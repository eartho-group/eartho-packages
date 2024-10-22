import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { authVerificationCollection, firestore } from '@/lib/firestore'; // Adjust based on your Firestore setup
import admin from 'firebase-admin';

export async function POST(req: NextRequest) {
  try {
    const { publicAddress } = await req.json();

    if (!publicAddress) {
      return NextResponse.json({ message: 'Public address is required' }, { status: 400 });
    }

    const nonce = crypto.randomBytes(32).toString('hex');
    const expires = admin.firestore.Timestamp.fromMillis(Date.now() + 1000 * 60 * 10); // 10 min

    await authVerificationCollection(firestore).doc(publicAddress).set({
      publicAddress,
      nonce,
      nonceExpires: expires,
    });

    return NextResponse.json({
      nonce,
      expires: expires.toMillis(),
    });
  } catch (error) {
    console.error("Error generating nonce:", error);
    return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 });
  }
}
