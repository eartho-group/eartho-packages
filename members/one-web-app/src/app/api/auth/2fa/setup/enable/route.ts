import { NextRequest, NextResponse } from 'next/server';
import qrcode from 'qrcode';
import { generateSecret } from '../../totp';
import { authUsersCollection, firestore } from '@/lib/firestore'; // Adjust based on your Firestore setup
import { auth } from '@/auth';
import Twilio from 'twilio';
import crypto from 'crypto';

type TwoStepVerificationMethodType = 'authenticator' | 'phone' | 'email';

interface EnableTwoStepVerificationRequest {
  methodType: TwoStepVerificationMethodType;
  phoneNumber?: string;
  email?: string;
}

interface TwoStepVerificationMethod {
  id: string,
  type: TwoStepVerificationMethodType;
  enabled: boolean;
  verified: boolean;
  data: {
    secret?: string;
    phoneNumber?: string;
    email?: string;
    phoneCode?: string;
    emailCode?: string;
  };
}

async function getUserData(userId: string) {
  const userRef = authUsersCollection(firestore).doc(userId);
  const userDoc = await userRef.get();

  return { userRef, userData: userDoc.data() };
}

const id = authUsersCollection(firestore).doc().id
function createTwoStepVerificationMethod(type: TwoStepVerificationMethodType, secretOrCode: string, contactInfo?: string): TwoStepVerificationMethod {
  switch (type) {
    case 'authenticator':
      return {
        id,
        type,
        enabled: false,
        verified: false,
        data: { secret: secretOrCode }
      };
    case 'phone':
      return {
        id,
        type,
        enabled: false,
        verified: false,
        data: { phoneNumber: contactInfo, phoneCode: secretOrCode }
      };
    case 'email':
      return {
        id,
        type,
        enabled: false,
        verified: false,
        data: { email: contactInfo, emailCode: secretOrCode }
      };
    default:
      throw new Error('Invalid two-step verification method type');
  }
}

async function generateQRCodeUrl(secret: string, email: string): Promise<string> {
  const otpauthUrl = `otpauth://totp/${email}?secret=${secret}`;
  return qrcode.toDataURL(otpauthUrl);
}

function sms(params: { otp: string }) {
  const { otp } = params;
  return `Your Eartho verification code is: ${otp}. This code will expire in 10 minutes. Don't share this code with anyone; our employees will never ask for the code.`;
}

/**
 * Email HTML body
 * Insert invisible space into domains from being turned into a hyperlink by email
 * clients like Outlook and Apple mail, as this is confusing because it seems
 * like they are supposed to click on it to sign in.
 *
 * @note We don't add the email address to avoid needing to escape it, if you do, remember to sanitize it!
 */
function html(params: { otp: string; host: string; }) {
  const { otp, host } = params

  const escapedHost = host.replace(/\./g, "&#8203;.")

  // eslint-disable-next-line @typescript-eslint/prefer-nullish-coalescing
  const brandColor = "#346df1"
  // eslint-disable-next-line @typescript-eslint/prefer-nullish-coalescing
  const buttonText = "#fff"

  const color = {
    background: "#f9f9f9",
    text: "#444",
    mainBackground: "#fff",
    buttonBackground: brandColor,
    buttonBorder: brandColor,
    buttonText,
  }

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
`
}

/** Email Text body (fallback for email clients that don't render HTML, e.g. feature phones) */
function text({ otp, host }: { otp: string; host: string }) {
  return `Your OTP Code for ${host}: ${otp}\n\n`
}

async function updateTwoStepVerificationMethods(
  userRef: FirebaseFirestore.DocumentReference,
  type: TwoStepVerificationMethodType,
  newMethod: TwoStepVerificationMethod
) {
  const userDoc = await userRef.get();
  const userData = userDoc.data();
  const methods = userData?.twoStepVerification?.methods || [];

  // const updatedMethods = methods.filter((method: TwoStepVerificationMethod) => method.type !== type);
  // updatedMethods.push({newMethod.id: newMethod});

  await userRef.set({
    twoStepVerification: {
      primary: type,
      methods: { [newMethod.id]: newMethod }
    }
  }, { merge: true });
}

export async function POST(req: NextRequest) {
  try {
    const session = await auth();

    if (!session || !session.user) {
      return NextResponse.json({ message: 'Not authenticated' }, { status: 401 });
    }

    const { methodType, phoneNumber, email }: EnableTwoStepVerificationRequest = await req.json();

    if (!methodType) {
      return NextResponse.json({ message: 'Two-step verification method type is required' }, { status: 400 });
    }

    const { userRef, userData } = await getUserData(session.user.uid);

    let newMethod: TwoStepVerificationMethod;
    let qrCodeUrl: string | undefined;

    switch (methodType) {
      case 'authenticator': {
        const secret = generateSecret();
        qrCodeUrl = await generateQRCodeUrl(secret, session.user.email||"Eartho");
        newMethod = createTwoStepVerificationMethod(methodType, secret);
        break;
      }

      case 'phone': {
        if (!phoneNumber) {
          return NextResponse.json({ message: 'Phone number is required' }, { status: 400 });
        }
        const otp = crypto.randomInt(100000, 999999).toString();
        const expires = Date.now() + 5 * 60 * 1000;
        const client = Twilio(process.env.AUTH_TWILIO_ID!, process.env.AUTH_TWILIO_SECRET!);
        await client.messages.create({
          body: sms({ otp }),
          from: process.env.AUTH_TWILIO_SID!,
          to: phoneNumber,
        });
        newMethod = createTwoStepVerificationMethod(methodType, otp, phoneNumber);
        break;
      }

      case 'email': {
        if (!email) {
          return NextResponse.json({ message: 'Email address is required' }, { status: 400 });
        }
        const otp = crypto.randomInt(100000, 999999).toString();
        const expires = Date.now() + 5 * 60 * 1000;

        const host = 'Eartho'
        const res = await fetch("https://api.mailgun.net/v3/eartho.io/messages", {
          method: "POST",
          headers: {
            Authorization: `Basic ${btoa(`api:${process.env.AUTH_MAINGUN_SECRET}`)}`,
            "Content-Type": "application/x-www-form-urlencoded",
          },
          body: new URLSearchParams({
            from: "Eartho <no-reply@eartho.io>",
            to: email,
            subject: `Your OTP Code for Eartho`,
            text: text({ otp: otp, host: host }),
            html: html({ otp, host }),
          }),
        });
        newMethod = createTwoStepVerificationMethod(methodType, otp, email);
        break;
      }

      default:
        return NextResponse.json({ message: 'Invalid two-step verification method type' }, { status: 400 });
    }

    await updateTwoStepVerificationMethods(userRef, methodType, newMethod);

    if (methodType == 'authenticator') {
      return NextResponse.json({ id: newMethod.id, qrCodeUrl });
    }

    return NextResponse.json({ id: newMethod.id });
  } catch (error: any) {
    console.error(error);
    return NextResponse.json({ message: error.message }, { status: 500 });
  }
}
