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
  
  // THE ROLLING TICKER STATE
  const [tickerIndex, setTickerIndex] = useState(0);
  const announcements = [
    "COMPLIMENTARY WORLDWIDE SHIPPING ON ALL ORDERS",
    "DISCOVER THE ARCHIVE: NEW READY-TO-WEAR & ACCESSORIES NOW LIVE",
    "CRAFTED SILHOUETTES • A STUDY IN TEXTURE AND MINIMALIST FORM",
    "JOIN THE S. SIKAMÒRE CLUB FOR EXCLUSIVE CAPSULE PREVIEWS"
  ];

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

  // 5-Second Ticker Interval Loop
  useEffect(() => {
    const tickerTimer = setInterval(() => {
      setTickerIndex((prev) => (prev + 1) % announcements.length);
    }, 5000);
    return () => clearInterval(tickerTimer);
  }, [announcements.length]);

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
    <div className="w-full h-screen relative md:grid md:grid-cols-2 bg-[#0a0a0a] text-white font-sans antialiased overflow-hidden select-none">
      
      {/* COLUMN 1: THE BRAND STATEMENT & CTA OVERLAY */}
      <div className="absolute inset-0 md:relative md:inset-auto z-20 flex flex-col justify-between p-8 sm:p-16 lg:p-24 bg-gradient-to-r from-black/60 via-black/20 to-transparent md:from-transparent md:bg-transparent h-full">
        
        {/* DYNAMIC TOP TICKER (Mobile View Overlay Position) */}
        <div className="w-full md:hidden text-center text-[8px] tracking-[0.25em] uppercase text-zinc-300 font-light pt-2 transition-all duration-500 animate-fade">
          {announcements[tickerIndex]}
        </div>

        <div>
          <h1 className="text-xs font-normal tracking-[0.5em] uppercase font-serif text-white pt-2 md:pt-0">
            S. SIKAMÒRE
          </h1>
        </div>

        <div className="space-y-4 md:space-y-8 my-auto max-w-sm">
          <span className="text-zinc-300 md:text-zinc-500 text-[9px] tracking-[0.4em] uppercase font-medium block">
            NEW ARRIVALS
          </span>
          <h2 className="text-2xl sm:text-4xl lg:text-5xl font-light font-serif tracking-[0.2em] leading-tight uppercase text-white">
            SUMMER IN AFRICA
          </h2>
          <p className="text-zinc-400 md:text-zinc-500 tracking-widest leading-relaxed font-light text-[10px] uppercase hidden sm:block">
            A study in raw textures, effortless silhouettes, and structural elegance. Designed for the modern vanguard.
          </p>
          
          <div className="pt-2">
            <Link 
              href="/shop" 
              className="inline-block bg-white text-black px-8 py-3.5 text-[10px] font-medium tracking-[0.2em] uppercase hover:bg-zinc-200 transition-all duration-300 rounded-sm shadow-xl text-center min-w-[140px]"
            >
              DISCOVER THE CURATION
            </Link>
          </div>
        </div>

        <div className="text-[8px] md:text-[9px] text-zinc-500 md:text-zinc-600 tracking-[0.2em] uppercase">
          © 2026 S. SIKAMÒRE. ARCHIVE COLLECTION.
        </div>
      </div>

      {/* COLUMN 2: THE FULL-SCREEN EDITORIAL CANVAS */}
      <div className="absolute inset-0 md:relative md:inset-auto w-full h-full z-10 md:z-auto border-l border-zinc-950 flex flex-col">
        
        {/* DYNAMIC TOP TICKER (Desktop Layout Position) */}
        <div className="hidden md:block w-full bg-black text-white py-3.5 text-center text-[9px] tracking-[0.3em] uppercase font-light border-b border-zinc-900 select-none absolute top-0 left-0 z-30 transition-all duration-500">
          {announcements[tickerIndex]}
        </div>

        <img 
          src={displayedImage} 
          alt="Campaign Visual" 
          className="w-full h-full object-cover transition-opacity duration-1000 ease-in-out"
          key={heroIndex}
        />
        <div className="absolute inset-0 bg-gradient-to-t md:bg-gradient-to-r from-black/40 via-transparent to-transparent pointer-events-none" />
        
        {/* Minimalist Slide Progress Dots */}
        {products.length > 1 && (
          <div className="absolute bottom-8 right-8 flex gap-2 z-30">
            {products.map((_, idx) => (
              <div 
                key={idx} 
                className={`h-[2px] transition-all duration-700 ${idx === heroIndex ? 'w-6 bg-white' : 'w-1.5 bg-zinc-800'}`} 
              />
            ))}
          </div>
        )}
      </div>

    </div>
  );
}
