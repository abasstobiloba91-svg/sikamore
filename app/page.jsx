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

  // Smooth crossfade loop for the background images only
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
    <div className="w-full h-screen relative md:grid md:grid-cols-2 bg-[#F5F5F4] text-[#0A0A0A] font-sans antialiased overflow-hidden select-none">
      
      {/* COLUMN 1: THE BRAND STATEMENT & CTA OVERLAY */}
      <div className="absolute inset-0 md:relative md:inset-auto z-20 flex flex-col justify-between p-8 sm:p-16 lg:p-24 bg-gradient-to-r from-[#F5F5F4] via-[#F5F5F4]/90 to-transparent md:from-transparent md:bg-transparent h-full">
        <div>
          <h1 className="text-xs font-normal tracking-[0.5em] uppercase font-serif text-[#0A0A0A]">
            S. SIKAMÒRE
          </h1>
        </div>

        <div className="space-y-4 md:space-y-8 my-auto max-w-sm">
          <span className="text-zinc-500 text-[9px] tracking-[0.4em] uppercase font-medium block">
            NEW ARRIVALS
          </span>
          <h2 className="text-2xl sm:text-4xl lg:text-5xl font-light font-serif tracking-[0.2em] leading-tight uppercase text-[#0A0A0A]">
            SUMMER IN AFRICA
          </h2>
          <p className="text-zinc-600 tracking-widest leading-relaxed font-light text-[10px] uppercase hidden sm:block">
            A study in raw textures, effortless silhouettes, and structural elegance. Designed for the modern vanguard.
          </p>
          
          <div className="pt-2">
            <Link 
              href="/shop" 
              className="inline-block bg-[#0A0A0A] text-white px-8 py-3.5 text-[10px] font-medium tracking-[0.2em] uppercase hover:bg-zinc-800 transition-all duration-300 rounded-sm shadow-xl text-center min-w-[140px]"
            >
              DISCOVER THE CURATION
            </Link>
          </div>
        </div>

        <div className="text-[8px] md:text-[9px] text-zinc-500 tracking-[0.2em] uppercase">
          © 2026 S. SIKAMÒRE. ARCHIVE COLLECTION.
        </div>
      </div>

      {/* COLUMN 2: THE FULL-SCREEN EDITORIAL CANVAS */}
      <div className="absolute inset-0 md:relative md:inset-auto w-full h-full z-10 md:z-auto border-l border-zinc-200">
        <img 
          src={displayedImage} 
          alt="Campaign Visual" 
          className="w-full h-full object-cover transition-opacity duration-1000 ease-in-out"
          key={heroIndex}
        />
        <div className="absolute inset-0 bg-gradient-to-t md:bg-gradient-to-r from-[#F5F5F4]/20 via-transparent to-transparent pointer-events-none" />
        
        {/* Minimalist Slide Progress Dots */}
        {products.length > 1 && (
          <div className="absolute bottom-8 right-8 flex gap-2 z-30">
            {products.map((_, idx) => (
              <div 
                key={idx} 
                className={`h-[2px] transition-all duration-700 ${idx === heroIndex ? 'w-6 bg-[#0A0A0A]' : 'w-1.5 bg-zinc-300'}`} 
              />
            ))}
          </div>
        )}
      </div>

    </div>
  );
}
