import CredentialsProvider from "next-auth/providers/credentials";
import { authAccountsCollection, authVerificationCollection, firestore, usersCollection } from "@/lib/firestore";
import { uuidOfString } from "../../extension/uuid";
import { AdapterUser } from "@auth/core/adapters";
import { FieldValue } from "firebase-admin/firestore";

interface Credentials {
  email: string;
  otp: string;
}

const EmailOtpProvider = CredentialsProvider({
  id: "email-otp",
  name: "Email",
  type: "credentials",
  credentials: {
    email: { label: "Email", type: "text" },
    otp: { label: "OTP", type: "text" },
  },
  authorize: async (credentials, req) => {
    const { email, otp } = credentials as Credentials;

    try {
      if (!email || !otp) {
        throw new Error("Email and OTP are required");
      }

      const otpsCollection = authVerificationCollection(firestore);
      const otpDoc = await otpsCollection.doc(email).get();

      if (!otpDoc.exists) {
        throw new Error("OTP not found");
      }

      const storedOtpData = otpDoc.data() as { otp: string; expires: number };

      if (Date.now() > storedOtpData.expires) {
        await otpsCollection.doc(email).delete();
        throw new Error("OTP has expired");
      }

      if (storedOtpData.otp !== otp) {
        throw new Error("Invalid OTP");
      }

      // Delete the OTP document
      await otpsCollection.doc(email).delete();

      const hashedEmail = uuidOfString(email);

      const accountsCollection = authAccountsCollection(firestore);
      const userCollection = usersCollection(firestore);
      const accountQuerySnapshot = await accountsCollection
        .where("provider", "==", "email")
        .where("providerAccountId", "==", hashedEmail)
        .get();

      const alreadyHasAccount = accountQuerySnapshot.docs.length > 0;

      if (alreadyHasAccount) {
        const accountData = accountQuerySnapshot.docs[0].data();
        const userId = accountData.userId;
        const userDoc = await userCollection.doc(userId).get();
        const userData = userDoc.data();

        if (userData && !userData.email) {
          await userCollection.doc(userId).update({
            email: email,
            verifiedEmails: [email],
          });
        }
        return userData as AdapterUser || null;
      } else {
        const newUserId = userCollection.doc().id;
        const newAccountId = accountsCollection.doc().id;
        const accountData = {
          provider: "email",
          providerAccountId: hashedEmail,
          email: email,
          userId: newUserId,
          createdAt: FieldValue.serverTimestamp(),
        };
        const userData = {
          id: newUserId,
          uid: newUserId,
          email: email,
          createdAt: FieldValue.serverTimestamp(),
          verifiedEmails: [email],
          accounts: { [newAccountId]: { provider: 'email', providerAccountId: hashedEmail } },
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

export default EmailOtpProvider;
