import { NextRequest, NextResponse } from 'next/server';
import { authUsersCollection, authVerificationCollection, firestore } from '@/lib/firestore';
import { auth } from '@/auth';
import { verifyTOTP } from '../totp';
import { DocumentData, FieldValue } from 'firebase-admin/firestore';

interface VerifyRequest {
  code: string;
  methodId: string;
}

export async function POST(req: NextRequest) {
  try {
    const session = await auth();

    if (!session || !session.user) {
      return NextResponse.json({ message: 'Not authenticated' }, { status: 401 });
    }

    const { code, methodId }: VerifyRequest = await req.json();
    console.log(`Received code: ${code}, methodId: ${methodId}`);

    const userRef = authUsersCollection(firestore).doc(session.user.uid);
    const userDoc = await userRef.get();

    console.log(`Processing user with UID: ${session.user.uid}`);

    if (!userDoc.exists) {
      return NextResponse.json({ message: 'User not found' }, { status: 404 });
    }

    const userData = userDoc.data() as DocumentData & {
      twoStepVerification?: {
        methods: { [key: string]: { id: string, type: string, data: any, enabled: boolean, verified: boolean } }
      };
    };

    if (!userData.twoStepVerification || !userData.twoStepVerification.methods) {
      return NextResponse.json({ message: 'Two-factor authentication not set up' }, { status: 400 });
    }

    const method = userData.twoStepVerification.methods[methodId];
    if (!method) {
      return NextResponse.json({ message: 'Two-factor authentication method not found' }, { status: 400 });
    }

    let isValid = false;
    if (method.type === 'authenticator') {
      isValid = verifyTOTP(method.data.secret, code);
    } else {
      const otpsCollection = authVerificationCollection(firestore);
      const otpDoc = await otpsCollection.doc(methodId).get();

      if (!otpDoc.exists) {
        return NextResponse.json({ message: 'OTP not found' }, { status: 400 });
      }

      const storedOtpData = otpDoc.data() as { otp: string; expires: number };

      if (Date.now() > storedOtpData.expires) {
        await otpsCollection.doc(methodId).delete();
        return NextResponse.json({ message: 'OTP has expired' }, { status: 400 });
      }

      if (method.type === 'phone' || method.type === 'email') {
        isValid = code === storedOtpData.otp;
      }
    }

    if (isValid) {
      userData.twoStepVerification.methods[methodId].enabled = true;
      userData.twoStepVerification.methods[methodId].verified = true;
      if (method.type !== 'authenticator') {
        userData.twoStepVerification.methods[methodId].data.phoneCode = null;
        userData.twoStepVerification.methods[methodId].data.emailCode = null;
      }

      await userRef.set(userData, { merge: true });

      return NextResponse.json({ success: true });
    } else {
      return NextResponse.json({ success: false }, { status: 400 });
    }
  } catch (error: any) {
    console.error(error);
    return NextResponse.json({ message: error.message }, { status: 500 });
  }
}
