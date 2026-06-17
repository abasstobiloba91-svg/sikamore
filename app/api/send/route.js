import { NextResponse } from 'next/server';

export async function POST(req) {
  try {
    const { to, subject, html } = await req.json();
    
    // REVERTED TO SANDBOX FOR GUARANTEED DELIVERY WITHOUT DNS VERIFICATION
    const senderEmail = 'onboarding@resend.dev';

    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.RESEND_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        from: `S. SIKAMORE <${senderEmail}>`,
        to: [to],
        subject: subject,
        html: html
      })
    });

    const data = await res.json();
    
    if (!res.ok) {
      console.error("RESEND REJECTED THE EMAIL:", data);
      throw new Error(data.message || 'Error sending email');
    }
    
    return NextResponse.json(data);
    
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
