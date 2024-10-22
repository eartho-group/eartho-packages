/**
 * Official **Firebase** adapter for Auth.js / NextAuth.js, using the [Firebase Admin SDK](https://firebase.google.com/docs/admin/setup)
 * and [Firestore](https://firebase.google.com/docs/firestore).
 * [![Firestore logo](https://authjs.dev/img/adapters/firebase.svg)](https://firebase.google.com)
 *
 * ## Installation
 *
 * ```bash npm2yarn
 * npm install @auth/firebase-adapter firebase-admin
 * ```
 *
 * @module @auth/firebase-adapter
 */

import { type AppOptions, getApps, initializeApp } from "firebase-admin/app"
import {
  Firestore,
  getFirestore,
  initializeFirestore,
  Timestamp, FieldValue
} from "firebase-admin/firestore"

import type {
  Adapter,
  AdapterAccount,
  AdapterSession,
  VerificationToken,
} from "@auth/core/adapters"
import { AdapterUser, adaptUser } from "./user"
import { authAccountsCollection, authSessionsCollection, authVerificationCollection, usersCollection } from "@/lib/firestore"

/** Configure the Firebase Adapter. */
export interface FirebaseAdapterConfig extends AppOptions {
  /**
   * The name of the app passed to {@link https://firebase.google.com/docs/reference/admin/node/firebase-admin.md#initializeapp `initializeApp()`}.
   */
  name?: string
  firestore?: Firestore
}

export function FirestoreAdapter(
  config: Firestore
): Adapter {
  const { db } = { db: config }

  const C = collectionsFactory(db)

  return {
    async createUser(userInit) {
      const ref = C.users.doc()
      const newUserId = ref.id
      const newUser = adaptUser(newUserId, userInit)
      await ref.set(newUser)

      const user = await getDoc(C.users.doc(newUserId))
      if (!user) throw new Error("[createUser] Failed to fetch created user")

      return user
    },

    async getUser(id) {
      return await getDoc(C.users.doc(id))
    },

    async getUserByEmail(email) {
      return await getOneDoc(C.users.where("email", "==", email))
    },

    async getUserByAccount({ provider, providerAccountId }) {
      const account = await getOneDoc(
        C.accounts
          .where("provider", "==", provider)
          .where("providerAccountId", "==", providerAccountId)
      )
      if (!account) return null

      return await getDoc(C.users.doc(account.userId))
    },

    async updateUser(partialUser) {
      if (!partialUser.id) throw new Error("[updateUser] Missing id")

      const userRef = C.users.doc(partialUser.id)

      await userRef.set(partialUser, { merge: true })

      const user = await getDoc(userRef)
      if (!user) throw new Error("[updateUser] Failed to fetch updated user")

      return user
    },

    async deleteUser(userId) {
      await db.runTransaction(async (transaction) => {
        const accounts = await C.accounts
          .where("userId", "==", userId)
          .get()
        const sessions = await C.sessions
          .where("userId", "==", userId)
          .get()

        transaction.delete(C.users.doc(userId))

        accounts.forEach((account) => transaction.delete(account.ref))
        sessions.forEach((session) => transaction.delete(session.ref))
      })
    },

    async linkAccount(accountInit) {
      const ref = await C.accounts.add(accountInit)
      const account = await ref.get().then((doc) => doc.data())

      const accountId = ref.id
      const userId = accountInit.userId
      const userRef = C.users.doc(userId)
      const newData = { accounts: { [accountId]: { provider: account?.provider, providerAccountId: account?.providerAccountId } } };
      await userRef.set(newData, { merge: true });

      return account ?? null
    },

    async unlinkAccount({ provider, providerAccountId }) {
      await deleteDocs(
        C.accounts
          .where("provider", "==", provider)
          .where("providerAccountId", "==", providerAccountId)
          .limit(1)
      )
    },

    async createSession(sessionInit) {
      const ref = await C.sessions.add(sessionInit)
      const session = await ref.get().then((doc) => doc.data())

      if (session) return session ?? null

      throw new Error("[createSession] Failed to fetch created session")
    },

    async getSessionAndUser(sessionToken) {
      const session = await getOneDoc(
        C.sessions.where("sessionToken", "==", sessionToken)
      )
      if (!session) return null

      const user = await getDoc(C.users.doc(session.userId))
      if (!user) return null

      return { session, user }
    },

    async updateSession(partialSession) {
      const sessionId = await db.runTransaction(async (transaction) => {
        const sessionSnapshot = (
          await transaction.get(
            C.sessions
              .where("sessionToken", "==", partialSession.sessionToken)
              .limit(1)
          )
        ).docs[0]
        if (!sessionSnapshot?.exists) return null

        transaction.set(sessionSnapshot.ref, partialSession, { merge: true })

        return sessionSnapshot.id
      })

      if (!sessionId) return null

      const session = await getDoc(C.sessions.doc(sessionId))
      if (session) return session
      throw new Error("[updateSession] Failed to fetch updated session")
    },

    async deleteSession(sessionToken) {
      await deleteDocs(
        C.sessions
          .where("sessionToken", "==", sessionToken)
          .limit(1)
      )
    },

    async createVerificationToken(verificationToken) {
      await C.verification_tokens.add(verificationToken)
      return verificationToken
    },

    async useVerificationToken({ identifier, token }) {
      const verificationTokenSnapshot = (
        await C.verification_tokens
          .where("identifier", "==", identifier)
          .where("token", "==", token)
          .limit(1)
          .get()
      ).docs[0]

      if (!verificationTokenSnapshot) return null

      const data = verificationTokenSnapshot.data()
      await verificationTokenSnapshot.ref.delete()
      return data
    },
  }
}

