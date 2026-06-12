/* eslint-disable @next/next/no-img-element */
'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@supabase/supabase-js';
import Link from 'next/link';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
const supabase = createClient(supabaseUrl, supabaseAnonKey);

export default function EditorialLanding() {
  const [products, setProducts] = useState([]);
  const [heroIndex, setHeroIndex] = useState(0);

  // Fetch live photos to use for the looping background
  useEffect(() => {
    async function fetchHeroImages() {
      try {
        const { data, error } = await supabase
          .from('products')
          .select('image')
          .order('created_at', { ascending: false });
        if (!error && data) setProducts(data);
      } catch (err) {
        console.error(err);
      }
    }
    fetchHeroImages();
  }, []);

  // Smooth crossfade looping clock
  useEffect(() => {
    if (products.length === 0) return;
    const interval = setInterval(() => {
      setHeroIndex((prev) => (prev + 1) % products.length);
    }, 4000);
    return () => clearInterval(interval);
  }, [products]);

  const defaultHero = "https://images.unsplash.com/photo-1509631179647-0177331693ae?q=80&w=1200";
  const displayedImage = products.length > 0 ? products[heroIndex]?.image : defaultHero;

  return (
    <div className="w-full min-h-screen grid grid-cols-1 md:grid-cols-2 bg-[#0a0a0a] text-white font-sans antialiased overflow-hidden select-none">
      
      {/* Left Column: Brand Statement & Access Action */}
      <div className="flex flex-col justify-between p-8 sm:p-16 lg:p-24 relative z-10 h-full min-h-screen">
        <div>
          <h1 className="text-sm font-normal tracking-[0.5em] uppercase font-serif text-white">
            S. SIKAMÒRE
          </h1>
        </div>

        <div className="space-y-6 md:space-y-8 my-auto">
          <span className="text-zinc-500 text-[9px] tracking-[0.4em] uppercase font-medium block">
            NEW ARRIVALS
          </span>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-light font-serif tracking-[0.2em] leading-snug uppercase text-zinc-100 max-w-md">
            SUMMER IN AFRICA
          </h2>
          <p className="text-zinc-500 tracking-widest leading-relaxed max-w-xs font-light text-[10px] uppercase">
            A premium exploration of raw structural textiles, calculated tailoring weight, and architecture.
          </p>
          
          {/* THE ENTRY BUTTON: Smooth transition directly into the shopping system */}
          <Link 
            href="/shop" 
            className="inline-block bg-white text-black px-10 py-4.5 text-[9px] font-medium tracking-[0.3em] uppercase hover:bg-zinc-200 transition-colors duration-300 rounded-sm shadow-2xl text-center"
          >
            SHOP NOW
          </Link>
        </div>

        <div className="text-[9px] text-zinc-600 tracking-[0.2em] uppercase">
          © 2026 S. SIKAMÒRE. ARCHIVE COLLECTION.
        </div>
      </div>

      {/* Right Column: Moving High-Fidelity Canvas */}
      <div className="relative w-full h-[50vh] md:h-full overflow-hidden bg-[#111] border-l border-zinc-950">
        <img 
          src={displayedImage} 
          alt="Campaign Visual" 
          className="w-full h-full object-cover transition-all duration-[1500ms] ease-in-out scale-100"
          key={heroIndex}
        />
        <div className="absolute inset-0 bg-gradient-to-t md:bg-gradient-to-r from-black via-transparent to-transparent opacity-60 pointer-events-none" />
        
        {/* Dynamic Minimalist Progress Tickers */}
        {products.length > 1 && (
          <div className="absolute bottom-10 right-10 flex gap-2.5 z-10">
            {products.map((_, idx) => (
              <div 
                key={idx} 
                className={`h-[2px] transition-all duration-1000 ${idx === heroIndex ? 'w-8 bg-white' : 'w-2 bg-zinc-800'}`} 
              />
            ))}
          </div>
        )}
      </div>

    </div>
  );
}
