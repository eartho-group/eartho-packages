import { NextRequest, NextResponse } from 'next/server';
import { firestore, authVerificationCollection } from '@/lib/firestore';
import crypto from 'crypto';

 interface Theme {
  colorScheme?: "auto" | "dark" | "light"
  logo?: string
  brandColor?: string
  buttonText?: string
}

/**
 * Email HTML body
 * Insert invisible space into domains from being turned into a hyperlink by email
 * clients like Outlook and Apple mail, as this is confusing because it seems
 * like they are supposed to click on it to sign in.
 *
 * @note We don't add the email address to avoid needing to escape it, if you do, remember to sanitize it!
 */
 function html(params: { otp: string; host: string; theme: Theme }) {
  const { otp, host, theme } = params

  const escapedHost = host.replace(/\./g, "&#8203;.")

  // eslint-disable-next-line @typescript-eslint/prefer-nullish-coalescing
  const brandColor = theme?.brandColor || "#346df1"
  // eslint-disable-next-line @typescript-eslint/prefer-nullish-coalescing
  const buttonText = theme?.buttonText || "#fff"

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


export async function POST(request: NextRequest) {
  try {
    const { email, theme } = await request.json();

    if (!email) {
      return NextResponse.json({ message: 'Email is required' }, { status: 400 });
    }

    const otp = crypto.randomInt(100000, 999999).toString();
    const expires = Date.now() + 5 * 60 * 1000;

    // Store OTP in Firestore
    const otpsCollection = authVerificationCollection(firestore);
    await otpsCollection.doc(email).set({ otp, expires, email });

    try {
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
          html: html({ otp, host, theme }),
        }),
      });
    } catch (error) {
      // Handle error
      console.log(error)
      throw new Error("Twilio error: " + error);
    }

    return NextResponse.json({ message: 'OTP sent successfully' });
  } catch (error) {
    return NextResponse.json({ message: 'Failed to send OTP' }, { status: 500 });
  }
}
