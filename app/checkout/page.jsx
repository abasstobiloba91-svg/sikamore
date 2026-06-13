/* eslint-disable @next/next/no-img-element */
'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { createClient } from '@supabase/supabase-js';
import { useApp } from '../providers';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
const supabase = createClient(supabaseUrl, supabaseAnonKey);

export default function CheckoutPage() {
  const { cart, clearCart, showToast } = useApp(); 
  const router = useRouter();
  const [processing, setProcessing] = useState(false);

  // Form State
  const [email, setEmail] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [address, setAddress] = useState('');
  const [shippingZone, setShippingZone] = useState('lagos_standard');

  // Magic Auth Pop-up State
  const [showAuthPopup, setShowAuthPopup] = useState(false);
  const [password, setPassword] = useState('');
  const [authLoading, setAuthLoading] = useState(false);
  const [authMode, setAuthMode] = useState('signup'); // changes to 'login' if account exists

  const itemTotal = cart.reduce((acc, item) => acc + (item.price * item.quantity), 0);
  
  const shippingRates = {
    'lagos_standard': 9000,
    'lagos_outskirts': 12000,
    'outside_lagos': 25000
  };
  
  const shippingFee = cart.length > 0 ? shippingRates[shippingZone] : 0;
  const grandTotal = itemTotal + shippingFee;

  // STEP 1: Process the Payment
  const handleCheckoutSubmit = (e) => {
    e.preventDefault();
    if (cart.length === 0) return showToast('ERROR: YOUR SHOPPING BAG IS EMPTY.');
    
    setProcessing(true);
    // Simulating Payment Gateway Delay
    setTimeout(() => {
      setProcessing(false);
      setShowAuthPopup(true); // Open the Guest-to-Account Magic Pop-up
    }, 2000);
  };

  // STEP 2: Secure Account, Save Order, & Fire Emails
  const handleSecureAccount = async (e) => {
    e.preventDefault();
    setAuthLoading(true);

    try {
      // 1. Create or Login the User
      if (authMode === 'signup') {
        const { error: signUpError } = await supabase.auth.signUp({
          email,
          password,
          options: { data: { first_name: firstName, last_name: lastName } }
        });
        
        if (signUpError) {
          if (signUpError.message.toLowerCase().includes('already registered')) {
            setAuthMode('login');
            setAuthLoading(false);
            return showToast('ACCOUNT EXISTS. PLEASE LOG IN.');
          }
          throw signUpError;
        }
      } else {
        const { error: loginError } = await supabase.auth.signInWithPassword({ email, password });
        if (loginError) throw loginError;
      }

      // 2. Save the Order to the Database (Triggers Admin Real-Time Notification)
      await supabase.from('orders').insert([{
        customer_name: `${firstName} ${lastName}`,
        customer_email: email,
        total_amount: grandTotal,
        location: address,
        items: cart,
        status: 'pending'
      }]);

      // 3. Fire Welcome & Receipt Emails quietly in the background
      fetch('/api/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, name: firstName, type: 'welcome', subject: 'Welcome to S. SIKAMÒRE' })
      });

      showToast('ORDER PLACED. ACCOUNT SECURED.');
      clearCart();
      setShowAuthPopup(false);
      
      // 4. Instant teleport to User Dashboard
      router.push('/dashboard');

    } catch (error) {
      showToast(`ERROR: ${error.message.toUpperCase()}`);
    } finally {
      setAuthLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F5F5F4] text-black font-sans antialiased text-[11px] relative">
      
      <header className="border-b border-zinc-300 h-20 bg-[#F5F5F4] sticky top-0 z-40 flex items-center shadow-sm">
        <div className="w-full max-w-[1600px] mx-auto px-4 sm:px-8 flex items-center justify-between relative">
          <div className="z-10 flex items-center">
            <Link href="/shop" className="tracking-[0.2em] text-zinc-500 hover:text-black uppercase text-[10px] flex items-center gap-1.5 py-2 transition-colors">
              <span className="text-xs font-light">&larr;</span>
              <span className="hidden sm:inline pt-0.5">Return to Store</span>
            </Link>
          </div>
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none px-4">
            <h1 className="text-xs sm:text-base font-normal tracking-[0.4em] uppercase font-serif text-center text-black pl-[0.4em]">
              S. SIKAMÒRE
            </h1>
          </div>
          <div className="z-10 text-right">
            <div className="hidden sm:block text-[9px] text-zinc-400 uppercase tracking-widest pt-0.5">
              Secure Checkout
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-[1600px] mx-auto px-4 sm:px-8 py-12 grid grid-cols-1 lg:grid-cols-12 gap-10 sm:gap-16">
        
        {/* CHECKOUT FORM (OFF-WHITE) */}
        <div className="lg:col-span-7 space-y-10">
          <h2 className="text-2xl font-light tracking-[0.2em] uppercase text-black">Checkout</h2>
          
          <form onSubmit={handleCheckoutSubmit} className="space-y-8">
            <div className="space-y-6">
              <h3 className="text-xs uppercase tracking-widest font-medium border-b border-zinc-300 pb-2 text-zinc-800">Billing details</h3>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="flex flex-col gap-2">
                  <label className="text-[10px] text-zinc-500 uppercase tracking-wider">First name *</label>
                  <input type="text" value={firstName} onChange={(e) => setFirstName(e.target.value)} required className="bg-transparent border border-zinc-300 p-4 outline-none focus:border-black transition-colors text-base md:text-xs uppercase tracking-wider rounded-none text-black" />
                </div>
                <div className="flex flex-col gap-2">
                  <label className="text-[10px] text-zinc-500 uppercase tracking-wider">Last name *</label>
                  <input type="text" value={lastName} onChange={(e) => setLastName(e.target.value)} required className="bg-transparent border border-zinc-300 p-4 outline-none focus:border-black transition-colors text-base md:text-xs uppercase tracking-wider rounded-none text-black" />
                </div>
              </div>

              <div className="flex flex-col gap-2">
                <label className="text-[10px] text-zinc-500 uppercase tracking-wider">Email address *</label>
                <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required className="bg-transparent border border-zinc-300 p-4 outline-none focus:border-black transition-colors text-base md:text-xs tracking-wider rounded-none text-black" />
              </div>

              <div className="flex flex-col gap-2">
                <label className="text-[10px] text-zinc-500 uppercase tracking-wider">Street address *</label>
                <input type="text" value={address} onChange={(e) => setAddress(e.target.value)} required placeholder="House number and street name" className="bg-transparent border border-zinc-300 p-4 outline-none focus:border-black transition-colors text-base md:text-xs uppercase tracking-wider rounded-none placeholder-zinc-400 text-black" />
              </div>
            </div>
            
            <button type="submit" disabled={processing || cart.length === 0} className="w-full bg-black text-white py-5 text-[10px] tracking-[0.3em] uppercase hover:bg-zinc-800 transition-colors disabled:opacity-50 font-medium">
              {processing ? 'PROCESSING SECURELY...' : 'PROCEED TO PAYMENT'}
            </button>
          </form>
        </div>

        {/* ORDER SUMMARY (STARK BLACK CARD) */}
        <div className="lg:col-span-5 bg-[#0A0A0A] text-white p-8 sm:p-12 shadow-2xl h-fit border border-zinc-900">
          <h3 className="text-sm tracking-[0.2em] font-medium uppercase mb-8">Your order</h3>
          
          <div className="space-y-6">
            <div className="flex justify-between text-[10px] text-zinc-500 uppercase tracking-widest border-b border-zinc-800 pb-2">
              <span>Product</span>
              <span>Total</span>
            </div>
            
            {cart.map((item, idx) => (
              <div key={idx} className="flex gap-4 py-2 border-b border-zinc-800/50">
                <div className="w-16 h-20 bg-[#111] shrink-0 border border-zinc-800">
                  <img src={item.image} alt={item.name} className="w-full h-full object-cover" />
                </div>
                <div className="flex-1 flex flex-col justify-center">
                  <h4 className="text-[10px] uppercase tracking-widest font-medium text-white">{item.name} × {item.quantity}</h4>
                  <p className="text-[9px] text-zinc-500 mt-1 uppercase">Size: {item.size}</p>
                </div>
                <div className="flex items-center text-[10px] tracking-wider text-zinc-300">
                  ₦{(item.price * item.quantity).toLocaleString()}
                </div>
              </div>
            ))}
          </div>

          <div className="space-y-4 pt-6 border-t border-zinc-800 mt-6">
            <div className="flex justify-between text-xs tracking-wider text-zinc-400">
              <span>Subtotal</span>
              <span className="font-medium text-white">₦{itemTotal.toLocaleString()}</span>
            </div>
            
            <div className="space-y-4 pt-4">
              <span className="text-zinc-500 text-xs tracking-wider uppercase block">Shipping Method</span>
              <div className="space-y-3">
                <label className="flex items-center justify-between cursor-pointer group">
                  <div className="flex items-center gap-3">
                    <input type="radio" name="shipping" value="lagos_standard" checked={shippingZone === 'lagos_standard'} onChange={() => setShippingZone('lagos_standard')} className="w-3 h-3 text-white focus:ring-white bg-black border-zinc-600 accent-white" />
                    <span className="text-[10px] tracking-widest text-zinc-400 group-hover:text-white transition-colors uppercase">Lagos Standard</span>
                  </div>
                  <span className="text-[10px] tracking-widest">₦9,000</span>
                </label>
                <label className="flex items-center justify-between cursor-pointer group">
                  <div className="flex items-center gap-3">
                    <input type="radio" name="shipping" value="lagos_outskirts" checked={shippingZone === 'lagos_outskirts'} onChange={() => setShippingZone('lagos_outskirts')} className="w-3 h-3 text-white focus:ring-white bg-black border-zinc-600 accent-white" />
                    <span className="text-[10px] tracking-widest text-zinc-400 group-hover:text-white transition-colors uppercase">Lagos Outskirts</span>
                  </div>
                  <span className="text-[10px] tracking-widest">₦12,000</span>
                </label>
              </div>
            </div>

            <div className="flex justify-between text-sm tracking-wider font-medium pt-8 border-t border-zinc-800 mt-6 text-white">
              <span className="uppercase">Grand Total</span>
              <span>₦{grandTotal.toLocaleString()}</span>
            </div>
          </div>
          
          <div className="pt-8 flex flex-col gap-2 items-center opacity-40 pointer-events-none mt-8 border-t border-zinc-900">
            <span className="text-[8px] uppercase tracking-widest text-zinc-400">Secured by Paystack</span>
          </div>
        </div>

      </main>

      {/* THE MAGIC GUEST-TO-ACCOUNT POP-UP */}
      {showAuthPopup && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4 animate-fade-in">
          <div className="bg-[#0A0A0A] text-white w-full max-w-md p-10 shadow-2xl border border-zinc-800 text-center animate-fade-in-up">
            
            <h2 className="text-lg font-normal tracking-[0.4em] uppercase mb-2 font-serif text-white">ORDER SUCCESSFUL</h2>
            <p className="text-[10px] text-zinc-400 leading-relaxed mb-8 uppercase tracking-wider">
              {authMode === 'signup' 
                ? "Your order has been placed. Secure your account below with a password to track delivery and access priority support." 
                : "We noticed you already have an account. Enter your password to log in and attach this order to your profile."}
            </p>
            
            <form onSubmit={handleSecureAccount} className="flex flex-col gap-6">
              <div className="flex flex-col gap-2 text-left">
                <label className="text-[9px] tracking-[0.2em] text-zinc-500 uppercase">Set Password</label>
                <input 
                  type="password" 
                  value={password} 
                  onChange={(e) => setPassword(e.target.value)} 
                  required 
                  placeholder="••••••••"
                  className="w-full bg-[#111] p-4 border border-zinc-800 focus:border-white outline-none text-base md:text-xs tracking-widest text-white"
                />
              </div>
              <button type="submit" disabled={authLoading} className="w-full bg-white text-black py-4 text-[10px] tracking-[0.3em] uppercase hover:bg-zinc-200 transition-colors font-medium disabled:opacity-50">
                {authLoading ? 'SECURING...' : (authMode === 'signup' ? 'CREATE ACCOUNT & CONTINUE' : 'LOG IN & CONTINUE')}
              </button>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
