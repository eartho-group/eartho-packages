import { NextRequest, NextResponse } from 'next/server';
import { firestore, authVerificationCollection } from '@/lib/firestore';
import crypto from 'crypto';
import Twilio from 'twilio';

function sms(params: { otp: string }) {
  const { otp } = params;
  return `Your Eartho verification code is: ${otp}. This code will expire in 10 minutes. Don't share this code with anyone; our employees will never ask for the code.`;
}

export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    const { phone }: { phone: string } = await request.json();

    if (!phone) {
      return NextResponse.json({ message: 'Phone is required' }, { status: 400 });
    }

    const otp = crypto.randomInt(100000, 999999).toString();
    const expires = Date.now() + 5 * 60 * 1000;

    // Store OTP in Firestore
    const otpsCollection = authVerificationCollection(firestore);
    await otpsCollection.doc(phone).set({ otp, expires });

    try {
      const client = Twilio(process.env.AUTH_TWILIO_ID!, process.env.AUTH_TWILIO_SECRET!);
      await client.messages.create({
        body: sms({ otp }),
        from: process.env.AUTH_TWILIO_SID!,
        to: phone,
      });
    } catch (error: any) {
      throw new Error("Twilio error: " + error.message);
    }

    return NextResponse.json({ message: 'OTP sent successfully' });
  } catch (error: any) {
    return NextResponse.json({ message: 'Failed to send OTP', error: error.message }, { status: 500 });
  }
}
