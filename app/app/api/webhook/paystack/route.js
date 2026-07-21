import { NextResponse } from 'next/server';
import crypto from 'crypto';
import { createClient } from '@supabase/supabase-js';

// We must use the SERVICE_ROLE_KEY here to bypass security rules 
// since this is an automated background bot, not a logged-in user.
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY 
);

export async function POST(req) {
  try {
    const rawBody = await req.text();
    const signature = req.headers.get('x-paystack-signature');
    
    // 1. Verify the message is actually from Paystack (Security Check)
    const hash = crypto
      .createHmac('sha512', process.env.PAYSTACK_SECRET_KEY)
      .update(rawBody)
      .digest('hex');
      
    if (hash !== signature) {
      return NextResponse.json({ message: 'Invalid signature detected.' }, { status: 401 });
    }

    const paystackEvent = JSON.parse(rawBody);

    // 2. Listen specifically for successful payments
    if (paystackEvent.event === 'charge.success') {
      const transactionRef = paystackEvent.data.reference;

      // 3. Find the pending order in Supabase
      const { data: order } = await supabaseAdmin
        .from('orders')
        .select('*')
        .eq('payment_reference', transactionRef)
        .single();

      // 4. If the order exists and isn't paid yet, mark it as paid!
      if (order && order.status === 'pending_payment') {
        
        await supabaseAdmin
          .from('orders')
          .update({ status: 'paid' })
          .eq('id', order.id);

        // Optional: You can copy your fetch('/api/send') email logic here 
        // if you want the webhook to handle sending the receipts too!
      }
    }

    // Tell Paystack we received the message successfully
    return NextResponse.json({ status: 'success' }, { status: 200 });

  } catch (error) {
    console.error('Webhook processing failed:', error);
    return NextResponse.json({ message: 'Server error' }, { status: 500 });
  }
}
