/* eslint-disable @next/next/no-img-element */
'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useApp } from '../providers';

export default function CheckoutPage() {
  const { cart, clearCart, showToast } = useApp(); 
  const [processing, setProcessing] = useState(false);

  const [email, setEmail] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [address, setAddress] = useState('');
  const [shippingZone, setShippingZone] = useState('lagos_standard');

  const itemTotal = cart.reduce((acc, item) => acc + (item.price * item.quantity), 0);
  
  const shippingRates = {
    'lagos_standard': 9000,
    'lagos_outskirts': 12000,
    'outside_lagos': 25000
  };
  
  const shippingFee = cart.length > 0 ? shippingRates[shippingZone] : 0;
  const grandTotal = itemTotal + shippingFee;

  const handleCheckoutSubmit = (e) => {
    e.preventDefault();
    if (cart.length === 0) return showToast('ERROR: YOUR SHOPPING BAG IS EMPTY.');
    setProcessing(true);
    setTimeout(() => {
      setProcessing(false);
      showToast('ORDER SECURELY PLACED. RECEIPT DISPATCHED.');
      clearCart();
    }, 2500);
  };

  return (
    <div className="min-h-screen bg-white text-black font-sans antialiased text-[11px]">
      
      <header className="border-b border-gray-100 h-20 flex items-center justify-between px-4 sm:px-8 bg-white sticky top-0 z-10">
        <Link href="/shop" className="tracking-[0.2em] text-gray-500 hover:text-black uppercase text-[9px] sm:text-[10px] z-10">
          &larr; Return to Store
        </Link>
        <h1 className="text-lg sm:text-xl font-normal tracking-[0.4em] uppercase font-serif text-center w-full absolute left-0 pointer-events-none">
          S. SIKAMÒRE
        </h1>
        <div className="hidden sm:block text-[9px] text-gray-400 uppercase tracking-widest z-10">Secure Checkout</div>
      </header>

      <main className="max-w-6xl mx-auto px-4 sm:px-8 py-12 grid grid-cols-1 lg:grid-cols-12 gap-16">
        
        <div className="lg:col-span-7 space-y-10">
          <h2 className="text-2xl font-light tracking-wide">Checkout</h2>
          
          <form onSubmit={handleCheckoutSubmit} className="space-y-8">
            <div className="space-y-6">
              <h3 className="text-xs uppercase tracking-widest font-medium border-b border-gray-200 pb-2">Billing details</h3>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="flex flex-col gap-2">
                  <label className="text-[10px] text-gray-500 uppercase tracking-wider">First name *</label>
                  {/* ZOOM FIX APPLIED HERE: text-base for mobile, scales cleanly to md:text-xs on desktop */}
                  <input 
                    type="text" 
                    value={firstName} 
                    onChange={(e) => setFirstName(e.target.value)} 
                    required 
                    className="border border-gray-300 p-3 outline-none focus:border-black transition-colors text-base md:text-xs uppercase tracking-wider rounded-none" 
                  />
                </div>
                <div className="flex flex-col gap-2">
                  <label className="text-[10px] text-gray-500 uppercase tracking-wider">Last name *</label>
                  <input 
                    type="text" 
                    value={lastName} 
                    onChange={(e) => setLastName(e.target.value)} 
                    required 
                    className="border border-gray-300 p-3 outline-none focus:border-black transition-colors text-base md:text-xs uppercase tracking-wider rounded-none" 
                  />
                </div>
              </div>

              <div className="flex flex-col gap-2">
                <label className="text-[10px] text-gray-500 uppercase tracking-wider">Email address *</label>
                <input 
                  type="type" 
                  value={email} 
                  onChange={(e) => setEmail(e.target.value)} 
                  required 
                  className="border border-gray-300 p-3 outline-none focus:border-black transition-colors text-base md:text-xs tracking-wider rounded-none" 
                />
              </div>

              <div className="flex flex-col gap-2">
                <label className="text-[10px] text-gray-500 uppercase tracking-wider">Street address *</label>
                <input 
                  type="text" 
                  value={address} 
                  onChange={(e) => setAddress(e.target.value)} 
                  required 
                  placeholder="House number and street name" 
                  className="border border-gray-300 p-3 outline-none focus:border-black transition-colors text-base md:text-xs uppercase tracking-wider rounded-none placeholder-gray-300" 
                />
              </div>
            </div>
            
            <button type="submit" disabled={processing || cart.length === 0} className="w-full bg-black text-white py-5 text-[10px] tracking-[0.2em] uppercase hover:bg-zinc-800 transition-colors disabled:opacity-50">
              {processing ? 'Processing Securely...' : 'Place Order'}
            </button>
          </form>
        </div>

        <div className="lg:col-span-5 bg-gray-50 border border-gray-200 p-8 h-fit space-y-8">
          <h3 className="text-sm tracking-wide font-medium">Your order</h3>
          
          <div className="space-y-4">
            <div className="flex justify-between text-[10px] text-gray-500 uppercase tracking-widest border-b border-gray-200 pb-2">
              <span>Product</span>
              <span>Total</span>
            </div>
            
            {cart.map((item, idx) => (
              <div key={idx} className="flex gap-4 py-2 border-b border-gray-100">
                <div className="w-16 h-20 bg-white shrink-0 border border-gray-200">
                  <img src={item.image} alt={item.name} className="w-full h-full object-cover" onError={(e) => { e.target.src = '/product 1.jpeg'; }} />
                </div>
                <div className="flex-1 flex flex-col justify-center">
                  <h4 className="text-[10px] uppercase tracking-widest font-medium text-black">{item.name} × {item.quantity}</h4>
                  <p className="text-[9px] text-gray-500 mt-1 uppercase">Size: {item.size}</p>
                </div>
                <div className="flex items-center text-[10px] tracking-wider text-black">
                  ₦{(item.price * item.quantity).toLocaleString()}
                </div>
              </div>
            ))}
          </div>

          <div className="space-y-4 pt-4 border-t border-gray-200">
            <div className="flex justify-between text-xs tracking-wider">
              <span className="text-gray-500">Subtotal</span>
              <span className="font-medium">₦{itemTotal.toLocaleString()}</span>
            </div>
            
            <div className="space-y-3 pt-4">
              <span className="text-gray-500 text-xs tracking-wider">Shipping</span>
              <div className="space-y-2">
                <label className="flex items-center justify-between cursor-pointer group">
                  <div className="flex items-center gap-3">
                    <input type="radio" name="shipping" value="lagos_standard" checked={shippingZone === 'lagos_standard'} onChange={() => setShippingZone('lagos_standard')} className="w-3 h-3 text-black focus:ring-black border-gray-300 accent-black" />
                    <span className="text-[10px] tracking-widest text-gray-600 group-hover:text-black">Lagos (Yaba, Lekki, Surulere)</span>
                  </div>
                  <span className="text-[10px] tracking-widest">₦9,000</span>
                </label>
                <label className="flex items-center justify-between cursor-pointer group">
                  <div className="flex items-center gap-3">
                    <input type="radio" name="shipping" value="lagos_outskirts" checked={shippingZone === 'lagos_outskirts'} onChange={() => setShippingZone('lagos_outskirts')} className="w-3 h-3 text-black focus:ring-black border-gray-300 accent-black" />
                    <span className="text-[10px] tracking-widest text-gray-600 group-hover:text-black">Lagos (Ogba, Berger, V.I)</span>
                  </div>
                  <span className="text-[10px] tracking-widest">₦12,000</span>
                </label>
                <label className="flex items-center justify-between cursor-pointer group">
                  <div className="flex items-center gap-3">
                    <input type="radio" name="shipping" value="outside_lagos" checked={shippingZone === 'outside_lagos'} onChange={() => setShippingZone('outside_lagos')} className="w-3 h-3 text-black focus:ring-black border-gray-300 accent-black" />
                    <span className="text-[10px] tracking-widest text-gray-600 group-hover:text-black">Outside Lagos / Int. Shipping</span>
                  </div>
                  <span className="text-[10px] tracking-widest">₦25,000</span>
                </label>
              </div>
            </div>

            <div className="flex justify-between text-sm tracking-wider font-medium pt-6 border-t border-gray-200">
              <span>Total</span>
              <span>₦{grandTotal.toLocaleString()}</span>
            </div>
          </div>
          
          <div className="pt-4 flex flex-col gap-2 items-center opacity-40 grayscale contrast-200 pointer-events-none">
            <span className="text-[8px] uppercase tracking-widest">Secured by Paystack</span>
            <div className="flex gap-2">
               <span className="border border-gray-400 px-1.5 py-0.5 rounded font-bold text-[8px]">VISA</span>
               <span className="border border-gray-400 px-1.5 py-0.5 rounded font-bold text-[8px]">MC</span>
               <span className="border border-gray-400 px-1.5 py-0.5 rounded font-bold text-[8px]">VERVE</span>
            </div>
          </div>
        </div>

      </main>
    </div>
  );
}
