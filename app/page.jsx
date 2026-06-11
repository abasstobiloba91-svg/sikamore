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
    // THE LUXURY DARK FIX: Switched to obsidian black background with crisp white typography
    <div className="min-h-screen bg-[#050505] text-white font-sans antialiased text-[11px]">
      
      {/* 1. TOP ANNOUNCEMENT TICKER BANNER */}
      <div className="bg-white text-black py-2 text-center text-[9px] tracking-[0.3em] uppercase font-medium border-b border-zinc-900 select-none px-4 truncate">
        WE SHIP OUR PRODUCTS WORLDWIDE • NEW IN | CORE COLLECTION
      </div>

      {/* 2. RESPONSIVE HEADER ARCHITECTURE */}
      <header className="bg-[#050505]/90 border-b border-zinc-900 sticky top-0 z-50 backdrop-blur-md">
        <div className="max-w-[1600px] mx-auto px-4 sm:px-8 h-20 sm:h-24 flex items-center justify-between">
          
          {/* Left Portal Access */}
          <Link href="/admin" className="tracking-[0.2em] text-zinc-500 hover:text-white transition-colors font-light uppercase text-[9px] sm:text-[10px]">
            Portal
          </Link>

          {/* Center Brand Text Logo */}
          <Link href="/" className="text-base sm:text-xl font-normal tracking-[0.3em] sm:tracking-[0.4em] uppercase text-center block pl-[0.3em] font-serif">
            S. SIKAMÒRE
          </Link>

          {/* Right Utility Navigation */}
          <div className="flex items-center gap-4 sm:gap-6 tracking-[0.2em] uppercase text-[9px] sm:text-[10px] text-zinc-500">
            <span className="hover:text-white cursor-pointer transition-colors hidden sm:inline">Search</span>
            <span className="text-white font-medium cursor-pointer">Bag (0)</span>
          </div>
        </div>

        {/* Categories Menu Ribbon - Touch Scroll Optimized for Mobile */}
        <div className="border-t border-zinc-900 bg-[#050505]">
          <div className="max-w-xl mx-auto h-12 flex items-center justify-start sm:justify-center gap-8 sm:gap-10 tracking-[0.25em] text-[9px] sm:text-[10px] uppercase font-light text-zinc-400 overflow-x-auto whitespace-nowrap px-6 scrollbar-none">
            <span className="text-white font-normal cursor-pointer border-b border-white pb-1 shrink-0">Home</span>
            <span className="hover:text-white cursor-pointer transition-colors shrink-0">New In</span>
            <span className="hover:text-white cursor-pointer transition-colors shrink-0">About Us</span>
            <span className="hover:text-white cursor-pointer transition-colors shrink-0">Contact Us</span>
          </div>
        </div>
      </header>

      {/* 3. GRID UTILITIES CONTROLLER */}
      <section className="max-w-[1600px] mx-auto px-4 sm:px-8 pt-6 sm:pt-10 pb-4 sm:pb-6 flex items-center justify-between border-b border-zinc-900">
        
        {/* Hidden on Mobile - Desktop Column Selectors */}
        <div className="hidden md:flex items-center gap-4 text-zinc-700">
          <button 
            onClick={() => setViewCols(2)} 
            className={`flex gap-0.5 p-1 transition-colors ${viewCols === 2 ? 'text-white' : 'hover:text-zinc-400'}`}
          >
            <div className="w-3 h-4 border border-current"></div>
            <div className="w-3 h-4 border border-current"></div>
          </button>
          <button 
            onClick={() => setViewCols(3)} 
            className={`flex gap-0.5 p-1 transition-colors ${viewCols === 3 ? 'text-white' : 'hover:text-zinc-400'}`}
          >
            <div className="w-2.5 h-4 border border-current"></div>
            <div className="w-2.5 h-4 border border-current"></div>
            <div className="w-2.5 h-4 border border-current"></div>
          </button>
          <button 
            onClick={() => setViewCols(4)} 
            className={`flex gap-0.5 p-1 transition-colors ${viewCols === 4 ? 'text-white' : 'hover:text-zinc-400'}`}
          >
            <div className="w-2 h-4 border border-current"></div>
            <div className="w-2 h-4 border border-current"></div>
            <div className="w-2 h-4 border border-current"></div>
            <div className="w-2 h-4 border border-current"></div>
          </button>
        </div>

        <div className="text-[9px] tracking-widest text-zinc-500 uppercase md:block hidden">
          Showing {products.length} Items
        </div>

        {/* Sort Dropdown Filter */}
        <div className="w-full md:w-auto flex justify-end">
          <select className="bg-transparent border-0 outline-none text-[9px] tracking-widest uppercase cursor-pointer text-zinc-400 hover:text-white font-light">
            <option className="bg-black">Sort by latest</option>
            <option className="bg-black">Price: Low to High</option>
            <option className="bg-black">Price: High to Low</option>
          </select>
        </div>
      </section>

      {/* 4. LUXURY PRODUCT GRID MATRIX */}
      <main className="max-w-[1600px] mx-auto px-4 sm:px-8 py-8 sm:py-12">
        {loading ? (
          <div className="text-center py-32 tracking-[0.3em] text-zinc-500 uppercase text-[9px]">Loading Curation Archive...</div>
        ) : (
          /* THE MOBILE GRID FIX: Strictly sets 2 columns on mobile (grid-cols-2), updates dynamically on screens higher than mobile */
          <div className={`grid grid-cols-2 ${
            viewCols === 2 ? 'md:grid-cols-2' : viewCols === 3 ? 'md:grid-cols-3' : 'md:grid-cols-3 lg:grid-cols-4'
          } gap-x-4 sm:gap-x-6 gap-y-10 sm:gap-y-14 transition-all duration-500`}>
            
            {products.map((product) => (
              <div key={product.id} className="group flex flex-col relative">
                
                {/* Visual Image Frame Container */}
                <div className="bg-[#121212] aspect-[3/4] w-full overflow-hidden relative border border-zinc-900 flex items-center justify-center">
                  <img
                    src={product.image}
                    alt={product.name}
                    className="w-full h-full object-cover object-center group-hover:scale-[1.02] transition-transform duration-[900ms] ease-out"
                    onError={(e) => { e.target.src = '/product 1.jpeg'; }}
                  />

                  {/* HOVER UTILITY PANEL (Auto-hidden on Touch screens to preserve native mobile feel) */}
                  <div className="absolute bottom-3 left-1/2 -translate-x-1/2 hidden md:flex items-center bg-black border border-zinc-800 divide-x divide-zinc-800 opacity-0 group-hover:opacity-100 transition-opacity duration-300 z-10 shadow-xl">
                    <button className="p-2.5 hover:bg-white hover:text-black transition-colors" title="Add to bag">
                      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" className="w-3.5 h-3.5">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 10.5V6a3.75 3.75 0 10-7.5 0v4.5m11.356-1.993l1.263 12c.07.665-.45 1.243-1.119 1.243H4.25a1.125 1.125 0 01-1.12-1.243l1.264-12A1.125 1.125 0 015.513 7.5h12.974c.576 0 1.059.435 1.119 1.007zM8.625 10.5a.375.375 0 11-.75 0 .375.375 0 01.75 0zm7.5 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z" />
                      </svg>
                    </button>
                    <button className="p-2.5 hover:bg-white hover:text-black transition-colors" title="Wishlist">
                      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" className="w-3.5 h-3.5">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12z" />
                      </svg>
                    </button>
                  </div>

                  {/* HIGH-FASHION MINIMAL CIRCULAR SOLD OUT OVERLAY */}
                  {product.is_sold_out && (
                    <div className="absolute inset-0 bg-black/40 backdrop-blur-[1px] flex items-center justify-center pointer-events-none">
                      <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-black border border-zinc-800 flex items-center justify-center shadow-2xl">
                        <span className="text-[8px] sm:text-[9px] tracking-[0.2em] uppercase font-light text-zinc-300">Sold Out</span>
                      </div>
                    </div>
                  )}
                </div>

                {/* Typography Metadata Deck labels */}
                <div className="flex flex-col gap-1 mt-3 text-center px-1">
                  <h3 className="text-[9px] sm:text-[10px] tracking-[0.2em] sm:tracking-[0.25em] font-light uppercase text-zinc-400 group-hover:text-white transition-colors duration-300 truncate">
                    {product.name}
                  </h3>
                  <p className="text-[10px] sm:text-[11px] font-normal tracking-wider text-white">
                    ₦{Number(product.price).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* PAGINATION BUTTON */}
        <div className="mt-16 sm:mt-24 text-center">
          <button className="px-8 sm:px-10 py-3.5 sm:py-4 bg-transparent border border-zinc-800 text-[9px] sm:text-[10px] tracking-[0.3em] uppercase text-zinc-300 hover:bg-white hover:text-black hover:border-white transition-colors duration-500 font-light select-none">
            Load More
          </button>
        </div>
      </main>

      {/* 5. BLACK & WHITE ACCORDION FOOTER SYSTEM */}
      <footer className="border-t border-zinc-900 bg-[#020202] pt-16 pb-12 mt-16 sm:mt-20">
        <div className="max-w-[1600px] mx-auto px-4 sm:px-8 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-10 sm:gap-12 text-zinc-400 font-light tracking-widest">
          
          {/* Brand Info */}
          <div className="flex flex-col gap-3">
            <h4 className="text-white text-[10px] tracking-[0.2em] font-medium uppercase">S. SIKAMÒRE</h4>
            <p className="leading-relaxed text-[10px] text-zinc-500">Curated high-fashion textiles and ready-to-wear luxury conceptualized for the modern vanguard.</p>
            <p className="text-[9px] text-zinc-300 pt-1">contact@sikamoreofficial.com</p>
          </div>

          {/* Help Links */}
          <div className="flex flex-col gap-2.5 text-[10px]">
            <h4 className="text-white text-[10px] tracking-[0.2em] font-medium uppercase mb-1">Help</h4>
            <span className="hover:text-white cursor-pointer transition-colors">Contact Us</span>
            <span className="hover:text-white cursor-pointer transition-colors">About Us</span>
            <span className="hover:text-white cursor-pointer transition-colors">Privacy Policy</span>
            <span className="hover:text-white cursor-pointer transition-colors">Terms & Conditions</span>
          </div>

          {/* Catalog Links */}
          <div className="flex flex-col gap-2.5 text-[10px]">
            <h4 className="text-white text-[10px] tracking-[0.2em] font-medium uppercase mb-1">Useful Links</h4>
            <span className="hover:text-white cursor-pointer transition-colors">Dresses</span>
            <span className="hover:text-white cursor-pointer transition-colors">Bottoms</span>
            <span className="hover:text-white cursor-pointer transition-colors">Tops</span>
            <span className="hover:text-white cursor-pointer transition-colors">Blazers</span>
          </div>

          {/* Newsletter Input */}
          <div className="flex flex-col gap-3">
            <h4 className="text-white text-[10px] tracking-[0.2em] font-medium uppercase">Sign up for email</h4>
            <p className="text-[10px] text-zinc-500 leading-relaxed">Stay informed about the latest style updates, private collection launches, and luxury lookbooks.</p>
            <form onSubmit={(e) => e.preventDefault()} className="flex border-b border-zinc-800 py-1.5 mt-1">
              <input 
                type="email" 
                placeholder="Your email address" 
                className="w-full bg-transparent border-0 outline-none placeholder-zinc-700 text-[10px] text-white tracking-widest uppercase font-light"
              />
              <button type="submit" className="text-[9px] font-medium tracking-widest text-white uppercase hover:text-zinc-400 transition-colors">Subscribe</button>
            </form>
          </div>
        </div>

        {/* Footnote Signature Row */}
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
