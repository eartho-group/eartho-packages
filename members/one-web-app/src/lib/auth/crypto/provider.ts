import CredentialsProvider from "next-auth/providers/credentials";
import { authAccountsCollection, authVerificationCollection, firestore, usersCollection } from "@/lib/firestore";
import { verifyMessage } from "ethers";
import { FieldValue, Timestamp } from "firebase-admin/firestore";
import { User } from "next-auth";

interface Credentials {
  publicAddress: string;
  signedNonce: string;
}

interface UserData {
  nonce: string;
  nonceExpires: Timestamp;
}

const CryptoProvider = CredentialsProvider({
  id: "cryptowallet",
  name: "Crypto Wallet",
  type: "credentials",
  credentials: {
    publicAddress: { label: "Public Address", type: "text" },
    signedNonce: { label: "Signed Nonce", type: "text" },
  },
  async authorize(credentials, req) {
    const { publicAddress, signedNonce } = credentials as Credentials;
    if (!publicAddress) return null;

    const userRef = authVerificationCollection(firestore).doc(publicAddress);
    const userDoc = await userRef.get();

    if (!userDoc.exists) return null;

    const user = userDoc.data() as UserData;
    const { nonce, nonceExpires } = user;

    if (Date.now() > nonceExpires.toMillis()) return null;

    const signerAddress = verifyMessage(nonce, signedNonce);
    if (signerAddress.toLowerCase() !== publicAddress.toLowerCase()) return null;

    await userRef.delete();

    const accountsCollection = authAccountsCollection(firestore);
    const userCollection = usersCollection(firestore);
    const account = await accountsCollection
      .where("provider", "==", "cryptowallet")
      .where("providerAccountId", "==", publicAddress)
      .get();

    const alreadyHasAccount = account.docs.length > 0;

    if (alreadyHasAccount) {
      const userId = account.docs[0].data().userId;
      const userData = await userCollection.doc(userId).get().then(x => x.data());
      return userData as User || null;
    } else {
      const newUserId = publicAddress;
      const newAccountId = accountsCollection.doc().id;
      const userData = {
        id: newUserId, uid: newUserId, displayName: 'Crypto User', firstName: 'Crypto', lastName: 'User',
        accounts: { [newAccountId]: { provider: 'cryptowallet', providerAccountId: newUserId } },
      };
      await accountsCollection.doc(newAccountId).set({ provider: "cryptowallet", providerAccountId: publicAddress, userId: newUserId 
      , createdAt: FieldValue.serverTimestamp()
    });
      await userCollection.doc(newUserId).set(userData);
      return userData as User;
    }
  },
});

export default CryptoProvider;
