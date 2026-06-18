/* eslint-disable @next/next/no-img-element */
'use client';
export const dynamic = 'force-dynamic';

import { useEffect, useState } from 'react';
import { createClient } from '@supabase/supabase-js';
import Link from 'next/link';
import { useApp } from '../providers';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
const supabase = createClient(supabaseUrl, supabaseAnonKey);

export default function CheckoutPage() {
  const { cart, clearCart, showToast } = useApp();

  const [customerName, setCustomerName] = useState('');
  const [customerEmail, setCustomerEmail] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [shippingAddress, setShippingAddress] = useState('');
  
  const [deliveryInfo, setDeliveryInfo] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [generatedOrderId, setGeneratedOrderId] = useState('');

  // Hydrate routing logistics cache from secure workspace directory
  useEffect(() => {
    const cachedDelivery = localStorage.getItem('sikamore_delivery');
    if (cachedDelivery) {
      try {
        const parsed = JSON.parse(cachedDelivery);
        setDeliveryInfo(parsed);
        setShippingAddress(parsed.address || '');
      } catch (e) {
        console.error("Cache parsing mismatch:", e);
      }
    }
  }, []);

  const cartSubtotal = cart.reduce((total, item) => total + (item.price * item.quantity), 0);
  const shippingFee = deliveryInfo ? deliveryInfo.fee : 0;
  const totalAmount = cartSubtotal + shippingFee;
  const activeCurrencySymbol = deliveryInfo?.currency === 'USD' ? '$' : deliveryInfo?.currency === 'GBP' ? '£' : deliveryInfo?.currency === 'EUR' ? '€' : '₦';

  const formatPriceValue = (amount) => {
    return `${activeCurrencySymbol}${Math.round(amount).toLocaleString()}`;
  };

  const handlePlaceOrder = async (e) => {
    e.preventDefault();
    if (cart.length === 0) return showToast("BAG REGISTRY EMPTY.");
    if (!shippingAddress.trim()) return showToast("VALID DISPATCH LOCATION REQUIRED.");

    setIsProcessing(true);

    try {
      // Let Supabase auto-generate the strict UUID to prevent schema validation crashes
      const { data: orderData, error: dbError } = await supabase.from('orders').insert([
        {
          customer_name: customerName.toUpperCase(),
          customer_email: customerEmail.toLowerCase().trim(),
          customer_phone: customerPhone,
          shipping_address: shippingAddress.toUpperCase(),
          items: cart,
          total_amount: totalAmount,
          status: 'pending'
        }
      ]).select().single();

      if (dbError) throw dbError;

      // Capture the auto-generated UUID from the database and slice it for a clean reference stamp
      const fullOrderId = orderData.id;
      const orderRefStamp = fullOrderId.slice(0, 8).toUpperCase();

      // Format Items HTML string for email loops
      const orderItemsHtml = cart.map(i => `
        <tr>
          <td style="padding: 14px 0; border-bottom: 1px solid #1A1A1A; font-size: 10px; tracking: 0.15em; color: #E5E5E5; text-transform: uppercase;">${i.name.toUpperCase()} (${i.size}) x${i.quantity}</td>
          <td style="padding: 14px 0; border-bottom: 1px solid #1A1A1A; font-size: 10px; tracking: 0.15em; color: #FFFFFF; text-align: right; font-family: monospace;">₦${(i.price * i.quantity).toLocaleString()}</td>
        </tr>
      `).join('');

      // Build Monochrome Luxury HTML Email Template
      const buildEmailPayload = (statusHeader, statusMessage, isManagementLink = false) => `
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
                    <strong>NAME:</strong> ${customerName.toUpperCase()}<br/>
                    <strong>EMAIL:</strong> ${customerEmail}<br/>
                    <strong>PHONE:</strong> ${customerPhone || 'N/A'}
                  </td>
                </tr>
                
                <tr><td style="font-size:9px; color:#525252; tracking:0.2em; padding:30px 0 10px 0; font-weight:bold;">DELIVERY ITINERARY</td></tr>
                <tr><td style="padding:24px; background-color:#000000; border:1px solid #1A1A1A; font-size:10px; color:#A3A3A3; line-height:2.0;">${shippingAddress.toUpperCase()}</td></tr>
                
                <tr><td><table width="100%" cellspacing="0" cellpadding="0" style="margin-top:30px; border-collapse:collapse;">${orderItemsHtml}</table></td></tr>
                <tr><td style="padding-top:25px; font-size:11px; color:#FFFFFF; font-weight:bold;"><table width="100%"><tr><td>TOTAL FUNDS REMITTED</td><td align="right" style="font-family:monospace;">₦${totalAmount.toLocaleString()}</td></tr></table></td></tr>
                
                <tr><td align="center" style="padding-top:40px;"><a href="${isManagementLink ? 'https://ssikamore.com/admin' : 'https://ssikamore.com/dashboard'}" style="background-color:#FFFFFF; color:#000000; text-decoration:none; padding:12px 30px; font-size:9px; font-weight:bold; tracking:0.25em; display:inline-block;">${isManagementLink ? 'OPEN MANAGEMENT CONSOLE' : 'VIEW PRIVATE CONSOLE'}</a></td></tr>
                <tr><td align="center" style="padding-top:50px; border-top:1px solid #1A1A1A; margin-top:40px;"><p style="font-size:8px; color:#525252; margin:0; tracking:0.2em;">S. SIKAMÒRE AUTOMATION DIRECTIVE © 2026</p></td></tr>
              </table>
            </td></tr>
          </table>
        </body></html>
      `;

      // Concurrent Dispatch: Trigger emails simultaneously to prevent gateway lag
      await Promise.all([
        // Internal Team Notification
        fetch('/api/send', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            to: 'hello@ssikamore.com',
            fromEmail: 'shipping@ssikamore.com',
            fromName: 'S. SIKAMÒRE AUTOMATION',
            subject: `NEW ORDER SECURED: #${orderRefStamp} (₦${totalAmount.toLocaleString()})`,
            html: buildEmailPayload('NEW ACQUISITION SECURELY LOGGED', 'A new client order has bypass-verified payment protocols.', true)
          })
        }),
        // Customer Confirmation Receipt
        fetch('/api/send', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            to: customerEmail.toLowerCase().trim(),
            fromEmail: 'hello@ssikamore.com',
            fromName: 'S. SIKAMÒRE',
            subject: `YOUR S. SIKAMÒRE ORDER RECEIPT: #${orderRefStamp}`,
            html: buildEmailPayload('THANK YOU FOR YOUR PURCHASE', 'Your acquisition ledger is currently under verification within our atelier directory.', false)
          })
        })
      ]).catch(e => console.error("Parallel pipeline delay handler:", e));

      // Clean Workspace Environment States
      localStorage.removeItem('sikamore_delivery');
      setGeneratedOrderId(orderRefStamp);
      setIsSuccess(true);
      clearCart();
      showToast("ORDER SECURED COMPLIMENTARY.");

    } catch (err) {
      showToast(`CHECKOUT DISCREPANCY: ${err.message?.toUpperCase() || 'TRANSACTION REJECTED'}`);
    } finally {
      setIsProcessing(false);
    }
  };

  if (isSuccess) {
    return (
      <div className="min-h-screen bg-white text-black flex flex-col items-center justify-center px-6 font-sans antialiased text-center">
        <div className="max-w-md w-full border border-zinc-200 p-10 bg-white rounded-sm shadow-sm space-y-6">
          <h1 className="text-xl font-normal font-serif tracking-[0.3em] uppercase text-black">ACQUISITION COMPLETE</h1>
          <div className="w-10 h-[1px] bg-black mx-auto my-4"></div>
          <p className="text-[10px] text-zinc-500 tracking-widest uppercase leading-relaxed">
            Your transaction has settled successfully. A monochrome catalog invoice summary has been dispatched directly to <span className="text-black font-medium">{customerEmail}</span>.
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
    <div className="min-h-screen bg-white text-black font-sans antialiased text-[11px] py-12 px-4 sm:px-8 max-w-[1400px] mx-auto">
      
      <div className="mb-12 text-center border-b border-zinc-100 pb-8">
        <Link href="/shop" className="text-xl font-normal tracking-[0.4em] uppercase font-serif text-black hover:text-zinc-500 transition-colors">S. SIKAMÒRE</Link>
        <p className="text-[8px] tracking-[0.25em] uppercase text-zinc-400 mt-2">Secure Directory Checkout</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-start">
        
        {/* LEFT COLUMN: CLIENT DATA ENTRY */}
        <form onSubmit={handlePlaceOrder} className="lg:col-span-7 space-y-8 bg-white border border-zinc-200 p-6 sm:p-10 rounded-sm shadow-sm">
          <h2 className="text-xs font-medium tracking-[0.25em] uppercase text-black border-b border-zinc-100 pb-3 mb-6">Fulfillment Record</h2>
          
          <div className="space-y-6">
            <div>
              <label className="block text-[8px] tracking-[0.2em] text-zinc-400 mb-2 uppercase font-medium">Client Full Name</label>
              <input type="text" required value={customerName} onChange={(e) => setCustomerName(e.target.value)} placeholder="ENTER YOUR FULL NAME" className="w-full bg-zinc-50 p-4 border border-zinc-200 focus:border-black outline-none text-base md:text-[11px] text-black uppercase tracking-wider transition-colors" />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-[8px] tracking-[0.2em] text-zinc-400 mb-2 uppercase font-medium">Digital Email Directory</label>
                <input type="email" required value={customerEmail} onChange={(e) => setCustomerEmail(e.target.value)} placeholder="EMAIL@ADDRESS.COM" className="w-full bg-zinc-50 p-4 border border-zinc-200 focus:border-black outline-none text-base md:text-[11px] text-black tracking-wider transition-colors" />
              </div>
              <div>
                <label className="block text-[8px] tracking-[0.2em] text-zinc-400 mb-2 uppercase font-medium">Mobile Contact Matrix</label>
                <input type="tel" required value={customerPhone} onChange={(e) => setCustomerPhone(e.target.value)} placeholder="+234..." className="w-full bg-zinc-50 p-4 border border-zinc-200 focus:border-black outline-none text-base md:text-[11px] text-black font-mono transition-colors" />
              </div>
            </div>

            <div>
              <label className="block text-[8px] tracking-[0.2em] text-zinc-400 mb-2 uppercase font-medium">Fulfillment Dispatch Address / Landmark Bus Stop</label>
              <textarea required rows="3" value={shippingAddress} onChange={(e) => setShippingAddress(e.target.value)} placeholder="SPECIFY EXACT DELIVERY LOCATION PRECISELY..." className="w-full bg-zinc-50 p-4 border border-zinc-200 focus:border-black outline-none text-base md:text-[11px] text-black uppercase tracking-wider resize-none transition-colors" />
              {deliveryInfo?.zone && (
                <span className="text-[8px] tracking-widest text-zinc-400 block mt-2 font-mono bg-zinc-50 p-2 border border-zinc-200">
                  ROUTING ZONE LAYOUT: {deliveryInfo.zone.toUpperCase()}
                </span>
              )}
            </div>
          </div>

          <button type="submit" disabled={isProcessing || cart.length === 0} className="w-full bg-black text-white py-4 text-[10px] font-bold tracking-[0.3em] uppercase hover:bg-zinc-800 transition-colors disabled:opacity-30 disabled:cursor-not-allowed rounded-sm my-2">
            {isProcessing ? 'PROCESSING SECURE ESCROW...' : `CONFIRM ACQUISITION • ${formatPriceValue(totalAmount)}`}
          </button>
        </form>

        {/* RIGHT COLUMN: MANIFEST SUMMARY */}
        <div className="lg:col-span-5 space-y-6">
          <div className="bg-[#0A0A0A] text-white border border-zinc-900 p-6 sm:p-8 rounded-sm shadow-xl">
            <h3 className="text-[10px] tracking-[0.25em] uppercase font-medium border-b border-zinc-800 pb-3 mb-6 text-zinc-400">Acquisition Manifest</h3>
            
            <div className="divide-y divide-zinc-900 overflow-y-auto max-h-[260px] pr-2 mb-6">
              {cart.length === 0 ? (
                <p className="text-zinc-600 text-center py-6 uppercase tracking-widest text-[9px]">Your shopping bag data frame is vacant.</p>
              ) : (
                cart.map((item, idx) => (
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
                        <span className="font-mono text-zinc-200">{formatPriceValue(item.price * item.quantity)}</span>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>

            <div className="border-t border-zinc-900 pt-5 space-y-2.5 text-[10px] tracking-widest uppercase text-zinc-500">
              <div className="flex justify-between">
                <span>Items Subtotal:</span>
                <span className="font-mono text-zinc-300">{formatPriceValue(cartSubtotal)}</span>
              </div>
              <div className="flex justify-between">
                <span>Logistics Routing Fee:</span>
                <span className="font-mono text-zinc-300">{shippingFee > 0 ? formatPriceValue(shippingFee) : 'FREE REF'}</span>
              </div>
              <div className="flex justify-between font-bold text-white text-xs pt-4 border-t border-zinc-800 mt-4">
                <span>Aggregate Total:</span>
                <span className="font-mono text-white text-[13px]">{formatPriceValue(totalAmount)}</span>
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
