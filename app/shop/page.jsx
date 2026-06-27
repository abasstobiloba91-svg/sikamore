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

const exchangeRates = { NGN: 1, USD: 1 / 1360, GBP: 1 / 1820, EUR: 1 / 1570 };
const currencySymbols = { NGN: '₦', USD: '$', GBP: '£', EUR: '€' };

const ATELIER_LONG = 3.4215;
const ATELIER_LAT = 6.4281;

// THE NATIVE ARRAY EXTRACTOR: Reads the Supabase text[] column directly!
const extractCleanUrls = (payload) => {
  if (!payload) return [];
  
  // 1. If Supabase hands us a native Array (which text[] does), just use it!
  if (Array.isArray(payload)) {
    return payload.filter(url => typeof url === 'string' && url.includes('http'));
  }
  
  // 2. Fallback just in case there are any legacy string entries
  if (typeof payload === 'string') {
    try {
      if (payload.startsWith('[') && payload.endsWith(']')) {
        const parsed = JSON.parse(payload);
        if (Array.isArray(parsed)) return parsed.filter(url => typeof url === 'string' && url.includes('http'));
      }
    } catch(e) {}
    const matches = payload.match(/https?:\/\/[^\s"'\[\]{}]+/gi);
    return matches || [];
  }
  
  return [];
};

const getPrimaryImage = (imgPayload) => {
  const urls = extractCleanUrls(imgPayload);
  return urls.length > 0 ? urls : '';
};

export default function ShopCatalog() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [userSession, setUserSession] = useState(null);
  const [currency, setCurrency] = useState('NGN');

  const [detectedCountryCode, setDetectedCountryCode] = useState('NG');
  const [detectedCountryName, setDetectedCountryName] = useState('Nigeria');
  const [isEuropeanUser, setIsEuropeanUser] = useState(false);

  const [viewCols, setViewCols] = useState(4); 
  const [isListView, setIsListView] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  
  const [quickViewProduct, setQuickViewProduct] = useState(null);
  const [openAccordion, setOpenAccordion] = useState('description');
  const [quickViewImgIndex, setQuickViewImgIndex] = useState(0);
  const [touchStart, setTouchStart] = useState(null);
  const [touchEnd, setTouchEnd] = useState(null);
  
  const [showNewsletter, setShowNewsletter] = useState(false);
  const [subscriberEmail, setSubscriberEmail] = useState('');
  const [submittingEmail, setSubmittingEmail] = useState(false);

  const [deliveryAddress, setDeliveryAddress] = useState('');
  const [isCalculating, setIsCalculating] = useState(false);
  const [deliveryFee, setDeliveryFee] = useState(0);
  const [deliveryZone, setDeliveryZone] = useState('');
  const [tickerIndex, setTickerIndex] = useState(0);

  const announcements = [
    "JOIN OUR CIRCLE TO RECEIVE AMAZING UPDATES",
    "DISCOVER OUR LATEST COLLECTION OF EFFORTLESS LUXURY",
    "BEAUTIFULLY CRAFTED SILHOUETTES • DESIGNED FOR YOU",
  ];

  const appContext = useApp() || {};
  const cart = appContext.cart || [];
  const wishlist = appContext.wishlist || [];
  const toggleWishlist = appContext.toggleWishlist || (() => {});
  const addToCart = appContext.addToCart || (() => {});
  const removeFromCart = appContext.removeFromCart || (() => {});
  const isCartOpen = appContext.isCartOpen || false;
  const setIsCartOpen = appContext.setIsCartOpen || (() => {});
  const showToast = appContext.showToast || ((msg) => console.log(msg));

  const [selectedSize, setSelectedSize] = useState('M');
  const [qty, setQty] = useState(1);

  const formatPrice = (ngnPrice, isShipping = false) => {
    if (ngnPrice === undefined || ngnPrice === null) return '';
    const rate = exchangeRates[currency] || 1;
    const markupRate = (detectedCountryCode === 'NG' || isShipping) ? 1.0 : 1.5;
    const converted = Number(ngnPrice) * markupRate * rate;
    if (isNaN(converted)) return '';
    if (currency === 'NGN') return `₦${Math.round(converted).toLocaleString()}`;
    return `${currencySymbols[currency] || '$'}${converted.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  const getDisplayTotal = () => {
    const markupRate = detectedCountryCode === 'NG' ? 1.0 : 1.5;
    const productsConverted = cartSubtotal * markupRate * (exchangeRates[currency] || 1);
    const shippingConverted = deliveryFee * 1.0 * (exchangeRates[currency] || 1);
    const combinedTotal = productsConverted + shippingConverted;
    if (currency === 'NGN') return `₦${Math.round(combinedTotal).toLocaleString()}`;
    return `${currencySymbols[currency] || '$'}${combinedTotal.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  useEffect(() => {
    async function locateClientNetwork() {
      try {
        const res = await fetch('https://ipapi.co/json/');
        const data = await res.json();
        if (data && data.country_code) {
          setDetectedCountryCode(data.country_code);
          setDetectedCountryName(data.country_name);
          const checkEurope = data.in_eu || ['FR', 'DE', 'IT', 'ES', 'NL', 'GB'].includes(data.country_code);
          setIsEuropeanUser(checkEurope);
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
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) setUserSession(session.user);
      else {
        const localUser = localStorage.getItem('sikamore_user_profile');
        if (localUser) setUserSession(JSON.parse(localUser)); 
      }
    });
  }, []);

  useEffect(() => {
    if (!searchQuery.trim()) {
      setSearchResults(products);
      return;
    }
    const lowerQ = searchQuery.toLowerCase();
    setSearchResults(
      products.filter(p => {
        const n = p.name ? p.name.toLowerCase() : '';
        const d = p.description ? p.description.toLowerCase() : '';
        return n.includes(lowerQ) || d.includes(lowerQ);
      })
    );
  }, [searchQuery, products]);

  useEffect(() => {
    supabase.from('page_analytics').insert([{ event_type: 'visit', page_path: '/shop' }]).then(() => {}).catch(() => {});
  }, []);

  useEffect(() => {
    async function fetchProducts() {
      const { data } = await supabase.from('products').select('*').order('created_at', { ascending: false });
      if (data) {
        setProducts(data);
        setSearchResults(data);
      }
      setLoading(false);
    }
    fetchProducts();
  }, []);

  useEffect(() => {
    const tickerTimer = setInterval(() => setTickerIndex((prev) => (prev + 1) % announcements.length), 5000);
    return () => clearInterval(tickerTimer);
  }, [announcements.length]);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const hasSignedNewsletter = sessionStorage.getItem('sikamore_newsletter');
      if (!hasSignedNewsletter) {
        const timer = setTimeout(() => setShowNewsletter(true), 4000);
        return () => clearTimeout(timer);
      }
    }
  }, []);

  const cartSubtotal = cart ? cart.reduce((total, item) => total + (Number(item.price || 0) * Number(item.quantity || 1)), 0) : 0;
  const cartItemCount = cart ? cart.reduce((acc, curr) => acc + curr.quantity, 0) : 0;

  const openQuickView = (product) => {
    if (!product) return;
    setQty(1);
    setSelectedSize('M');
    setOpenAccordion('description');
    setQuickViewImgIndex(0); 
    setQuickViewProduct(product);
  };

  const minSwipeDistance = 30;
  const onTouchStart = (e) => {
    setTouchEnd(null);
    setTouchStart(e.targetTouches.clientX);
  };
  const onTouchMove = (e) => setTouchEnd(e.targetTouches.clientX);
  const onTouchEnd = () => {
    if (!touchStart || !touchEnd) return;
    const distance = touchStart - touchEnd;
    const images = quickViewProduct ? extractCleanUrls(quickViewProduct.image) : [];
    
    if (images.length <= 1) return;

    if (distance > minSwipeDistance) {
      setQuickViewImgIndex((prev) => (prev + 1) % images.length);
    } else if (distance < -minSwipeDistance) {
      setQuickViewImgIndex((prev) => (prev - 1 + images.length) % images.length);
    }
    setTouchStart(null);
    setTouchEnd(null);
  };

  const handleAddToCart = (e, product, overrideQty = 1, overrideSize = 'M') => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    
    const cartItemPayload = {
      id: String(product.id),
      name: String(product.name || ''),
      price: Number(product.price || 0),
      image: getPrimaryImage(product.image),
      is_sold_out: Boolean(product.is_sold_out)
    };

    try {
      addToCart(cartItemPayload, overrideQty, overrideSize); 
      setIsCartOpen(false); 
      showToast('Added to your bag.');
    } catch (err) {
      console.error(err);
      showToast('Error adding to bag.');
    }
  };

  const handleWishlistClick = (e, product) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    
    const wishlistPayload = {
      id: String(product.id),
      name: String(product.name || ''),
      price: Number(product.price || 0),
      image: getPrimaryImage(product.image),
      is_sold_out: Boolean(product.is_sold_out)
    };

    toggleWishlist(wishlistPayload);
  };

  const handlePopupSubscription = async (e) => {
    e.preventDefault();
    if (!subscriberEmail.trim()) return;
    setSubmittingEmail(true);
    try {
      const { error } = await supabase.from('subscribers').insert([{ email: subscriberEmail.toLowerCase().trim() }]);
      if (error && error.code !== '23505') throw error;
      showToast('Thank you for joining our community.');
      setShowNewsletter(false);
      sessionStorage.setItem('sikamore_newsletter', 'true');
    } catch (err) {
      showToast(`Oops, there was an issue: ${err.message}`);
    } finally {
      setSubmittingEmail(false);
    }
  };

  const calculateLiveDelivery = async () => {
    if (!deliveryAddress.trim()) return showToast("PLEASE ENTER YOUR NEAREST BUS STOP OR LANDMARK.");
    setIsCalculating(true);
    try {
      let finalFee = 0;
      let zoneLabel = "";
      let autoCurrency = detectedCountryCode === 'NG' ? 'NGN' : 'USD';

      if (detectedCountryCode !== 'NG') {
        const internationalBaseFee = 55 / exchangeRates['USD']; 
        finalFee = internationalBaseFee; 
        zoneLabel = `International Delivery (${detectedCountryName})`;
        if (detectedCountryCode === 'GB') autoCurrency = 'GBP';
        else if (isEuropeanUser) autoCurrency = 'EUR';
        
        setDeliveryFee(finalFee);
        setDeliveryZone(zoneLabel);
        if (autoCurrency !== currency) setCurrency(autoCurrency);
        setIsCalculating(false);
        showToast(`Dispatch Logged: ${zoneLabel}`);
        return;
      }

      showToast("SCANNING HIGHWAY NETWORKS...");
      const geoUrl = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(deliveryAddress)}&format=json&countrycodes=ng&limit=1`;
      const geoRes = await fetch(geoUrl, { headers: { 'User-Agent': 'Sikamore-Shop-App' } });
      const geoData = await geoRes.json();
      
      if (!geoData || geoData.length === 0) throw new Error("ROUTE NOT RECOGNIZED. PLEASE ENTER YOUR NEAREST WELL-KNOWN BUS STOP OR STREET LANDMARK.");

      const destLon = parseFloat(geoData.lon);
      const destLat = parseFloat(geoData.lat);
      const placeName = geoData.display_name;

      const routeUrl = `https://router.project-osrm.org/route/v1/driving/${ATELIER_LONG},${ATELIER_LAT};${destLon},${destLat}?overview=false`;
      const routeRes = await fetch(routeUrl);
      const routeData = await routeRes.json();

      if (!routeData.routes || routeData.routes.length === 0) throw new Error("No navigable roadways found to this destination.");

      const distanceKm = routeData.routes.distance / 1000; 
      const durationMins = routeData.routes.duration / 60; 

      const BASE_FARE = 2500; 
      const PRICE_PER_KM = 180; 
      const PRICE_PER_MINUTE = 60; 
      
      finalFee = BASE_FARE + (distanceKm * PRICE_PER_KM) + (durationMins * PRICE_PER_MINUTE);

      if (distanceKm < 30) {
        zoneLabel = `Lagos Dispatch (${Math.round(distanceKm)}km | ~${Math.round(durationMins)} mins)`;
      } else {
        zoneLabel = `Regional Freight Delivery (${Math.round(distanceKm)}km | ~${Math.round(durationMins / 60)} hrs)`;
      }

      setDeliveryAddress(placeName); 
      setDeliveryFee(Math.round(finalFee));
      setDeliveryZone(zoneLabel);
      if (autoCurrency !== currency) setCurrency(autoCurrency);

      showToast(`Route Calculated: ${Math.round(distanceKm)}km layout validated.`);

    } catch (err) {
      showToast(err.message || "LOCATION NOT FOUND. SPECIFY YOUR NEAREST BUS STOP OR LANDMARK.");
      setDeliveryFee(0);
      setDeliveryZone('');
    } finally {
      setIsCalculating(false);
    }
  };

  const toggleAccordion = (tabId) => {
    setOpenAccordion(openAccordion === tabId ? '' : tabId);
  };

  const productTabs = [
    { id: 'description', title: 'The Details', content: quickViewProduct?.description || "A beautifully detailed silhouette crafted to elevate your everyday wardrobe with effortless grace." },
    { id: 'additional', title: 'Additional Info', content: quickViewProduct?.additional_information || "Designed in our atelier. We recommend dry cleaning to preserve the integrity of the fabrics and true-to-size fit." },
    { id: 'policies', title: 'Store Policies', content: quickViewProduct?.store_policies || "We offer complimentary worldwide shipping on all orders. Returns are seamlessly accepted within 14 days of delivery." },
    { id: 'inquiries', title: 'Inquiries', content: quickViewProduct?.inquiries || "Questions about styling or fit? Our Client Advisory team is here for you. Reach out through the Support tab on your dashboard." }
  ];

  return (
    <div className="min-h-screen bg-white text-black font-sans antialiased text-[11px] pb-0 relative">
      
      <div className="w-full bg-[#0A0A0A] text-white h-9 overflow-hidden border-b border-zinc-900 relative z-">
        <div className="transition-transform duration-700 cubic-bezier(0.25, 1, 0.5, 1) h-full w-full" style={{ transform: `translateY(-${tickerIndex * 100}%)` }}>
          {announcements.map((text, idx) => (
            <div key={idx} className="h-full w-full flex items-center justify-center text-[7.5px] sm:text-[9px] tracking-[0.15em] sm:tracking-[0.3em] uppercase font-light text-zinc-300 px-4 text-center select-none truncate">
              {text}
            </div>
          ))}
        </div>
      </div>

      <header className="bg-white text-black border-b border-zinc-200 sticky top-0 z-">
        <div className="max-w-[1600px] mx-auto px-4 sm:px-8 h-20 sm:h-24 flex items-center justify-between">
          <div className="flex-1 flex items-center justify-start gap-4">
            <button onClick={() => setIsMenuOpen(true)} className="hover:text-zinc-500 transition-colors py-2">
              <svg className="w-[14px] h-[14px] sm:w-5 sm:h-5" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" /></svg>
            </button>
            <button onClick={() => setIsSearchOpen(true)} className="hover:text-zinc-500 transition-colors p-1">
              <svg className="w-[14px] h-[14px] sm:w-5 sm:h-5" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" /></svg>
            </button>
            <Link href="/admin" className="tracking-[0.2em] text-zinc-500 hover:text-black uppercase text-[9px] sm:text-[10px] hidden sm:inline-block ml-2">Atelier</Link>
          </div>
          
          <div className="flex-none flex items-center justify-center">
            <Link href="/" className="text-[15px] sm:text-xl font-bold tracking-[0.3em] sm:tracking-[0.4em] uppercase font-serif text-center text-black pl-[0.3em] whitespace-nowrap">S. SIKAMÒRE</Link>
          </div>
          
          <div className="flex-1 flex items-center justify-end gap-3 sm:gap-6">
            <select value={currency} onChange={(e) => setCurrency(e.target.value)} className="bg-transparent border-0 outline-none text-[9px] sm:text-[10px] font-bold tracking-[0.2em] cursor-pointer text-zinc-500 hover:text-black hidden sm:inline-block">
              <option value="NGN">NGN ₦</option>
              <option value="USD">USD $</option>
              {isEuropeanUser && <option value="GBP">GBP £</option>}
              {isEuropeanUser && <option value="EUR">EUR €</option>}
            </select>

            <Link href="/dashboard?tab=wishlist" className="relative hover:text-zinc-500 transition-colors p-1 flex items-center">
              <svg className="w-[14px] h-[14px] sm:w-5 sm:h-5" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12z" /></svg>
              {wishlist.length > 0 && <span className="absolute -top-1 -right-1.5 w-3.5 h-3.5 bg-[#D31313] text-white flex items-center justify-center rounded-full text-[7.5px] font-bold">{wishlist.length}</span>}
            </Link>

            <button onClick={() => setIsCartOpen(true)} className="relative hover:text-zinc-500 transition-colors p-1 flex items-center">
              <svg className="w-[14px] h-[14px] sm:w-5 sm:h-5" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M15.75 10.5V6a3.75 3.75 0 10-7.5 0v4.5m11.356-1.993l1.263 12c.07.665-.45 1.243-1.119 1.243H4.25a1.125 1.125 0 01-1.12-1.243l1.264-12A1.125 1.125 0 015.513 7.5h12.974c.576 0 1.059.435 1.119 1.007z" /></svg>
              {cartItemCount > 0 && <span className="absolute -top-1 -right-1.5 w-3.5 h-3.5 bg-black text-white flex items-center justify-center rounded-full text-[7.5px] font-bold">{cartItemCount}</span>}
            </button>
          </div>
        </div>
      </header>

      <section className="bg-white border-b border-zinc-200 relative z-">
        <div className="max-w-[1600px] mx-auto px-4 sm:px-8 py-3.5 flex items-center justify-between">
          <button className="flex items-center gap-2 border border-zinc-200 px-3.5 py-1.5 text-[9px] uppercase tracking-wider hover:border-black hover:bg-black hover:text-white transition-colors">Refine</button>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5 md:hidden">
              <button onClick={() => setIsListView(true)} className={`p-1.5 border transition-all ${isListView ? 'border-black bg-black text-white' : 'border-zinc-200 text-zinc-500'}`}><svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" /></svg></button>
              <button onClick={() => setIsListView(false)} className={`p-1.5 border transition-all ${!isListView ? 'border-black bg-black text-white' : 'border-zinc-200 text-zinc-500'}`}><svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 24 24"><rect width="9" height="9" x="2" y="2" rx="1"/><rect width="9" height="9" x="13" y="2" rx="1"/><rect width="9" height="9" x="2" y="13" rx="1"/><rect width="9" height="9" x="13" y="13" rx="1"/></svg></button>
            </div>
            <div className="hidden md:flex items-center gap-2">
              <button onClick={() => { setViewCols(2); setIsListView(false); }} className={`flex gap-[3px] p-2 border transition-all ${viewCols === 2 && !isListView ? 'border-black bg-black text-white' : 'border-zinc-200 text-zinc-400'}`}><svg className="w-[14px] h-[14px]" fill="currentColor" viewBox="0 0 16 16"><rect width="6" height="14" x="1" y="1"/><rect width="6" height="14" x="9" y="1"/></svg></button>
              <button onClick={() => { setViewCols(3); setIsListView(false); }} className={`flex gap-[3px] p-2 border transition-all ${viewCols === 3 && !isListView ? 'border-black bg-black text-white' : 'border-zinc-200 text-zinc-400'}`}><svg className="w-[18px] h-[14px]" fill="currentColor" viewBox="0 0 20 16"><rect width="5" height="14" x="1" y="1"/><rect width="5" height="14" x="7" y="1"/><rect width="5" height="14" x="13" y="1"/></svg></button>
              <button onClick={() => { setViewCols(4); setIsListView(false); }} className={`flex gap-[2px] p-2 border transition-all ${viewCols === 4 && !isListView ? 'border-black bg-black text-white' : 'border-zinc-200 text-zinc-400'}`}><svg className="w-[22px] h-14" fill="currentColor" viewBox="0 0 24 16"><rect width="4" height="14" x="1" y="1"/><rect width="4" height="14" x="6" y="1"/><rect width="4" height="14" x="11" y="1"/><rect width="4" height="14" x="16" y="1"/></svg></button>
            </div>
          </div>
        </div>
      </section>

      <main className="max-w-[1600px] mx-auto px-4 sm:px-8 py-6 sm:py-16 bg-white relative z- pb-32">
        {loading ? (
          <div className="text-center py-32 tracking-[0.3em] text-zinc-500 uppercase text-[9px]">Preparing the Collection for You...</div>
        ) : (
          <div className={"grid gap-x-4 sm:gap-x-6 gap-y-8 sm:gap-y-12 " + (isListView ? "grid-cols-1 gap-y-6 max-w-xl mx-auto" : viewCols === 2 ? "grid-cols-2 md:grid-cols-2" : viewCols === 3 ? "grid-cols-2 md:grid-cols-3" : "grid-cols-2 md:grid-cols-3 lg:grid-cols-4")}>
            {searchResults.map((product) => {
              const inWishlist = wishlist.some(w => w.id === product.id);
              const gridPrimaryImage = getPrimaryImage(product.image);

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
                      <div className="absolute inset-0 bg-zinc-100 flex items-center justify-center text-[8px] tracking-widest text-zinc-400 uppercase">Awaiting Curation</div>
                    )}
                    
                    <button type="button" onClick={(e) => handleWishlistClick(e, product)} className="absolute top-3 right-3 z-30 pointer-events-auto p-2 text-black hover:scale-110 active:scale-95 transition-transform">
                      <svg className="w-5 h-5 pointer-events-none" fill={inWishlist ? "#D31313" : "none"} stroke={inWishlist ? "#D31313" : "currentColor"} strokeWidth="1.5" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12z" /></svg>
                    </button>

                    <div className="absolute inset-x-0 bottom-6 opacity-0 lg:group-hover:opacity-100 transition-opacity duration-300 hidden lg:flex flex-col items-center gap-2 z-30 pointer-events-none">
                      <button type="button" onClick={(e) => handleAddToCart(e, product)} disabled={product.is_sold_out} className={`pointer-events-auto flex items-center justify-center bg-black text-white h-8 w-32 rounded-sm text-[9px] uppercase tracking-widest hover:bg-zinc-800 active:scale-95 transition-all shadow-lg ${product.is_sold_out ? 'opacity-50 cursor-not-allowed' : ''}`}>Add to Cart</button>
                      <button type="button" onClick={(e) => { e.stopPropagation(); openQuickView(product); }} className="pointer-events-auto flex items-center justify-center bg-white border border-zinc-200 text-black h-8 w-32 rounded-sm text-[9px] uppercase tracking-widest hover:bg-zinc-100 active:scale-95 transition-all shadow-lg">View Product</button>
                    </div>

                    {product.is_sold_out && (
                      <div className="absolute inset-0 bg-white/60 flex items-center justify-center pointer-events-none z-20"><div className="w-14 h-14 rounded-full bg-white border border-zinc-200 flex items-center justify-center"><span className="text-[8px] tracking-[0.15em] uppercase text-zinc-400">Sold Out</span></div></div>
                    )}
                  </div>

                  <div className="flex flex-col gap-1 mt-4 text-left px-1">
                    <h3 className="text-[10px] sm:text-[11px] tracking-[0.15em] uppercase text-zinc-800 truncate">{product.name}</h3>
                    <p className="text-[11px] sm:text-[13px] tracking-widest text-black font-medium">{formatPrice(product.price)}</p>
                    <div className="flex lg:hidden flex-col gap-2 mt-3 w-full">
                      <button type="button" onClick={(e) => handleAddToCart(e, product)} disabled={product.is_sold_out} className={`w-full bg-black text-white py-2.5 text-[8px] uppercase tracking-[0.2em] font-medium transition-colors ${product.is_sold_out ? 'opacity-50 cursor-not-allowed' : ''}`}>Add to Cart</button>
                      <button type="button" onClick={(e) => { e.stopPropagation(); openQuickView(product); }} className="w-full bg-white text-black border border-zinc-200 py-2.5 text-[8px] uppercase tracking-[0.2em] font-medium active:bg-zinc-50 transition-colors">View Product</button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>

      <footer className="border-t border-zinc-200 bg-white pt-16 pb-12 mt-16 sm:mt-20 text-black relative z-">
        <div className="max-w-[1600px] mx-auto px-4 sm:px-8 mb-12 text-center border-b border-zinc-100 pb-12">
          <h2 className="text-xl sm:text-3xl tracking-[0.5em] uppercase font-normal text-black pl-[0.5em] select-none font-serif font-bold">
            S. SIKAMÒRE
          </h2>
        </div>
        <div className="max-w-[1600px] mx-auto px-4 sm:px-8 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-10 sm:gap-12 text-zinc-500 font-light tracking-widest">
          <div className="flex flex-col gap-3">
            <h4 className="text-black text-[10px] tracking-[0.2em] font-medium uppercase">About Our Atelier</h4>
            <p className="leading-relaxed text-[10px] text-zinc-400">Thoughtfully curated ready-to-wear luxury, designed to bring effortless elegance to your everyday life.</p>
            <p className="text-[9px] text-zinc-600 pt-1">Email: hello@ssikamore.com</p>
          </div>
          <div className="flex flex-col gap-2.5 text-[10px]">
            <h4 className="text-black text-[10px] tracking-[0.2em] font-medium uppercase mb-1">Here to Help</h4>
            <Link href="/contact" className="hover:text-black cursor-pointer transition-colors">Contact Us</Link>
            <Link href="/about" className="hover:text-black cursor-pointer transition-colors">About Us</Link>
            <span className="hover:text-black cursor-pointer transition-colors">Privacy Policy</span>
            <span className="hover:text-black cursor-pointer transition-colors">Terms & Conditions</span>
          </div>
          <div className="flex flex-col gap-2.5 text-[10px]">
            <h4 className="text-black text-[10px] tracking-[0.2em] font-medium uppercase mb-1">Explore</h4>
            <span className="hover:text-black cursor-pointer transition-colors">Dresses</span>
            <span className="hover:text-black cursor-pointer transition-colors">Bottoms</span>
            <span className="hover:text-black cursor-pointer transition-colors">Tops</span>
            <span className="hover:text-black cursor-pointer transition-colors">Blazers</span>
          </div>
          <div className="flex flex-col gap-3">
            <h4 className="text-black text-[10px] tracking-[0.2em] font-medium uppercase">Join Our Circle</h4>
            <p className="text-[10px] text-zinc-400 leading-relaxed">Sign up to receive styling inspiration, exclusive access to new arrivals, and a warm welcome to our community.</p>
            <form onSubmit={async (e) => { e.preventDefault(); showToast('Email submitted.'); }} className="flex border-b border-zinc-200 py-1.5 mt-1">
              <input type="email" placeholder="Enter your email" required className="w-full bg-transparent border-0 outline-none placeholder-zinc-300 text-base md:text-[10px] text-black tracking-widest uppercase font-light" />
              <button type="submit" className="text-[9px] font-medium tracking-widest text-black uppercase hover:text-zinc-500 transition-colors">Join Us</button>
            </form>
          </div>
        </div>
      </footer>

      {/* 1. NEWSLETTER POPUP */}
      {showNewsletter && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in" style={{ zIndex: 9999999 }}>
          <div className="bg-white text-black max-w-4xl w-full flex flex-col md:flex-row relative shadow-2xl overflow-hidden">
            <button onClick={() => { setShowNewsletter(false); sessionStorage.setItem('sikamore_newsletter', 'true'); }} className="absolute top-4 right-4 z-10 text-zinc-400 hover:text-black bg-white/80 p-1.5 rounded-full shadow-sm transition-colors">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12"/></svg>
            </button>
            <div className="w-full md:w-1/2 h-56 md:h-auto bg-zinc-100 relative shrink-0">
              <img src={products.length > 0 ? getPrimaryImage(products.image) : ''} alt="Join the Community" className="w-full h-full object-cover" />
            </div>
            <div className="w-full md:w-1/2 p-8 md:p-14 flex flex-col justify-center text-center bg-white">
              <div className="animate-fade-in">
                <h2 className="text-xl md:text-2xl font-normal tracking-[0.2em] uppercase font-serif mb-4">Join Our Circle</h2>
                <p className="text-[10px] tracking-widest text-zinc-500 uppercase leading-relaxed mb-8">Stay up to date with new arrivals and get exclusive offers delivered directly to your inbox first.</p>
                <form onSubmit={handlePopupSubscription} className="space-y-4">
                  <input type="email" value={subscriberEmail} onChange={(e) => setSubscriberEmail(e.target.value)} placeholder="ENTER YOUR EMAIL" required className="w-full bg-white p-4 border border-zinc-300 focus:border-black outline-none text-base md:text-xs uppercase tracking-widest text-center" />
                  <button type="submit" disabled={submittingEmail} className="w-full bg-black text-white py-4 text-[10px] tracking-[0.2em] uppercase hover:bg-zinc-800 transition-colors font-medium disabled:opacity-50">{submittingEmail ? 'JOINING...' : 'JOIN NOW'}</button>
                </form>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 2. SWIPEABLE QUICK VIEW MODAL */}
      {quickViewProduct && (
        <div className="fixed inset-0 bg-black/95 flex items-center justify-center p-4 sm:p-6 animate-fade-in" style={{ zIndex: 9999999 }}>
          <div className="bg-white w-full max-w-4xl max-h-[90vh] rounded-sm shadow-2xl relative flex flex-col overflow-hidden">
            <button onClick={() => setQuickViewProduct(null)} className="absolute top-4 right-4 z-50 bg-white/90 shadow-md p-2 rounded-full text-zinc-400 hover:text-black">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12"/></svg>
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
                      key={extractCleanUrls(quickViewProduct.image)[quickViewImgIndex]} 
                      src={extractCleanUrls(quickViewProduct.image)[quickViewImgIndex]} 
                      alt={`${quickViewProduct.name} - Angle View ${quickViewImgIndex + 1}`} 
                      className="absolute inset-0 w-full h-full object-cover animate-fade-in"
                    />
                  )}
                </div>
                
                <div className="absolute inset-x-0 top-1/2 -translate-y-1/2 flex justify-between px-4 z-">
                  <button type="button" onClick={(e) => { e.preventDefault(); e.stopPropagation(); const arr = extractCleanUrls(quickViewProduct.image); if (arr.length > 0) { setQuickViewImgIndex(prev => (prev - 1 + arr.length) % arr.length); } }} className="w-10 h-10 bg-white text-black flex items-center justify-center rounded-full shadow-2xl active:scale-95 transition-transform cursor-pointer pointer-events-auto"><svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7"/></svg></button>
                  <button type="button" onClick={(e) => { e.preventDefault(); e.stopPropagation(); const arr = extractCleanUrls(quickViewProduct.image); if (arr.length > 0) { setQuickViewImgIndex(prev => (prev + 1) % arr.length); } }} className="w-10 h-10 bg-white text-black flex items-center justify-center rounded-full shadow-2xl active:scale-95 transition-transform cursor-pointer pointer-events-auto"><svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7"/></svg></button>
                </div>
                <div className="absolute bottom-5 left-1/2 -translate-x-1/2 flex gap-2 z-30 bg-black/20 px-3 py-1.5 rounded-full">
                  {extractCleanUrls(quickViewProduct.image).map((_, idx) => (
                    <button key={idx} type="button" onClick={(e) => { e.stopPropagation(); setQuickViewImgIndex(idx); }} className={`w-2 h-2 rounded-full transition-all duration-300 ${idx === quickViewImgIndex ? 'bg-white scale-125' : 'bg-white/40'}`} />
                  ))}
                </div>
              </div>
              <div className="w-full md:w-1/2 p-6 sm:p-10 flex flex-col justify-center bg-white">
                <div className="flex justify-between items-start mb-1">
                  <h2 className="text-base font-normal tracking-[0.2em] uppercase font-serif pr-4 text-black">{quickViewProduct.name}</h2>
                  <button onClick={(e) => handleWishlistClick(e, quickViewProduct)} className="text-black hover:scale-110 transition-transform mt-0.5 pointer-events-auto z-10"><svg className="w-4 h-4 sm:w-5 sm:h-5" fill={wishlist.some(w => w.id === quickViewProduct.id) ? "#D31313" : "none"} stroke={wishlist.some(w => w.id === quickViewProduct.id) ? "#D31313" : "currentColor"} strokeWidth="1.5" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12z" /></svg></button>
                </div>
                <p className="text-xs tracking-widest font-medium mb-6 text-zinc-500">{formatPrice(quickViewProduct.price)}</p>
                <div className="mb-5">
                  <span className="text-[8px] tracking-widest uppercase text-zinc-400 block mb-2">Choose your perfect size</span>
                  <div className="flex gap-2">
                    {['S', 'M', 'L'].map(s => <button key={s} onClick={() => setSelectedSize(s)} className={`w-8 h-8 flex items-center justify-center text-[10px] border transition-colors ${selectedSize === s ? 'border-black bg-black text-white' : 'border-zinc-200 text-black hover:border-black'}`}>{s}</button>)}
                  </div>
                </div>
                <div className="flex items-center gap-4 mb-6">
                  <div className="flex items-center border border-zinc-200 bg-white">
                    <button onClick={() => setQty(Math.max(1, qty - 1))} className="w-8 h-8 flex items-center justify-center text-zinc-400 hover:text-black">-</button>
                    <span className="w-8 text-center text-xs font-mono text-black">{qty}</span>
                    <button onClick={() => setQty(qty + 1)} className="w-8 h-8 flex items-center justify-center text-zinc-400 hover:text-black">+</button>
                  </div>
                </div>
                <button onClick={(e) => { handleAddToCart(e, quickViewProduct, qty, selectedSize); setQuickViewProduct(null); }} className="w-full bg-black text-white py-3 text-[9px] tracking-[0.2em] uppercase hover:bg-zinc-800 transition-colors font-medium mb-4">Add to Bag • {formatPrice(quickViewProduct.price * qty)}</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 3. DYNAMIC SEARCH PORTAL */}
      {isSearchOpen && (
        <div className="fixed inset-0 bg-white flex flex-col overflow-y-auto animate-fade-in" style={{ zIndex: 9999999 }}>
          <div className="w-full max-w-[1600px] mx-auto px-4 sm:px-8 pt-10 sm:pt-16 pb-6 flex justify-between items-center shrink-0">
            <h2 className="text-xl sm:text-2xl font-serif tracking-[0.1em] uppercase text-black">Find Your Perfect Piece</h2>
            <button onClick={() => { setIsSearchOpen(false); setSearchQuery(''); }} className="p-2 text-zinc-400 hover:text-black transition-colors"><svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12"/></svg></button>
          </div>
          <div className="w-full max-w-[1600px] mx-auto px-4 sm:px-8 shrink-0">
            <div className="w-full relative flex items-center border-b-2 border-zinc-200 focus-within:border-black transition-colors py-4">
              <svg className="w-5 h-5 sm:w-6 sm:h-6 text-zinc-400 mr-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" /></svg>
              <input type="text" autoFocus value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="w-full outline-none text-base md:text-2xl text-black uppercase tracking-widest bg-transparent placeholder-zinc-300 font-light" placeholder="WHAT ARE YOU LOOKING FOR TODAY?..." />
              {searchQuery && ( <button onClick={() => setSearchQuery('')} className="ml-4 text-zinc-400 hover:text-black uppercase text-[10px] tracking-[0.2em] font-medium">Clear</button> )}
            </div>
          </div>
          <div className="w-full max-w-[1600px] mx-auto px-4 sm:px-8 mt-12 sm:mt-16 flex-1 pb-24">
            {searchQuery.trim() === '' ? (
              <div className="h-full flex flex-col items-center justify-start pt-10 text-zinc-400 text-center space-y-4">
                 <svg className="w-12 h-12 opacity-20" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
                 <p className="text-[10px] uppercase tracking-[0.2em]">Type a keyword or style to begin exploring our collection.</p>
              </div>
            ) : searchResults.length === 0 ? (
              <div className="text-center pt-10 text-[10px] tracking-[0.2em] text-zinc-400 uppercase">We couldn&apos;t quite find what you&apos;re looking for. Try a different search.</div>
            ) : (
              <>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6">
                  {searchResults.map((product) => {
                    const inWishlist = wishlist.some(w => w.id === product.id);
                    return (
                      <div key={`search-${product.id}`} className="group flex flex-col relative bg-white pb-4">
                        <div className="bg-zinc-50 aspect-[3/4] w-full overflow-hidden relative rounded-sm border border-zinc-100 cursor-pointer" onClick={() => { if (!product.is_sold_out) { setIsSearchOpen(false); setSearchQuery(''); openQuickView(product); } }}>
                          {product.image && ( <img key={getPrimaryImage(product.image)} src={getPrimaryImage(product.image)} alt={product.name} className="w-full h-full object-cover" /> )}
                          <button type="button" onClick={(e) => handleWishlistClick(e, product)} className="absolute top-3 right-3 z-30 pointer-events-auto p-2 text-black hover:scale-110 active:scale-95 transition-transform"><svg className="w-5 h-5 pointer-events-none" fill={inWishlist ? "#D31313" : "none"} stroke={inWishlist ? "#D31313" : "currentColor"} strokeWidth="1.5" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12z" /></svg></button>
                        </div>
                        <div className="flex flex-col gap-1 mt-4 text-left px-1">
                          <h3 className="text-[10px] sm:text-[11px] tracking-[0.15em] uppercase text-zinc-800 truncate">{product.name}</h3>
                          <p className="text-[11px] sm:text-[13px] tracking-widest text-black font-medium">{formatPrice(product.price)}</p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* 4. SLIDING MINI BAG DRAWER GRID */}
      {isCartOpen && <div className="fixed inset-0 bg-black/80 transition-opacity" style={{ zIndex: 9999998 }} onClick={() => setIsCartOpen(false)}></div>}
      <div className={`fixed inset-y-0 right-0 w-full sm:w-[400px] bg-[#0A0A0A] text-white shadow-2xl border-l border-zinc-900 transform transition-transform duration-500 ease-in-out ${isCartOpen ? 'translate-x-0' : 'translate-x-full'} flex flex-col`} style={{ zIndex: 9999999 }}>
        <div className="flex items-center justify-between p-6 border-b border-zinc-900 shrink-0">
          <h2 className="text-[11px] tracking-[0.2em] uppercase font-medium">Your Shopping Bag ({cartItemCount})</h2>
          <button onClick={() => setIsCartOpen(false)} className="text-zinc-500 hover:text-white transition-colors"><svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12"/></svg></button>
        </div>
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {cart.length === 0 ? (
            <div className="text-center text-zinc-600 text-[10px] tracking-widest uppercase mt-10">Your bag is currently empty. Let's find you something beautiful.</div>
          ) : (
            cart.map((item, idx) => (
              <div key={`${item.id}-${item.size}-${idx}`} className="flex gap-4">
                <div className="w-20 h-28 bg-[#111] shrink-0 border border-zinc-800">
                  {item.image && ( <img src={item.image} alt={item.name} className="w-full h-full object-cover" /> )}
                </div>
                <div className="flex-1 flex flex-col justify-between py-1">
                  <div>
                    <h3 className="text-[10px] tracking-widest uppercase font-medium">{item.name}</h3>
                    <p className="text-[10px] text-zinc-500 mt-1 uppercase">Size: {item.size}</p>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] tracking-wider font-medium text-zinc-300">{formatPrice(item.price)}</span>
                    <div className="flex items-center gap-3 border border-zinc-800 px-2 py-1">
                      <span className="text-[10px] text-zinc-500">Qty: {item.quantity}</span>
                      <span className="text-zinc-800">|</span>
                      <button onClick={() => removeFromCart(item.id, item.size)} className="text-[9px] uppercase tracking-wider text-red-500 hover:text-red-400">Remove</button>
                    </div>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
        {cart.length > 0 && (
          <div className="p-6 border-t border-zinc-900 bg-[#111] shrink-0">
            <div className="mb-6 border-b border-zinc-800 pb-5">
              <label className="block text-[9px] text-zinc-500 uppercase tracking-widest mb-3">Calculate Dynamic Routing Logistics</label>
              <div className="flex gap-2">
                <input type="text" value={deliveryAddress} onChange={(e) => setDeliveryAddress(e.target.value)} placeholder="ENTER NEAREST BUS STOP OR LANDMARK..." className="flex-1 bg-transparent border border-zinc-700 text-white text-base md:text-[10px] uppercase tracking-widest p-3 outline-none focus:border-white placeholder-zinc-600 transition-colors" />
                <button onClick={calculateLiveDelivery} disabled={isCalculating} className="bg-white text-black px-4 text-[9px] font-bold uppercase tracking-widest hover:bg-zinc-300 transition-colors disabled:opacity-50">{isCalculating ? 'WAIT...' : 'CALCULATE'}</button>
              </div>
            </div>
            <div className="space-y-2 mb-6 text-xs uppercase tracking-widest">
              <div className="flex justify-between text-zinc-500"><span>Subtotal:</span><span>{formatPrice(cartSubtotal)}</span></div>
              {deliveryFee > 0 && ( <div className="flex justify-between text-zinc-400 animate-fade-in text-[10px]"><span>Dispatch ({deliveryZone}):</span><span>{formatPrice(deliveryFee, true)}</span></div> )}
              <div className="flex justify-between font-medium text-white pt-3 border-t border-zinc-800 mt-3 text-[13px]"><span>Total:</span><span>{getDisplayTotal()}</span></div>
            </div>
            <div className="flex gap-3">
              <button onClick={() => setIsCartOpen(false)} className="flex-1 border border-white text-white text-center py-4 text-[9px] tracking-[0.2em] uppercase hover:bg-white hover:text-black transition-colors">Continue Shopping</button>
              <button onClick={() => { if (deliveryFee <= 0 || !deliveryAddress.trim()) return showToast("PLEASE CALCULATE ROUTING EXPENDITURES TO PROCEED."); localStorage.setItem('sikamore_delivery', JSON.stringify({ fee: deliveryFee, zone: deliveryZone, address: deliveryAddress, currency: currency, countryCode: detectedCountryCode, countryName: detectedCountryName })); setIsCartOpen(false); window.location.href = '/checkout'; }} className={`flex-1 text-center flex items-center justify-center py-4 text-[9px] tracking-[0.2em] uppercase transition-colors font-bold ${deliveryFee <= 0 ? 'bg-zinc-800 text-zinc-500 cursor-not-allowed' : 'bg-white text-black hover:bg-zinc-300'}`}>{deliveryFee <= 0 ? 'CALCULATE SHIPPING' : 'Proceed to Payment'}</button>
            </div>
          </div>
        )}
      </div>

      {/* 5. MOBILE MENU INTERACTION EXPANSION */}
      {isMenuOpen && <div className="fixed inset-0 bg-black/80 transition-opacity" style={{ zIndex: 9999998 }} onClick={() => setIsMenuOpen(false)}></div>}
      <div className={`fixed inset-y-0 left-0 w-[280px] bg-white text-black shadow-2xl transform transition-transform duration-500 ease-in-out ${isMenuOpen ? 'translate-x-0' : '-translate-x-full'} flex flex-col`} style={{ zIndex: 9999999 }}>
        <div className="p-6 border-b border-zinc-200 flex justify-between items-center">
          <span className="text-[10px] tracking-[0.3em] font-serif uppercase">Explore</span>
          <button onClick={() => setIsMenuOpen(false)} className="text-zinc-400 hover:text-black transition-colors p-1"><svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12"/></svg></button>
        </div>
        <nav className="flex-1 px-6 py-8 space-y-6 text-xs font-normal tracking-[0.25em] uppercase border-b border-zinc-100">
          <Link href="/" onClick={() => setIsMenuOpen(false)} className="block py-1 hover:text-zinc-400 transition-colors">Home</Link>
          <Link href="/shop" onClick={() => setIsMenuOpen(false)} className="block py-1 hover:text-zinc-400 transition-colors border-b border-zinc-900 pb-2 text-black font-medium">Latest Arrivals</Link>
          <Link href="/dashboard" onClick={() => setIsMenuOpen(false)} className="block py-1 hover:text-zinc-400 transition-colors">My Account</Link>
        </nav>
        <div className="p-6 text-[8px] tracking-[0.2em] uppercase text-zinc-400">S. SIKAMÒRE COLLECTIVES © 2026</div>
      </div>

      {/* 6. COMPACT FLOATING BAG PILL FOR MOBILE */}
      {cartItemCount > 0 && !isCartOpen && (
        <div className="fixed bottom-6 left-1/2 transform -translate-x-1/2 w-[92%] sm:w-auto pointer-events-auto animate-fade-in shadow-2xl" style={{ zIndex: 9999990 }}>
          <div className="bg-black rounded-full flex items-center justify-between p-1.5 sm:p-2 border border-zinc-800">
            <div className="flex items-center gap-2 sm:gap-4 pl-4 text-white text-[10px] sm:text-[11px] font-medium tracking-widest uppercase flex-1 whitespace-nowrap">
              <span>{cartItemCount} ITEM{cartItemCount !== 1 && 'S'}</span>
              <span className="text-zinc-600">|</span>
              <span>{formatPrice(cartSubtotal)}</span>
            </div>
            <button onClick={() => setIsCartOpen(true)} className="bg-white text-black px-4 sm:px-6 py-2.5 sm:py-3 rounded-full text-[9px] sm:text-[10px] font-bold uppercase tracking-widest hover:bg-zinc-200 transition-colors shrink-0 ml-2">
              View Bag
            </button>
          </div>
        </div>
      )}

    </div>
  );
}
