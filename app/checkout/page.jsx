/* eslint-disable @next/next/no-img-element */
'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useApp } from '../providers';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || '', 
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''
);

export default function CheckoutPage() {
  const router = useRouter();
  const { cart, showToast } = useApp();
  
  // State
  const [email, setEmail] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [address, setAddress] = useState('');
  const [phone, setPhone] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [isGatewayReady, setIsGatewayReady] = useState(false);

  // 1. IMPROVED GATEWAY LOADING: Prevents "Paystack not defined" errors
  useEffect(() => {
    if (typeof window !== 'undefined' && !window.PaystackPop) {
      const script = document.createElement('script');
      script.src = 'https://js.paystack.co/v2/inline.js';
      script.async = true;
      script.onload = () => setIsGatewayReady(true);
      document.head.appendChild(script);
    } else if (window.PaystackPop) {
      setIsGatewayReady(true);
    }
  }, []);

  const cartSubtotal = cart.reduce((total, item) => total + (item.price * item.quantity), 0);
  const orderTotal = cartSubtotal;

  // 2. DECOUPLED PAYMENT LOGIC
  const handleCheckoutProcess = async (e) => {
    e.preventDefault();
    if (!isGatewayReady) return showToast('SYSTEM INITIALIZING... PLEASE WAIT.');
    if (!email || !address || !firstName || !lastName || !phone) return showToast('PLEASE COMPLETE ALL FIELDS.');

    setIsProcessing(true);

    try {
      const paystack = new window.PaystackPop();
      paystack.newTransaction({
        key: process.env.NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY,
        email: email.toLowerCase().trim(),
        amount: orderTotal * 100, // Paystack requires kobo
        reference: `SKM_${Date.now()}`,
        onSuccess: async (transaction) => {
          // 3. SECURE DATABASE RECORDING
          const { error } = await supabase.from('orders').insert([{
            customer_name: `${firstName} ${lastName}`.toUpperCase(),
            customer_email: email.toLowerCase().trim(),
            customer_phone: phone,
            shipping_address: address,
            total_amount: orderTotal,
            items: cart,
            status: 'paid',
            payment_reference: transaction.reference
          }]);

          if (error) throw error;
          
          localStorage.removeItem('sikamore_cart');
          window.location.href = '/success';
        },
        onCancel: () => setIsProcessing(false)
      });
    } catch (err) {
      showToast(`GATEWAY ERROR: ${err.message.toUpperCase()}`);
      setIsProcessing(false);
    }
  };

  if (cart.length === 0) return null;

  return (
    <div className="min-h-screen bg-[#F5F5F4] text-black font-sans antialiased">
      <header className="bg-white border-b border-zinc-200 py-6 px-8 text-center sticky top-0 z-50">
        <Link href="/" className="text-xl font-normal tracking-[0.4em] uppercase font-serif text-black">S. SIKAMÒRE</Link>
      </header>

      <div className="max-w-6xl mx-auto px-4 py-12 grid grid-cols-1 lg:grid-cols-12 gap-12">
        {/* FORM SECTION */}
        <div className="lg:col-span-7">
          <form id="checkout-form" onSubmit={handleCheckoutProcess} className="space-y-6">
            <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="EMAIL ADDRESS" required className="w-full p-4 border border-zinc-300" />
            <div className="grid grid-cols-2 gap-4">
              <input type="text" value={firstName} onChange={e => setFirstName(e.target.value)} placeholder="FIRST NAME" required className="w-full p-4 border border-zinc-300" />
              <input type="text" value={lastName} onChange={e => setLastName(e.target.value)} placeholder="LAST NAME" required className="w-full p-4 border border-zinc-300" />
            </div>
            <input type="text" value={address} onChange={e => setAddress(e.target.value)} placeholder="DELIVERY ADDRESS" required className="w-full p-4 border border-zinc-300" />
            <input type="tel" value={phone} onChange={e => setPhone(e.target.value)} placeholder="PHONE NUMBER" required className="w-full p-4 border border-zinc-300" />
            
            <button 
              type="submit" 
              disabled={isProcessing || !isGatewayReady} 
              className="w-full bg-black text-white py-5 uppercase tracking-[0.2em] disabled:opacity-50"
            >
              {isProcessing ? 'AUTHORIZING...' : isGatewayReady ? 'PROCEED TO PAYMENT' : 'LOADING GATEWAY...'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
