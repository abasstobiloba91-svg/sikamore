/* eslint-disable @next/next/no-img-element */
'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useApp } from './providers'; 

export default function GlobalCart() {
  const { cart } = useApp();
  const [isOpen, setIsOpen] = useState(false);
  const pathname = usePathname();

  // --- CUSTOM PHYSICS & DRAG LOGIC ---
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const isDragging = useRef(false);
  const startPos = useRef({ x: 0, y: 0 });
  const hasDragged = useRef(false);

  // Calculate cart totals
  const totalItems = cart.reduce((total, item) => total + item.quantity, 0);
  const subtotal = cart.reduce((total, item) => total + (item.price * item.quantity), 0);

  // Close the cart drawer automatically when the user navigates to a new page
  useEffect(() => {
    setIsOpen(false);
  }, [pathname]);

  // Hide on Home Page, Checkout, and Admin
  if (pathname === '/' || pathname === '/checkout' || pathname.startsWith('/admin')) {
    return null;
  }

  // --- POINTER EVENT HANDLERS ---
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
    
    // If movement exceeds 3px, we classify it as a "drag" rather than a "click"
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
    // If they were dragging, intercept the click so the drawer doesn't accidentally open
    if (hasDragged.current) {
      e.preventDefault();
      e.stopPropagation();
      return;
    }
    setIsOpen(true);
  };

  return (
    <>
      {/* DRAGGABLE FLOATING CART ICON */}
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
            <svg 
              width="24" 
              height="24" 
              viewBox="0 0 24 24" 
              fill="none" 
              stroke="black" 
              strokeWidth="2" 
              strokeLinecap="round" 
              strokeLinejoin="round"
            >
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
          <div 
            className="absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity"
            onClick={() => setIsOpen(false)}
          ></div>

          <div className="relative w-full max-w-md bg-white h-full flex flex-col shadow-2xl animate-slide-in-right border-l border-zinc-200">
            
            <div className="flex items-center justify-between p-6 border-b border-zinc-200 shrink-0 bg-zinc-50">
              <h2 className="text-xs font-medium tracking-[0.3em] uppercase text-black">Your Atelier Bag</h2>
              <button onClick={() => setIsOpen(false)} className="text-[10px] tracking-widest uppercase text-zinc-500 hover:text-black transition-colors">
                ✕ Close
              </button>
            </div>

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
