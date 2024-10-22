import NextAuth, { Account, JWT, NextAuthConfig, Session } from 'next-auth';
import GoogleProvider from 'next-auth/providers/google';
import FacebookProvider from 'next-auth/providers/facebook';
import TwitterProvider from 'next-auth/providers/twitter';
import GitHubProvider from 'next-auth/providers/github';
import RedditProvider from 'next-auth/providers/reddit';
import YandexProvider from 'next-auth/providers/yandex';
import VKontakteProvider from 'next-auth/providers/vk';
import AppleProvider from 'next-auth/providers/apple';
import MicrosoftProvider from 'next-auth/providers/microsoft-entra-id';
import { firestore } from './lib/firestore';
import { FirestoreAdapter } from './lib/auth/firestore/adapter';
import { redirect } from 'next/navigation';
import { getEarthoToken } from './lib/auth/earthotoken/earthotoken';
import CryptoProvider from './lib/auth/crypto/provider';
import EmailOtpProvider from './lib/auth/email/mailgun-otp';
import PhoneOtpProvider from './lib/auth/phone/phone-otp';

export const homePage = '/';
export const loginPage = '/auth/signin';
const TIME_TO_LIVE_SEC = 30 * 24 * 60 * 60; // 30 DAYS

export const firestoreAdapter = FirestoreAdapter(firestore);


const authOptions: NextAuthConfig = {
  pages: {
    signIn: loginPage,
    error: '/auth/signin/error',
  },
  secret: process.env.AUTH_SECRET,
  adapter: firestoreAdapter,
  session: {
    strategy: 'jwt',
    maxAge: TIME_TO_LIVE_SEC, // 30 days
  },
  callbacks: {
    async jwt({ token, user, account }) {
      // Initial sign in
      if (account && user) {
        token.accessToken = await getEarthoToken(user, account, TIME_TO_LIVE_SEC);
        token.accessTokenExpires = Date.now() + TIME_TO_LIVE_SEC * 1000;
        token.refreshToken = account.refresh_token;
        const { id, uid, email, emailVerified, firstName, lastName, displayName, photoURL, verifiedEmails, accounts } = user as User;
        token.user = { id, uid, email, emailVerified, firstName, lastName, displayName, photoURL, verifiedEmails, accounts };
      }

      // Return previous token if the access token has not expired yet
      if (Date.now() < (token.accessTokenExpires as number)) {
        return token;
      }

      // Access token has expired, try to update it
      return token;
    },
    async session({ session, token }) {
      if (token) {
        session.user = token.user as User;
        session.accessToken = token.accessToken as string;
      }

      return session;
    },
  },
  providers: [
    PhoneOtpProvider,
    EmailOtpProvider,
    CryptoProvider,
    GoogleProvider({
      clientId: process.env.AUTH_GOOGLE_ID!,
      clientSecret: process.env.AUTH_GOOGLE_SECRET!,
    }),
    FacebookProvider({
      clientId: process.env.AUTH_FACEBOOK_ID!,
      clientSecret: process.env.AUTH_FACEBOOK_SECRET!,
    }),
    TwitterProvider({
      clientId: process.env.AUTH_TWITTER_ID!,
      clientSecret: process.env.AUTH_TWITTER_SECRET!,
    }),
    GitHubProvider({
      clientId: process.env.AUTH_GITHUBIO_ID!,
      clientSecret: process.env.AUTH_GITHUBIO_SECRET!,
    }),
    RedditProvider({
      clientId: process.env.AUTH_REDDITWORLD_ID!,
      clientSecret: process.env.AUTH_REDDITWORLD_SECRET!,
    }),
    YandexProvider({
      clientId: process.env.AUTH_YANDEX_ID!,
      clientSecret: process.env.AUTH_YANDEX_SECRET!,
    }),
    VKontakteProvider({
      clientId: process.env.AUTH_VKONTAKTE_ID!,
      clientSecret: process.env.AUTH_VKONTAKTE_SECRET!,
      checks: ["none"],
    }),
    AppleProvider({
      clientId: "auth.one.eartho.io",
      clientSecret: process.env.AUTH_APPLE_TOKEN!,
      profile(profile) {
        return {
          id: profile.sub,
          name: profile.name || null,
          email: profile.email || null,
          image: null,
        }
      },
    }),
    MicrosoftProvider({
      clientId: process.env.AUTH_MICROSOFT_ID!,
      clientSecret: process.env.AUTH_MICROSOFT_SECRET!,
    }),
  ],
};

const { handlers, signIn, signOut, auth } = NextAuth(authOptions);

async function protectAuth() {
  const session = await auth();
  if (!session) {
    redirect(loginPage);
    return null;
  }
  return session;
}

export { handlers, signIn, signOut, auth, protectAuth };

declare module 'next-auth' {
  interface Session {
    accessToken?: string;
    user: User;
  }

  interface JWT {
    accessToken?: string | null;
    accessTokenExpires?: number;
    refreshToken?: string;
    user?: User;
  }
}

interface User {
  id: string;
  uid: string;
  email: string;
  emailVerified: null
  firstName?: string | null;
  lastName?: string | null;
  displayName?: string | null;
  photoURL?: string | null;
  verifiedEmails?: string[] | null;
  accounts?: Map<string, any> | null;
}