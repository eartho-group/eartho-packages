import { NextRequest, NextResponse } from 'next/server';
import { verifyTOTP } from '../../totp';
import { authUsersCollection, firestore } from '@/lib/firestore'; // Adjust based on your Firestore setup
import { auth } from '@/auth';
import { DocumentData, FieldValue } from 'firebase-admin/firestore';

interface VerifyRequest {
  code: string;
  methodId: string;
  methodType: 'authenticator' | 'phone' | 'email';
}

export async function POST(req: NextRequest) {
  try {
    const session = await auth();

    if (!session || !session.user) {
      return NextResponse.json({ message: 'Not authenticated' }, { status: 401 });
    }

    const { code, methodType, methodId }: VerifyRequest = await req.json();
    console.log(`Received code: ${code}, methodType: ${methodType}, methodId: ${methodId}`);

    const userRef = authUsersCollection(firestore).doc(session.user.uid);
    const userDoc = await userRef.get();

    console.log(`Processing user with UID: ${session.user.uid}`);

    if (!userDoc.exists) {
      return NextResponse.json({ message: 'User not found' }, { status: 404 });
    }

    const userData = userDoc.data() as DocumentData & {
      twoStepVerification?: {
        methods: { [key: string]: { id: string; type: string; data: any; enabled: boolean; verified: boolean } }
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

    switch (methodType) {
      case 'authenticator':
        isValid = verifyTOTP(method.data.secret, code);
        break;
      case 'phone':
        isValid = method.data.phoneCode === code;
        break;
      case 'email':
        isValid = method.data.emailCode === code;
        break;
      default:
        return NextResponse.json({ message: 'Invalid two-step verification method type' }, { status: 400 });
    }

    if (isValid) {
      userData.twoStepVerification.methods[methodId].enabled = true;
      userData.twoStepVerification.methods[methodId].verified = true;
      userData.twoStepVerification.methods[methodId].data.phoneCode = FieldValue.delete();
      userData.twoStepVerification.methods[methodId].data.emailCode = FieldValue.delete();

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
