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
    <div className="min-h-screen bg-[#0a0a0a] text-white font-sans antialiased text-[11px]">
      
      {/* 1. TOP TICKER BANNER */}
      <div className="bg-black text-white py-2.5 text-center text-[9px] tracking-[0.3em] uppercase font-light border-b border-zinc-900 px-4 truncate select-none">
        WE SHIP OUR PRODUCTS WORLDWIDE • NEW IN | CORE COLLECTION
      </div>

      {/* 2. THE EDITORIAL NAVIGATION HUB */}
      <header className="bg-white text-black border-b border-gray-200 sticky top-0 z-50 shadow-sm">
        <div className="max-w-[1600px] mx-auto px-4 sm:px-8 h-20 sm:h-24 flex items-center justify-between">
          
          <Link href="/admin" className="tracking-[0.2em] text-gray-400 hover:text-black transition-colors font-light uppercase text-[9px] sm:text-[10px]">
            Portal
          </Link>

          {/* SIKAMORE Formal Text Logo */}
          <Link href="/" className="text-base sm:text-xl font-normal tracking-[0.3em] sm:tracking-[0.4em] uppercase text-center block pl-[0.3em] font-serif text-black">
            S. SIKAMÒRE
          </Link>

          <div className="flex items-center gap-4 sm:gap-6 tracking-[0.2em] uppercase text-[9px] sm:text-[10px] text-gray-400">
            <span className="hover:text-black cursor-pointer transition-colors hidden sm:inline">Search</span>
            <span className="text-black font-medium cursor-pointer">Bag (0)</span>
          </div>
        </div>

        {/* Categories Menu Ribbon */}
        <div className="border-t border-gray-100 bg-white">
          <div className="max-w-xl mx-auto h-11 flex items-center justify-start sm:justify-center gap-8 sm:gap-10 tracking-[0.25em] text-[9px] sm:text-[10px] uppercase font-light text-gray-500 overflow-x-auto whitespace-nowrap px-6 scrollbar-none">
            <span className="text-black font-normal cursor-pointer border-b border-black pb-1 shrink-0">Home</span>
            <span className="hover:text-black cursor-pointer transition-colors shrink-0">New In</span>
            <span className="hover:text-black cursor-pointer transition-colors shrink-0">About Us</span>
            <span className="hover:text-black cursor-pointer transition-colors shrink-0">Contact Us</span>
          </div>
        </div>
      </header>

      {/* 3. DYNAMIC UTILITIES HUB */}
      <section className="bg-white text-black border-b border-gray-200">
        <div className="max-w-[1600px] mx-auto px-4 sm:px-8 py-5 flex items-center justify-between">
          
          {/* THE SHARP FIXED GRID CONTROLLERS: Using high-contrast solid fills */}
          <div className="hidden md:flex items-center gap-6">
            
            {/* 2-Column Toggle Button */}
            <button 
              onClick={() => setViewCols(2)} 
              className={`flex gap-[3px] p-2 border transition-all duration-200 ${
                viewCols === 2 
                  ? 'border-black text-black bg-zinc-100' 
                  : 'border-gray-200 text-gray-400 hover:text-black hover:border-gray-400'
              }`}
              title="2 Columns View"
            >
              <svg className="w-[14px] h-[14px]" fill="currentColor" viewBox="0 0 16 16">
                <rect width="6" height="14" x="1" y="1" rx="0.5"/>
                <rect width="6" height="14" x="9" y="1" rx="0.5"/>
              </svg>
            </button>
            
            {/* 3-Column Toggle Button */}
            <button 
              onClick={() => setViewCols(3)} 
              className={`flex gap-[3px] p-2 border transition-all duration-200 ${
                viewCols === 3 
                  ? 'border-black text-black bg-zinc-100' 
                  : 'border-gray-200 text-gray-400 hover:text-black hover:border-gray-400'
              }`}
              title="3 Columns View"
            >
              <svg className="w-[18px] h-[14px]" fill="currentColor" viewBox="0 0 20 16">
                <rect width="5" height="14" x="1" y="1" rx="0.5"/>
                <rect width="5" height="14" x="7" y="1" rx="0.5"/>
                <rect width="5" height="14" x="13" y="1" rx="0.5"/>
              </svg>
            </button>

            {/* 4-Column Toggle Button */}
            <button 
              onClick={() => setViewCols(4)} 
              className={`flex gap-[2px] p-2 border transition-all duration-200 ${
                viewCols === 4 
                  ? 'border-black text-black bg-zinc-100' 
                  : 'border-gray-200 text-gray-400 hover:text-black hover:border-gray-400'
              }`}
              title="4 Columns View"
            >
              <svg className="w-[22px] h-[14px]" fill="currentColor" viewBox="0 0 24 16">
                <rect width="4" height="14" x="1" y="1" rx="0.5"/>
                <rect width="4" height="14" x="6" y="1" rx="0.5"/>
                <rect width="4" height="14" x="11" y="1" rx="0.5"/>
                <rect width="4" height="14" x="16" y="1" rx="0.5"/>
              </svg>
            </button>
          </div>

          <div className="text-[10px] tracking-with-space text-gray-400 uppercase md:block hidden font-light tracking-[0.15em]">
            Curation Archive / Total {products.length} Designs
          </div>

          <div>
            <select className="bg-transparent border-0 outline-none text-[10px] tracking-widest uppercase cursor-pointer text-gray-500 hover:text-black font-light">
              <option>Sort by latest</option>
              <option>Price: Low to High</option>
              <option>Price: High to Low</option>
            </select>
          </div>
        </div>
      </section>

      {/* 4. BLACK HIGH-FASHION GALLERY CANVAS */}
      <main className="max-w-[1600px] mx-auto px-4 sm:px-8 py-10 sm:py-16">
        {loading ? (
          <div className="text-center py-32 tracking-[0.3em] text-zinc-500 uppercase text-[9px]">Loading Curation...</div>
        ) : (
          <div className={`grid grid-cols-2 ${
            viewCols === 2 ? 'md:grid-cols-2' : viewCols === 3 ? 'md:grid-cols-3' : 'md:grid-cols-3 lg:grid-cols-4'
          } gap-x-4 sm:gap-x-6 gap-y-12 sm:gap-y-16 transition-all duration-500`}>
            
            {products.map((product) => (
              <div key={product.id} className="group flex flex-col relative bg-[#111111] p-2 border border-zinc-900 shadow-xl rounded-sm">
                
                {/* Product Image Frame Container */}
                <div className="bg-[#161616] aspect-[3/4] w-full overflow-hidden relative flex items-center justify-center rounded-sm">
                  <img
                    src={product.image}
                    alt={product.name}
                    className="w-full h-full object-cover object-center group-hover:scale-[1.03] transition-transform duration-[800ms] ease-out"
                    onError={(e) => { e.target.src = '/product 1.jpeg'; }}
                  />

                  {/* High-visibility overlay action metrics */}
                  <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex items-center bg-black/95 backdrop-blur-md border border-zinc-800 divide-x divide-zinc-800 opacity-90 md:opacity-0 md:group-hover:opacity-100 transition-all duration-300 z-10 shadow-2xl rounded-sm">
                    <button className="p-2.5 hover:bg-white hover:text-black text-white transition-colors" title="Add to Cart">
                      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" className="w-3.5 h-3.5">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 10.5V6a3.75 3.75 0 10-7.5 0v4.5m11.356-1.993l1.263 12c.07.665-.45 1.243-1.119 1.243H4.25a1.125 1.125 0 01-1.12-1.243l1.264-12A1.125 1.125 0 015.513 7.5h12.974c.576 0 1.059.435 1.119 1.007zM8.625 10.5a.375.375 0 11-.75 0 .375.375 0 01.75 0zm7.5 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z" />
                      </svg>
                    </button>
                    <button className="p-2.5 hover:bg-white hover:text-black text-white transition-colors" title="Add to Wishlist">
                      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" className="w-3.5 h-3.5">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12z" />
                      </svg>
                    </button>
                    <button className="p-2.5 hover:bg-white hover:text-black text-white transition-colors" title="Quick Look">
                      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" className="w-3.5 h-3.5">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" />
                        <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                    </button>
                  </div>

                  {/* Elegant Circular Sold Out Overlay */}
                  {product.is_sold_out && (
                    <div className="absolute inset-0 bg-black/40 backdrop-blur-[0.5px] flex items-center justify-center pointer-events-none">
                      <div className="w-14 h-14 sm:w-18 sm:h-18 rounded-full bg-black/90 border border-zinc-800 flex items-center justify-center shadow-2xl">
                        <span className="text-[8px] tracking-[0.15em] uppercase text-zinc-300 font-light">Sold Out</span>
                      </div>
                    </div>
                  )}
                </div>

                {/* Typography Labels Under Cards */}
                <div className="flex flex-col gap-1 mt-3.5 text-center pb-1">
                  <h3 className="text-[9px] sm:text-[10px] tracking-[0.2em] font-light uppercase text-zinc-400 group-hover:text-white transition-colors duration-300 truncate">
                    {product.name}
                  </h3>
                  <p className="text-[10px] sm:text-[11px] font-normal tracking-widest text-zinc-200">
                    ₦{Number(product.price).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* PAGINATION LOAD MORE ACTION BUTTON */}
        <div className="mt-16 sm:mt-24 text-center">
          <button className="px-9 sm:px-12 py-3.5 sm:py-4 bg-transparent border border-zinc-800 text-[9px] sm:text-[10px] tracking-[0.3em] uppercase text-zinc-300 hover:bg-white hover:text-black hover:border-white transition-colors duration-500 font-light select-none rounded-sm">
            Load More Archive
          </button>
        </div>
      </main>

      {/* 5. BLACK & WHITE ACCORDION FOOTER MATRIX */}
      <footer className="border-t border-zinc-900 bg-[#020202] pt-16 pb-12">
        <div className="max-w-[1600px] mx-auto px-4 sm:px-8 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-10 sm:gap-12 text-zinc-400 font-light tracking-widest">
          
          <div className="flex flex-col gap-3">
            <h4 className="text-white text-[10px] tracking-[0.2em] font-medium uppercase">S. SIKAMÒRE</h4>
            <p className="leading-relaxed text-[10px] text-zinc-500">Curated high-fashion textiles and ready-to-wear luxury conceptualized for the modern vanguard.</p>
            <p className="text-[9px] text-zinc-300 pt-1">contact@sikamoreofficial.com</p>
          </div>

          <div className="flex flex-col gap-2.5 text-[10px]">
            <h4 className="text-white text-[10px] tracking-[0.2em] font-medium uppercase mb-1">Help</h4>
            <span className="hover:text-white cursor-pointer transition-colors">Contact Us</span>
            <span className="hover:text-white cursor-pointer transition-colors">About Us</span>
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
            <p className="text-[10px] text-zinc-500 leading-relaxed">Stay informed about latest releases and luxury lookbooks.</p>
            <form onSubmit={(e) => e.preventDefault()} className="flex border-b border-zinc-800 py-1.5">
              <input 
                type="email" 
                placeholder="Your email address" 
                className="w-full bg-transparent border-0 outline-none placeholder-zinc-700 text-[10px] text-white tracking-widest uppercase font-light"
              />
              <button type="submit" className="text-[9px] font-medium tracking-widest text-white uppercase hover:text-zinc-400 transition-colors">Subscribe</button>
            </form>
          </div>
        </div>

        <div className="max-w-[1600px] mx-auto px-4 sm:px-8 border-t border-zinc-900 mt-16 pt-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-[9px] tracking-[0.2em] text-zinc-600">
          <p>© 2026 S. SIKAMÒRE. ALL RIGHTS RESERVED.</p>
          <div className="flex items-center gap-4 opacity-20 invert">
            <span className="border border-gray-400 px-1.5 py-0.5 rounded font-bold">VISA</span>
            <span className="border border-gray-400 px-1.5 py-0.5 rounded font-bold">MC</span>
            <span className="border border-gray-400 px-1.5 py-0.5 rounded font-bold">AMEX</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
