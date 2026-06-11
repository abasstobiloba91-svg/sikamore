'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@supabase/supabase-js';
import Link from 'next/link';

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
  
  // THE FUNCTIONAL UI FIX: Track dynamic layout columns exactly like the video preview
  const [viewCols, setViewCols] = useState(4); 

  useEffect(() => {
    async function fetchProducts() {
      try {
        const { data, error } = await supabase
          .from('products')
          .select('*')
          .order('created_at', { ascending: false });

        if (error) throw error;

        if (data && data.length > 0) {
          setProducts(data);
        } else {
          setProducts(HARDCODED_COLLECTION);
        }
      } catch (err) {
        setProducts(HARDCODED_COLLECTION);
      } finally {
        setLoading(false);
      }
    }
    fetchProducts();
  }, []);

  return (
    <div className="min-h-screen bg-white text-black font-sans antialiased text-xs">
      
      {/* 1. TOP ANNOUNCEMENT TICKER BANNER */}
      <div className="bg-black text-white py-2.5 text-center text-[9px] tracking-[0.3em] uppercase font-light border-b border-black select-none">
        WE SHIP OUR PRODUCTS WORLDWIDE • NEW IN | CORE COLLECTION
      </div>

      {/* 2. LUXURY HEADER ARCHITECTURE */}
      <header className="bg-white border-b border-gray-100 sticky top-0 z-50">
        <div className="max-w-[1600px] mx-auto px-8 h-24 flex items-center justify-between">
          
          {/* Left Portal Access */}
          <Link href="/admin" className="tracking-[0.2em] text-gray-400 hover:text-black transition-colors font-light uppercase text-[10px]">
            Portal
          </Link>

          {/* Center Brand Text Logo (Preserved as requested) */}
          <Link href="/" className="text-xl font-normal tracking-[0.4em] uppercase text-center block pl-[0.4em] font-serif">
            S. SIKAMÒRE
          </Link>

          {/* Right Utility Navigation */}
          <div className="flex items-center gap-6 tracking-[0.2em] uppercase text-[10px] text-gray-400">
            <span className="hover:text-black cursor-pointer transition-colors">Search</span>
            <span className="text-black font-medium cursor-pointer">Bag (0)</span>
          </div>
        </div>

        {/* Categories Menu Ribbon */}
        <div className="border-t border-gray-100 bg-white">
          <div className="max-w-xl mx-auto h-12 flex items-center justify-center gap-10 tracking-[0.25em] text-[10px] uppercase font-light text-gray-500">
            <span className="text-black font-normal cursor-pointer border-b border-black pb-1">Home</span>
            <span className="hover:text-black cursor-pointer transition-colors">New In</span>
            <span className="hover:text-black cursor-pointer transition-colors">About Us</span>
            <span className="hover:text-black cursor-pointer transition-colors">Contact Us</span>
          </div>
        </div>
      </header>

      {/* 3. GRID UTILITIES CONTROLLER (Matches Video Controls Layout Exactly) */}
      <section className="max-w-[1600px] mx-auto px-8 pt-10 pb-6 flex items-center justify-between border-b border-gray-100">
        
        {/* Dynamic Column Grid Layout Selectors */}
        <div className="hidden md:flex items-center gap-4 text-gray-300">
          <button 
            onClick={() => setViewCols(2)} 
            className={`flex gap-0.5 p-1 transition-colors ${viewCols === 2 ? 'text-black' : 'hover:text-gray-500'}`}
          >
            <div className="w-3 h-4 border border-current"></div>
            <div className="w-3 h-4 border border-current"></div>
          </button>
          <button 
            onClick={() => setViewCols(3)} 
            className={`flex gap-0.5 p-1 transition-colors ${viewCols === 3 ? 'text-black' : 'hover:text-gray-500'}`}
          >
            <div className="w-2.5 h-4 border border-current"></div>
            <div className="w-2.5 h-4 border border-current"></div>
            <div className="w-2.5 h-4 border border-current"></div>
          </button>
          <button 
            onClick={() => setViewCols(4)} 
            className={`flex gap-0.5 p-1 transition-colors ${viewCols === 4 ? 'text-black' : 'hover:text-gray-500'}`}
          >
            <div className="w-2 h-4 border border-current"></div>
            <div className="w-2 h-4 border border-current"></div>
            <div className="w-2 h-4 border border-current"></div>
            <div className="w-2 h-4 border border-current"></div>
          </button>
        </div>

        <div className="text-[10px] tracking-widest text-gray-400 uppercase md:block hidden">
          Showing {products.length} Items
        </div>

        {/* Sort Filter Filter Container */}
        <div>
          <select className="bg-transparent border-0 outline-none text-[10px] tracking-widest uppercase cursor-pointer text-gray-600 hover:text-black font-light">
            <option>Sort by latest</option>
            <option>Price: Low to High</option>
            <option>Price: High to Low</option>
          </select>
        </div>
      </section>

      {/* 4. PREMIUM EDITORIAL PRODUCT MATRIX CLOUD */}
      <main className="max-w-[1600px] mx-auto px-8 py-12">
        {loading ? (
          <div className="text-center py-32 tracking-[0.3em] text-gray-400 uppercase text-[10px]">Loading Curation Archive...</div>
        ) : (
          <div className={`grid grid-cols-1 sm:grid-cols-2 ${
            viewCols === 2 ? 'md:grid-cols-2' : viewCols === 3 ? 'md:grid-cols-3' : 'lg:grid-cols-4'
          } gap-x-6 gap-y-14 transition-all duration-500`}>
            
            {products.map((product) => (
              <div key={product.id} className="group flex flex-col relative">
                
                {/* Visual Image Board Frame Container */}
                <div className="bg-[#fcfcfc] aspect-[3/4] w-full overflow-hidden relative border border-gray-100 flex items-center justify-center">
                  <img
                    src={product.image}
                    alt={product.name}
                    className="w-full h-full object-cover object-center group-hover:scale-[1.02] transition-transform duration-[900ms] ease-out"
                    onError={(e) => { e.target.src = '/product 1.jpeg'; }}
                  />

                  {/* HIGH-FASHION OVERLAY HOVER ROW BUTTONS (From the video capture) */}
                  <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex items-center bg-white shadow-sm border border-gray-200 divide-x divide-gray-100 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-auto z-10">
                    <button className="p-3 hover:bg-black hover:text-white transition-colors group/btn" title="Add to bag">
                      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" className="w-3.5 h-3.5">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 10.5V6a3.75 3.75 0 10-7.5 0v4.5m11.356-1.993l1.263 12c.07.665-.45 1.243-1.119 1.243H4.25a1.125 1.125 0 01-1.12-1.243l1.264-12A1.125 1.125 0 015.513 7.5h12.974c.576 0 1.059.435 1.119 1.007zM8.625 10.5a.375.375 0 11-.75 0 .375.375 0 01.75 0zm7.5 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z" />
                      </svg>
                    </button>
                    <button className="p-3 hover:bg-black hover:text-white transition-colors" title="Wishlist">
                      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" className="w-3.5 h-3.5">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12z" />
                      </svg>
                    </button>
                    <button className="p-3 hover:bg-black hover:text-white transition-colors" title="Quick view">
                      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" className="w-3.5 h-3.5">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" />
                        <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                    </button>
                  </div>

                  {/* CIRCULAR MID-IMAGE SOLD OUT BADGE OVERLAY (Matches Video Aesthetic Exactly) */}
                  {product.is_sold_out && (
                    <div className="absolute inset-0 bg-white/10 backdrop-blur-[1px] flex items-center justify-center pointer-events-none">
                      <div className="w-20 h-20 rounded-full bg-white border border-gray-200 flex items-center justify-center shadow-sm select-none">
                        <span className="text-[9px] tracking-[0.2em] uppercase font-medium text-black">Sold Out</span>
                      </div>
                    </div>
                  )}
                </div>

                {/* Typography Metadata Deck labels beneath image container */}
                <div className="flex flex-col gap-1 mt-4 text-center">
                  <h3 className="text-[10px] tracking-[0.25em] font-normal uppercase text-gray-500 group-hover:text-black transition-colors duration-300 leading-relaxed">
                    {product.name}
                  </h3>
                  <p className="text-[11px] font-medium tracking-widest text-black">
                    ₦{Number(product.price).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* 5. LOADER COMPONENT PAGINATION BUTTON ACTION */}
        <div className="mt-24 text-center">
          <button className="px-10 py-4 bg-white border border-black text-[10px] tracking-[0.3em] uppercase hover:bg-black hover:text-white transition-colors duration-500 font-light select-none">
            Load More
          </button>
        </div>
      </main>

      {/* 6. MINIMALIST FOOTER HOUSING ACCORDION MATRIX */}
      <footer className="border-t border-gray-100 bg-white pt-20 pb-12 mt-20">
        <div className="max-w-[1600px] mx-auto px-8 grid grid-cols-1 md:grid-cols-4 gap-12 text-gray-500 font-light tracking-widest">
          
          {/* Brand Card Column */}
          <div className="flex flex-col gap-4">
            <h4 className="text-black text-[10px] tracking-[0.2em] font-medium uppercase">S. SIKAMÒRE</h4>
            <p className="leading-relaxed text-[11px] text-gray-400">Curated high-fashion textiles and ready-to-wear luxury conceptualized for the modern vanguard.</p>
            <p className="text-[10px] text-black pt-2">contact@sikamoreofficial.com</p>
          </div>

          {/* Quick Help Links */}
          <div className="flex flex-col gap-3 text-[11px]">
            <h4 className="text-black text-[10px] tracking-[0.2em] font-medium uppercase mb-1">Help</h4>
            <span className="hover:text-black cursor-pointer transition-colors">Contact Us</span>
            <span className="hover:text-black cursor-pointer transition-colors">About Us</span>
            <span className="hover:text-black cursor-pointer transition-colors">Privacy Policy</span>
            <span className="hover:text-black cursor-pointer transition-colors">Terms & Conditions</span>
          </div>

          {/* Catalog Categories Navigation */}
          <div className="flex flex-col gap-3 text-[11px]">
            <h4 className="text-black text-[10px] tracking-[0.2em] font-medium uppercase mb-1">Useful Links</h4>
            <span className="hover:text-black cursor-pointer transition-colors">Dresses</span>
            <span className="hover:text-black cursor-pointer transition-colors">Bottoms</span>
            <span className="hover:text-black cursor-pointer transition-colors">Tops</span>
            <span className="hover:text-black cursor-pointer transition-colors">Blazers</span>
          </div>

          {/* Newsletter Submission Form */}
          <div className="flex flex-col gap-4">
            <h4 className="text-black text-[10px] tracking-[0.2em] font-medium uppercase">Sign up for email</h4>
            <p className="text-[11px] text-gray-400 leading-relaxed">Stay informed about the latest style updates, private collection launches, and luxury lookbooks.</p>
            <form onSubmit={(e) => e.preventDefault()} className="flex border-b border-black py-1 mt-2">
              <input 
                type="email" 
                placeholder="Your email address" 
                className="w-full bg-transparent border-0 outline-none placeholder-gray-300 text-[11px] text-black tracking-widest uppercase font-light"
              />
              <button type="submit" className="text-[10px] font-medium tracking-widest text-black uppercase hover:text-gray-500 transition-colors">Subscribe</button>
            </form>
          </div>
        </div>

        {/* Financial Badges & Copyright Signature */}
        <div className="max-w-[1600px] mx-auto px-8 border-t border-gray-100 mt-20 pt-8 flex flex-col sm:flex-row items-center justify-between gap-6 text-[9px] tracking-[0.2em] text-gray-400">
          <p>© 2026 S. SIKAMÒRE. ALL RIGHTS RESERVED.</p>
          <div className="flex items-center gap-4 filter grayscale contrast-200 opacity-60">
            <span className="border border-gray-200 px-2 py-0.5 rounded font-bold">VISA</span>
            <span className="border border-gray-200 px-2 py-0.5 rounded font-bold">MC</span>
            <span className="border border-gray-200 px-2 py-0.5 rounded font-bold">AMEX</span>
            <span className="border border-gray-200 px-2 py-0.5 rounded font-bold">PAYPAL</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
