/* eslint-disable @next/next/no-img-element */
'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useApp } from './providers'; // IMPORTANT: Adjust this path if your providers file is somewhere else

export default function GlobalCart() {
  const { cart } = useApp();
  const [isOpen, setIsOpen] = useState(false);
  const pathname = usePathname();

  // Calculate cart totals
  const totalItems = cart.reduce((total, item) => total + item.quantity, 0);
  const subtotal = cart.reduce((total, item) => total + (item.price * item.quantity), 0);

  // Close the cart drawer automatically when the user navigates to a new page (like checkout)
  useEffect(() => {
    setIsOpen(false);
  }, [pathname]);

  // Hide the floating cart button if the user is already on the checkout or admin page
  if (pathname === '/checkout' || pathname.startsWith('/admin')) {
    return null;
  }

  return (
    <>
      {/* FLOATING CART BUTTON */}
      <button 
        onClick={() => setIsOpen(true)}
        className="fixed bottom-6 right-6 z-50 bg-black text-white px-5 py-3.5 text-[9px] tracking-[0.25em] uppercase font-medium hover:bg-zinc-800 transition-all shadow-xl flex items-center gap-3 rounded-sm"
      >
        <span>Cart</span>
        {totalItems > 0 && (
          <span className="bg-white text-black px-2 py-0.5 font-mono text-[10px] rounded-sm">{totalItems}</span>
        )}
      </button>

      {/* SLIDE-OUT DRAWER OVERLAY */}
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex justify-end">
          {/* Dark transparent background (click to close) */}
          <div 
            className="absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity"
            onClick={() => setIsOpen(false)}
          ></div>

          {/* The Actual Drawer */}
          <div className="relative w-full max-w-md bg-white h-full flex flex-col shadow-2xl animate-slide-in-right border-l border-zinc-200">
            
            {/* Drawer Header */}
            <div className="flex items-center justify-between p-6 border-b border-zinc-200 shrink-0 bg-zinc-50">
              <h2 className="text-xs font-medium tracking-[0.3em] uppercase text-black">Your Atelier Bag</h2>
              <button onClick={() => setIsOpen(false)} className="text-[10px] tracking-widest uppercase text-zinc-500 hover:text-black transition-colors">
                ✕ Close
              </button>
            </div>

            {/* Drawer Body (Items) */}
            <div className="flex-1 overflow-y-auto p-6">
              {cart.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-center space-y-4">
                  <p className="text-[10px] tracking-[0.2em] text-zinc-400 uppercase">Your bag is currently empty.</p>
                  <button onClick={() => setIsOpen(false)} className="border border-black text-black px-6 py-3 text-[9px] tracking-widest uppercase hover:bg-zinc-50 transition-colors">
                    Continue Browsing
                  </button>
                </div>
              ) : (
                <div className="divide-y divide-zinc-100">
                  {cart.map((item, idx) => (
                    <div key={`${item.id}-${item.size}-${idx}`} className="flex gap-4 py-6 first:pt-0 last:pb-0">
                      <div className="w-20 h-28 bg-zinc-100 shrink-0 border border-zinc-200 overflow-hidden">
                        {item.image && <img src={item.image} alt={item.name} className="w-full h-full object-cover" />}
                      </div>
                      <div className="flex-1 flex flex-col justify-between">
                        <div>
                          <h4 className="text-[10px] tracking-widest uppercase font-medium text-black">{item.name}</h4>
                          <p className="text-[9px] text-zinc-500 uppercase tracking-widest mt-1">Size: {item.size}</p>
                        </div>
                        <div className="flex justify-between items-center text-[10px] font-mono">
                          <span className="text-zinc-500">Qty: {item.quantity}</span>
                          <span className="text-black">₦{(item.price * item.quantity).toLocaleString()}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Drawer Footer (Checkout Button) */}
            {cart.length > 0 && (
              <div className="p-6 border-t border-zinc-200 bg-zinc-50 shrink-0">
                <div className="flex justify-between items-center mb-6 text-[10px] tracking-widest uppercase font-medium text-black">
                  <span>Subtotal</span>
                  <span className="font-mono text-sm">₦{subtotal.toLocaleString()}</span>
                </div>
                <Link href="/checkout" className="w-full block bg-black text-white text-center py-4 text-[10px] font-bold tracking-[0.3em] uppercase hover:bg-zinc-800 transition-colors rounded-sm shadow-md">
                  Proceed to Secure Checkout
                </Link>
                <p className="text-[8px] tracking-[0.2em] uppercase text-zinc-400 text-center mt-4">
                  International currency & shipping calculated at checkout.
                </p>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}
