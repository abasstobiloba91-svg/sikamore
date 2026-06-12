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
  
  // Desktop columns tracker
  const [viewCols, setViewCols] = useState(4); 
  // Mobile design state switcher: false = 2-Column Grid (image_2.png), true = List View (image_3.png)
  const [isListView, setIsListView] = useState(false);

  const { 
    cart, wishlist, toggleWishlist, 
    isCartOpen, setIsCartOpen, quickViewProduct, setQuickViewProduct, addToCart, removeFromCart 
  } = useApp();

  const [selectedSize, setSelectedSize] = useState('M');
  const [qty, setQty] = useState(1);

  useEffect(() => {
    async function fetchProducts() {
      try {
        const { data, error } = await supabase
          .from('products')
          .select('*')
          .order('created_at', { ascending: false });
        if (error) throw error;
        setProducts(data || []);
      } catch (err) {
        console.error("Fetch error:", err);
      } finally {
        setLoading(false);
      }
    }
    fetchProducts();
  }, []);

  const openQuickView = (product) => {
    setQty(1);
    setSelectedSize('M');
    setQuickViewProduct(product);
  };

  const cartSubtotal = cart.reduce((total, item) => total + (item.price * item.quantity), 0);
  const cartItemCount = cart.reduce((acc, curr) => acc + curr.quantity, 0);

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white font-sans antialiased text-[11px] relative overflow-x-hidden">
      
      {/* 1. TOP TICKER */}
      <div className="bg-black text-white py-2.5 text-center text-[9px] tracking-[0.3em] uppercase font-light border-b border-zinc-900 select-none">
        WE SHIP OUR PRODUCTS WORLDWIDE • NEW IN | CORE COLLECTION
      </div>

      {/* 2. NAVIGATION HEADER */}
      <header className="bg-white text-black border-b border-gray-200 sticky top-0 z-40 shadow-sm">
        <div className="max-w-[1600px] mx-auto px-4 sm:px-8 h-20 sm:h-24 flex items-center justify-between">
          <Link href="/admin" className="tracking-[0.2em] text-gray-400 hover:text-black uppercase text-[10px]">Portal</Link>
          
          <Link href="/" className="text-base sm:text-xl font-normal tracking-[0.4em] uppercase text-center block pl-[0.4em] font-serif text-black">
            S. SIKAMÒRE
          </Link>
          
          <div className="flex items-center gap-4 sm:gap-6 text-black">
            <button className="hover:text-gray-500 transition-colors hidden sm:block">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" /></svg>
            </button>
            <button className="hover:text-gray-500 transition-colors hidden sm:block">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" /></svg>
            </button>
            <button onClick={() => setIsCartOpen(true)} className="relative hover:text-gray-500 transition-colors flex items-center gap-2">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M15.75 10.5V6a3.75 3.75 0 10-7.5 0v4.5m11.356-1.993l1.263 12c.07.665-.45 1.243-1.119 1.243H4.25a1.125 1.125 0 01-1.12-1.243l1.264-12A1.125 1.125 0 015.513 7.5h12.974c.576 0 1.059.435 1.119 1.007z" /></svg>
              <span className="text-[10px] font-medium pt-0.5">{cartItemCount}</span>
            </button>
          </div>
        </div>
        
        <div className="border-t border-gray-100 bg-white">
          <div className="max-w-xl mx-auto h-11 flex items-center justify-center gap-8 sm:gap-10 tracking-[0.25em] text-[9px] sm:text-[10px] uppercase font-light text-gray-500 overflow-x-auto whitespace-nowrap px-6 scrollbar-none">
            <Link href="/" className="hover:text-black transition-colors shrink-0">Home</Link>
            <Link href="/shop" className="text-black font-normal border-b border-black pb-1 shrink-0">New In</Link>
            <Link href="/about" className="hover:text-black transition-colors shrink-0">About Us</Link>
            <Link href="/contact" className="hover:text-black transition-colors shrink-0">Contact Us</Link>
          </div>
        </div>
      </header>

      {/* 3. GRID & LIST CONTROLS SYSTEM (REPLICATES IMAGE_2 AND IMAGE_3) */}
      <section className="bg-white text-black border-b border-gray-200 sticky top-[121px] sm:top-[137px] z-30 shadow-sm">
        <div className="max-w-[1600px] mx-auto px-4 sm:px-8 py-4 flex items-center justify-between">
          
          {/* Native Filter Layout Element */}
          <button className="flex items-center gap-2 border border-gray-200 px-4 py-2 text-[10px] uppercase font-medium tracking-wider hover:border-black transition-colors">
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M10.5 6h9.75M10.5 6a1.5 1.5 0 11-3 0m3 0a1.5 1.5 0 10-3 0M3.75 6H7.5m3 12h9.75m-9.75 0a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m-3.75 0H7.5m9-6h3.75m-3.75 0a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m-9.75 0h9.75" /></svg>
            Filter
          </button>

          {/* DYNAMIC LAYOUT CONTROL SWITCH PANEL */}
          <div className="flex items-center gap-4">
            
            {/* Mobile-Only View Switchers (Visible only on mobile devices) */}
            <div className="flex items-center gap-2 md:hidden">
              {/* List View Option Trigger (Image_3.png) */}
              <button 
                onClick={() => setIsListView(true)} 
                className={`p-2 border transition-all ${isListView ? 'border-black text-black bg-zinc-100' : 'border-gray-200 text-gray-300'}`}
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              </button>
              
              {/* Grid View Option Trigger (Image_2.png) */}
              <button 
                onClick={() => setIsListView(false)} 
                className={`p-2 border transition-all ${!isListView ? 'border-black text-black bg-zinc-100' : 'border-gray-200 text-gray-300'}`}
              >
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                  <rect width="9" height="9" x="2" y="2" rx="1"/><rect width="9" height="9" x="13" y="2" rx="1"/>
                  <rect width="9" height="9" x="2" y="13" rx="1"/><rect width="9" height="9" x="13" y="13" rx="1"/>
                </svg>
              </button>
            </div>

            {/* Desktop-Only View Switchers */}
            <div className="hidden md:flex items-center gap-3">
              <button onClick={() => { setViewCols(2); setIsListView(false); }} className={`flex gap-[3px] p-2 border transition-all ${viewCols === 2 && !isListView ? 'border-black text-black bg-zinc-100' : 'border-gray-200 text-gray-400'}`}>
                <svg className="w-[14px] h-[14px]" fill="currentColor" viewBox="0 0 16 16"><rect width="6" height="14" x="1" y="1"/><rect width="6" height="14" x="9" y="1"/></svg>
              </button>
              <button onClick={() => { setViewCols(3); setIsListView(false); }} className={`flex gap-[3px] p-2 border transition-all ${viewCols === 3 && !isListView ? 'border-black text-black bg-zinc-100' : 'border-gray-200 text-gray-400'}`}>
                <svg className="w-[18px] h-[14px]" fill="currentColor" viewBox="0 0 20 16"><rect width="5" height="14" x="1" y="1"/><rect width="5" height="14" x="7" y="1"/><rect width="5" height="14" x="13" y="1"/></svg>
              </button>
              <button onClick={() => { setViewCols(4); setIsListView(false); }} className={`flex gap-[2px] p-2 border transition-all ${viewCols === 4 && !isListView ? 'border-black text-black bg-zinc-100' : 'border-gray-200 text-gray-400'}`}>
                <svg className="w-[22px] h-[14px]" fill="currentColor" viewBox="0 0 24 16"><rect width="4" height="14" x="1" y="1"/><rect width="4" height="14" x="6" y="1"/><rect width="4" height="14" x="11" y="1"/><rect width="4" height="14" x="16" y="1"/></svg>
              </button>
            </div>
          </div>

          <select className="bg-transparent border-0 outline-none text-[10px] uppercase cursor-pointer text-gray-500 hover:text-black font-light">
            <option>Sort by latest</option>
          </select>
        </div>
      </section>

      {/* 4. MAIN GALLERY CONTENT COMPONENT */}
      <main className="max-w-[1600px] mx-auto px-4 sm:px-8 py-8 sm:py-16">
        {loading ? (
          <div className="text-center py-32 tracking-[0.3em] text-zinc-500 uppercase text-[9px]">Loading Archive...</div>
        ) : products.length === 0 ? (
          <div className="text-center py-32 tracking-[0.3em] text-zinc-500 uppercase text-[10px]">
            Inventory processing. No items listed yet.
          </div>
        ) : (
          /* Dynamic layout mapping based on selected view mode state */
          <div className={`grid ${isListView ? 'grid-cols-1 gap-y-6 max-w-xl mx-auto' : `grid-cols-2 ${viewCols === 2 ? 'md:grid-cols-2' : viewCols === 3 ? 'md:grid-cols-3' : 'md:grid-cols-3 lg:grid-cols-4'} gap-x-4 sm:gap-x-6 gap-y-10 sm:gap-y-16`}`}>
            
            {products.map((product) => {
              const isLiked = wishlist.some(item => item.id === product.id);
              
              {/* HOVER/VIEW OPTION A: EXCLUSIVE DYNAMIC ROW LIST LAYOUT (Image_3.png) */}
              if (isListView) {
                return (
                  <div key={product.id} className="flex gap-4 sm:gap-6 bg-[#111111] p-3 border border-zinc-900 rounded-sm items-center relative group">
                    <div className="w-28 sm:w-36 aspect-[3/4] shrink-0 overflow-hidden relative bg-[#161616] rounded-sm">
                      <img src={product.image} alt={product.name} className="w-full h-full object-cover" />
                      {product.is_sold_out && (
                        <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                          <span className="text-[7px] tracking-widest text-zinc-300 uppercase bg-black/80 px-2 py-1 rounded-sm">Sold Out</span>
                        </div>
                      )}
                    </div>
                    
                    <div className="flex-1 flex flex-col justify-center text-left space-y-1 sm:space-y-2">
                      <h3 className="text-[10px] sm:text-[11px] tracking-[0.15em] uppercase font-medium text-zinc-200">{product.name}</h3>
                      <p className="text-[11px] sm:text-[12px] font-normal tracking-wider text-zinc-400">₦{Number(product.price).toLocaleString()}</p>
                      
                      {/* Responsive Action Buttons Container */}
                      <div className="flex items-center gap-2 pt-1">
                        <button onClick={() => !product.is_sold_out && openQuickView(product)} disabled={product.is_sold_out} className="p-2.5 border border-zinc-800 bg-[#161616] hover:bg-white hover:text-black text-white transition-colors duration-300 rounded-sm disabled:opacity-30">
                          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" className="w-3.5 h-3.5"><path strokeLinecap="round" strokeLinejoin="round" d="M15.75 10.5V6a3.75 3.75 0 10-7.5 0v4.5m11.356-1.993l1.263 12c.07.665-.45 1.243-1.119 1.243H4.25a1.125 1.125 0 01-1.12-1.243l1.264-12A1.125 1.125 0 015.513 7.5h12.974c.576 0 1.059.435 1.119 1.007z" /></svg>
                        </button>
                        <button onClick={() => toggleWishlist(product)} className="p-2.5 border border-zinc-800 bg-[#161616] hover:bg-white hover:text-black transition-colors duration-300 rounded-sm">
                          <svg xmlns="http://www.w3.org/2000/svg" fill={isLiked ? "currentColor" : "none"} viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" className={`w-3.5 h-3.5 ${isLiked ? 'text-red-500' : 'text-white'}`}><path strokeLinecap="round" strokeLinejoin="round" d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12z" /></svg>
                        </button>
                      </div>
                    </div>
                  </div>
                );
              }

              {/* HOVER/VIEW OPTION B: PREMIUM 2-COLUMN GRID GALLERY LAYOUT (Image_2.png) */}
              return (
                <div key={product.id} className="group flex flex-col relative bg-[#111111] p-2 border border-zinc-900 shadow-xl rounded-sm transition-all duration-500 hover:border-zinc-700">
                  <div className="bg-[#161616] aspect-[3/4] w-full overflow-hidden relative flex items-center justify-center rounded-sm cursor-pointer" onClick={() => !product.is_sold_out && openQuickView(product)}>
                    <img src={product.image} alt={product.name} className="w-full h-full object-cover transition-transform duration-[1000ms] cubic-bezier(0.25, 1, 0.5, 1) group-hover:scale-105" />
                    <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />
                    
                    {/* Action Controller Overlay Slider (Matches the look of image_2.png on desktop & mobile) */}
                    <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex items-center bg-black/95 backdrop-blur-md border border-zinc-800 divide-x divide-zinc-800 opacity-0 sm:group-hover:opacity-100 translate-y-2 sm:group-hover:translate-y-0 max-sm:opacity-100 max-sm:translate-y-0 transition-all duration-[400ms] z-10 shadow-2xl rounded-sm" onClick={(e) => e.stopPropagation()}>
                      <button onClick={() => !product.is_sold_out && openQuickView(product)} disabled={product.is_sold_out} className="p-3 hover:bg-white hover:text-black text-white transition-colors duration-300 disabled:opacity-30">
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" className="w-4 h-4"><path strokeLinecap="round" strokeLinejoin="round" d="M15.75 10.5V6a3.75 3.75 0 10-7.5 0v4.5m11.356-1.993l1.263 12c.07.665-.45 1.243-1.119 1.243H4.25a1.125 1.125 0 01-1.12-1.243l1.264-12A1.125 1.125 0 015.513 7.5h12.974c.576 0 1.059.435 1.119 1.007z" /></svg>
                      </button>
                      <button onClick={() => toggleWishlist(product)} className={`p-3 hover:bg-white hover:text-black transition-colors duration-300 ${isLiked ? 'text-red-500' : 'text-white'}`}>
                        <svg xmlns="http://www.w3.org/2000/svg" fill={isLiked ? "currentColor" : "none"} viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" className="w-4 h-4"><path strokeLinecap="round" strokeLinejoin="round" d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12z" /></svg>
                      </button>
                    </div>

                    {product.is_sold_out && (
                      <div className="absolute inset-0 bg-black/40 backdrop-blur-[0.5px] flex items-center justify-center pointer-events-none">
                        <div className="w-16 h-16 rounded-full bg-black/90 border border-zinc-800 flex items-center justify-center"><span className="text-[8px] tracking-[0.15em] uppercase text-zinc-300">Sold Out</span></div>
                      </div>
                    )}
                  </div>
                  <div className="flex flex-col gap-1 mt-3.5 text-center pb-1">
                    <h3 className="text-[9px] sm:text-[10px] tracking-[0.2em] uppercase text-zinc-400 group-hover:text-white transition-colors duration-300 truncate">{product.name}</h3>
                    <p className="text-[10px] sm:text-[11px] font-normal tracking-widest text-zinc-200">₦{Number(product.price).toLocaleString()}</p>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>

      {/* QUICK VIEW PANEL MODAL CONTAINER */}
      {quickViewProduct && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="bg-white text-black w-full max-w-3xl flex flex-col md:flex-row relative shadow-2xl">
            <button onClick={() => setQuickViewProduct(null)} className="absolute top-4 right-4 z-10 text-gray-500 hover:text-black">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12"/></svg>
            </button>
            <div className="w-full md:w-1/2 bg-gray-50 aspect-square md:aspect-auto">
              <img src={quickViewProduct.image} alt="Preview" className="w-full h-full object-cover" />
            </div>
            <div className="w-full md:w-1/2 p-8 sm:p-12 flex flex-col justify-center">
              <h2 className="text-lg font-light tracking-[0.2em] uppercase mb-2">{quickViewProduct.name}</h2>
              <p className="text-sm tracking-widest font-medium mb-8">₦{quickViewProduct.price.toLocaleString()}</p>
              
              <div className="mb-6">
                <span className="text-[9px] tracking-widest uppercase text-gray-400 block mb-3">Size</span>
                <div className="flex gap-3">
                  {['S', 'M', 'L'].map(s => (
                    <button key={s} onClick={() => setSelectedSize(s)} className={`w-10 h-10 flex items-center justify-center text-[10px] border transition-colors ${selectedSize === s ? 'border-black bg-black text-white' : 'border-gray-200 text-black hover:border-black'}`}>{s}</button>
                  ))}
                </div>
              </div>

              <div className="flex items-center gap-4 mb-8">
                <div className="flex items-center border border-gray-200">
                  <button onClick={() => setResultQty(Math.max(1, qty - 1))} className="w-10 h-10 flex items-center justify-center hover:bg-gray-50">-</button>
                  <span className="w-10 text-center text-xs">{qty}</span>
                  <button onClick={() => setQty(qty + 1)} className="w-10 h-10 flex items-center justify-center hover:bg-gray-50">+</button>
                </div>
              </div>

              <button onClick={() => addToCart(quickViewProduct, qty, selectedSize)} className="w-full bg-black text-white py-4 text-[10px] tracking-[0.2em] uppercase hover:bg-zinc-800 transition-colors">
                Add to Cart • ₦{(quickViewProduct.price * qty).toLocaleString()}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* SLIDING MINI BAG CART SLIDER */}
      <div className={`fixed inset-y-0 right-0 z-50 w-full sm:w-[400px] bg-white text-black shadow-2xl transform transition-transform duration-500 ease-in-out ${isCartOpen ? 'translate-x-0' : 'translate-x-full'} flex flex-col`}>
        <div className="flex items-center justify-between p-6 border-b border-gray-100 shrink-0">
          <h2 className="text-[11px] tracking-[0.2em] uppercase font-medium">Shopping Cart ({cartItemCount})</h2>
          <button onClick={() => setIsCartOpen(false)} className="text-gray-400 hover:text-black">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12"/></svg>
          </button>
        </div>
        
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {cart.length === 0 ? (
            <div className="text-center text-gray-400 text-[10px] tracking-widest uppercase mt-10">Your bag is empty.</div>
          ) : (
            cart.map((item, idx) => (
              <div key={`${item.id}-${item.size}-${idx}`} className="flex gap-4">
                <div className="w-20 h-28 bg-gray-50 shrink-0 border border-gray-100">
                  <img src={item.image} alt={item.name} className="w-full h-full object-cover" />
                </div>
                <div className="flex-1 flex flex-col justify-between py-1">
                  <div>
                    <h3 className="text-[10px] tracking-widest uppercase font-medium">{item.name}</h3>
                    <p className="text-[10px] text-gray-500 mt-1 uppercase">Size: {item.size}</p>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] tracking-wider font-medium">₦{item.price.toLocaleString()}</span>
                    <div className="flex items-center gap-3 border border-gray-200 px-2 py-1">
                      <span className="text-[10px] text-gray-500">Qty: {item.quantity}</span>
                      <span className="text-gray-300">|</span>
                      <button onClick={() => removeFromCart(item.id, item.size)} className="text-[9px] uppercase tracking-wider text-red-500 hover:text-red-700">Remove</button>
                    </div>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {cart.length > 0 && (
          <div className="p-6 border-t border-gray-100 bg-gray-50 shrink-0">
            <div className="flex justify-between mb-6 text-xs uppercase tracking-widest">
              <span className="text-gray-500">Subtotal:</span>
              <span className="font-medium text-black">₦{cartSubtotal.toLocaleString()}</span>
            </div>
            <div className="flex gap-3">
              <Link href="/checkout" onClick={() => setIsCartOpen(false)} className="flex-1 border border-black text-black text-center py-4 text-[9px] tracking-[0.2em] uppercase hover:bg-black hover:text-white transition-colors">
                View Cart
              </Link>
              <Link href="/checkout" onClick={() => setIsCartOpen(false)} className="flex-1 bg-black text-white text-center py-4 text-[9px] tracking-[0.2em] uppercase hover:bg-zinc-800 transition-colors">
                Checkout
              </Link>
            </div>
          </div>
        )}
      </div>
      
      {isCartOpen && <div className="fixed inset-0 bg-black/30 z-40 backdrop-blur-sm transition-opacity" onClick={() => setIsCartOpen(false)}></div>}

      {/* 5. BRAND SYSTEM FOOTER PANEL */}
      <footer className="border-t border-zinc-900 bg-[#020202] pt-16 pb-12 mt-16 sm:mt-20">
        <div className="max-w-[1600px] mx-auto px-4 sm:px-8 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-10 sm:gap-12 text-zinc-400 font-light tracking-widest">
          
          <div className="flex flex-col gap-3">
            <h4 className="text-white text-[10px] tracking-[0.2em] font-medium uppercase">S. SIKAMÒRE</h4>
            <p className="leading-relaxed text-[10px] text-zinc-500">Curated high-fashion textiles and ready-to-wear luxury conceptualized for the modern vanguard.</p>
            <p className="text-[9px] text-zinc-300 pt-1">contact@sikamoreofficial.com</p>
          </div>

          <div className="flex flex-col gap-2.5 text-[10px]">
            <h4 className="text-white text-[10px] tracking-[0.2em] font-medium uppercase mb-1">Help</h4>
            <Link href="/contact" className="hover:text-white cursor-pointer transition-colors">Contact Us</Link>
            <Link href="/about" className="hover:text-white cursor-pointer transition-colors">About Us</Link>
            <span className="hover:text-white cursor-pointer transition-colors">Privacy Policy</span>
            <span className="hover:text-white cursor-pointer transition-colors">Terms & Conditions</span>
          </div>

          <div className="flex flex-col gap-2.5 text-[10px]">
            <h4 className="text-white text-[10px] tracking-[0.2em] font-medium uppercase mb-1">Useful Links</h4>
            <span className="hover:text-white cursor-pointer transition-colors">Dresses</span>
            <span className="hover:text-white cursor-pointer transition-colors">Bottoms</span>
            <span className="hover:text-white cursor-pointer transition-colors">Tops</span>
            <span className="hover:text-white cursor-pointer transition-colors">Blazers</span>
          </div>

          <div className="flex flex-col gap-3">
            <h4 className="text-white text-[10px] tracking-[0.2em] font-medium uppercase">Sign up for email</h4>
            <p className="text-[10px] text-zinc-500 leading-relaxed">Stay informed about the latest releases and luxury lookbooks.</p>
            <form onSubmit={(e) => { e.preventDefault(); alert('Subscribed.'); }} className="flex border-b border-zinc-800 py-1.5 mt-1">
              <input type="email" placeholder="Your email address" required className="w-full bg-transparent border-0 outline-none placeholder-zinc-700 text-[10px] text-white tracking-widest uppercase font-light" />
              <button type="submit" className="text-[9px] font-medium tracking-widest text-white uppercase hover:text-zinc-400 transition-colors">Subscribe</button>
            </form>
          </div>
        </div>

        <div className="max-w-[1600px] mx-auto px-4 sm:px-8 border-t border-zinc-900 mt-16 pt-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-[9px] tracking-[0.2em] text-zinc-600">
          <p>© 2026 S. SIKAMÒRE. ALL RIGHTS RESERVED.</p>
          <div className="flex items-center gap-4 opacity-30 invert">
            <span className="border border-gray-400 px-1.5 py-0.5 rounded font-bold">VISA</span>
            <span className="border border-gray-400 px-1.5 py-0.5 rounded font-bold">MC</span>
            <span className="border border-gray-400 px-1.5 py-0.5 rounded font-bold">AMEX</span>
            <span className="border border-gray-400 px-1.5 py-0.5 rounded font-bold">PAYPAL</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
