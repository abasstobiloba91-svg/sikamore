'use client';

import { useState, useRef } from 'react';
import { usePathname } from 'next/navigation';
import { useApp } from './providers'; 

export default function GlobalCart() {
  // Connect directly to your existing global state!
  const { cart, setIsCartOpen } = useApp() || {};
  const pathname = usePathname();

  // --- DRAGGABLE PHYSICS STATES ---
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const isDragging = useRef(false);
  const startPos = useRef({ x: 0, y: 0 });
  const hasDragged = useRef(false);

  // Calculate cart totals for the badge
  const totalItems = cart ? cart.reduce((total, item) => total + (item.quantity || 1), 0) : 0;

  // Hide on Home Page, Checkout, and Admin
  if (pathname === '/' || pathname === '/checkout' || pathname.startsWith('/admin')) {
    return null;
  }

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
    // THIS TRIGGERS YOUR EXACT EXISTING SHOP CART DRAWER
    if (setIsCartOpen) setIsCartOpen(true);
  };

  return (
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
  );
}
