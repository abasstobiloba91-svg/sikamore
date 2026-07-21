export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server';
import crypto from 'crypto';
import { createClient } from '@supabase/supabase-js';

export async function POST(req) {
  try {
    // Moved INSIDE the POST function so Vercel doesn't crash during the build!
    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL || '',
      process.env.SUPABASE_SERVICE_ROLE_KEY || ''
    );

    const rawBody = await req.text();
    const signature = req.headers.get('x-paystack-signature');
    
    if (!signature) {
      return NextResponse.json({ message: 'No signature provided' }, { status: 400 });
    }

    const hash = crypto
      .createHmac('sha512', process.env.PAYSTACK_SECRET_KEY)
      .update(rawBody)
      .digest('hex');
      
    if (hash !== signature) {
      return NextResponse.json({ message: 'Invalid signature detected.' }, { status: 401 });
    }

    const paystackEvent = JSON.parse(rawBody);

    if (paystackEvent.event === 'charge.success') {
      const transactionRef = paystackEvent.data.reference;

      const { data: order } = await supabaseAdmin
        .from('orders')
        .select('*')
        .eq('payment_reference', transactionRef)
        .single();

      if (order && order.status === 'pending_payment') {
        await supabaseAdmin
          .from('orders')
          .update({ status: 'paid' })
          .eq('id', order.id);
      }
    }

    return NextResponse.json({ status: 'success' }, { status: 200 });

  } catch (error) {
    console.error('Webhook processing failed:', error);
    return NextResponse.json({ message: 'Server error' }, { status: 500 });
  }
}
