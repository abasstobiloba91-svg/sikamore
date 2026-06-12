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
  
  // ROLLING WHEEL ENGINE CONFIGURATION
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

  // 5-Second Wheel Roll Trigger
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
    <div className="w-full min-h-screen flex flex-col bg-[#0a0a0a] text-white font-sans antialiased overflow-hidden select-none">
      
      {/* PERFECTLY ALIGNED ROLLING GLOBAL TICKER */}
      {/* Fixed h-9 container with absolute single-line clipping ensures text never shakes or breaks */}
      <div className="w-full bg-black text-white h-9 overflow-hidden border-b border-zinc-900 relative flex items-center justify-center z-50">
        <div 
          className="flex flex-col text-center transition-transform duration-700 cubic-bezier(0.25, 1, 0.5, 1) w-full"
          style={{ transform: `translateY(-${tickerIndex * 100}%)` }}
        >
          {announcements.map((text, idx) => (
            <div 
              key={idx} 
              className="h-9 flex items-center justify-center text-[8px] sm:text-[9px] tracking-[0.25em] sm:tracking-[0.3em] uppercase font-light text-zinc-300 px-4 whitespace-nowrap truncate w-full"
            >
              {text}
            </div>
          ))}
        </div>
      </div>

      {/* CORE VIEWPORT HERO GRID */}
      <div className="w-full flex-1 relative md:grid md:grid-cols-2 overflow-hidden">
        
        {/* COLUMN 1: INTERFACE DETAILS */}
        <div className="absolute inset-0 md:relative md:inset-auto z-20 flex flex-col justify-between p-8 sm:p-16 lg:p-24 bg-gradient-to-r from-black/70 via-black/20 to-transparent md:from-transparent md:bg-transparent h-full">
          <div>
            <h1 className="text-xs font-normal tracking-[0.5em] uppercase font-serif text-white">
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

        {/* COLUMN 2: FULL-SCREEN CAMPAIGN COVER */}
        <div className="absolute inset-0 md:relative md:inset-auto w-full h-full z-10 md:z-auto border-l border-zinc-950">
          <img 
            src={displayedImage} 
            alt="Campaign Visual" 
            className="w-full h-full object-cover transition-opacity duration-1000 ease-in-out"
            key={heroIndex}
          />
          <div className="absolute inset-0 bg-gradient-to-t md:bg-gradient-to-r from-black/40 via-transparent to-transparent pointer-events-none" />
          
          {/* Progress Markers */}
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
    </div>
  );
}
