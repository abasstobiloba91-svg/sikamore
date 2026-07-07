/* eslint-disable @next/next/no-img-element */
'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@supabase/supabase-js';
import Link from 'next/link';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
const supabase = createClient(supabaseUrl, supabaseAnonKey);

const getPrimaryImage = (payload) => {
  if (!payload) return '';
  try {
    const raw = JSON.stringify(payload);
    const match = raw.match(/https?:\/\/[^,;"'\[\]\s]+\.(?:jpg|jpeg|png|webp)/i);
    return match ? match[0] : '';
  } catch (e) {
    return '';
  }
};

export default function HomePage() {
  const [bgImages, setBgImages] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [userSession, setUserSession] = useState(null);

  // Check login status
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) setUserSession(session.user);
      else {
        const localUser = localStorage.getItem('sikamore_user_profile');
        if (localUser) setUserSession(JSON.parse(localUser)); 
      }
    });
  }, []);

  // Fetch background images
  useEffect(() => {
    async function fetchLatestProducts() {
      const { data } = await supabase
        .from('products')
        .select('image')
        .order('created_at', { ascending: false })
        .limit(5);

      if (data && data.length > 0) {
        const extractedUrls = data
          .map(product => getPrimaryImage(product.image))
          .filter(url => url !== '');
        if (extractedUrls.length > 0) setBgImages(extractedUrls);
      }
    }
    fetchLatestProducts();
  }, []);

  // Cycle images
  useEffect(() => {
    if (bgImages.length <= 1) return;
    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % bgImages.length);
    }, 5000);
    return () => clearInterval(interval);
  }, [bgImages]);

  return (
    <div className="relative h-screen w-full overflow-hidden bg-[#0A0A0A] font-sans antialiased text-white flex flex-col">
      
      {/* 1. BACKGROUND LAYER */}
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
        <div className="absolute inset-0 bg-[#0A0A0A]" />
      )}

      {/* 2. OVERLAYS */}
      <div className="absolute inset-0 z-10 bg-black/40" />
      <div className="absolute inset-0 z-10 bg-gradient-to-t from-black/90 via-black/20 to-black/60" />

      {/* 3. HEADER */}
      <header className="relative z-20 w-full pt-8 px-6 sm:px-10 flex justify-between items-center">
        <Link href="/shop" className="text-[9px] sm:text-[10px] uppercase tracking-widest text-white hover:text-zinc-300 transition-colors">
          The Collection
        </Link>
        <div className="flex items-center">
          {userSession ? (
            <Link href="/dashboard" className="text-[9px] sm:text-[10px] uppercase tracking-[0.2em] text-white hover:text-zinc-300 transition-colors">
              DASHBOARD
            </Link>
          ) : (
            <Link href="/login" className="text-[9px] sm:text-[10px] uppercase tracking-[0.2em] text-white hover:text-zinc-300 transition-colors">
              LOGIN / SIGNUP
            </Link>
          )}
        </div>
      </header>

      {/* 4. MAIN CONTENT */}
      <main className="relative z-20 flex-1 flex flex-col items-center justify-center px-4 text-center">
        <div className="animate-fade-in flex flex-col items-center">
          <h1 className="text-3xl sm:text-5xl md:text-6xl tracking-[0.4em] sm:tracking-[0.5em] font-serif font-light mb-6 uppercase pl-[0.2em]">
            S. Sikamòre
          </h1>
          <p className="text-[9px] sm:text-[11px] tracking-[0.3em] uppercase text-zinc-200 mb-12 max-w-md leading-relaxed">
            Finely crafted for audacious women who carry light and purpose.
          </p>
          <Link 
            href="/shop"
            className="bg-white text-black px-10 py-4 sm:px-12 sm:py-5 text-[9px] sm:text-[10px] tracking-[0.25em] uppercase font-bold hover:bg-zinc-200 transition-colors shadow-2xl"
          >
            Explore Now
          </Link>
        </div>
      </main>

      {/* 5. LUXURY FOOTER */}
      <footer className="relative z-20 w-full pb-8 pt-10 flex flex-col items-center text-center">
        
        {/* Social Icons */}
        <div className="flex items-center gap-8 mb-6">
          <a href="https://instagram.com/ssikamore" target="_blank" rel="noreferrer" className="text-white hover:text-zinc-400 transition-colors">
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z"/></svg>
          </a>
          <a href="https://tiktok.com/@ssikamore" target="_blank" rel="noreferrer" className="text-white hover:text-zinc-400 transition-colors">
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M19.59 6.69a4.83 4.83 0 01-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 01-5.2 1.74 2.89 2.89 0 012.31-4.64 2.93 2.93 0 01.88.13V9.4a6.84 6.84 0 00-1-.05A6.33 6.33 0 005 20.1a6.34 6.34 0 0010.86-4.43v-7a8.16 8.16 0 004.77 1.52v-3.4a4.85 4.85 0 01-1-.1z"/></svg>
          </a>
          <a href="https://facebook.com/ssikamore" target="_blank" rel="noreferrer" className="text-white hover:text-zinc-400 transition-colors">
             <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M22.675 0h-21.35c-.732 0-1.325.593-1.325 1.325v21.351c0 .731.593 1.324 1.325 1.324h11.495v-9.294h-3.128v-3.622h3.128v-2.671c0-3.1 1.893-4.788 4.659-4.788 1.325 0 2.463.099 2.795.143v3.24l-1.918.001c-1.504 0-1.795.715-1.795 1.763v2.313h3.587l-.467 3.622h-3.12v9.293h6.116c.73 0 1.323-.593 1.323-1.325v-21.35c0-.732-.593-1.325-1.325-1.325z"/></svg>
          </a>
        </div>

        <p className="text-[7px] sm:text-[8px] tracking-[0.3em] text-zinc-500 uppercase">
          S. Sikamore Collective © {new Date().getFullYear()}
        </p>
      </footer>
    </div>
  );
}
