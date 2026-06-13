/* eslint-disable @next/next/no-img-element */
'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@supabase/supabase-js';
import Link from 'next/link';
import { useApp } from '../providers';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
const supabase = createClient(supabaseUrl, supabaseAnonKey);

export default function ShopCatalog() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [viewCols, setViewCols] = useState(4); 
  const [isListView, setIsListView] = useState(false);

  // NEWSLETTER & TICKER
  const [showNewsletter, setShowNewsletter] = useState(false);
  const [tickerIndex, setTickerIndex] = useState(0);
  const announcements = [
    "COMPLIMENTARY WORLDWIDE SHIPPING ON ALL ORDERS",
    "DISCOVER THE ARCHIVE: NEW READY-TO-WEAR & ACCESSORIES NOW LIVE",
    "CRAFTED SILHOUETTES • A STUDY IN TEXTURE AND MINIMALIST FORM",
  ];

  const { cart, wishlist, toggleWishlist, addToCart, setIsCartOpen } = useApp();

  // INLINE QUICK ADD STATE
  const [inlineAddId, setInlineAddId] = useState(null);
  const [inlineSize, setInlineSize] = useState('M');
  const [inlineQty, setInlineQty] = useState(1);

  useEffect(() => {
    async function fetchProducts() {
      const { data } = await supabase.from('products').select('*').order('created_at', { ascending: false });
      if (data) setProducts(data);
      setLoading(false);
    }
    fetchProducts();
  }, []);

  useEffect(() => {
    const tickerTimer = setInterval(() => setTickerIndex((prev) => (prev + 1) % announcements.length), 5000);
    return () => clearInterval(tickerTimer);
  }, [announcements.length]);

  useEffect(() => {
    if (!sessionStorage.getItem('sikamore_newsletter')) {
      const timer = setTimeout(() => setShowNewsletter(true), 5000);
      return () => clearTimeout(timer);
    }
  }, []);

  const cartSubtotal = cart.reduce((total, item) => total + (item.price * item.quantity), 0);
  const cartItemCount = cart.reduce((acc, curr) => acc + curr.quantity, 0);

  // SUPPRESS DRAWER & PROCESS INLINE ADD
  const handleInlineAdd = (e, product) => {
    e.stopPropagation();
    
    addToCart(product, inlineQty, inlineSize);
    
    // Instantly force the global cart drawer to stay closed for a seamless experience
    setTimeout(() => {
      setIsCartOpen(false); 
    }, 10);
    
    // Reset inline UI
    setInlineAddId(null);
    setInlineQty(1);
    setInlineSize('M');
  };

  return (
    <div className="min-h-screen bg-[#F5F5F4] text-black font-sans antialiased text-[11px] relative overflow-x-hidden pb-24">
      
      {/* TICKER */}
      <div className="w-full bg-[#0A0A0A] text-white h-9 overflow-hidden border-b border-zinc-900 relative z-[60]">
        <div className="transition-transform duration-700 cubic-bezier(0.25, 1, 0.5, 1) h-full w-full" style={{ transform: `translateY(-${tickerIndex * 100}%)` }}>
          {announcements.map((text, idx) => (
            <div key={idx} className="h-full w-full flex items-center justify-center text-[8px] sm:text-[9px] tracking-[0.3em] uppercase font-light text-zinc-300 px-4 whitespace-nowrap truncate">{text}</div>
          ))}
        </div>
      </div>

      {/* HEADER */}
      <header className="bg-[#F5F5F4] text-black border-b border-zinc-300 sticky top-0 z-[60] shadow-sm">
        <div className="max-w-[1600px] mx-auto px-4 sm:px-8 h-20 sm:h-24 flex items-center justify-between">
          <Link href="/admin" className="tracking-[0.2em] text-zinc-500 hover:text-black uppercase text-[10px]">Portal</Link>
          <Link href="/" className="text-base sm:text-xl font-normal tracking-[0.4em] uppercase text-center block pl-[0.4em] font-serif">S. SIKAMÒRE</Link>
          
          <div className="flex items-center gap-6">
            <button className="hidden sm:block hover:text-zinc-500 transition-colors"><svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" /></svg></button>
            <button className="hidden sm:block hover:text-zinc-500 transition-colors"><svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" /></svg></button>
            
            {/* CART ICON WITH LIVE RED NOTIFICATION BADGE + NUMBER */}
            <Link href="/checkout" className="relative hover:text-zinc-500 transition-colors flex items-center gap-2">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M15.75 10.5V6a3.75 3.75 0 10-7.5 0v4.5m11.356-1.993l1.263 12c.07.665-.45 1.243-1.119 1.243H4.25a1.125 1.125 0 01-1.12-1.243l1.264-12A1.125 1.125 0 015.513 7.5h12.974c.576 0 1.059.435 1.119 1.007z" /></svg>
              {cartItemCount > 0 && (
                <span className="absolute -top-2 -right-2 w-[18px] h-[18px] bg-red-600 text-white flex items-center justify-center rounded-full text-[9px] font-bold shadow-sm">
                  {cartItemCount}
                </span>
              )}
            </Link>
          </div>
        </div>
      </header>

      {/* FILTER BAR MINIFIED */}
      <section className="bg-[#F5F5F4] border-b border-zinc-300 sticky top-[121px] sm:top-[137px] z-30 shadow-sm">
        <div className="max-w-[1600px] mx-auto px-4 sm:px-8 py-4 flex items-center justify-between">
          <button className="flex items-center gap-2 border border-zinc-300 px-4 py-2 text-[10px] uppercase tracking-wider hover:border-black hover:bg-black hover:text-white transition-colors">
            Filter
          </button>
          <select className="bg-transparent border-0 outline-none text-base md:text-[10px] uppercase text-zinc-500 hover:text-black font-light">
            <option>Sort by latest</option>
          </select>
        </div>
      </section>

      {/* MAIN PRODUCTS GRID */}
      <main className="max-w-[1600px] mx-auto px-4 sm:px-8 py-8 sm:py-16">
        {loading ? (
          <div className="text-center py-32 tracking-[0.3em] text-zinc-500 uppercase text-[9px]">Loading Archive...</div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-x-4 sm:gap-x-6 gap-y-10 sm:gap-y-16">
            {products.map((product) => {
              const isLiked = wishlist.some(item => item.id === product.id);
              
              return (
                <div key={product.id} className="group flex flex-col relative bg-[#0A0A0A] p-2 shadow-xl rounded-sm">
                  <div className="bg-[#111] aspect-[3/4] w-full overflow-hidden relative flex items-center justify-center rounded-sm">
                    <img src={product.image} alt={product.name} className="w-full h-full object-cover transition-transform duration-[1000ms] group-hover:scale-105" />
                    
                    {/* INLINE QUICK ADD UI OVERLAY */}
                    <div className={`absolute inset-0 bg-black/90 backdrop-blur-sm flex flex-col items-center justify-center p-4 z-20 text-white transition-opacity duration-300 ${inlineAddId === product.id ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'}`}>
                      <button onClick={(e) => { e.stopPropagation(); setInlineAddId(null); }} className="absolute top-3 right-3 text-zinc-500 hover:text-white">✕</button>
                      
                      <p className="text-[9px] uppercase tracking-[0.2em] text-zinc-400 mb-3">Select Size</p>
                      <div className="flex gap-2 mb-5">
                        {['S', 'M', 'L'].map(s => (
                          <button key={s} onClick={(e) => { e.stopPropagation(); setInlineSize(s); }} className={`w-10 h-10 flex items-center justify-center text-[10px] border transition-colors ${inlineSize === s ? 'bg-white text-black border-white' : 'border-zinc-700 hover:border-white'}`}>{s}</button>
                        ))}
                      </div>

                      <div className="flex items-center border border-zinc-700 mb-6 w-full max-w-[120px]">
                        <button onClick={(e) => { e.stopPropagation(); setInlineQty(Math.max(1, inlineQty - 1)); }} className="flex-1 py-2 hover:bg-[#161616]">-</button>
                        <span className="flex-1 text-center text-[10px]">{inlineQty}</span>
                        <button onClick={(e) => { e.stopPropagation(); setInlineQty(inlineQty + 1); }} className="flex-1 py-2 hover:bg-[#161616]">+</button>
                      </div>

                      <button onClick={(e) => handleInlineAdd(e, product)} className="w-full bg-white text-black py-3 text-[9px] tracking-widest uppercase hover:bg-zinc-300 font-medium transition-colors">
                        Confirm & Add
                      </button>
                    </div>

                    {/* HOVER QUICK ACTION BUTTONS */}
                    {inlineAddId !== product.id && (
                      <>
                        <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />
                        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex items-center bg-black/95 border border-zinc-800 divide-x divide-zinc-800 opacity-0 sm:group-hover:opacity-100 translate-y-2 sm:group-hover:translate-y-0 max-sm:opacity-100 max-sm:translate-y-0 transition-all duration-[400ms] z-10 shadow-2xl rounded-sm">
                          <button onClick={(e) => { e.stopPropagation(); setInlineAddId(product.id); }} disabled={product.is_sold_out} className="px-5 py-3 text-white hover:bg-white hover:text-black transition-colors duration-300 disabled:opacity-30 tracking-[0.2em] text-[9px] uppercase font-medium">
                            Add To Bag
                          </button>
                        </div>
                      </>
                    )}

                    {product.is_sold_out && (
                      <div className="absolute inset-0 bg-black/40 flex items-center justify-center pointer-events-none z-10"><div className="w-16 h-16 rounded-full bg-black/90 border border-zinc-800 flex items-center justify-center"><span className="text-[8px] tracking-[0.15em] uppercase text-zinc-300">Sold Out</span></div></div>
                    )}
                  </div>
                  <div className="flex flex-col gap-1 mt-3.5 text-center pb-1">
                    <h3 className="text-[9px] sm:text-[10px] tracking-[0.2em] uppercase text-zinc-400 truncate">{product.name}</h3>
                    <p className="text-[10px] sm:text-[11px] tracking-widest text-white">₦{Number(product.price).toLocaleString()}</p>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>

      {/* BULLETPROOF STICKY FLOATING CART BAR */}
      <div 
        className={`fixed bottom-0 left-0 w-full z-[100] transition-transform duration-500 ease-in-out ${cart.length > 0 ? 'translate-y-0' : 'translate-y-full'}`}
      >
        <div className="bg-[#0A0A0A] text-white h-[75px] sm:h-[80px] w-full border-t border-zinc-800 flex items-center justify-center shadow-[0_-10px_40px_rgba(0,0,0,0.2)]">
          <div className="w-full max-w-[1600px] mx-auto px-6 sm:px-12 flex items-center justify-between">
            
            {/* Left Side: Summary */}
            <div className="flex items-center gap-4 sm:gap-8">
              <span className="text-[10px] sm:text-xs tracking-[0.2em] uppercase font-light text-zinc-300 flex items-center gap-2">
                <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse hidden sm:block"></span>
                {cartItemCount} Item{cartItemCount > 1 ? 's' : ''}
              </span>
              <span className="text-zinc-700 hidden sm:inline">|</span>
              <span className="text-[12px] sm:text-sm tracking-widest font-medium">
                ₦{cartSubtotal.toLocaleString()}
              </span>
            </div>

            {/* Right Side: Action to Checkout Page */}
            <Link href="/checkout" className="bg-white text-black px-6 sm:px-12 py-3.5 sm:py-4 text-[9px] sm:text-[10px] tracking-[0.3em] uppercase font-medium hover:bg-zinc-200 transition-colors shadow-lg">
              CHECK OUT &rarr;
            </Link>
          </div>
        </div>
      </div>

      {/* FOOTER */}
      <footer className="border-t border-zinc-900 bg-[#0A0A0A] pt-16 pb-12 mt-16 text-white">
         <div className="max-w-[1600px] mx-auto px-4 sm:px-8 text-center text-[9px] tracking-[0.2em] text-zinc-600">
          <p>© 2026 S. SIKAMÒRE. ALL RIGHTS RESERVED.</p>
        </div>
      </footer>

      {/* NEWSLETTER POP-UP */}
      <div className={`fixed inset-0 z-[110] flex items-center justify-center bg-black/60 backdrop-blur-md p-4 transition-opacity duration-500 ${showNewsletter ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'}`}>
        <div className="bg-[#0A0A0A] text-white w-full max-w-md p-10 border border-zinc-800 text-center relative shadow-2xl">
          <button onClick={() => {setShowNewsletter(false); sessionStorage.setItem('sikamore_newsletter', 'true');}} className="absolute top-4 right-4 text-zinc-500 hover:text-white transition-colors">
            ✕
          </button>
          <h2 className="text-xl tracking-[0.4em] uppercase mb-8 font-serif">S. SIKAMÒRE</h2>
          <form onSubmit={(e) => { e.preventDefault(); setShowNewsletter(false); }} className="flex flex-col gap-4">
            <input type="email" placeholder="ENTER EMAIL" required className="w-full bg-[#111] p-4 border border-zinc-800 outline-none text-base md:text-xs text-center tracking-widest uppercase text-white"/>
            <button type="submit" className="bg-white text-black py-4 text-[10px] tracking-[0.3em] uppercase font-medium hover:bg-zinc-200">Subscribe</button>
          </form>
        </div>
      </div>

    </div>
  );
}
