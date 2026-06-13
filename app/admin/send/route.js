import { Resend } from 'resend';
import { NextResponse } from 'next/server';

// You will need to add RESEND_API_KEY to your .env.local file
const resend = new Resend(process.env.RESEND_API_KEY);

export async function POST(request) {
  try {
    const { email, subject, type, name } = await request.json();

    let htmlContent = '';

    // Dynamic Email Routing
    if (type === 'welcome') {
      htmlContent = `
        <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 40px 20px; text-align: center;">
          <h1 style="font-weight: 300; letter-spacing: 0.2em; text-transform: uppercase;">S. SIKAMÒRE</h1>
          <p style="letter-spacing: 0.1em; font-size: 12px; margin-top: 40px;">Welcome, ${name}.</p>
          <p style="letter-spacing: 0.05em; font-size: 12px; color: #555;">Your exclusive account has been secured.</p>
          <p style="letter-spacing: 0.05em; font-size: 12px; color: #555;">You can now track your orders and access priority support directly from your dashboard.</p>
          <div style="margin-top: 60px; border-top: 1px solid #eee; padding-top: 20px;">
            <p style="font-size: 9px; color: #999; letter-spacing: 0.2em; text-transform: uppercase;">© 2026 S. SIKAMÒRE. ALL RIGHTS RESERVED.</p>
          </div>
        </div>
      `;
    } else if (type === 'newsletter') {
      htmlContent = `
        <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <h1 style="font-weight: 300; letter-spacing: 0.2em; text-transform: uppercase; text-align: center;">S. SIKAMÒRE ARCHIVE</h1>
          <div style="margin-top: 30px; line-height: 1.8; color: #333; font-size: 12px;">
            ${subject}
          </div>
          <!-- Invisible Tracking Pixel for Real-Time Dashboard Analytics -->
          <img src="https://yourdomain.com/api/track?email=${email}" width="1" height="1" style="display:none;" alt="" />
        </div>
      `;
    }

    const data = await resend.emails.send({
      from: 'S. SIKAMÒRE <contact@yourdomain.com>',
      to: email,
      subject: subject || 'Update from S. SIKAMÒRE',
      html: htmlContent,
    });

    return NextResponse.json(data);
  } catch (error) {
    return NextResponse.json({ error }, { status: 500 });
  }
}
