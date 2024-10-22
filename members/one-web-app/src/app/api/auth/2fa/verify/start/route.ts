import { NextRequest, NextResponse } from 'next/server';
import { authUsersCollection, authVerificationCollection, firestore } from '@/lib/firestore';
import { auth } from '@/auth';
import Twilio from 'twilio';
import crypto from 'crypto';

async function getUserData(userId: string) {
  const userRef = authUsersCollection(firestore).doc(userId);
  const userDoc = await userRef.get();
  return { userRef, userData: userDoc.data() };
}

function sms(params: { otp: string }) {
  const { otp } = params;
  return `Your Eartho verification code is: ${otp}. This code will expire in 10 minutes. Don't share this code with anyone; our employees will never ask for the code.`;
}

function html(params: { otp: string; host: string; }) {
  const { otp, host } = params;
  const escapedHost = host.replace(/\./g, "&#8203;.");

  const brandColor = "#346df1";
  const buttonText = "#fff";

  const color = {
    background: "#f9f9f9",
    text: "#444",
    mainBackground: "#fff",
    buttonBackground: brandColor,
    buttonBorder: brandColor,
    buttonText,
  };

  return `
<body style="background: ${color.background};">
  <table width="100%" border="0" cellspacing="20" cellpadding="0"
    style="background: ${color.mainBackground}; max-width: 600px; margin: auto; border-radius: 10px;">
    <tr>
      <td align="center"
        style="padding: 10px 0px; font-size: 22px; font-family: Helvetica, Arial, sans-serif; color: ${color.text};">
        Your OTP Code for <strong>${escapedHost}</strong>
      </td>
    </tr>
    <tr>
      <td align="center" style="padding: 20px 0;">
        <table border="0" cellspacing="0" cellpadding="0">
          <tr>
            <td align="center" style="border-radius: 5px;" bgcolor="${color.buttonBackground}">
              <div style="font-size: 18px; font-family: Helvetica, Arial, sans-serif; color: ${color.buttonText}; text-decoration: none; border-radius: 5px; padding: 10px 20px; border: 1px solid ${color.buttonBorder}; display: inline-block; font-weight: bold;">
                ${otp}
              </div>
            </td>
          </tr>
        </table>
      </td>
    </tr>
    <tr>
      <td align="center"
        style="padding: 0px 0px 10px 0px; font-size: 16px; line-height: 22px; font-family: Helvetica, Arial, sans-serif; color: ${color.text};">
        If you did not request this email you can safely ignore it.
      </td>
    </tr>
  </table>
</body>
  `;
}

function text(params: { otp: string; host: string }) {
  const { otp, host } = params;
  return `Your OTP Code for ${host}: ${otp}\n\n`;
}

async function sendOTPToPhone(phoneNumber: string, otp: string) {
  const client = Twilio(process.env.AUTH_TWILIO_ID!, process.env.AUTH_TWILIO_SECRET!);
  await client.messages.create({
    body: sms({ otp }),
    from: process.env.AUTH_TWILIO_SID!,
    to: phoneNumber,
  });
}

async function sendOTPToEmail(email: string, otp: string) {
  const host = 'Eartho';
  await fetch("https://api.mailgun.net/v3/eartho.io/messages", {
    method: "POST",
    headers: {
      Authorization: `Basic ${Buffer.from(`api:${process.env.AUTH_MAILGUN_SECRET}`).toString('base64')}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: new URLSearchParams({
      from: "Eartho <no-reply@eartho.io>",
      to: email,
      subject: `Your OTP Code for Eartho`,
      text: text({ otp, host }),
      html: html({ otp, host }),
    }),
  });
}

interface VerifyRequest {
  methodId: string;
}

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    const { methodId }: VerifyRequest = await req.json();

    if (!session || !session.user) {
      return NextResponse.json({ message: 'Not authenticated' }, { status: 401 });
    }

    const { userRef, userData } = await getUserData(session.user.uid);
    const methods = userData?.twoStepVerification?.methods || {};

    const method = methods[methodId];
    if (!method) {
      return NextResponse.json({ message: 'Two-factor authentication method not found' }, { status: 400 });
    }
    if (method.type === 'authenticator') {
      return NextResponse.json({ message: '' });
    }
    const otp = crypto.randomInt(100000, 999999).toString();
    const expires = Date.now() + 10 * 60 * 1000; // OTP expires in 10 minutes

    const otpsCollection = authVerificationCollection(firestore);
    await otpsCollection.doc(methodId).set({ otp, expires });

    if (method.type === 'phone') {
      await sendOTPToPhone(method.data.phoneNumber, otp);
    } else if (method.type === 'email') {
      await sendOTPToEmail(method.data.email, otp);
    } else {
      return NextResponse.json({ message: 'Invalid two-step verification method type' }, { status: 400 });
    }

    return NextResponse.json({ message: 'OTP sent successfully' });
  } catch (error: any) {
    console.error(error);
    return NextResponse.json({ message: error.message }, { status: 500 });
  }
}
