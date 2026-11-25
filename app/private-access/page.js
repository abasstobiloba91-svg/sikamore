/* eslint-disable @next/next/no-img-element */
'use client';
export const dynamic = 'force-dynamic';

import { useEffect, useState } from 'react';
import { createClient } from '@supabase/supabase-js';
import Link from 'next/link';
import { useApp } from '../providers';

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
  if (!payload) return '';
  try {
    const raw = JSON.stringify(payload);
    const match = raw.match(/https?:\/\/[^,;"'\[\]\s]+\.(?:jpg|jpeg|png|webp)/i);
    return match ? match[0] : '';
  } catch (e) {
    return '';
  }
};

const generateSlug = (name) => {
  if (!name) return '';
  return name.toString().toLowerCase().trim()
    .replace(/\s+/g, '-')
    .replace(/[^\w\-]+/g, '')
    .replace(/\-\-+/g, '-');
};

export default function PrivateEarlyAccessPage() {
  const [usdToNgnRate, setUsdToNgnRate] = useState(1500);
  const [privateAccessHeading, setPrivateAccessHeading] = useState('');
  const [privateAccessNote, setPrivateAccessNote] = useState('');
  const [loading, setLoading] = useState(true);
  const [products, setProducts] = useState([]);
  const [currency, setCurrency] = useState('NGN');

  const [viewCols, setViewCols] = useState(4);
  const [isListView, setIsListView] = useState(false);

  const [quickViewProduct, setQuickViewProduct] = useState(null);
  const [openAccordion, setOpenAccordion] = useState('description');
  const [quickViewImgIndex, setQuickViewImgIndex] = useState(0);
  const [touchStart, setTouchStart] = useState(null);
  const [touchEnd, setTouchEnd] = useState(null);

  const [selectedSize, setSelectedSize] = useState('M');
  const [qty, setQty] = useState(1);
  const [localCartOpen, setLocalCartOpen] = useState(false);
  const [showDeliveryNotice, setShowDeliveryNotice] = useState(false);

  const appContext = useApp() || {};
  const cart = appContext.cart || [];
  const wishlist = appContext.wishlist || [];
  const toggleWishlist = appContext.toggleWishlist || (() => {});
  const addToCart = appContext.addToCart || (() => {});
  const removeFromCart = appContext.removeFromCart || (() => {});
  const showToast = appContext.showToast || ((msg) => console.log(msg));

  const cartCount = cart.reduce((sum, item) => sum + (Number(item.quantity) || 1), 0);
  const cartTotal = cart.reduce((sum, item) => sum + (Number(item.price) || 0) * (Number(item.quantity) || 1), 0);

  const handleOpenCart = () => {
    if (typeof appContext.setIsCartOpen === 'function') {
      appContext.setIsCartOpen(true);
    } else if (typeof appContext.openCart === 'function') {
      appContext.openCart();
    } else if (typeof appContext.setCartOpen === 'function') {
      appContext.setCartOpen(true);
    } else if (typeof appContext.toggleCart === 'function') {
      appContext.toggleCart();
    } else {
      setLocalCartOpen(true);
    }
  };

  useEffect(() => {
    async function loadMasterLogistics() {
      try {
        const { data } = await supabase
          .from('shipping_settings')
          .select('usd_to_ngn_rate, private_access_heading, private_access_note')
          .eq('id', 1)
          .single();
        if (data) {
          if (data.usd_to_ngn_rate) setUsdToNgnRate(parseFloat(data.usd_to_ngn_rate));
          if (data.private_access_heading) setPrivateAccessHeading(data.private_access_heading);
          if (data.private_access_note) setPrivateAccessNote(data.private_access_note);
        }
      } catch (e) {}
    }
    loadMasterLogistics();
  }, []);

  useEffect(() => {
    async function locateClientNetwork() {
      try {
        const res = await fetch('https://ipapi.co/json/');
        const data = await res.json();
        if (data && data.country_code) {
          const checkEurope = data.in_eu || ['FR', 'DE', 'IT', 'ES', 'NL', 'GB'].includes(data.country_code);
          if (data.country_code === 'NG') setCurrency('NGN');
          else if (data.continent_code === 'AF') setCurrency('USD');
          else if (data.country_code === 'GB') setCurrency('GBP');
          else if (checkEurope) setCurrency('EUR');
          else setCurrency('USD');
        }
      } catch (err) {}
    }
    locateClientNetwork();
  }, []);

  useEffect(() => {
    async function fetchPrivateDrop() {
      const { data } = await supabase
        .from('products')
        .select('*')
        .eq('is_hidden', true)
        .order('sort_order', { ascending: true })
        .order('created_at', { ascending: false });

      if (data) setProducts(data);
      setLoading(false);
    }
    fetchPrivateDrop();
  }, []);

  const formatPrice = (ngnPrice) => {
    if (ngnPrice === undefined || ngnPrice === null) return '';
    const dynamicExchangeRates = {
      NGN: 1,
      USD: 1 / usdToNgnRate,
      GBP: 1 / (usdToNgnRate * 1.32),
      EUR: 1 / (usdToNgnRate * 1.12),
    };
    const rate = dynamicExchangeRates[currency] || 1;
    const converted = Number(ngnPrice) * rate;
    if (isNaN(converted)) return '';
    if (currency === 'NGN') return `₦${Math.round(converted).toLocaleString()}`;
    return `${currencySymbols[currency] || '$'}${converted.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  const openQuickView = async (product) => {
    if (!product) return;
    setQty(1);
    setSelectedSize('M');
    setOpenAccordion('description');
    setQuickViewImgIndex(0);
    setQuickViewProduct(product);

    try {
      await supabase.from('page_analytics').insert([{
        event_type: 'click',
        action_type: 'view_details',
        product_name: product.name.toUpperCase(),
        page_path: `/private-access?item=${product.id}`,
      }]);
    } catch (e) {}
  };

  const minSwipeDistance = 30;
  const onTouchStart = (e) => {
    setTouchEnd(null);
    setTouchStart(e.targetTouches[0]?.clientX);
  };
  const onTouchMove = (e) => setTouchEnd(e.targetTouches[0]?.clientX);
  const onTouchEnd = () => {
    if (!touchStart || !touchEnd) return;
    const distance = touchStart - touchEnd;
    const images = quickViewProduct ? extractCleanUrls(quickViewProduct.image) : [];
    if (images.length <= 1) return;

    if (distance > minSwipeDistance) setQuickViewImgIndex((prev) => (prev + 1) % images.length);
    else if (distance < -minSwipeDistance) setQuickViewImgIndex((prev) => (prev - 1 + images.length) % images.length);

    setTouchStart(null);
    setTouchEnd(null);
  };

  const handleAddToCart = async (e, product, overrideQty = 1, overrideSize = 'M') => {
    if (e) { e.preventDefault(); e.stopPropagation(); }
    const cartItemPayload = {
      id: String(product.id),
      name: String(product.name || ''),
      price: Number(product.price || 0),
      image: getPrimaryImage(product.image),
      is_sold_out: Boolean(product.is_sold_out),
    };
    try {
      addToCart(cartItemPayload, overrideQty, overrideSize);
      showToast('Added to your bag.');

      await supabase.from('page_analytics').insert([{
        event_type: 'click',
        action_type: 'add_to_cart',
        product_name: product.name.toUpperCase(),
        page_path: `/private-access?item=${product.id}`,
      }]);
    } catch (err) {
      showToast('Error adding to bag.');
    }
  };

  const handleWishlistClick = (e, product) => {
    if (e) { e.preventDefault(); e.stopPropagation(); }
    const wishlistPayload = {
      id: String(product.id),
      name: String(product.name || ''),
      price: Number(product.price || 0),
      image: getPrimaryImage(product.image),
      is_sold_out: Boolean(product.is_sold_out),
    };
    toggleWishlist(wishlistPayload);
  };

  const toggleAccordion = (tabId) => {
    setOpenAccordion(openAccordion === tabId ? '' : tabId);
  };

  const productTabs = [
    { id: 'description', title: 'The Details', content: quickViewProduct?.description || "A beautifully detailed silhouette crafted to elevate your everyday wardrobe with effortless grace." },
    { id: 'additional', title: 'Additional Info', content: quickViewProduct?.additional_information || "Designed in-house. We recommend dry cleaning to preserve the integrity of the fabrics and true-to-size fit." },
    { id: 'policies', title: 'Store Policies', content: quickViewProduct?.store_policies || "We offer worldwide shipping on all orders. Returns are accepted within 14 days of delivery." },
    { id: 'inquiries', title: 'Inquiries', content: quickViewProduct?.inquiries || "Questions about styling or fit? Our Client Advisory team is here for you." },
  ];

  const renderProductCard = (product) => {
    const inWishlist = wishlist.some(w => w.id === product.id);
    const gridPrimaryImage = getPrimaryImage(product.image);
    const productSlug = generateSlug(product.name);

    return (
      <div key={product.id} className="group flex flex-col relative bg-white pb-4">
        <div
          className="bg-zinc-50 aspect-[3/4] w-full overflow-hidden relative rounded-sm border border-zinc-100 cursor-pointer"
          onClick={(e) => { e.stopPropagation(); if (!product.is_sold_out) openQuickView(product); }}
        >
          {gridPrimaryImage ? (
            <img
              key={gridPrimaryImage}
              src={gridPrimaryImage}
              alt={product.name || 'Product'}
              className="absolute inset-0 w-full h-full object-cover"
            />
          ) : (
            <div className="absolute inset-0 bg-zinc-100 flex items-center justify-center text-[8px] tracking-widest text-zinc-400 uppercase">Awaiting Restock</div>
          )}

          <button type="button" onClick={(e) => handleWishlistClick(e, product)} className="absolute top-3 right-3 z-30 pointer-events-auto p-2 text-black hover:scale-110 active:scale-95 transition-transform">
            <svg className="w-5 h-5 pointer-events-none" fill={inWishlist ? "#D31313" : "none"} stroke={inWishlist ? "#D31313" : "currentColor"} strokeWidth="1.5" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12z" /></svg>
          </button>

          <div className="absolute inset-x-0 bottom-6 opacity-0 lg:group-hover:opacity-100 transition-opacity duration-300 hidden lg:flex flex-col items-center gap-2 z-30 pointer-events-none">
            <button type="button" onClick={(e) => handleAddToCart(e, product)} disabled={product.is_sold_out} className={`pointer-events-auto flex items-center justify-center bg-black text-white h-8 w-32 rounded-sm text-[9px] uppercase tracking-widest hover:bg-zinc-800 active:scale-95 transition-all shadow-lg ${product.is_sold_out ? 'opacity-50 cursor-not-allowed' : ''}`}>Add to Cart</button>
            <Link href={`/product/${productSlug}`} onClick={(e) => e.stopPropagation()} className="pointer-events-auto flex items-center justify-center bg-white border border-zinc-200 text-black h-8 w-32 rounded-sm text-[9px] uppercase tracking-widest hover:bg-zinc-100 active:scale-95 transition-all shadow-lg">View Product</Link>
          </div>

          {product.is_sold_out && (
            <div className="absolute inset-0 bg-white/60 flex items-center justify-center pointer-events-none z-20">
              <div className="w-14 h-14 rounded-full bg-white border border-zinc-200 flex items-center justify-center">
                <span className="text-[8px] tracking-[0.15em] uppercase text-zinc-400">Sold Out</span>
              </div>
            </div>
          )}
        </div>

        <div className="flex flex-col gap-1 mt-4 text-left px-1">
          <h3 className="text-[10px] sm:text-[11px] tracking-[0.15em] uppercase text-zinc-800 truncate">{product.name}</h3>
          <p className="text-[11px] sm:text-[13px] tracking-widest text-black font-medium">{formatPrice(product.price)}</p>
          {!product.is_sold_out && product.stock_quantity > 0 && (
            <p className="text-[9px] tracking-[0.15em] uppercase text-[#D31313] font-medium mt-0.5">
              Only {product.stock_quantity} left
            </p>
          )}
          <div className="flex lg:hidden flex-col gap-2 mt-3 w-full">
            <button type="button" onClick={(e) => handleAddToCart(e, product)} disabled={product.is_sold_out} className={`w-full bg-black text-white py-2.5 text-[8px] uppercase tracking-[0.2em] font-medium transition-colors ${product.is_sold_out ? 'opacity-50 cursor-not-allowed' : ''}`}>Add to Cart</button>
            <Link href={`/product/${productSlug}`} className="w-full text-center bg-white text-black border border-zinc-200 py-2.5 text-[8px] uppercase tracking-[0.2em] font-medium active:bg-zinc-50 transition-colors block">View Product</Link>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-white text-black font-sans antialiased text-[11px] pb-0 relative">
      {/* STICKY HEADER */}
      <div className="sticky top-0 w-full z-50">
        <div className="w-full bg-[#0A0A0A] text-white h-9 flex items-center justify-center text-[8px] sm:text-[9px] tracking-[0.25em] uppercase font-light text-zinc-200 px-4 text-center">
          PRIVATE WAITLIST EARLY ACCESS • 24-HOUR EXCLUSIVE WINDOW
        </div>

        <header className="bg-white text-black border-b border-zinc-200">
          <div className="max-w-[1600px] mx-auto px-4 sm:px-8 h-20 sm:h-24 flex items-center justify-center">
            <Link href="/" className="text-[15px] sm:text-xl font-bold tracking-[0.3em] sm:tracking-[0.4em] uppercase font-serif text-center text-black pl-[0.3em] whitespace-nowrap">
              S. SIKAMÒRE
            </Link>
          </div>
        </header>
      </div>

      {/* EDITABLE BRAND EDITORIAL WRITE-UP */}
      {(privateAccessHeading || privateAccessNote) && (
        <section className="bg-white border-b border-zinc-100">
          <div className="max-w-2xl mx-auto px-6 py-10 sm:py-14 text-center">
            {privateAccessHeading && (
              <h1 className="text-sm sm:text-lg font-serif tracking-[0.3em] uppercase text-black mb-4">
                {privateAccessHeading}
              </h1>
            )}
            <div className="w-8 h-[1px] bg-black mx-auto mb-5"></div>
            {privateAccessNote && (
              <p className="text-[11px] sm:text-xs text-zinc-600 leading-relaxed tracking-wider font-light whitespace-pre-wrap">
                {privateAccessNote}
              </p>
            )}
          </div>
        </section>
      )}

      {/* GRID VIEW CONTROLS */}
      <section className="bg-white border-b border-zinc-200">
        <div className="max-w-[1600px] mx-auto px-4 sm:px-8 py-3.5 flex items-center justify-between">
          <p className="text-[9px] uppercase tracking-[0.25em] text-zinc-500">
            Private Collection ({products.length} {products.length === 1 ? 'Piece' : 'Pieces'})
          </p>

          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5 md:hidden">
              <button onClick={() => setIsListView(true)} className={`p-1.5 border transition-all ${isListView ? 'border-black bg-black text-white' : 'border-zinc-200 text-zinc-500'}`}><svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" /></svg></button>
              <button onClick={() => setIsListView(false)} className={`p-1.5 border transition-all ${!isListView ? 'border-black bg-black text-white' : 'border-zinc-200 text-zinc-500'}`}><svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 24 24"><rect width="9" height="9" x="2" y="2" rx="1"/><rect width="9" height="9" x="13" y="2" rx="1"/><rect width="9" height="9" x="2" y="13" rx="1"/><rect width="9" height="9" x="13" y="13" rx="1"/></svg></button>
            </div>
            <div className="hidden md:flex items-center gap-2">
              <button onClick={() => { setViewCols(2); setIsListView(false); }} className={`flex gap-[3px] p-2 border transition-all ${viewCols === 2 && !isListView ? 'border-black bg-black text-white' : 'border-zinc-200 text-zinc-400'}`}><svg className="w-[14px] h-[14px]" fill="currentColor" viewBox="0 0 16 16"><rect width="6" height="14" x="1" y="1"/><rect width="6" height="14" x="9" y="1"/></svg></button>
              <button onClick={() => { setViewCols(3); setIsListView(false); }} className={`flex gap-[3px] p-2 border transition-all ${viewCols === 3 && !isListView ? 'border-black bg-black text-white' : 'border-zinc-200 text-zinc-400'}`}><svg className="w-[18px] h-[14px]" fill="currentColor" viewBox="0 0 20 16"><rect width="5" height="14" x="1" y="1"/><rect width="5" height="14" x="7" y="1"/><rect width="5" height="14" x="13" y="1"/></svg></button>
              <button onClick={() => { setViewCols(4); setIsListView(false); }} className={`flex gap-[2px] p-2 border transition-all ${viewCols === 4 && !isListView ? 'border-black bg-black text-white' : 'border-zinc-200 text-zinc-400'}`}><svg className="w-[22px] h-[14px]" fill="currentColor" viewBox="0 0 24 16"><rect width="4" height="14" x="1" y="1"/><rect width="4" height="14" x="6" y="1"/><rect width="4" height="14" x="11" y="1"/><rect width="4" height="14" x="16" y="1"/></svg></button>
            </div>
          </div>
        </div>
      </section>

      {/* PRODUCT GRID */}
      <main className="max-w-[1600px] mx-auto px-4 sm:px-8 py-10 sm:py-16 bg-white pb-32">
        {loading ? (
          <div className="text-center py-32 tracking-[0.3em] text-zinc-500 uppercase text-[9px]">
            Unlocking Private Reserve...
          </div>
        ) : products.length === 0 ? (
          <div className="text-center py-32 space-y-4">
            <p className="tracking-[0.3em] text-zinc-500 uppercase text-[10px]">
              The early access window has closed or no private pieces are currently active.
            </p>
            <Link href="/shop" className="inline-block border border-black px-8 py-3 text-[9px] tracking-[0.25em] uppercase hover:bg-black hover:text-white transition-colors">
              Visit Main Storefront
            </Link>
          </div>
        ) : (
          <div className={"grid gap-x-4 sm:gap-x-6 gap-y-8 sm:gap-y-12 w-full " + (isListView ? "grid-cols-1 gap-y-6 max-w-xl mx-auto" : viewCols === 2 ? "grid-cols-2 md:grid-cols-2" : viewCols === 3 ? "grid-cols-2 md:grid-cols-3" : "grid-cols-2 md:grid-cols-3 lg:grid-cols-4")}>
            {products.map((product) => renderProductCard(product))}
          </div>
        )}
      </main>

      {/* FLOATING RED PILL VIEW CART BAR */}
      {cartCount > 0 && (
        <div className="fixed bottom-5 left-1/2 -translate-x-1/2 z-50 w-[92%] max-w-sm">
          <div className="w-full bg-[#D31313] text-white rounded-full p-2 pl-6 shadow-2xl flex items-center justify-between">
            <div className="flex items-center text-[11px] sm:text-xs font-bold tracking-wider uppercase whitespace-nowrap">
              <span>{cartCount} {cartCount === 1 ? 'ITEM' : 'ITEMS'}</span>
              <span className="mx-3 opacity-60 font-light">|</span>
              <span>{formatPrice(cartTotal)}</span>
            </div>
            <button
              type="button"
              onClick={handleOpenCart}
              className="bg-white text-[#D31313] font-bold text-[10px] sm:text-xs tracking-[0.15em] uppercase px-6 py-3 rounded-full hover:bg-zinc-100 active:scale-95 transition-all whitespace-nowrap cursor-pointer"
            >
              VIEW CART
            </button>
          </div>
        </div>
      )}

      {/* FALLBACK CART DRAWER (NEVER 404s) */}
      {localCartOpen && (
        <div
          className="fixed inset-0 bg-black/70 z-[9999999] flex justify-end"
          onClick={(e) => { if (e.target === e.currentTarget) setLocalCartOpen(false); }}
        >
          <div className="bg-white w-full max-w-md h-full flex flex-col shadow-2xl">
            <div className="p-6 border-b border-zinc-200 flex items-center justify-between">
              <h2 className="text-xs tracking-[0.25em] uppercase font-bold">Your Bag ({cartCount})</h2>
              <button onClick={() => setLocalCartOpen(false)} className="text-zinc-500 hover:text-black p-1 text-lg">✕</button>
            </div>

            <div className="flex-1 overflow-y-auto p-6 space-y-5">
              {cart.length === 0 ? (
                <p className="text-center text-zinc-400 uppercase tracking-widest text-[10px] py-20">Your bag is empty.</p>
              ) : (
                cart.map((item, idx) => (
                  <div key={`${item.id}-${idx}`} className="flex gap-4 border-b border-zinc-100 pb-4">
                    <img src={item.image} alt={item.name} className="w-16 h-20 object-cover bg-zinc-50 border border-zinc-200 shrink-0" />
                    <div className="flex-1">
                      <h4 className="text-[10px] uppercase tracking-wider font-medium text-black">{item.name}</h4>
                      {item.size && <p className="text-[9px] text-zinc-400 uppercase mt-1">Size: {item.size}</p>}
                      <p className="text-[10px] font-mono text-black mt-1">{formatPrice(item.price)} × {item.quantity || 1}</p>
                    </div>
                    {typeof removeFromCart === 'function' && (
                      <button onClick={() => removeFromCart(item.id, item.size)} className="text-[9px] text-zinc-400 hover:text-red-600 uppercase self-start">Remove</button>
                    )}
                  </div>
                ))
              )}
            </div>

            {cart.length > 0 && (
              <div className="p-6 border-t border-zinc-200 bg-zinc-50 space-y-4">
                <div className="flex justify-between text-xs font-bold uppercase tracking-widest">
                  <span>Subtotal</span>
                  <span>{formatPrice(cartTotal)}</span>
                </div>
                <button
                  type="button"
                  onClick={() => setShowDeliveryNotice(true)}
                  className="block w-full text-center bg-black text-white py-4 text-[10px] tracking-[0.25em] uppercase font-bold hover:bg-zinc-800 transition-colors cursor-pointer"
                >
                  Proceed to Checkout
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* BRANDED DELIVERY TIMELINE MODAL */}
      {showDeliveryNotice && (
        <div
          className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[99999999] flex items-center justify-center p-4"
          onClick={(e) => { if (e.target === e.currentTarget) setShowDeliveryNotice(false); }}
        >
          <div className="bg-white border border-zinc-200 w-full max-w-md p-8 sm:p-10 text-center shadow-2xl rounded-sm">
            <p className="text-[8px] tracking-[0.35em] uppercase text-zinc-400 mb-3">
              S. SIKAMÒRE • CLIENT ADVISORY
            </p>
            <h3 className="text-sm sm:text-base font-serif tracking-[0.25em] uppercase text-black mb-4">
              Delivery Notice
            </h3>
            <div className="w-8 h-[1px] bg-black mx-auto mb-5"></div>
            <p className="text-[11px] text-zinc-600 leading-relaxed tracking-wide mb-8">
              Please note that select pieces are handcrafted to order and require <strong className="text-black">1–2 weeks</strong> for preparation and dispatch before delivery.
            </p>
            <div className="flex flex-col gap-3">
              <Link
                href="/checkout"
                onClick={() => { setShowDeliveryNotice(false); setLocalCartOpen(false); }}
                className="w-full bg-black text-white py-3.5 text-[9px] tracking-[0.25em] uppercase font-bold hover:bg-zinc-800 transition-colors block"
              >
                Okay, Proceed to Payment
              </Link>
              <button
                type="button"
                onClick={() => setShowDeliveryNotice(false)}
                className="w-full bg-white text-zinc-500 border border-zinc-200 py-3 text-[9px] tracking-[0.25em] uppercase hover:text-black hover:border-black transition-colors"
              >
                Go Back
              </button>
            </div>
          </div>
        </div>
      )}

      {/* QUICK VIEW MODAL */}
      {quickViewProduct && (
        <div
          className="fixed inset-0 bg-black/95 flex items-center justify-center p-4 sm:p-6 z-[9999999]"
          onClick={(e) => { if (e.target === e.currentTarget) setQuickViewProduct(null); }}
        >
          <div className="bg-white w-full max-w-4xl max-h-[90vh] rounded-sm shadow-2xl relative flex flex-col overflow-hidden">
            <button
              onClick={() => setQuickViewProduct(null)}
              className="absolute top-4 right-4 z-[100] bg-white shadow-md p-2 rounded-full text-zinc-500 hover:text-black border border-zinc-200"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12"/></svg>
            </button>

            <div className="flex-1 overflow-y-auto flex flex-col md:flex-row h-full w-full">
              <div
                className="w-full md:w-1/2 bg-zinc-50 shrink-0 aspect-[3/4] relative overflow-hidden group touch-pan-y"
                onTouchStart={onTouchStart}
                onTouchMove={onTouchMove}
                onTouchEnd={onTouchEnd}
              >
                <div className="w-full h-full relative flex items-center justify-center">
                  {extractCleanUrls(quickViewProduct.image)[quickViewImgIndex] && (
                    <img
                      src={extractCleanUrls(quickViewProduct.image)[quickViewImgIndex]}
                      alt={`${quickViewProduct.name} - Angle ${quickViewImgIndex + 1}`}
                      className="absolute inset-0 w-full h-full object-cover"
                    />
                  )}
                </div>

                {extractCleanUrls(quickViewProduct.image).length > 1 && (
                  <>
                    <div className="absolute inset-x-0 top-1/2 -translate-y-1/2 flex justify-between px-4 z-20">
                      <button type="button" onClick={(e) => { e.preventDefault(); e.stopPropagation(); const arr = extractCleanUrls(quickViewProduct.image); setQuickViewImgIndex(prev => (prev - 1 + arr.length) % arr.length); }} className="w-10 h-10 bg-white text-black flex items-center justify-center rounded-full shadow-2xl"><svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7"/></svg></button>
                      <button type="button" onClick={(e) => { e.preventDefault(); e.stopPropagation(); const arr = extractCleanUrls(quickViewProduct.image); setQuickViewImgIndex(prev => (prev + 1) % arr.length); }} className="w-10 h-10 bg-white text-black flex items-center justify-center rounded-full shadow-2xl"><svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7"/></svg></button>
                    </div>
                    <div className="absolute bottom-5 left-1/2 -translate-x-1/2 flex gap-2 z-30 bg-black/20 px-3 py-1.5 rounded-full">
                      {extractCleanUrls(quickViewProduct.image).map((_, idx) => (
                        <button key={idx} type="button" onClick={(e) => { e.stopPropagation(); setQuickViewImgIndex(idx); }} className={`w-2 h-2 rounded-full transition-all ${idx === quickViewImgIndex ? 'bg-white scale-125' : 'bg-white/40'}`} />
                      ))}
                    </div>
                  </>
                )}
              </div>

              <div className="w-full md:w-1/2 p-6 sm:p-10 flex flex-col justify-start bg-white">
                <div className="flex justify-between items-start mb-1">
                  <h2 className="text-base font-normal tracking-[0.2em] uppercase font-serif pr-4 text-black">{quickViewProduct.name}</h2>
                  <button onClick={(e) => handleWishlistClick(e, quickViewProduct)} className="text-black hover:scale-110 transition-transform">
                    <svg className="w-5 h-5" fill={wishlist.some(w => w.id === quickViewProduct.id) ? "#D31313" : "none"} stroke={wishlist.some(w => w.id === quickViewProduct.id) ? "#D31313" : "currentColor"} strokeWidth="1.5" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12z" /></svg>
                  </button>
                </div>
                <p className="text-xs tracking-widest font-medium mb-1 text-zinc-500">{formatPrice(quickViewProduct.price)}</p>
                {!quickViewProduct.is_sold_out && quickViewProduct.stock_quantity > 0 && (
                  <p className="text-[9px] tracking-[0.15em] uppercase text-[#D31313] font-medium mb-5">
                    Only {quickViewProduct.stock_quantity} left
                  </p>
                )}

                <div className="mb-5">
                  <span className="text-[8px] tracking-widest uppercase text-zinc-400 block mb-2">Choose your perfect size</span>
                  <div className="flex gap-2">
                    {['S', 'M', 'L'].map(s => (
                      <button key={s} onClick={() => setSelectedSize(s)} className={`w-8 h-8 flex items-center justify-center text-[10px] border transition-colors ${selectedSize === s ? 'border-black bg-black text-white' : 'border-zinc-200 text-black hover:border-black'}`}>{s}</button>
                    ))}
                  </div>
                </div>

                <div className="flex items-center gap-4 mb-6">
                  <div className="flex items-center border border-zinc-200 bg-white">
                    <button onClick={() => setQty(Math.max(1, qty - 1))} className="w-8 h-8 flex items-center justify-center text-zinc-400 hover:text-black">-</button>
                    <span className="w-8 text-center text-xs font-mono text-black">{qty}</span>
                    <button onClick={() => setQty(qty + 1)} className="w-8 h-8 flex items-center justify-center text-zinc-400 hover:text-black">+</button>
                  </div>
                </div>

                <button onClick={(e) => { handleAddToCart(e, quickViewProduct, qty, selectedSize); setQuickViewProduct(null); }} className="w-full bg-black text-white py-3 text-[9px] tracking-[0.2em] uppercase hover:bg-zinc-800 transition-colors font-medium mb-4">
                  Add to Cart • {formatPrice(quickViewProduct.price * qty)}
                </button>

                <div className="mt-8 border-t border-zinc-200">
                  {productTabs.map((tab) => (
                    <div key={tab.id} className="border-b border-zinc-200">
                      <button onClick={() => toggleAccordion(tab.id)} className="w-full py-4 flex justify-between items-center text-[9px] tracking-[0.2em] uppercase text-black hover:text-zinc-500 transition-colors">
                        {tab.title}
                        <svg className={`w-3 h-3 transition-transform duration-300 ${openAccordion === tab.id ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" /></svg>
                      </button>
                      <div className={`overflow-hidden transition-all duration-300 ease-in-out ${openAccordion === tab.id ? 'max-h-96 opacity-100 mb-4' : 'max-h-0 opacity-0'}`}>
                        <p className="text-[10px] text-zinc-500 leading-relaxed font-light whitespace-pre-wrap">{tab.content}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
