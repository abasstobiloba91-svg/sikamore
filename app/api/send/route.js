import { NextResponse } from 'next/server';

export async function POST(req) {
  try {
    // We now securely accept a dynamic "fromEmail" variable from the frontend
    const { to, subject, html, fromEmail = 'hello@ssikamore.com', fromName = 'S. SIKAMÒRE' } = await req.json();

    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.RESEND_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        from: `${fromName} <${fromEmail}>`,
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
