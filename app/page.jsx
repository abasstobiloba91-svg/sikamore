/* eslint-disable @next/next/no-img-element */
'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@supabase/supabase-js';
import Link from 'next/link';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
const supabase = createClient(supabaseUrl, supabaseAnonKey);

// THE BRUTE FORCE EXTRACTOR: Perfectly snatches the first image of a product
const getPrimaryImage = (payload) => {
  if (!payload) return '';
  try {
    const raw = JSON.stringify(payload);
    const match = raw.match(/https?:\/\/[^,;"'\[\]\s]+\.(?:jpg|jpeg|png|webp)/i);
    return match ? match : '';
  } catch (e) {
    return '';
  }
};

export default function HomePage() {
  const [bgImages, setBgImages] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    async function fetchLatestProducts() {
      // Grab the 5 most recently created products
      const { data } = await supabase
        .from('products')
        .select('image')
        .order('created_at', { ascending: false })
        .limit(5);

      if (data && data.length > 0) {
        // Extract the valid images
        const extractedUrls = data
          .map(product => getPrimaryImage(product.image))
          .filter(url => url !== '');
        
        if (extractedUrls.length > 0) {
          setBgImages(extractedUrls);
        }
      }
    }
    fetchLatestProducts();
  }, []);

  // Cycle through the images every 5 seconds
  useEffect(() => {
    if (bgImages.length <= 1) return;
    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % bgImages.length);
    }, 5000);
    return () => clearInterval(interval);
  }, [bgImages]);

  return (
    <div className="relative h-screen w-full overflow-hidden bg-[#0A0A0A] font-sans antialiased text-white flex flex-col">
      
      {/* 1. THE SLIDESHOW BACKGROUND LAYER */}
      {bgImages.length > 0 ? (
        bgImages.map((img, index) => (
          <div
            key={img}
            className={`absolute inset-0 transition-all duration-[2000ms] ease-in-out ${
              index === currentIndex ? 'opacity-100 scale-100' : 'opacity-0 scale-105'
            }`}
          >
            <img src={img} alt="Sikamore Latest Collection" className="w-full h-full object-cover" />
          </div>
        ))
      ) : (
        // Fallback placeholder while images load
        <div className="absolute inset-0 bg-[#0A0A0A]" />
      )}

      {/* 2. THE LUXURY DARK WASH OVERLAY (Ensures text is always visible) */}
      <div className="absolute inset-0 z-10 bg-black/40" />
      <div className="absolute inset-0 z-10 bg-gradient-to-t from-black/80 via-transparent to-black/60" />

      {/* 3. MINIMAL TRANSPARENT HEADER */}
      <header className="relative z-20 w-full pt-8 px-6 sm:px-10 flex justify-between items-center">
        <Link href="/shop" className="text-[9px] sm:text-[10px] uppercase tracking-widest text-white hover:text-zinc-300 transition-colors">
          The Collection
        </Link>
        <div className="flex items-center gap-6">
          <Link href="/dashboard" className="text-[9px] sm:text-[10px] uppercase tracking-widest text-white hover:text-zinc-300 transition-colors hidden sm:block">
            Client Login
          </Link>
          <Link href="/admin" className="text-[9px] sm:text-[10px] uppercase tracking-widest text-white hover:text-zinc-300 transition-colors">
            Atelier
          </Link>
        </div>
      </header>

      {/* 4. MAIN CONTENT */}
      <main className="relative z-20 flex-1 flex flex-col items-center justify-center px-4 text-center">
        <div className="animate-fade-in flex flex-col items-center">
          <h1 className="text-3xl sm:text-5xl md:text-6xl tracking-[0.4em] sm:tracking-[0.5em] font-serif font-light mb-6 uppercase pl-[0.2em]">
            S. Sikamòre
          </h1>
          <p className="text-[9px] sm:text-[11px] tracking-[0.3em] uppercase text-zinc-200 mb-12 max-w-md leading-relaxed">
            Finely crafted for audacious women who carry light.
          </p>
          <Link 
            href="/shop" 
            className="bg-white text-black px-10 py-4 sm:px-12 sm:py-5 text-[9px] sm:text-[10px] tracking-[0.25em] uppercase font-bold hover:bg-zinc-200 transition-colors shadow-2xl"
          >
            Shop Now
          </Link>
        </div>
      </main>

      {/* 5. MINIMAL FOOTER STAMP */}
      <footer className="relative z-20 w-full pb-8 text-center">
        <p className="text-[7px] sm:text-[8px] tracking-[0.3em] text-zinc-400 uppercase">
          S. Sikamòre Collectives © {new Date().getFullYear()}
        </p>
      </footer>

    </div>
  );
}
