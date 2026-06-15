'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useApp } from '../providers';
import PaystackPop from '@paystack/inline-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
const supabase = createClient(supabaseUrl, supabaseAnonKey);

export default function CheckoutPage() {
  const router = useRouter();
  const { cart, showToast } = useApp();
  
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [accountStatus, setAccountStatus] = useState(null); 
  const [isScanningEmail, setIsScanningEmail] = useState(false);

  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [address, setAddress] = useState('');
  const [phone, setPhone] = useState('');

  const [isProcessing, setIsProcessing] = useState(false);

  const cartSubtotal = cart.reduce((total, item) => total + (item.price * item.quantity), 0);
  const shippingFee = 0; 
  const orderTotal = cartSubtotal + shippingFee;

  useEffect(() => {
    if (cart.length === 0) router.push('/shop');
    
    async function checkActiveSession() {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        setEmail(session.user.email);
        setFirstName(session.user.user_metadata?.first_name || '');
        setLastName(session.user.user_metadata?.last_name || '');
        setPhone(session.user.user_metadata?.phone || '');
        setAddress(session.user.user_metadata?.address || '');
        setAccountStatus('logged_in');
      }
    }
    checkActiveSession();
  }, [cart, router]);

  const handleEmailCheck = async (e) => {
    const inputEmail = e.target.value;
    setEmail(inputEmail);
    
    if (accountStatus === 'logged_in') return;
    if (inputEmail.includes('@') && inputEmail.includes('.')) {
      setIsScanningEmail(true);
      try {
        const { data } = await supabase.from('orders').select('customer_email').eq('customer_email', inputEmail.toLowerCase()).limit(1);
        setAccountStatus(data && data.length > 0 ? 'exists' : 'new');
      } catch (err) {
        setAccountStatus('new');
      } finally {
        setIsScanningEmail(false);
      }
    } else {
      setAccountStatus(null);
    }
  };

  const handlePasswordReset = async () => {
    if (!email) return showToast('ENTER EMAIL ADDRESS FIRST.');
    const { error } = await supabase.auth.resetPasswordForEmail(email, { redirectTo: `${window.location.origin}/dashboard` });
    if (error) showToast(`ERROR: ${error.message.toUpperCase()}`);
    else showToast('RECOVERY DISPATCHED TO EMAIL.');
  };

  const finalizeOrderDatabase = async (transaction) => {
    try {
      const { error: orderError } = await supabase.from('orders').insert([{
        customer_name: `${firstName} ${lastName}`.toUpperCase(),
        customer_email: email.toLowerCase(),
        customer_phone: phone,
        shipping_address: address,
        total_amount: orderTotal,
        items: cart,
        status: 'pending',
        payment_reference: transaction.reference
      }]);

      if (orderError) throw orderError;
      
      // CLEAR CART FROM MEMORY AND HARD REDIRECT TO PREVENT BACK-NAVIGATION GHOSTING
      localStorage.removeItem('sikamore_cart');
      window.location.href = '/success';
      
    } catch (err) {
      showToast(`DATABASE ERROR: ${err.message.toUpperCase()}`);
      setIsProcessing(false);
    }
  };

  const handleCheckoutProcess = async (e) => {
    e.preventDefault();
    if (!email || !address || !firstName || !lastName || !phone) return showToast('PLEASE COMPLETE ALL REQUIRED FIELDS.');
    
    setIsProcessing(true);

    try {
      if (accountStatus === 'new') {
        const { error } = await supabase.auth.signUp({
          email: email.toLowerCase(),
          password: password,
          options: { data: { first_name: firstName, last_name: lastName, phone: phone, address: address, name: `${firstName} ${lastName}` } }
        });
        if (error) throw error;
      } else if (accountStatus === 'exists') {
        const { error } = await supabase.auth.signInWithPassword({ email: email.toLowerCase(), password: password });
        if (error) throw error;
      }

      showToast('AUTHORIZING SECURE PAYMENT GATEWAY...');
      
      const PaystackModule = await import('@paystack/inline-js');
      const PaystackPop = PaystackModule.default;
      
      const paystack = new PaystackPop();
      paystack.newTransaction({
        key: process.env.NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY || '',
        email: email.toLowerCase(),
        amount: orderTotal * 100, 
        reference: `SKM_${new Date().getTime().toString()}`,
        onSuccess: (transaction) => {
          finalizeOrderDatabase(transaction);
        },
        onCancel: () => {
          setIsProcessing(false);
          showToast('PAYMENT CANCELLED BY USER.');
        }
      });

    } catch (err) {
      showToast(`AUTH ERROR: ${err.message.toUpperCase()}`);
      setIsProcessing(false);
    }
  };

  if (cart.length === 0) return null;

  return (
    <div className="min-h-screen bg-[#F5F5F4] text-black font-sans antialiased">
      <header className="bg-white border-b border-zinc-200 py-6 px-8 text-center sticky top-0 z-50">
        <Link href="/" className="text-xl font-normal tracking-[0.4em] uppercase font-serif text-black hover:text-zinc-600 transition-colors">S. SIKAMÒRE</Link>
      </header>

      <div className="max-w-6xl mx-auto px-4 sm:px-8 py-12 grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-20">
        
        <div className="lg:col-span-7 space-y-10">
          <section>
            <h2 className="text-sm tracking-[0.2em] uppercase font-medium mb-6 border-b border-zinc-200 pb-3">Contact Information</h2>
            <div className="space-y-4 relative">
              <input type="email" value={email} onChange={handleEmailCheck} disabled={accountStatus === 'logged_in'} placeholder="EMAIL ADDRESS" required className="w-full bg-white p-4 border border-zinc-300 focus:border-black outline-none text-base uppercase tracking-widest disabled:bg-zinc-100 disabled:text-zinc-500" />
              {isScanningEmail && <span className="absolute right-4 top-4 text-[9px] text-zinc-400 uppercase tracking-widest animate-pulse">Scanning...</span>}
              
              {accountStatus === 'exists' && (
                <div className="animate-fade-in space-y-3 bg-zinc-50 p-4 border border-zinc-200">
                  <p className="text-[10px] text-zinc-600 uppercase tracking-widest">Profile detected. Welcome back.</p>
                  <div className="relative">
                    <input type={showPassword ? "text" : "password"} value={password} onChange={(e) => setPassword(e.target.value)} placeholder="ENTER PASSWORD" required className="w-full bg-white p-4 border border-zinc-300 focus:border-black outline-none text-base uppercase tracking-widest pr-12" />
                    <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-4 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-black">
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d={showPassword ? "M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0l-3.29-3.29" : "M15 12a3 3 0 11-6 0 3 3 0 016 0z M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"} /></svg>
                    </button>
                  </div>
                  <button type="button" onClick={handlePasswordReset} className="text-[9px] text-zinc-500 hover:text-black underline uppercase tracking-widest mt-1 block">Forgot Password?</button>
                </div>
              )}

              {accountStatus === 'new' && (
                <div className="animate-fade-in space-y-3 bg-zinc-50 p-4 border border-zinc-200">
                  <p className="text-[10px] text-zinc-600 uppercase tracking-widest">Create a password to secure your profile.</p>
                  <div className="relative">
                    <input type={showPassword ? "text" : "password"} value={password} onChange={(e) => setPassword(e.target.value)} placeholder="CREATE PASSWORD" required className="w-full bg-white p-4 border border-zinc-300 focus:border-black outline-none text-base uppercase tracking-widest pr-12" />
                    <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-4 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-black">
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d={showPassword ? "M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0l-3.29-3.29" : "M15 12a3 3 0 11-6 0 3 3 0 016 0z M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"} /></svg>
                    </button>
                  </div>
                </div>
              )}
            </div>
          </section>

          <section>
            <h2 className="text-sm tracking-[0.2em] uppercase font-medium mb-6 border-b border-zinc-200 pb-3">Shipping Destination</h2>
            <form id="checkout-form" onSubmit={handleCheckoutProcess} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <input type="text" value={firstName} onChange={e => setFirstName(e.target.value)} placeholder="FIRST NAME" required className="w-full bg-white p-4 border border-zinc-300 focus:border-black outline-none text-base uppercase tracking-widest" />
                <input type="text" value={lastName} onChange={e => setLastName(e.target.value)} placeholder="LAST NAME" required className="w-full bg-white p-4 border border-zinc-300 focus:border-black outline-none text-base uppercase tracking-widest" />
              </div>
              <input type="text" value={address} onChange={e => setAddress(e.target.value)} placeholder="FULL DELIVERY ADDRESS (STREET, CITY, STATE)" required className="w-full bg-white p-4 border border-zinc-300 focus:border-black outline-none text-base uppercase tracking-widest" />
              <input type="tel" value={phone} onChange={e => setPhone(e.target.value)} placeholder="PHONE NUMBER" required className="w-full bg-white p-4 border border-zinc-300 focus:border-black outline-none text-base uppercase tracking-widest" />
            </form>
          </section>
        </div>

        <div className="lg:col-span-5 relative">
          <div className="bg-white border border-zinc-200 p-8 shadow-sm sticky top-32">
            <h2 className="text-sm tracking-[0.2em] uppercase font-medium mb-6 border-b border-zinc-200 pb-3">Order Outline</h2>
            <div className="space-y-4 mb-8 max-h-[300px] overflow-y-auto pr-2">
              {cart.map((item, idx) => (
                <div key={idx} className="flex items-center gap-4">
                  <div className="w-16 h-20 bg-zinc-50 border border-zinc-100 shrink-0"><img src={item.image} alt={item.name} className="w-full h-full object-cover" /></div>
                  <div className="flex-1">
                    <h3 className="text-[10px] tracking-widest uppercase font-medium text-black">{item.name}</h3>
                    <p className="text-[9px] text-zinc-500 mt-1 uppercase tracking-widest">SIZE: {item.size} | QTY: {item.quantity}</p>
                  </div>
                  <span className="text-[11px] font-medium tracking-wider text-black">₦{(item.price * item.quantity).toLocaleString()}</span>
                </div>
              ))}
            </div>
            <div className="space-y-3 border-t border-zinc-200 pt-6 mb-6 text-[10px] tracking-widest uppercase text-zinc-500">
              <div className="flex justify-between"><span>Subtotal</span><span className="text-black font-medium">₦{cartSubtotal.toLocaleString()}</span></div>
              <div className="flex justify-between"><span>Shipping</span><span className="text-black font-medium">Complimentary</span></div>
            </div>
            <div className="flex justify-between items-center border-t border-zinc-900 pt-6 mb-8 text-sm tracking-widest uppercase font-semibold text-black">
              <span>Total Remittance</span><span>₦{orderTotal.toLocaleString()}</span>
            </div>
            <button type="submit" form="checkout-form" disabled={isProcessing} className="w-full bg-black text-white py-5 text-[11px] tracking-[0.25em] uppercase hover:bg-zinc-800 transition-colors font-medium disabled:opacity-40">
              {isProcessing ? 'AUTHORIZING GATEWAY...' : 'PROCEED TO PAYMENT'}
            </button>
            <div className="mt-6 flex items-center justify-center gap-3 opacity-40">
              <span className="border border-zinc-300 px-2 py-1 rounded text-[8px] font-bold">PAYSTACK</span>
              <span className="border border-zinc-300 px-2 py-1 rounded text-[8px] font-bold">VISA</span>
              <span className="border border-zinc-300 px-2 py-1 rounded text-[8px] font-bold">MASTERCARD</span>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
