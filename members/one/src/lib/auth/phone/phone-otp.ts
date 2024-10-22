import CredentialsProvider from "next-auth/providers/credentials";
import { authAccountsCollection, authVerificationCollection, firestore, usersCollection } from "@/lib/firestore";
import { AdapterUser } from "@auth/core/adapters";
import { FieldValue } from "firebase-admin/firestore";

interface Credentials {
  phone: string;
  otp: string;
}

const PhoneOtpProvider = CredentialsProvider({
  id: "phone-otp",
  name: "Phone",
  type: "credentials",
  credentials: {
    phone: { label: "Phone Number", type: "text" },
    otp: { label: "OTP", type: "text" },
  },
  authorize: async (credentials) => {
    const { phone, otp } = credentials as Credentials;
    try {
      if (!phone || !otp) {
        throw new Error("Phone Number and OTP are required");
      }

      const otpsCollection = authVerificationCollection(firestore);
      const otpDoc = await otpsCollection.doc(phone).get();

      if (!otpDoc.exists) {
        throw new Error("OTP not found");
      }

      const storedOtpData = otpDoc.data() as { otp: string; expires: number };

      if (Date.now() > storedOtpData.expires) {
        await otpsCollection.doc(phone).delete();
        throw new Error("OTP has expired");
      }

      if (storedOtpData.otp !== otp) {
        throw new Error("Invalid OTP");
      }

      // Delete the OTP document
      await otpsCollection.doc(phone).delete();

      const accountsCollection = authAccountsCollection(firestore);
      const userCollection = usersCollection(firestore);
      const accountQuerySnapshot = await accountsCollection
        .where("provider", "==", "phone")
        .where("providerAccountId", "==", phone)
        .get();

      const alreadyHasAccount = accountQuerySnapshot.docs.length > 0;

      if (alreadyHasAccount) {
        const accountData = accountQuerySnapshot.docs[0].data();
        const userId = accountData.userId;
        const userDoc = await userCollection.doc(userId).get();
        const userData = userDoc.data();
        return userData as AdapterUser || null;
      } else {
        const newUserId = userCollection.doc().id;
        const newAccountId = accountsCollection.doc().id;
        const accountData = {
          provider: "phone",
          providerAccountId: phone,
          phoneNumber: phone,
          createdAt: FieldValue.serverTimestamp(),
          userId: newUserId,
        };
        const userData = {
          id: newUserId,
          uid: newUserId,
          phoneNumber: phone,
          createdAt: FieldValue.serverTimestamp(),
          verifiedPhoneNumbers: [phone],
          accounts: { [newAccountId]: { provider: 'phone', providerAccountId: phone } },
        };
        await accountsCollection.doc(newAccountId).set(accountData);
        await userCollection.doc(newUserId).set(userData);
        return userData;
      }
    } catch (error) {
      console.error(error);
      return null;
    }
  },
});

export default PhoneOtpProvider;
