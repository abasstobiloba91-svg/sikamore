/* eslint-disable @next/next/no-img-element */
'use client';
export const dynamic = 'force-dynamic';

import { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useApp } from '../providers';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
const supabase = createClient(supabaseUrl, supabaseAnonKey);

const currencySymbols = { NGN: '₦', USD: '$', GBP: '£', EUR: '€' };

export default function CheckoutPage() {
  const router = useRouter();
  const { cart, clearCart, showToast } = useApp();

  // DYNAMIC PRICING STATES
  const [usdToNgnRate, setUsdToNgnRate] = useState(1500);
  const [intlFeeAfrica, setIntlFeeAfrica] = useState(45);
  const [intlFeeGlobal, setIntlFeeGlobal] = useState(55);

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
  const [isScriptLoaded, setIsScriptLoaded] = useState(false);
  const [deliveryData, setDeliveryData] = useState(null);
  const [currency, setCurrency] = useState('NGN');
  const [isHydrated, setIsHydrated] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [generatedOrderId, setGeneratedOrderId] = useState('');

  // 1. INJECT SECURE PAYSTACK INLINE SDK & LOAD MASTER SETTINGS
  useEffect(() => {
    if (typeof window !== 'undefined') {
      if (!window.PaystackPop) {
        const script = document.createElement('script');
        script.src = 'https://js.paystack.co/v2/inline.js';
        script.async = true;
        script.onload = () => setIsScriptLoaded(true);
        document.head.appendChild(script);
      } else {
        setIsScriptLoaded(true);
      }
    }

    async function loadMasterLogistics() {
      try {
        const { data } = await supabase.from('shipping_settings').select('*').eq('id', 1).single();
        if (data) {
          if (data.usd_to_ngn_rate) setUsdToNgnRate(parseFloat(data.usd_to_ngn_rate));
          if (data.international_fee_africa) setIntlFeeAfrica(parseFloat(data.international_fee_africa));
          if (data.international_fee_global) setIntlFeeGlobal(parseFloat(data.international_fee_global));
        }
      } catch (e) {}
    }
    loadMasterLogistics();
  }, []);

  // 2. HYDRATION & SESSION MANAGEMENT
  useEffect(() => {
    const timeout = setTimeout(() => {
      setIsHydrated(true);
      if ((!cart || cart.length === 0) && !isSuccess) {
        router.push('/shop');
      }
    }, 800);

    if (typeof window !== 'undefined') {
      const storedDelivery = localStorage.getItem('sikamore_delivery');
      if (storedDelivery) {
        try {
          const parsed = JSON.parse(storedDelivery);
          setDeliveryData(parsed);
          if (parsed.currency) setCurrency(parsed.currency);
          if (parsed.address) setAddress(parsed.address.toUpperCase());
        } catch(e) {}
      }
    }
    
    async function checkActiveSession() {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        setEmail(session.user.email);
        setFirstName(session.user.user_metadata?.first_name || '');
        setLastName(session.user.user_metadata?.last_name || '');
        setPhone(session.user.user_metadata?.phone || '');
        setAddress(session.user.user_metadata?.address || address || '');
        setAccountStatus('logged_in');
      }
    }
    checkActiveSession();

    return () => clearTimeout(timeout);
  }, [cart, router, address, isSuccess]);

  // MATH CORE: 1-to-1 Pure Conversion Math
  const cartSubtotalNgn = cart.reduce((total, item) => total + (item.price * item.quantity), 0);
  const shippingFeeNgn = deliveryData?.fee || 0; 
  
  const getDynamicExchangeRate = () => {
    const rates = { NGN: 1, USD: 1 / usdToNgnRate, GBP: 1 / (usdToNgnRate * 1.32), EUR: 1 / (usdToNgnRate * 1.12) };
    return rates[currency] || 1;
  };

  const finalConvertedSubtotal = cartSubtotalNgn * getDynamicExchangeRate();
  const finalConvertedShipping = shippingFeeNgn * getDynamicExchangeRate();
  const finalNumericTotal = finalConvertedSubtotal + finalConvertedShipping;

  const displayFormat = (amount) => {
    if (currency === 'NGN') return `₦${Math.round(amount).toLocaleString()}`;
    return `${currencySymbols[currency] || '$'}${amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  const handleEmailCheck = async (e) => {
    const inputEmail = e.target.value;
    setEmail(inputEmail);
    if (accountStatus === 'logged_in') return;
    if (inputEmail.includes('@') && inputEmail.includes('.')) {
      setIsScanningEmail(true);
      try {
        const { data } = await supabase.from('orders').select('customer_email').eq('customer_email', inputEmail.toLowerCase().trim()).limit(1);
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

  // 3. FINALIZE EMAILS & STATUS POST-PAYMENT
  const finalizeOrderSuccess = async (transactionRef, dbOrderId, customerFullName) => {
    try {
      showToast('PAYMENT SECURED. DISPATCHING RECEIPTS...');

      // Update the pre-saved order to paid
      await supabase.from('orders').update({ status: 'paid' }).eq('id', dbOrderId);

      const orderRefStamp = dbOrderId.slice(0, 8).toUpperCase();

      const orderItemsHtml = cart.map(i => {
        const itemConverted = i.price * getDynamicExchangeRate();
        return `
        <tr>
          <td style="padding: 14px 0; border-bottom: 1px solid #1A1A1A; font-size: 10px; tracking: 0.15em; color: #E5E5E5; text-transform: uppercase;">${i.name.toUpperCase()} (${i.size}) x${i.quantity}</td>
          <td style="padding: 14px 0; border-bottom: 1px solid #1A1A1A; font-size: 10px; tracking: 0.15em; color: #FFFFFF; text-align: right; font-family: monospace;">${displayFormat(itemConverted * i.quantity)}</td>
        </tr>
      `}).join('');

      const buildEmailPayload = (statusHeader, isManagementLink = false) => `
        <!DOCTYPE html><html><head><meta charset="utf-8"></head>
        <body style="margin:0; padding:0; background-color:#000000; font-family:-apple-system, sans-serif;">
          <table width="100%" border="0" cellspacing="0" cellpadding="0" style="background-color:#000000; padding:40px 10px;">
            <tr><td align="center">
              <table width="500" border="0" cellspacing="0" cellpadding="0" style="background-color:#0A0A0A; border:1px solid #1A1A1A; padding:45px; text-transform:uppercase; letter-spacing:0.15em; line-height:1.8;">
                <tr><td align="center" style="padding-bottom:20px; border-bottom:1px solid #1A1A1A;"><h2 style="font-family:serif; letter-spacing:0.35em; font-size:15px; margin:0; color:#FFFFFF;">S. SIKAMÒRE</h2></td></tr>
                <tr><td style="font-size:11px; color:#FFFFFF; padding:35px 0 10px 0; font-weight:bold; tracking:0.2em; text-align:center;">${statusHeader}</td></tr>
                <tr><td style="font-size:9px; color:#525252; text-align:center; padding-bottom:30px; font-family:monospace;">ORDER REFERENCE: #${orderRefStamp}</td></tr>
                
                <tr>
                  <td style="padding:24px; background-color:#111111; border:1px solid #1A1A1A; color:#E5E5E5; font-size:10px;">
                    <span style="color:#525252; font-size:8px; font-weight:bold; tracking:0.2em; display:block; margin-bottom:8px;">CLIENT REGISTRY</span>
                    <strong>NAME:</strong> ${customerFullName}<br/>
                    <strong>EMAIL:</strong> ${email}<br/>
                    <strong>PHONE:</strong> ${phone || 'N/A'}
                  </td>
                </tr>
                
                <tr><td style="font-size:9px; color:#525252; tracking:0.2em; padding:30px 0 10px 0; font-weight:bold;">DELIVERY ITINERARY</td></tr>
                <tr><td style="padding:24px; background-color:#000000; border:1px solid #1A1A1A; font-size:10px; color:#A3A3A3; line-height:2.0;">${address.toUpperCase()}</td></tr>
                
                <tr><td><table width="100%" cellspacing="0" cellpadding="0" style="margin-top:30px; border-collapse:collapse;">${orderItemsHtml}</table></td></tr>
                <tr><td style="padding-top:25px; font-size:11px; color:#FFFFFF; font-weight:bold;"><table width="100%"><tr><td>TOTAL FUNDS REMITTED</td><td align="right" style="font-family:monospace;">${displayFormat(finalNumericTotal)}</td></tr></table></td></tr>
                
                <tr><td align="center" style="padding-top:40px;"><a href="${isManagementLink ? 'https://ssikamore.com/admin' : 'https://ssikamore.com/dashboard'}" style="background-color:#FFFFFF; color:#000000; text-decoration:none; padding:12px 30px; font-size:9px; font-weight:bold; tracking:0.25em; display:inline-block;">${isManagementLink ? 'OPEN MANAGEMENT CONSOLE' : 'VIEW PRIVATE CONSOLE'}</a></td></tr>
              </table>
            </td></tr>
          </table>
        </body></html>
      `;

      await Promise.all([
        fetch('/api/send', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            to: 'hello@ssikamore.com',
            fromEmail: 'shipping@ssikamore.com',
            fromName: 'S. SIKAMÒRE AUTOMATION',
            subject: `NEW ORDER SECURED: #${orderRefStamp} (${displayFormat(finalNumericTotal)})`,
            html: buildEmailPayload('NEW ACQUISITION SECURELY LOGGED', true)
          })
        }),
        fetch('/api/send', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            to: email.toLowerCase().trim(),
            fromEmail: 'hello@ssikamore.com',
            fromName: 'S. SIKAMÒRE',
            subject: `YOUR S. SIKAMÒRE ORDER RECEIPT: #${orderRefStamp}`,
            html: buildEmailPayload('THANK YOU FOR YOUR PURCHASE', false)
          })
        })
      ]).catch(e => console.error("Email pipeline delay:", e));

      localStorage.removeItem('sikamore_delivery');
      setGeneratedOrderId(orderRefStamp);
      setIsSuccess(true);
      clearCart();
      showToast("ACQUISITION COMPLETE.");
      
    } catch (err) {
      showToast(`RECEIPT ERROR: ${err.message.toUpperCase()}`);
    } finally {
      setIsProcessing(false);
    }
  };

  // 4. PRE-SAVE ORDER & INITIATE CHECKOUT
  const handleCheckoutProcess = async (e) => {
    e.preventDefault();
    if (!email || !address || !firstName || !lastName || !phone) return showToast('PLEASE COMPLETE ALL REQUIRED FIELDS.');
    if (!isScriptLoaded || !window.PaystackPop) return showToast('SECURE CONNECTION CONFIGURING... PLEASE TRY AGAIN IN A MOMENT.');

    setIsProcessing(true);

    try {
      if (password.trim().length >= 6) {
        const { error: signInError } = await supabase.auth.signInWithPassword({
          email: email.toLowerCase().trim(),
          password: password
        });
        
        if (signInError) {
          await supabase.auth.signUp({
            email: email.toLowerCase().trim(),
            password: password,
            options: { data: { first_name: firstName, last_name: lastName, phone: phone, address: address, name: `${firstName} ${lastName}`.trim().toUpperCase() } }
          });
        }
      }
    } catch (err) {
      console.log('Guest fallback engaged.');
    }

    try {
      showToast('SECURING LEDGER ENTRY...');
      
      const transactionRef = `SKM_${new Date().getTime().toString()}`;
      const customerFullName = `${firstName} ${lastName}`.trim().toUpperCase();

      // PRE-SAVE ORDER TO DATABASE (Status: pending_payment)
      const { data: orderData, error: dbError } = await supabase.from('orders').insert([{
        customer_name: customerFullName,
        customer_email: email.toLowerCase().trim(),
        customer_phone: phone,
        shipping_address: address.toUpperCase(),
        total_amount: cartSubtotalNgn + shippingFeeNgn, 
        items: cart,
        status: 'pending_payment',
        payment_reference: transactionRef
      }]).select().single();

      if (dbError) {
        setIsProcessing(false);
        return showToast(`DATABASE ERROR: ${dbError.message.toUpperCase()}`);
      }

      showToast('LAUNCHING SECURE PAYMENT COHORT...');
      const paystack = new window.PaystackPop();
      
      paystack.newTransaction({
        key: process.env.NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY || '',
        email: email.toLowerCase().trim(),
        amount: Math.round(finalNumericTotal * 100), 
        currency: currency, 
        reference: transactionRef,
        onSuccess: (transaction) => {
          // PROCEED TO MARK AS PAID AND EMAIL
          finalizeOrderSuccess(transaction.reference, orderData.id, customerFullName);
        },
        onCancel: () => {
          setIsProcessing(false);
          showToast('PAYMENT CANCELLED BY USER.');
        }
      });
    } catch (err) {
      showToast(`GATEWAY ERROR: ${err.message.toUpperCase()}`);
      setIsProcessing(false);
    }
  };

  if (!isHydrated) {
    return (
      <div className="min-h-screen bg-white text-black flex items-center justify-center font-sans uppercase tracking-[0.3em] text-[9px]">
        Synchronizing Secured Atelier Pipeline...
      </div>
    );
  }

  if (isSuccess) {
    return (
      <div className="min-h-screen bg-white text-black flex flex-col items-center justify-center px-6 font-sans antialiased text-center">
        <div className="max-w-md w-full border border-zinc-200 p-10 bg-white rounded-sm shadow-sm space-y-6 animate-fade-in">
          <h1 className="text-xl font-normal font-serif tracking-[0.3em] uppercase text-black">PAYMENT COMPLETE</h1>
          <div className="w-10 h-[1px] bg-black mx-auto my-4"></div>
          <p className="text-[10px] text-zinc-500 tracking-widest uppercase leading-relaxed">
            Your transaction has settled successfully. A receipt has been dispatched directly to <span className="text-black font-medium">{email}</span>.
          </p>
          <div className="bg-zinc-50 border border-zinc-200 p-4 rounded-sm font-mono text-[10px] text-zinc-600 uppercase tracking-widest">
            REFERENCE STAMP: #{generatedOrderId}
          </div>
          <div className="pt-4 flex flex-col gap-3">
            <Link href="/shop" className="w-full bg-black text-white py-3.5 text-[9px] font-bold tracking-[0.2em] uppercase hover:bg-zinc-800 transition-colors block text-center rounded-sm">
              Return to Catalog
            </Link>
            <Link href="/dashboard" className="w-full border border-zinc-300 text-black py-3.5 text-[9px] font-bold tracking-[0.2em] uppercase hover:bg-zinc-50 transition-colors block text-center rounded-sm">
              Track In Console
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white text-black font-sans antialiased text-[11px] py-12 px-4 sm:px-8 max-w-[1400px] mx-auto animate-fade-in">
      
      <div className="mb-12 text-center border-b border-zinc-100 pb-8">
        <Link href="/shop" className="text-xl font-normal tracking-[0.4em] uppercase font-serif text-black hover:text-zinc-500 transition-colors">S. SIKAMÒRE</Link>
        <p className="text-[8px] tracking-[0.25em] uppercase text-zinc-400 mt-2">Secure Directory Checkout</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-start">
        
        <form onSubmit={handleCheckoutProcess} className="lg:col-span-7 space-y-10 bg-white border border-zinc-200 p-6 sm:p-10 rounded-sm shadow-sm">
          <section>
            <h2 className="text-xs font-medium tracking-[0.25em] uppercase text-black border-b border-zinc-100 pb-3 mb-6">Digital Identity</h2>
            <div className="space-y-4 relative">
              <input type="email" value={email} onChange={handleEmailCheck} disabled={accountStatus === 'logged_in'} placeholder="EMAIL ADDRESS" required className="w-full bg-zinc-50 p-4 border border-zinc-200 focus:border-black outline-none text-base md:text-[11px] uppercase tracking-widest disabled:opacity-50 transition-colors" />
              {isScanningEmail && <span className="absolute right-4 top-4 text-[9px] text-zinc-400 uppercase tracking-widest animate-pulse">Scanning Profile...</span>}
              
              {accountStatus === 'exists' && (
                <div className="animate-fade-in space-y-3 bg-zinc-50 p-4 border border-zinc-200">
                  <p className="text-[9px] text-zinc-500 uppercase tracking-widest">Profile detected. Enter password or leave blank for guest checkout.</p>
                  <div className="relative">
                    <input type={showPassword ? "text" : "password"} value={password} onChange={(e) => setPassword(e.target.value)} placeholder="ENTER PASSWORD (OPTIONAL)" className="w-full bg-white p-4 border border-zinc-200 focus:border-black outline-none text-base md:text-[11px] uppercase tracking-widest pr-12 transition-colors" />
                    <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-4 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-black">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d={showPassword ? "M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0l-3.29-3.29" : "M15 12a3 3 0 11-6 0 3 3 0 016 0z M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268-2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"} /></svg>
                    </button>
                  </div>
                  <button type="button" onClick={handlePasswordReset} className="text-[8px] text-zinc-400 hover:text-black underline uppercase tracking-widest mt-1 block">Forgot Password?</button>
                </div>
              )}

              {accountStatus === 'new' && (
                <div className="animate-fade-in space-y-3 bg-zinc-50 p-4 border border-zinc-200">
                  <p className="text-[9px] text-zinc-500 uppercase tracking-widest">Create a password to save an account context, or leave blank to skip.</p>
                  <div className="relative">
                    <input type={showPassword ? "text" : "password"} value={password} onChange={(e) => setPassword(e.target.value)} placeholder="CREATE PASSWORD (OPTIONAL)" className="w-full bg-white p-4 border border-zinc-200 focus:border-black outline-none text-base md:text-[11px] uppercase tracking-widest pr-12 transition-colors" />
                    <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-4 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-black">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d={showPassword ? "M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0l-3.29-3.29" : "M15 12a3 3 0 11-6 0 3 3 0 016 0z M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268-2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"} /></svg>
                    </button>
                  </div>
                </div>
              )}
            </div>
          </section>

          <section>
            <h2 className="text-xs font-medium tracking-[0.25em] uppercase text-black border-b border-zinc-100 pb-3 mb-6">Fulfillment Record</h2>
            <div className="space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[8px] tracking-[0.2em] text-zinc-400 mb-2 uppercase font-medium">First Name</label>
                  <input type="text" value={firstName} onChange={e => setFirstName(e.target.value)} placeholder="FIRST NAME" required className="w-full bg-zinc-50 p-4 border border-zinc-200 focus:border-black outline-none text-base md:text-[11px] uppercase tracking-widest transition-colors" />
                </div>
                <div>
                  <label className="block text-[8px] tracking-[0.2em] text-zinc-400 mb-2 uppercase font-medium">Last Name</label>
                  <input type="text" value={lastName} onChange={e => setLastName(e.target.value)} placeholder="LAST NAME" required className="w-full bg-zinc-50 p-4 border border-zinc-200 focus:border-black outline-none text-base md:text-[11px] uppercase tracking-widest transition-colors" />
                </div>
              </div>
              
              <div>
                <label className="block text-[8px] tracking-[0.2em] text-zinc-400 mb-2 uppercase font-medium">Mobile Contact Matrix</label>
                <input type="tel" value={phone} onChange={e => setPhone(e.target.value)} placeholder="+234..." required className="w-full bg-zinc-50 p-4 border border-zinc-200 focus:border-black outline-none text-base md:text-[11px] font-mono transition-colors" />
              </div>

              <div>
                <label className="block text-[8px] tracking-[0.2em] text-zinc-400 mb-2 uppercase font-medium">Fulfillment Dispatch Address</label>
                <textarea required rows="3" value={address} onChange={(e) => setAddress(e.target.value)} placeholder="NEAREST ZIP CODE, LANDMARK, OR BUS STOP..." className="w-full bg-zinc-50 p-4 border border-zinc-200 focus:border-black outline-none text-base md:text-[11px] uppercase tracking-wider resize-none transition-colors" />
                {deliveryData?.zone && (
                  <span className="text-[8px] tracking-widest text-zinc-400 block mt-2 font-mono bg-zinc-50 p-2 border border-zinc-200">
                    ROUTING ZONE LAYOUT: {deliveryData.zone.toUpperCase()}
                  </span>
                )}
              </div>
            </div>
          </section>

          <button type="submit" disabled={isProcessing || cart.length === 0} className="w-full bg-black text-white py-4 text-[10px] font-bold tracking-[0.3em] uppercase hover:bg-zinc-800 transition-colors disabled:opacity-30 disabled:cursor-not-allowed rounded-sm my-2">
            {isProcessing ? 'AUTHORIZING SECURE GATEWAY...' : !isScriptLoaded ? 'CONNECTING SECURITIES...' : `COMPLETE PAYMENT • ${displayFormat(finalNumericTotal)}`}
          </button>
        </form>

        <div className="lg:col-span-5 space-y-6">
          <div className="bg-[#0A0A0A] text-white border border-zinc-900 p-6 sm:p-8 rounded-sm shadow-xl">
            <h3 className="text-[10px] tracking-[0.25em] uppercase font-medium border-b border-zinc-800 pb-3 mb-6 text-zinc-400">Breakdown</h3>
            
            <div className="divide-y divide-zinc-900 overflow-y-auto max-h-[260px] pr-2 mb-6">
              {cart.map((item, idx) => {
                const itemConverted = item.price * getDynamicExchangeRate();
                return (
                <div key={`${item.id}-${item.size}-${idx}`} className="flex gap-4 py-4 first:pt-0 last:pb-0">
                  <div className="w-14 h-20 bg-[#111] shrink-0 border border-zinc-800 overflow-hidden rounded-xs">
                    {item.image && <img src={item.image} alt={item.name} className="w-full h-full object-cover" />}
                  </div>
                  <div className="flex-1 flex flex-col justify-between">
                    <div>
                      <h4 className="text-[9px] tracking-widest uppercase font-medium text-white line-clamp-1">{item.name}</h4>
                      <p className="text-[8px] text-zinc-500 uppercase tracking-widest mt-1">Size Matrix: {item.size}</p>
                    </div>
                    <div className="flex justify-between items-center text-[10px]">
                      <span className="text-zinc-400 font-mono">Qty: {item.quantity}</span>
                      <span className="font-mono text-zinc-200">{displayFormat(itemConverted * item.quantity)}</span>
                    </div>
                  </div>
                </div>
              )})}
            </div>

            <div className="border-t border-zinc-900 pt-5 space-y-2.5 text-[10px] tracking-widest uppercase text-zinc-500">
              <div className="flex justify-between">
                <span>Items Subtotal:</span>
                <span className="font-mono text-zinc-300">{displayFormat(finalConvertedSubtotal)}</span>
              </div>
              <div className="flex justify-between">
                <span>Logistics Routing Fee:</span>
                <span className="font-mono text-zinc-300">{displayFormat(finalConvertedShipping)}</span>
              </div>
              <div className="flex justify-between font-bold text-white text-xs pt-4 border-t border-zinc-800 mt-4">
                <span>Total:</span>
                <span className="font-mono text-white text-[13px]">{displayFormat(finalNumericTotal)}</span>
              </div>
            </div>
          </div>
          
          <div className="text-center">
            <Link href="/shop" className="text-[9px] tracking-widest text-zinc-400 hover:text-black uppercase transition-colors border-b border-transparent hover:border-black pb-0.5 font-medium">&larr; Revise Selected Pieces</Link>
          </div>
        </div>

      </div>
    </div>
  );
}
