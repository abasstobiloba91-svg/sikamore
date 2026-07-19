'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useApp } from '../../providers';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
const supabase = createClient(supabaseUrl, supabaseAnonKey);
const currencySymbols = { NGN: '₦', USD: '$', GBP: '£', EUR: '€' };

const extractCleanUrls = (payload) => {
  if (!payload) return [];
  try {
    let raw = JSON.stringify(payload);
    raw = raw.replace(/["'\[\]{}\s]/g, '');
    return raw.split(',').filter(u => u.startsWith('http'));
  } catch (e) {
    return [];
  }
};

const getPrimaryImage = (payload) => {
  const urls = extractCleanUrls(payload);
  return urls.length > 0 ? urls[0] : '';
};

// Generates URL friendly names
const generateSlug = (name) => {
  if (!name) return '';
  return name.toString().toLowerCase().trim()
    .replace(/\s+/g, '-')
    .replace(/[^\w\-]+/g, '')
    .replace(/\-\-+/g, '-');
};

export default function ClientView({ product }) {
  const { addToCart, wishlist, toggleWishlist, setIsCartOpen, showToast } = useApp();
  
  const [imgIndex, setImgIndex] = useState(0);
  const [qty, setQty] = useState(1);
  const [selectedSize, setSelectedSize] = useState('M');
  const [openAccordion, setOpenAccordion] = useState('description');
  const [currency, setCurrency] = useState('NGN');
  const [usdToNgnRate, setUsdToNgnRate] = useState(1500);
  
  useEffect(() => {
    supabase.from('shipping_settings').select('usd_to_ngn_rate').eq('id', 1).single().then(({ data }) => {
      if (data && data.usd_to_ngn_rate) setUsdToNgnRate(parseFloat(data.usd_to_ngn_rate));
    });
    
    fetch('https://ipapi.co/json/').then(r => r.json()).then(data => {
      if (data && data.country_code) {
        if (data.country_code === 'NG') setCurrency('NGN');
        else if (data.country_code === 'GB') setCurrency('GBP');
        else if (data.in_eu) setCurrency('EUR');
        else setCurrency('USD');
      }
    }).catch(() => {});
  }, []);

  const formatPrice = (ngnPrice) => {
    const rate = { NGN: 1, USD: 1 / usdToNgnRate, GBP: 1 / (usdToNgnRate * 1.32), EUR: 1 / (usdToNgnRate * 1.12) }[currency] || 1;
    const converted = Number(ngnPrice) * rate;
    return currency === 'NGN' ? `₦${Math.round(converted).toLocaleString()}` : `${currencySymbols[currency] || '$'}${converted.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  const handleAddToCart = () => {
    addToCart({ id: String(product.id), name: product.name, price: product.price, image: getPrimaryImage(product.image), is_sold_out: product.is_sold_out }, qty, selectedSize);
    showToast('Added to your bag.');
    setIsCartOpen(true);
  };

  const copyToClipboard = () => {
    const slug = generateSlug(product.name);
    navigator.clipboard.writeText(`https://ssikamore.com/product/${slug}`);
    showToast('Link copied! Ready to share.');
  };

  const productTabs = [
    { id: 'description', title: 'The Details', content: product.description || "A beautifully detailed silhouette crafted to elevate your everyday wardrobe." },
    { id: 'additional', title: 'Additional Info', content: product.additional_information || "Designed in-house. Dry clean recommended." },
    { id: 'policies', title: 'Store Policies', content: product.store_policies || "Worldwide shipping available. Returns accepted within 14 days." },
    { id: 'inquiries', title: 'Inquiries', content: product.inquiries || "Reach out to our Client Advisory team for styling or fit questions." }
  ];

  return (
    <div className="min-h-screen bg-white text-black font-sans antialiased flex flex-col">
      <header className="border-b border-zinc-200 h-20 bg-white flex items-center shrink-0">
        <div className="w-full max-w-[1600px] mx-auto px-4 sm:px-8 flex items-center justify-between">
          <Link href="/shop" className="text-[9px] uppercase tracking-widest text-zinc-500 hover:text-black transition-colors">&larr; Back to Collection</Link>
          <Link href="/" className="text-sm sm:text-lg font-serif uppercase tracking-[0.3em] font-bold">S. SIKAMÒRE</Link>
          <div className="w-[100px] text-right">
            <button onClick={copyToClipboard} className="text-[9px] uppercase tracking-widest text-black border border-black px-3 py-1.5 hover:bg-black hover:text-white transition-colors">Share</button>
          </div>
        </div>
      </header>

      <main className="flex-1 max-w-[1600px] w-full mx-auto flex flex-col md:flex-row">
        <div className="w-full md:w-1/2 bg-zinc-50 relative aspect-[3/4] md:aspect-auto md:min-h-screen overflow-hidden">
          {extractCleanUrls(product.image)[imgIndex] && (
            <img src={extractCleanUrls(product.image)[imgIndex]} alt={product.name} className="absolute inset-0 w-full h-full object-cover animate-fade-in" />
          )}
          <div className="absolute inset-x-0 top-1/2 -translate-y-1/2 flex justify-between px-4">
            <button onClick={() => { const arr = extractCleanUrls(product.image); if (arr.length > 0) setImgIndex(prev => (prev - 1 + arr.length) % arr.length); }} className="w-10 h-10 bg-white text-black flex items-center justify-center rounded-full shadow-lg active:scale-95"><svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7"/></svg></button>
            <button onClick={() => { const arr = extractCleanUrls(product.image); if (arr.length > 0) setImgIndex(prev => (prev + 1) % arr.length); }} className="w-10 h-10 bg-white text-black flex items-center justify-center rounded-full shadow-lg active:scale-95"><svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7"/></svg></button>
          </div>
        </div>
        
        <div className="w-full md:w-1/2 p-6 sm:p-14 flex flex-col justify-start">
          <div className="flex justify-between items-start mb-1">
            <h1 className="text-xl sm:text-2xl font-normal tracking-[0.2em] uppercase font-serif pr-4">{product.name}</h1>
            <button onClick={() => toggleWishlist({ id: String(product.id), name: product.name, price: product.price, image: getPrimaryImage(product.image) })} className="text-black hover:scale-110 transition-transform"><svg className="w-5 h-5" fill={wishlist.some(w => w.id === String(product.id)) ? "#D31313" : "none"} stroke={wishlist.some(w => w.id === String(product.id)) ? "#D31313" : "currentColor"} strokeWidth="1.5" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12z" /></svg></button>
          </div>
          <p className="text-sm tracking-widest font-medium mb-8 text-zinc-500">{formatPrice(product.price)}</p>

          <div className="mb-6">
            <span className="text-[9px] tracking-widest uppercase text-zinc-400 block mb-3">Select Size</span>
            <div className="flex gap-3">
              {['S', 'M', 'L'].map(s => <button key={s} onClick={() => setSelectedSize(s)} className={`w-10 h-10 flex items-center justify-center text-xs border transition-colors ${selectedSize === s ? 'border-black bg-black text-white' : 'border-zinc-200 hover:border-black'}`}>{s}</button>)}
            </div>
          </div>
          
          <div className="flex items-center gap-4 mb-8">
            <div className="flex items-center border border-zinc-200">
              <button onClick={() => setQty(Math.max(1, qty - 1))} className="w-10 h-10 flex items-center justify-center text-zinc-400 hover:text-black">-</button>
              <span className="w-10 text-center text-sm font-mono">{qty}</span>
              <button onClick={() => setQty(qty + 1)} className="w-10 h-10 flex items-center justify-center text-zinc-400 hover:text-black">+</button>
            </div>
          </div>

          <button onClick={handleAddToCart} disabled={product.is_sold_out} className={`w-full py-4 text-[10px] tracking-[0.2em] uppercase font-bold transition-colors ${product.is_sold_out ? 'bg-zinc-200 text-zinc-400 cursor-not-allowed' : 'bg-black text-white hover:bg-zinc-800'}`}>
            {product.is_sold_out ? 'Sold Out' : `Add to Bag • ${formatPrice(product.price * qty)}`}
          </button>

          <div className="mt-12 border-t border-zinc-200">
            {productTabs.map((tab) => (
              <div key={tab.id} className="border-b border-zinc-200">
                <button onClick={() => setOpenAccordion(openAccordion === tab.id ? '' : tab.id)} className="w-full py-5 flex justify-between items-center text-[10px] tracking-[0.2em] uppercase hover:text-zinc-500 transition-colors">
                  {tab.title}
                  <svg className={`w-4 h-4 transition-transform duration-300 ${openAccordion === tab.id ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" /></svg>
                </button>
                <div className={`overflow-hidden transition-all duration-300 ${openAccordion === tab.id ? 'max-h-96 opacity-100 mb-5' : 'max-h-0 opacity-0'}`}>
                  <p className="text-xs text-zinc-500 leading-relaxed font-light whitespace-pre-wrap">{tab.content}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </main>
    </div>
  );
}
