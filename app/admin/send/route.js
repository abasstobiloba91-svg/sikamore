import { NextResponse } from 'next/server';

export async function POST(req) {
  try {
    const { to, subject, html } = await req.json();
    
    // USE YOUR OFFICIAL CONNECTED ACCOUNT
    const senderEmail = 'comms@arclightsfoundation.com';

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
    
    console.log("RESEND SUCCESS! Email sent to:", to);
    return NextResponse.json(data);
    
  } catch (error) {
    console.error("API ROUTE ERROR:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
