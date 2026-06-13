import { NextResponse } from 'next/server';

export async function POST(req) {
  try {
    const { to, subject, html } = await req.json();
    const senderEmail = process.env.NEXT_PUBLIC_SENDER_EMAIL || 'onboarding@resend.dev';

    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.RESEND_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        from: `S. SIKAMÒRE <${senderEmail}>`,
        to: [to],
        subject: subject,
        html: html
      })
    });

    const data = await res.json();
    if (!res.ok) throw new Error(data.message);
    
    return NextResponse.json(data);
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
