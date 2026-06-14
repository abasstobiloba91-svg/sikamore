'use client';

import Link from 'next/link';

export default function SuccessPage() {
  return (
    <div className="min-h-screen bg-[#F5F5F4] text-black font-sans antialiased flex flex-col">
      
      {/* MINIMAL HEADER */}
      <header className="bg-white border-b border-zinc-200 py-6 px-8 text-center shrink-0">
        <Link href="/" className="text-xl font-normal tracking-[0.4em] uppercase font-serif text-black hover:text-zinc-600 transition-colors">
          S. SIKAMÒRE
        </Link>
      </header>

      {/* PREMIUM SUCCESS UI */}
      <main className="flex-1 flex flex-col items-center justify-center p-6 text-center animate-fade-in">
        
        {/* THIN LUXURY CHECKMARK SVG */}
        <div className="w-24 h-24 mb-8 rounded-full border border-black flex items-center justify-center bg-white shadow-sm">
          <svg className="w-10 h-10 text-black" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="1">
            <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
          </svg>
        </div>

        <h1 className="text-2xl sm:text-3xl font-normal tracking-[0.3em] uppercase font-serif text-black mb-4">
          Order Confirmed
        </h1>
        
        <p className="text-[11px] sm:text-xs tracking-[0.2em] text-zinc-500 uppercase leading-relaxed max-w-md mx-auto mb-12">
          Thank you for your purchase. A highly detailed receipt and dispatch tracking itinerary has been sent to your registered email profile.
        </p>

        <div className="flex flex-col sm:flex-row items-center gap-4 w-full max-w-sm">
          <Link 
            href="/shop" 
            className="w-full bg-black text-white py-5 text-[10px] sm:text-[11px] tracking-[0.3em] uppercase font-medium hover:bg-zinc-800 transition-colors border border-black"
          >
            Continue Shopping
          </Link>
          
          <Link 
            href="/dashboard" 
            className="w-full bg-white text-black py-5 text-[10px] sm:text-[11px] tracking-[0.3em] uppercase font-medium hover:bg-zinc-50 transition-colors border border-zinc-300"
          >
            Client Portal
          </Link>
        </div>

      </main>

      {/* MINIMAL FOOTER */}
      <footer className="py-8 text-center border-t border-zinc-200 bg-white text-[9px] tracking-[0.3em] text-zinc-400 uppercase shrink-0">
        © 2026 S. SIKAMÒRE LOGISTICS
      </footer>

    </div>
  );
}
