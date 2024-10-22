import { splitFullName } from "@/lib/extension/string"
import {
  Timestamp,
} from "firebase-admin/firestore"

export interface User {
  id?: string
  uid?: string
  displayName?: string | null
  email?: string | null
  photoURL?: string | null
}

export interface LinkedAccount {
  provider: string
  providerAccountId: string
}

export interface AdapterUser extends User {
  /** A unique identifier for the user. */
  id: string
  uid: string
  /** The user's email address. */
  email: string
  /** The user's first name. */
  firstName: string
  /**
   * Whether the user has verified their email address via an [Email provider](https://authjs.dev/getting-started/authentication/email).
   * It is `null` if the user has not signed in with the Email provider yet, or the date of the first successful signin.
   */
  emailVerified: Date | null
  /** The user's phone number. */
  phoneNumber?: string | null
  /** The user's profile picture URL. */
  photoURL?: string | null
  /** The time the user was created. */
  createdAt: Date
  /** The time the user last signed in. */
  lastSignedInAt: Date
  /** Provider user info */
  accounts: Map<string, LinkedAccount>
  verifiedEmails: string[]
}

// Function to convert user object to desired JSON structure
export function adaptUser(newUserId: string, user: any) {
  const name = splitFullName(user.name)
  return {
    id: newUserId,
    uid: newUserId,
    email: user.email,
    emailVerified: user.emailVerified,
    displayName: user.name,
    firstName: name.firstName,
    lastName: name.lastName,
    photoURL: user.image,
    createdAt: Timestamp.now(),
    lastSignedInAt: Timestamp.now(),
    phoneNumber: user.phone,
    accounts: user.accounts,
    verifiedEmails: user.accounts
  }
}