const identity = <T>(x: T) => x

/** @internal */
function getConverter<Document extends Record<string, any>>(options: {
  excludeId?: boolean
}): FirebaseFirestore.FirestoreDataConverter<Document> {
  return {
    toFirestore(object) {
      const document: Record<string, unknown> = {}

      for (const key in object) {
        if (key === "id") continue
        const value = object[key]
        if (value !== undefined) {
          document[key] = value
        } else {
          console.warn(`FirebaseAdapter: value for key "${key}" is undefined`)
        }
      }

      return document
    },

    fromFirestore(
      snapshot: FirebaseFirestore.QueryDocumentSnapshot<Document>
    ): Document {
      const document = snapshot.data()! // we can guarantee it exists

      const object: Record<string, unknown> = {}

      if (!options?.excludeId) {
        object.id = snapshot.id
      }

      for (const key in document) {
        let value: any = document[key]
        if (value instanceof Timestamp) value = value.toDate()

        object[key] = value
      }

      return object as Document
    },
  }
}

/** @internal */
export async function getOneDoc<T>(
  querySnapshot: FirebaseFirestore.Query<T>
): Promise<T | null> {
  const querySnap = await querySnapshot.limit(1).get()
  return querySnap.docs[0]?.data() ?? null
}

/** @internal */
async function deleteDocs<T>(
  querySnapshot: FirebaseFirestore.Query<T>
): Promise<void> {
  const querySnap = await querySnapshot.get()
  for (const doc of querySnap.docs) {
    await doc.ref.delete()
  }
}

/** @internal */
export async function getDoc<T>(
  docRef: FirebaseFirestore.DocumentReference<T>
): Promise<T | null> {
  const docSnap = await docRef.get()
  return docSnap.data() ?? null
}

/** @internal */
export function collectionsFactory(
  db: FirebaseFirestore.Firestore
) {
  return {
    users: usersCollection(db)
      .withConverter(getConverter<AdapterUser>({})),
    sessions: authSessionsCollection(db)
      .withConverter(getConverter<AdapterSession>({})),
    accounts: authAccountsCollection(db)
      .withConverter(getConverter<AdapterAccount>({})),
    verification_tokens: authVerificationCollection(db)
      .withConverter(
        getConverter<VerificationToken>({ excludeId: true })
      ),
  }
}
