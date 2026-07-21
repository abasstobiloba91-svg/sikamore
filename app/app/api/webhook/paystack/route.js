export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server';
import crypto from 'crypto';
import { createClient } from '@supabase/supabase-js';

// ----------------------------------------------------------------------
// 1. POST ROUTE (Used secretly by Paystack to update the system & send emails)
// ----------------------------------------------------------------------
export async function POST(req) {
  try {
    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL || '',
      process.env.SUPABASE_SERVICE_ROLE_KEY || ''
    );

    const rawBody = await req.text();
    const signature = req.headers.get('x-paystack-signature');
    
    if (!signature) {
      return NextResponse.json({ message: 'No signature provided' }, { status: 400 });
    }

    // Verify Paystack Signature
    const hash = crypto
      .createHmac('sha512', process.env.PAYSTACK_SECRET_KEY)
      .update(rawBody)
      .digest('hex');
      
    if (hash !== signature) {
      return NextResponse.json({ message: 'Invalid signature detected.' }, { status: 401 });
    }

    const paystackEvent = JSON.parse(rawBody);

    // ONLY TRIGGER IF PAYMENT WAS SUCCESSFUL
    if (paystackEvent.event === 'charge.success') {
      const transactionRef = paystackEvent.data.reference;
      
      // Grab the exact currency and amount paid from Paystack
      const paidCurrency = paystackEvent.data.currency;
      const paidAmount = paystackEvent.data.amount / 100;
      const formattedTotal = `${paidCurrency === 'NGN' ? '₦' : paidCurrency === 'USD' ? '$' : paidCurrency === 'GBP' ? '£' : '€'}${paidAmount.toLocaleString()}`;

      // 1. Find the pending order in your database
      const { data: order } = await supabaseAdmin
        .from('orders')
        .select('*')
        .eq('payment_reference', transactionRef)
        .single();

      // 2. If it is still pending, MARK AS PAID and SEND EMAILS
      if (order && order.status === 'pending_payment') {
        
        // Update Tracker!
        await supabaseAdmin
          .from('orders')
          .update({ status: 'paid' })
          .eq('id', order.id);

        const orderRefStamp = order.id.slice(0, 8).toUpperCase();
        const baseUrl = 'https://ssikamore.com';

        // Build the item list for the email
        const orderItemsHtml = (order.items || []).map(i => `
          <tr>
            <td style="padding: 14px 0; border-bottom: 1px solid #1A1A1A; font-size: 10px; letter-spacing: 0.15em; color: #E5E5E5; text-transform: uppercase;">${i.name.toUpperCase()} (${i.size}) x${i.quantity}</td>
          </tr>
        `).join('');

        const buildEmailPayload = (statusHeader, isManagementLink = false) => `
          <!DOCTYPE html><html><head><meta charset="utf-8"></head>
          <body style="margin:0; padding:0; background-color:#000000; font-family:-apple-system, sans-serif;">
            <table width="100%" border="0" cellspacing="0" cellpadding="0" style="background-color:#000000; padding:40px 10px;">
              <tr><td align="center">
                <table width="500" border="0" cellspacing="0" cellpadding="0" style="background-color:#0A0A0A; border:1px solid #1A1A1A; padding:45px; text-transform:uppercase; letter-spacing:0.15em; line-height:1.8;">
                  <tr><td align="center" style="padding-bottom:20px; border-bottom:1px solid #1A1A1A;"><h2 style="font-family:serif; letter-spacing:0.35em; font-size:15px; margin:0; color:#FFFFFF;">S. SIKAMÒRE</h2></td></tr>
                  <tr><td style="font-size:11px; color:#FFFFFF; padding:35px 0 10px 0; font-weight:bold; letter-spacing:0.2em; text-align:center;">${statusHeader}</td></tr>
                  <tr><td style="font-size:9px; color:#525252; text-align:center; padding-bottom:30px; font-family:monospace;">ORDER REFERENCE: #${orderRefStamp}</td></tr>
                  
                  <tr>
                    <td style="padding:24px; background-color:#111111; border:1px solid #1A1A1A; color:#E5E5E5; font-size:10px;">
                      <span style="color:#525252; font-size:8px; font-weight:bold; letter-spacing:0.2em; display:block; margin-bottom:8px;">CLIENT REGISTRY</span>
                      <strong>NAME:</strong> ${order.customer_name}<br/>
                      <strong>EMAIL:</strong> ${order.customer_email}<br/>
                      <strong>PHONE:</strong> ${order.customer_phone || 'N/A'}
                    </td>
                  </tr>
                  
                  <tr><td style="font-size:9px; color:#525252; letter-spacing:0.2em; padding:30px 0 10px 0; font-weight:bold;">DELIVERY ITINERARY</td></tr>
                  <tr><td style="padding:24px; background-color:#000000; border:1px solid #1A1A1A; font-size:10px; color:#A3A3A3; line-height:2.0;">${order.shipping_address}</td></tr>
                  
                  <tr><td><table width="100%" cellspacing="0" cellpadding="0" style="margin-top:30px; border-collapse:collapse;">${orderItemsHtml}</table></td></tr>
                  <tr><td style="padding-top:25px; font-size:11px; color:#FFFFFF; font-weight:bold;"><table width="100%"><tr><td>TOTAL FUNDS REMITTED</td><td align="right" style="font-family:monospace;">${formattedTotal}</td></tr></table></td></tr>
                  
                  <tr><td align="center" style="padding-top:40px;"><a href="${isManagementLink ? baseUrl + '/admin' : baseUrl + '/dashboard'}" style="background-color:#FFFFFF; color:#000000; text-decoration:none; padding:12px 30px; font-size:9px; font-weight:bold; letter-spacing:0.25em; display:inline-block;">${isManagementLink ? 'OPEN MANAGEMENT CONSOLE' : 'VIEW PRIVATE CONSOLE'}</a></td></tr>
                </table>
              </td></tr>
            </table>
          </body></html>
        `;

        // 3. Dispatch the emails!
        await Promise.all([
          fetch(`${baseUrl}/api/send`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              to: 'hello@ssikamore.com',
              fromEmail: 'shipping@ssikamore.com',
              fromName: 'S. SIKAMÒRE AUTOMATION',
              subject: `NEW ORDER SECURED: #${orderRefStamp} (${formattedTotal})`,
              html: buildEmailPayload('NEW ACQUISITION SECURELY LOGGED', true)
            })
          }),
          fetch(`${baseUrl}/api/send`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              to: order.customer_email,
              fromEmail: 'hello@ssikamore.com',
              fromName: 'S. SIKAMÒRE',
              subject: `YOUR S. SIKAMÒRE ORDER RECEIPT: #${orderRefStamp}`,
              html: buildEmailPayload('THANK YOU FOR YOUR PURCHASE', false)
            })
          })
        ]);
      }
    }

    return NextResponse.json({ status: 'success' }, { status: 200 });

  } catch (error) {
    console.error('Webhook processing failed:', error);
    return NextResponse.json({ message: 'Server error' }, { status: 500 });
  }
}

// ----------------------------------------------------------------------
// 2. GET ROUTE (Used so you can check the URL safely in your web browser)
// ----------------------------------------------------------------------
export async function GET() {
  return NextResponse.json({ 
    status: "Active", 
    message: "S. SIKAMÒRE Webhook is Live & Listening for Paystack." 
  }, { status: 200 });
}
