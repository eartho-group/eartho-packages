import { NextRequest, NextResponse } from 'next/server';
import { authVerificationCollection, firestore } from '@/lib/firestore';
import crypto from 'crypto';

export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    const { email }: { email: string } = await request.json();

    if (!email) {
      return NextResponse.json({ message: 'Email is required' }, { status: 400 });
    }

    const otp = crypto.randomInt(100000, 999999).toString();
    const expires = Date.now() + 5 * 60 * 1000;

    // Store OTP in Firestore
    const otpsCollection = authVerificationCollection(firestore);
    await otpsCollection.doc(email).set({ otp, expires });

    const host = 'Eartho'

    const html = `
      <body style="background: #f9f9f9;">
        <table width="100%" border="0" cellspacing="20" cellpadding="0"
          style="background: #fff; max-width: 600px; margin: auto; border-radius: 10px;">
          <tr>
            <td align="center"
              style="padding: 10px 0px; font-size: 22px; font-family: Helvetica, Arial, sans-serif; color: #444;">
              Your OTP Code for <strong>${host.replace(/\./g, "&#8203;.")}</strong>
            </td>
          </tr>
          <tr>
            <td align="center" style="padding: 20px 0;">
              <table border="0" cellspacing="0" cellpadding="0">
                <tr>
                  <td align="center" style="border-radius: 5px;" bgcolor="#346df1">
                    <div style="font-size: 18px; font-family: Helvetica, Arial, sans-serif; color: #fff; text-decoration: none; border-radius: 5px; padding: 10px 20px; border: 1px solid #346df1; display: inline-block; font-weight: bold;">
                      ${otp}
                    </div>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          <tr>
            <td align="center"
              style="padding: 0px 0px 10px 0px; font-size: 16px; line-height: 22px; font-family: Helvetica, Arial, sans-serif; color: #444;">
              If you did not request this email you can safely ignore it.
            </td>
          </tr>
        </table>
      </body>
    `;

    const text = `Your OTP Code for ${host}: ${otp}\n\n`;
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
        text: text,
        html: html,
      }),
    });

    if (!res.ok) {
      throw new Error('Mailgun error: ' + (await res.text()));
    }

    return NextResponse.json({ message: 'OTP sent successfully' });
  } catch (error: any) {
    return NextResponse.json({ message: 'Failed to send OTP', error: error.message }, { status: 500 });
  }
}
