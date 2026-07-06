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

export default function CollectionsPage() {
  const [userSession, setUserSession] = useState(null);
  
  // State to hold the full product data for each category
  const [groupedProducts, setGroupedProducts] = useState({
    bags: [],
    accessories: [],
    clothing: []
  });

  // Global ticker to cycle through images in the hero banners
  const [tick, setTick] = useState(0);

  // 1. Check Auth Status for Header
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) setUserSession(session.user);
      else {
        const localUser = localStorage.getItem('sikamore_user_profile');
        if (localUser) setUserSession(JSON.parse(localUser)); 
      }
    });
  }, []);

  // 2. Fetch all products and group them by category
  useEffect(() => {
    async function fetchProducts() {
      const { data } = await supabase
        .from('products')
        .select('*')
        .order('created_at', { ascending: false });

      if (data) {
        const categorized = { bags: [], accessories: [], clothing: [] };
        
        data.forEach(product => {
          const cat = product.category || 'bags'; // Default to bags if empty
          if (categorized[cat]) {
            categorized[cat].push(product);
          }
        });

        setGroupedProducts(categorized);
      }
    }
    fetchProducts();
  }, []);

  // 3. Start the motion timer for the hero backgrounds (Changes image every 4 seconds)
  useEffect(() => {
    const interval = setInterval(() => {
      setTick(prev => prev + 1);
    }, 4000);
    return () => clearInterval(interval);
  }, []);

  // REUSABLE HERO BANNER COMPONENT
  const HeroSection = ({ title, categoryName, products }) => {
    // Extract up to 5 images for the background slideshow
    const images = products
      .map(p => getPrimaryImage(p.image))
      .filter(img => img !== '')
      .slice(0, 5);
      
    const currentImgIndex = images.length > 0 ? tick % images.length : 0;

    return (
      <div className="h-screen w-full relative flex flex-col items-center justify-center overflow-hidden bg-[#0A0A0A]">
        {/* Motion Background */}
        {images.length > 0 && images.map((img, index) => (
          <div
            key={`${categoryName}-hero-${index}`}
            className={`absolute inset-0 transition-opacity duration-[2000ms] ease-in-out ${
              index === currentImgIndex ? 'opacity-100' : 'opacity-0'
            }`}
          >
            <img src={img} alt={`${title} Collection`} className="w-full h-full object-cover scale-105" />
          </div>
        ))}

        {/* Dark Overlays for Text Legibility */}
        <div className="absolute inset-0 z-10 bg-black/40" />
        <div className="absolute inset-0 z-10 bg-gradient-to-t from-black/80 via-transparent to-black/40" />

        {/* Content */}
        <div className="relative z-20 flex flex-col items-center text-center px-4 animate-fade-in">
          <h2 className="text-4xl sm:text-6xl tracking-[0.4em] font-serif font-light mb-8 uppercase text-white drop-shadow-lg pl-[0.2em]">
            {title}
          </h2>
          <Link 
            href={`/shop?category=${categoryName}`} 
            className="bg-white/10 backdrop-blur-md border border-white/30 text-white px-10 py-4 sm:px-12 sm:py-5 text-[9px] sm:text-[10px] tracking-[0.3em] uppercase font-bold hover:bg-white hover:text-black transition-all shadow-2xl"
          >
            Shop {title}
          </Link>
        </div>
      </div>
    );
  };

  // REUSABLE 6-ITEM PRODUCT GRID COMPONENT
  const ProductGrid = ({ products, categoryName }) => {
    if (!products || products.length === 0) return null;
    
    // Take exactly up to 6 products to display just like before
    const displayProducts = products.slice(0, 6);

    return (
      <div className="w-full bg-white text-black py-16 sm:py-24 px-4 sm:px-8">
        <div className="max-w-[1400px] mx-auto">
          
          <div className="grid grid-cols-2 lg:grid-cols-3 gap-x-4 gap-y-10 sm:gap-x-8 sm:gap-y-16">
            {displayProducts.map(product => (
              <Link href={`/shop?category=${categoryName}`} key={product.id} className="group flex flex-col cursor-pointer">
                <div className="relative w-full aspect-[3/4] bg-zinc-100 overflow-hidden mb-4">
                  <img
                    src={getPrimaryImage(product.image)}
                    alt={product.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 ease-out"
                  />
                </div>
                <h3 className="text-[9px] sm:text-[10px] tracking-widest uppercase font-medium text-black mb-1">
                  {product.name}
                </h3>
                <p className="text-[9px] text-zinc-500 font-mono">
                  ₦{product.price.toLocaleString()}
                </p>
              </Link>
            ))}
          </div>

          {/* Optional link to view the full category if they have more than 6 items */}
          <div className="mt-16 text-center">
            <Link 
              href={`/shop?category=${categoryName}`} 
              className="text-[9px] sm:text-[10px] tracking-[0.2em] uppercase font-bold border-b border-black pb-1 hover:text-zinc-500 hover:border-zinc-500 transition-colors"
            >
              View Full {categoryName} Archives
            </Link>
          </div>

        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen w-full bg-[#0A0A0A] font-sans antialiased text-white relative">
      
      {/* FIXED TRANSPARENT HEADER */}
      <header className="fixed top-0 left-0 right-0 z-50 w-full pt-8 px-6 sm:px-10 flex justify-between items-center bg-gradient-to-b from-black/80 to-transparent pb-6">
        <Link href="/shop" className="text-[9px] sm:text-[10px] uppercase tracking-widest text-white hover:text-zinc-300 transition-colors">
          The Collection
        </Link>
        <Link href="/" className="absolute left-1/2 -translate-x-1/2 text-lg sm:text-xl font-normal tracking-[0.4em] uppercase font-serif text-white hidden sm:block">
          S. SIKAMÒRE
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

      {/* SCROLLING CONTENT: Hero -> Grid -> Hero -> Grid */}
      
      {/* BAGS */}
      <HeroSection title="Bags" categoryName="bags" products={groupedProducts.bags} />
      <ProductGrid products={groupedProducts.bags} categoryName="bags" />
      
      {/* ACCESSORIES */}
      <HeroSection title="Accessories" categoryName="accessories" products={groupedProducts.accessories} />
      <ProductGrid products={groupedProducts.accessories} categoryName="accessories" />
      
      {/* CLOTHING */}
      <HeroSection title="Clothing" categoryName="clothing" products={groupedProducts.clothing} />
      <ProductGrid products={groupedProducts.clothing} categoryName="clothing" />

      {/* LUXURY FOOTER */}
      <div className="w-full bg-[#0A0A0A] flex flex-col items-center justify-center py-24 sm:py-32 px-6">
        
        <h2 className="text-xl sm:text-2xl font-serif tracking-[0.4em] uppercase mb-10 text-white">S. Sikamòre</h2>

        {/* Social Icons */}
        <div className="flex items-center gap-8 mb-10">
          <a href="https://instagram.com/ssikamore" target="_blank" rel="noreferrer" className="text-white hover:text-zinc-400 transition-colors">
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z"/></svg>
          </a>
          <a href="https://tiktok.com/@ssikamore" target="_blank" rel="noreferrer" className="text-white hover:text-zinc-400 transition-colors">
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M19.59 6.69a4.83 4.83 0 01-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 01-5.2 1.74 2.89 2.89 0 012.31-4.64 2.93 2.93 0 01.88.13V9.4a6.84 6.84 0 00-1-.05A6.33 6.33 0 005 20.1a6.34 6.34 0 0010.86-4.43v-7a8.16 8.16 0 004.77 1.52v-3.4a4.85 4.85 0 01-1-.1z"/></svg>
          </a>
          <a href="https://facebook.com/ssikamore" target="_blank" rel="noreferrer" className="text-white hover:text-zinc-400 transition-colors">
             <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M22.675 0h-21.35c-.732 0-1.325.593-1.325 1.325v21.351c0 .731.593 1.324 1.325 1.324h11.495v-9.294h-3.128v-3.622h3.128v-2.671c0-3.1 1.893-4.788 4.659-4.788 1.325 0 2.463.099 2.795.143v3.24l-1.918.001c-1.504 0-1.795.715-1.795 1.763v2.313h3.587l-.467 3.622h-3.12v9.293h6.116c.73 0 1.323-.593 1.323-1.325v-21.35c0-.732-.593-1.325-1.325-1.325z"/></svg>
          </a>
        </div>

        <div className="flex flex-col sm:flex-row gap-6 sm:gap-10 text-[9px] uppercase tracking-[0.2em] text-zinc-500 mb-10 font-medium text-center">
          <Link href="/shop" className="hover:text-white transition-colors">The Archives</Link>
          <Link href="/contact" className="hover:text-white transition-colors">Client Concierge</Link>
          <Link href="/about" className="hover:text-white transition-colors">House of Sikamòre</Link>
        </div>

        <p className="text-[8px] tracking-[0.3em] text-zinc-600 uppercase">
          S. Sikamore Collective © {new Date().getFullYear()}
        </p>
      </div>

    </div>
  );
}
