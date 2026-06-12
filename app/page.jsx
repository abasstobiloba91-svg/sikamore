/* eslint-disable @next/next/no-img-element */
'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@supabase/supabase-js';
import Link from 'next/link';
import { useApp } from './providers';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
const supabase = createClient(supabaseUrl, supabaseAnonKey);

const HARDCODED_COLLECTION = [
  { id: 'p1', name: 'LUMIÈRE MAXI DRESS', price: 85000, image: '/product 1.jpeg', is_sold_out: false },
  { id: 'p2', name: 'ESPRIT SILK BLOUSE', price: 45000, image: '/Product 2.jpeg', is_sold_out: false },
  { id: 'p3', name: 'MONARCH TAILORED TROUSER', price: 60000, image: '/Product 3.jpeg', is_sold_out: true },
  { id: 'p4', name: 'NOIR COUTURE BLAZER', price: 125000, image: '/Product 4.jpeg', is_sold_out: false }
];

export default function Storefront() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [viewCols, setViewCols] = useState(4); 
  
  const { 
    cart, wishlist, toggleWishlist, 
    isCartOpen, setIsCartOpen, quickViewProduct, setQuickViewProduct, addToCart, removeFromCart 
  } = useApp();

  // Local state for the quick view modal
  const [selectedSize, setSelectedSize] = useState('M');
  const [qty, setQty] = useState(1);

  useEffect(() => {
    async function fetchProducts() {
      try {
        const { data, error } = await supabase.from('products').select('*').order('created_at', { ascending: false });
        if (error) throw error;
        setProducts(data && data.length > 0 ? data : HARDCODED_COLLECTION);
      } catch (err) {
        setProducts(HARDCODED_COLLECTION);
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

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white font-sans antialiased text-[11px] relative overflow-x-hidden">
      
      {/* HEADER TOP BANNER */}
      <div className="bg-black text-white py-2.5 text-center text-[9px] tracking-[0.3em] uppercase font-light border-b border-zinc-900 select-none">
        WE SHIP OUR PRODUCTS WORLDWIDE • NEW IN | CORE COLLECTION
      </div>

      <header className="bg-white text-black border-b border-gray-200 sticky top-0 z-40 shadow-sm">
        <div className="max-w-[1600px] mx-auto px-4 sm:px-8 h-20 sm:h-24 flex items-center justify-between">
          <Link href="/admin" className="tracking-[0.2em] text-gray-400 hover:text-black uppercase text-[10px]">Portal</Link>
          <Link href="/" className="text-base sm:text-xl font-normal tracking-[0.4em] uppercase text-center block pl-[0.4em] font-serif text-black">
            S. SIKAMÒRE
          </Link>
          <div className="flex items-center gap-4 sm:gap-6 tracking-[0.2em] uppercase text-[9px] sm:text-[10px] text-gray-400">
            <span className="text-zinc-400 hidden sm:inline">Wishlist ({wishlist.length})</span>
            <button onClick={() => setIsCartOpen(true)} className="text-black font-medium cursor-pointer hover:underline">
              Bag ({cart.reduce((acc, curr) => acc + curr.quantity, 0)})
            </button>
          </div>
        </div>
        <div className="border-t border-gray-100 bg-white">
          <div className="max-w-xl mx-auto h-11 flex items-center justify-center gap-8 sm:gap-10 tracking-[0.25em] text-[9px] sm:text-[10px] uppercase font-light text-gray-500 overflow-x-auto whitespace-nowrap px-6 scrollbar-none">
            <span className="text-black font-normal border-b border-black pb-1">Home</span>
            <span className="hover:text-black cursor-pointer">New In</span>
            <span className="hover:text-black cursor-pointer">About Us</span>
            <span className="hover:text-black cursor-pointer">Contact Us</span>
          </div>
        </div>
      </header>

      {/* GRID CONTROLS */}
      <section className="bg-white text-black border-b border-gray-200">
        <div className="max-w-[1600px] mx-auto px-4 sm:px-8 py-5 flex items-center justify-between">
          <div className="hidden md:flex items-center gap-6">
            <button onClick={() => setViewCols(2)} className={`flex gap-[3px] p-2 border transition-all ${viewCols === 2 ? 'border-black text-black bg-zinc-100' : 'border-gray-200 text-gray-400'}`}>
              <svg className="w-[14px] h-[14px]" fill="currentColor" viewBox="0 0 16 16"><rect width="6" height="14" x="1" y="1"/><rect width="6" height="14" x="9" y="1"/></svg>
            </button>
            <button onClick={() => setViewCols(3)} className={`flex gap-[3px] p-2 border transition-all ${viewCols === 3 ? 'border-black text-black bg-zinc-100' : 'border-gray-200 text-gray-400'}`}>
              <svg className="w-[18px] h-[14px]" fill="currentColor" viewBox="0 0 20 16"><rect width="5" height="14" x="1" y="1"/><rect width="5" height="14" x="7" y="1"/><rect width="5" height="14" x="13" y="1"/></svg>
            </button>
            <button onClick={() => setViewCols(4)} className={`flex gap-[2px] p-2 border transition-all ${viewCols === 4 ? 'border-black text-black bg-zinc-100' : 'border-gray-200 text-gray-400'}`}>
              <svg className="w-[22px] h-[14px]" fill="currentColor" viewBox="0 0 24 16"><rect width="4" height="14" x="1" y="1"/><rect width="4" height="14" x="6" y="1"/><rect width="4" height="14" x="11" y="1"/><rect width="4" height="14" x="16" y="1"/></svg>
            </button>
          </div>
          <div className="text-[10px] uppercase font-light tracking-[0.15em] text-gray-400 md:block hidden">Archive / {products.length} Designs</div>
          <select className="bg-transparent border-0 outline-none text-[10px] uppercase cursor-pointer text-gray-500 hover:text-black font-light">
            <option>Sort by latest</option>
          </select>
        </div>
      </section>

      {/* MAIN GALLERY */}
      <main className="max-w-[1600px] mx-auto px-4 sm:px-8 py-10 sm:py-16">
        {loading ? (
          <div className="text-center py-32 tracking-[0.3em] text-zinc-500 uppercase text-[9px]">Loading Curation...</div>
        ) : (
          <div className={`grid grid-cols-2 ${viewCols === 2 ? 'md:grid-cols-2' : viewCols === 3 ? 'md:grid-cols-3' : 'md:grid-cols-3 lg:grid-cols-4'} gap-x-4 sm:gap-x-6 gap-y-12 sm:gap-y-16`}>
            {products.map((product) => {
              const isLiked = wishlist.some(item => item.id === product.id);
              return (
                <div key={product.id} className="group flex flex-col relative bg-[#111111] p-2 border border-zinc-900 shadow-xl rounded-sm">
                  <div className="bg-[#161616] aspect-[3/4] w-full overflow-hidden relative flex items-center justify-center rounded-sm cursor-pointer" onClick={() => !product.is_sold_out && openQuickView(product)}>
                    <img src={product.image} alt={product.name} className="w-full h-full object-cover group-hover:scale-[1.03] transition-transform duration-[800ms]" onError={(e) => { e.target.src = '/product 1.jpeg'; }} />
                    
                    <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex items-center bg-black/95 border border-zinc-800 divide-x divide-zinc-800 opacity-90 md:opacity-0 md:group-hover:opacity-100 transition-all duration-300 z-10 shadow-2xl rounded-sm" onClick={(e) => e.stopPropagation()}>
                      <button onClick={() => !product.is_sold_out && openQuickView(product)} disabled={product.is_sold_out} className="p-2.5 hover:bg-white hover:text-black text-white transition-colors disabled:opacity-30" title="Quick View">
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" className="w-3.5 h-3.5"><path strokeLinecap="round" strokeLinejoin="round" d="M15.75 10.5V6a3.75 3.75 0 10-7.5 0v4.5m11.356-1.993l1.263 12c.07.665-.45 1.243-1.119 1.243H4.25a1.125 1.125 0 01-1.12-1.243l1.264-12A1.125 1.125 0 015.513 7.5h12.974c.576 0 1.059.435 1.119 1.007z" /></svg>
                      </button>
                      <button onClick={() => toggleWishlist(product)} className={`p-2.5 hover:bg-white hover:text-black transition-colors ${isLiked ? 'text-red-500' : 'text-white'}`}>
                        <svg xmlns="http://www.w3.org/2000/svg" fill={isLiked ? "currentColor" : "none"} viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" className="w-3.5 h-3.5"><path strokeLinecap="round" strokeLinejoin="round" d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12z" /></svg>
                      </button>
                    </div>

                    {product.is_sold_out && (
                      <div className="absolute inset-0 bg-black/40 backdrop-blur-[0.5px] flex items-center justify-center pointer-events-none">
                        <div className="w-16 h-16 rounded-full bg-black/90 border border-zinc-800 flex items-center justify-center"><span className="text-[8px] tracking-[0.15em] uppercase text-zinc-300">Sold Out</span></div>
                      </div>
                    )}
                  </div>
                  <div className="flex flex-col gap-1 mt-3.5 text-center pb-1">
                    <h3 className="text-[9px] sm:text-[10px] tracking-[0.2em] uppercase text-zinc-400 group-hover:text-white truncate">{product.name}</h3>
                    <p className="text-[10px] sm:text-[11px] font-normal tracking-widest text-zinc-200">₦{Number(product.price).toLocaleString()}</p>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>

      {/* QUICK VIEW MODAL */}
      {quickViewProduct && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="bg-white text-black w-full max-w-3xl flex flex-col md:flex-row relative shadow-2xl">
            <button onClick={() => setQuickViewProduct(null)} className="absolute top-4 right-4 z-10 text-gray-500 hover:text-black">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M6 18L18 6M6 6l12 12"/></svg>
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
                  <button onClick={() => setQty(Math.max(1, qty - 1))} className="w-10 h-10 flex items-center justify-center hover:bg-gray-50">-</button>
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

      {/* SLIDING CART DRAWER */}
      <div className={`fixed inset-y-0 right-0 z-50 w-full sm:w-[400px] bg-white text-black shadow-2xl transform transition-transform duration-500 ease-in-out ${isCartOpen ? 'translate-x-0' : 'translate-x-full'}`}>
        <div className="h-full flex flex-col">
          <div className="flex items-center justify-between p-6 border-b border-gray-100">
            <h2 className="text-[11px] tracking-[0.2em] uppercase font-medium">Shopping Cart ({cart.reduce((a, c) => a + c.quantity, 0)})</h2>
            <button onClick={() => setIsCartOpen(false)} className="text-gray-400 hover:text-black">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M6 18L18 6M6 6l12 12"/></svg>
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
                      <span className="text-[11px] tracking-wider">₦{item.price.toLocaleString()}</span>
                      <div className="flex items-center gap-3">
                        <span className="text-[10px] text-gray-500">Qty: {item.quantity}</span>
                        <button onClick={() => removeFromCart(item.id, item.size)} className="text-[9px] uppercase tracking-wider text-red-400 hover:text-red-600 underline">Remove</button>
                      </div>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>

          {cart.length > 0 && (
            <div className="p-6 border-t border-gray-100 bg-gray-50">
              <div className="flex justify-between mb-6 text-xs uppercase tracking-widest">
                <span className="text-gray-500">Subtotal</span>
                <span className="font-medium">₦{cartSubtotal.toLocaleString()}</span>
              </div>
              <Link href="/checkout" onClick={() => setIsCartOpen(false)} className="block w-full bg-black text-white text-center py-4 text-[10px] tracking-[0.2em] uppercase hover:bg-zinc-800 transition-colors">
                Proceed to Checkout
              </Link>
            </div>
          )}
        </div>
      </div>
      
      {/* Dark Overlay when Drawer is open */}
      {isCartOpen && <div className="fixed inset-0 bg-black/20 z-40" onClick={() => setIsCartOpen(false)}></div>}

      <footer className="border-t border-zinc-900 bg-[#020202] py-12 text-center text-zinc-600 text-[9px] tracking-[0.2em]">
        © 2026 S. SIKAMÒRE. ALL RIGHTS RESERVED.
      </footer>
    </div>
  );
}
