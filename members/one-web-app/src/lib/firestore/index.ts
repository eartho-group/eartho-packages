import {
  Firestore,
  getFirestore,
  initializeFirestore,
  Timestamp, FieldValue
} from "firebase-admin/firestore"
import { AppOptions, getApps, initializeApp } from "firebase-admin/app";
import { FirebaseAdapterConfig } from "../auth/firestore/adapter";
var admin = require("firebase-admin");
var serviceAccount = require("./eartho-app-firebase-adminsdk-njcdc-0fff8407e9.json");


const firestore = initFirestore({
  credential: admin.credential.cert(serviceAccount),
});


export const usersCollection = (f: Firestore)=> f.collection('users')

export const authSessionsCollection = (f: Firestore)=> f.collection('auth-sessions')
export const authAccountsCollection = (f: Firestore)=> f.collection('auth-accounts')
export const authUsersCollection = (f: Firestore)=> f.collection('auth-users')
export const authVerificationCollection = (f: Firestore)=> f.collection('auth-verification-tokens')

/**
 * Utility function that helps making sure that there is no duplicate app initialization issues in serverless environments.
 * If no parameter is passed, it will use the `GOOGLE_APPLICATION_CREDENTIALS` environment variable to initialize a Firestore instance.
 *
 * @example
 * ```ts title="lib/firestore.ts"
 * import { initFirestore } from "@auth/firebase-adapter"
 * import { cert } from "firebase-admin/app"
 *
 * export const firestore = initFirestore({
 *  credential: cert({
 *    projectId: process.env.FIREBASE_PROJECT_ID,
 *    clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
 *    privateKey: process.env.FIREBASE_PRIVATE_KEY,
 *  })
 * })
 * ```
 */
function initFirestore(
  options: AppOptions & { name?: FirebaseAdapterConfig["name"] } = {}
) {
  const apps = getApps()
  const app = options.name ? apps.find((a) => a.name === options.name) : apps[0]

  if (app) return getFirestore(app)

  return initializeFirestore(initializeApp(options, options.name))
}


export {firestore, Timestamp}