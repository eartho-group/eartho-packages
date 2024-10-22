import { NextResponse } from 'next/server';
import { authVerificationCollection, firestore, usersCollection } from '@/lib/firestore';
import admin from 'firebase-admin';
import { auth } from '@/auth';
import { NextRequest } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const session = await auth();

    if (!session) {
      return NextResponse.json({ message: 'Not authenticated' }, { status: 401 });
    }

    const { email, otp }: { email: string; otp: string } = await request.json();

    if (!email || !otp) {
      return NextResponse.json({ message: 'Email and OTP are required' }, { status: 400 });
    }

    const otpsCollection = authVerificationCollection(firestore);
    const otpDoc = await otpsCollection.doc(email).get();

    if (!otpDoc.exists) {
      return NextResponse.json({ message: 'OTP not found' }, { status: 400 });
    }

    const storedOtpData = otpDoc.data() as { otp: string; expires: number };

    if (Date.now() > storedOtpData.expires) {
      await otpsCollection.doc(email).delete();
      return NextResponse.json({ message: 'OTP has expired' }, { status: 400 });
    }

    if (storedOtpData.otp !== otp) {
      return NextResponse.json({ message: 'Invalid OTP' }, { status: 400 });
    }

    // OTP is valid, add the email to the user's verifiedEmails list
    const userId = session.user.uid; // Assuming your session contains user id
    const userDoc = usersCollection(firestore).doc(userId);
    await userDoc.update({
      verifiedEmails: admin.firestore.FieldValue.arrayUnion(email)
    });

    // Delete the OTP document
    await otpsCollection.doc(email).delete();

    return NextResponse.json({ message: 'Email verified successfully', email });
  } catch (error: any) {
    return NextResponse.json({ message: 'Failed to verify email', error: error.message }, { status: 500 });
  }
}
