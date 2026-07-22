/* eslint-disable @next/next/no-img-element */
'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useApp } from './providers'; 
import { createClient } from '@supabase/supabase-js';

// We need a tiny Supabase instance to fetch the live exchange rate for the cart drawer
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
const supabase = createClient(supabaseUrl, supabaseAnonKey);

const currencySymbols = { NGN: '₦', USD: '$', GBP: '£', EUR: '€' };

export default function GlobalCart() {
  const { cart, removeFromCart } = useApp();
  const [isOpen, setIsOpen] = useState(false);
  const pathname = usePathname();

  // --- GLOBAL CURRENCY STATES ---
  const [currency, setCurrency] = useState('NGN');
  const [usdToNgnRate, setUsdToNgnRate] = useState(1500);

  // --- DRAGGABLE PHYSICS STATES ---
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const isDragging = useRef(false);
  const startPos = useRef({ x: 0, y: 0 });
  const hasDragged = useRef(false);

  // Calculate cart totals
  const totalItems = cart.reduce((total, item) => total + item.quantity, 0);
  const cartSubtotal = cart.reduce((total, item) => total + (Number(item.price || 0) * Number(item.quantity || 1)), 0);

  // 1. LOAD MASTER EXCHANGE RATE & DETECT LOCATION (Just like your shop code!)
  useEffect(() => {
    async function loadMasterSettings() {
      try {
        const { data } = await supabase.from('shipping_settings').select('usd_to_ngn_rate').eq('id', 1).single();
        if (data && data.usd_to_ngn_rate) setUsdToNgnRate(parseFloat(data.usd_to_ngn_rate));
      } catch (e) {}
    }
    loadMasterSettings();

    async function locateClientNetwork() {
      try {
        const res = await fetch('https://ipapi.co/json/');
        const data = await res.json();
        if (data && data.country_code) {
          const checkEurope = data.in_eu || ['FR', 'DE', 'IT', 'ES', 'NL', 'GB'].includes(data.country_code);
          if (data.country_code === 'NG') setCurrency('NGN');
          else if (data.continent_code === 'AF') setCurrency('USD'); 
          else if (data.country_code === 'GB') setCurrency('GBP');
          else if (checkEurope) setCurrency('EUR');
          else setCurrency('USD');
        }
      } catch (err) {}
    }
    locateClientNetwork();
  }, []);

  // Close the cart drawer automatically when the user navigates
  useEffect(() => {
    setIsOpen(false);
  }, [pathname]);

  // Hide on Home Page, Checkout, and Admin
  if (pathname === '/' || pathname === '/checkout' || pathname.startsWith('/admin')) {
    return null;
  }

  // --- FORMAT PRICE EXACTLY LIKE YOUR CODE ---
  const formatPrice = (ngnPrice) => {
    if (ngnPrice === undefined || ngnPrice === null) return '';
    const dynamicExchangeRates = { 
      NGN: 1, 
      USD: 1 / usdToNgnRate, 
      GBP: 1 / (usdToNgnRate * 1.32),
      EUR: 1 / (usdToNgnRate * 1.12) 
    };
    const rate = dynamicExchangeRates[currency] || 1;
    const converted = Number(ngnPrice) * rate; 
    if (isNaN(converted)) return '';
    if (currency === 'NGN') return `₦${Math.round(converted).toLocaleString()}`;
    return `${currencySymbols[currency] || '$'}${converted.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  // --- POINTER EVENT HANDLERS FOR DRAGGING ---
  const handlePointerDown = (e) => {
    isDragging.current = true;
    hasDragged.current = false;
    startPos.current = { x: e.clientX - offset.x, y: e.clientY - offset.y };
    e.currentTarget.setPointerCapture(e.pointerId);
  };

  const handlePointerMove = (e) => {
    if (!isDragging.current) return;
    const newX = e.clientX - startPos.current.x;
    const newY = e.clientY - startPos.current.y;
    if (Math.abs(e.clientX - (startPos.current.x + offset.x)) > 3 || Math.abs(e.clientY - (startPos.current.y + offset.y)) > 3) {
      hasDragged.current = true;
    }
    setOffset({ x: newX, y: newY });
  };

  const handlePointerUp = (e) => {
    isDragging.current = false;
    e.currentTarget.releasePointerCapture(e.pointerId);
  };

  const handleClick = (e) => {
    if (hasDragged.current) {
      e.preventDefault();
      e.stopPropagation();
      return;
    }
    setIsOpen(true);
  };

  return (
    <>
      {/* DRAGGABLE FLOATING CART ICON (WITH YOUR TOTE BAG ICON) */}
      <div 
        className="fixed bottom-6 right-6 z-[9999] touch-none"
        style={{ transform: `translate3d(${offset.x}px, ${offset.y}px, 0)` }}
      >
        <button 
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          onPointerCancel={handlePointerUp}
          onClick={handleClick}
          className="w-14 h-14 bg-white/95 backdrop-blur-sm border border-zinc-200 shadow-xl rounded-full flex items-center justify-center transition-transform hover:scale-105 active:scale-95 cursor-grab active:cursor-grabbing"
          aria-label="Open Cart"
        >
          <div className="relative flex items-center justify-center">
            {/* Tapered Bag Icon */}
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="black" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M8 8V5a4 4 0 0 1 8 0v3" />
              <path d="M4.5 8h15l1.5 13H3L4.5 8z" />
            </svg>
            
            {/* Overlapping Notification Badge */}
            {totalItems > 0 && (
              <span className="absolute -top-2.5 -right-3 bg-black text-white w-6 h-6 flex items-center justify-center rounded-full text-[11px] font-bold font-sans border-2 border-white">
                {totalItems}
              </span>
            )}
          </div>
        </button>
      </div>

      {/* SLIDE-OUT DRAWER OVERLAY */}
      {isOpen && (
        <div className="fixed inset-0 z-[10000] flex justify-end touch-auto">
          {/* Dark transparent background */}
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity" onClick={() => setIsOpen(false)}></div>

          {/* The Drawer Panel */}
          <div className="relative w-full max-w-md bg-white h-full flex flex-col shadow-2xl animate-slide-in-right">
            
            <div className="flex items-center justify-between p-6 border-b border-zinc-200 shrink-0 bg-white">
              <h2 className="text-sm font-normal font-serif tracking-[0.2em] uppercase text-black">Your Shopping Bag</h2>
              <button onClick={() => setIsOpen(false)} className="text-[10px] tracking-widest uppercase text-zinc-500 hover:text-black transition-colors">
                Close
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-6 bg-zinc-50">
              {cart.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-center space-y-6">
                  <p className="text-[11px] tracking-[0.2em] text-zinc-400 uppercase">Your bag is currently empty.</p>
                  <button onClick={() => setIsOpen(false)} className="border border-black bg-black text-white px-8 py-3.5 text-[9px] font-medium tracking-[0.2em] uppercase hover:bg-zinc-800 transition-colors">
                    Explore Collections
                  </button>
                </div>
              ) : (
                <div className="divide-y divide-zinc-200">
                  {cart.map((item, idx) => (
                    <div key={`${item.id}-${item.size}-${idx}`} className="flex gap-4 py-6 first:pt-0 last:pb-0 relative group">
                      
                      <div className="w-24 h-32 bg-white shrink-0 border border-zinc-200 overflow-hidden rounded-sm relative">
                        {item.image && <img src={item.image} alt={item.name} className="w-full h-full object-cover" />}
                      </div>
                      
                      <div className="flex-1 flex flex-col justify-between py-1">
                        <div>
                          <h4 className="text-[11px] tracking-[0.15em] uppercase font-medium text-black line-clamp-2">{item.name}</h4>
                          <p className="text-[9px] text-zinc-500 uppercase tracking-widest mt-2">Size: {item.size}</p>
                          <p className="text-[9px] text-zinc-500 uppercase tracking-widest mt-1">Qty: {item.quantity}</p>
                        </div>
                        
                        <div className="flex justify-between items-end">
                          <span className="text-[13px] tracking-widest text-black font-medium">{formatPrice(item.price * item.quantity)}</span>
                          <button onClick={() => removeFromCart(item.id, item.size)} className="text-[9px] text-zinc-400 hover:text-red-600 uppercase tracking-widest underline decoration-zinc-300 underline-offset-4 transition-colors">
                            Remove
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {cart.length > 0 && (
              <div className="p-6 border-t border-zinc-200 bg-white shrink-0 shadow-[0_-10px_20px_rgba(0,0,0,0.03)]">
                <div className="flex justify-between items-center mb-6 text-[10px] tracking-[0.2em] uppercase font-medium text-zinc-500">
                  <span>Subtotal</span>
                  <span className="font-mono text-sm text-black">{formatPrice(cartSubtotal)}</span>
                </div>
                
                <Link href="/checkout" className="w-full block bg-black text-white text-center py-4.5 text-[10px] font-bold tracking-[0.3em] uppercase hover:bg-zinc-800 transition-colors rounded-sm shadow-md mb-3">
                  Proceed to Secure Checkout
                </Link>
                
                <p className="text-[8px] tracking-[0.15em] uppercase text-zinc-400 text-center leading-relaxed">
                  Taxes, shipping, and international conversion rates are calculated securely at checkout.
                </p>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}
