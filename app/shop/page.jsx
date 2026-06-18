/* eslint-disable @next/next/no-img-element */
'use client';
export const dynamic = 'force-dynamic';

import { useEffect, useState, useRef } from 'react';
import { createClient } from '@supabase/supabase-js';
import Link from 'next/link';
import { useApp } from '../providers';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
const supabase = createClient(supabaseUrl, supabaseAnonKey);

const exchangeRates = {
  NGN: 1,
  USD: 1 / 1360,
  GBP: 1 / 1820,
  EUR: 1 / 1570
};

const currencySymbols = {
  NGN: '₦',
  USD: '$',
  GBP: '£',
  EUR: '€'
};

export default function ShopCatalog() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [userSession, setUserSession] = useState(null);
  const [currency, setCurrency] = useState('NGN');

  // GEOLOCATION ENGINE STATES
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
  
  // NEWSLETTER POPUP STATES
  const [showNewsletter, setShowNewsletter] = useState(false);
  const [subscriberEmail, setSubscriberEmail] = useState('');
  const [submittingEmail, setSubmittingEmail] = useState(false);

  // REAL-TIME DISPATCH CALCULATOR STATES
  const [deliveryAddress, setDeliveryAddress] = useState('');
  const [isCalculating, setIsCalculating] = useState(false);
  const [deliveryFee, setDeliveryFee] = useState(0);
  const [deliveryZone, setDeliveryZone] = useState('');
  const [tickerIndex, setTickerIndex] = useState(0);

  // GOOGLE MAPS SECURE REFERENCE HOOKS
  const autocompleteInputRef = useRef(null);
  const autocompleteInitialized = useRef(false);

  const announcements = [
    "ENJOY COMPLIMENTARY WORLDWIDE SHIPPING ON ALL ORDERS",
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
  const hasUnreadSupport = appContext.hasUnreadSupport || false;
  const showToast = appContext.showToast || ((msg) => console.log(msg));

  const [selectedSize, setSelectedSize] = useState('M');
  const [qty, setQty] = useState(1);

  // AUTOMATED REGIONAL MARKUP PRICING ENGINE
  const formatPrice = (ngnPrice, isShipping = false) => {
    if (!ngnPrice) return '';
    const markupRate = (detectedCountryCode === 'NG' || isShipping) ? 1.0 : 1.5;
    const converted = ngnPrice * markupRate * exchangeRates[currency];
    if (currency === 'NGN') return `₦${Math.round(converted).toLocaleString()}`;
    return `${currencySymbols[currency]}${converted.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  const getDisplayTotal = () => {
    const markupRate = detectedCountryCode === 'NG' ? 1.0 : 1.5;
    const productsConverted = cartSubtotal * markupRate * exchangeRates[currency];
    const shippingConverted = deliveryFee * 1.0 * exchangeRates[currency];
    const combinedTotal = productsConverted + shippingConverted;
    if (currency === 'NGN') return `₦${Math.round(combinedTotal).toLocaleString()}`;
    return `${currencySymbols[currency]}${combinedTotal.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  // FIXED & MEMORY-SAFE GOOGLE MAPS INJECTOR
  useEffect(() => {
    if (typeof window === 'undefined' || !isCartOpen) return;

    const initializeGoogleAutocomplete = () => {
      if (!autocompleteInputRef.current || !window.google || autocompleteInitialized.current) return;

      const autocomplete = new window.google.maps.places.Autocomplete(autocompleteInputRef.current, {
        types: ['geocode', 'establishment'],
      });

      autocomplete.addListener('place_changed', () => {
        const place = autocomplete.getPlace();
        if (!place.address_components) return;

        let countryCode = 'NG';
        let fullFormattedAddress = place.formatted_address || '';

        for (const component of place.address_components) {
          if (component.types.includes('country')) {
            countryCode = component.short_name;
            break;
          }
        }

        if (countryCode !== detectedCountryCode) {
          showToast("LOCATION NOT FOUND.");
          setDeliveryAddress('');
          setDeliveryFee(0);
          setDeliveryZone('');
          return;
        }
        setDeliveryAddress(fullFormattedAddress);
      });
      
      autocompleteInitialized.current = true;
    };

    if (window.google) {
      initializeGoogleAutocomplete();
    } else if (!document.getElementById('google-maps-script')) {
      const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || '';
      const script = document.createElement('script');
      script.id = 'google-maps-script';
      script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=places`;
      script.async = true;
      script.defer = true;
      script.onload = initializeGoogleAutocomplete;
      document.head.appendChild(script);
    }
  }, [isCartOpen, detectedCountryCode, showToast]); 

  // SMART AUTO-DETECT GEOLOCATION ENGINE
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

          if (data.country_code === 'NG') {
            setCurrency('NGN');
          } else if (data.continent_code === 'AF') {
            setCurrency('USD'); 
          } else if (data.country_code === 'GB') {
            setCurrency('GBP');
          } else if (checkEurope) {
            setCurrency('EUR');
          } else {
            setCurrency('USD');
          }
        }
      } catch (err) {
        // Fallback default operational states
      }
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
      setSearchResults([]);
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

  // SECURE ANALYTICS DISPATCH
  useEffect(() => {
    supabase.from('page_analytics').insert([{ event_type: 'visit', page_path: '/shop' }]).then(() => {}).catch(() => {});
  }, []);

  useEffect(() => {
    async function fetchProducts() {
      const { data } = await supabase.from('products').select('*').order('created_at', { ascending: false });
      if (data) setProducts(data);
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

  const cartSubtotal = cart.reduce((total, item) => total + (item.price * item.quantity), 0);
  const cartItemCount = cart.reduce((acc, curr) => acc + curr.quantity, 0);

  const openQuickView = (product) => {
    if (!product) return;
    setQty(1);
    setSelectedSize('M');
    setOpenAccordion('description');
    setQuickViewProduct(product);

    supabase.from('page_analytics')
      .insert([{ event_type: 'click', page_path: '/shop', product_name: product.name }])
      .then(() => {}).catch(() => {});
  };

  // FIXED: ADD TO CART WITH GLOBAL CONTEXT SUPPRESSION
  const handleCartClick = (e, product) => {
    e.preventDefault();
    e.stopPropagation();
    addToCart(product, 1, 'M'); 
    
    // Suppresses the global provider from auto-opening the cart drawer
    setIsCartOpen(false); 
    setTimeout(() => setIsCartOpen(false), 50); 
    
    showToast('Added to your bag.');
  };

  const handleWishlistClick = (e, product) => {
    e.preventDefault();
    e.stopPropagation();
    toggleWishlist(product);
    const isCurrentlyInWishlist = wishlist.some(w => w.id === product.id);
    showToast(isCurrentlyInWishlist ? 'Removed from your wishlist.' : 'Added to your beautifully curated wishlist.');
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
    if (!deliveryAddress.trim()) return showToast("PLEASE SELECT AN ADDRESS VIA AUTOMATED SUGGESTIONS.");
    
    setIsCalculating(true);
    await new Promise(resolve => setTimeout(resolve, 800));
    
    const lowerAddress = deliveryAddress.toLowerCase().trim();
    
    try {
      let fee = 15000; 
      let zone = "Nigeria Nationwide";
      let autoCurrency = detectedCountryCode === 'NG' ? 'NGN' : 'USD';

      const internationalBaseFee = 55 / exchangeRates['USD'];

      if (detectedCountryCode !== 'NG') {
        fee = internationalBaseFee; 
        zone = `International Delivery (${detectedCountryName})`;
        if (detectedCountryCode === 'GB') autoCurrency = 'GBP';
        else if (isEuropeanUser) autoCurrency = 'EUR';
      } else if (lowerAddress.includes('lagos')) {
        if (lowerAddress.includes('island') || lowerAddress.includes('lekki') || lowerAddress.includes('ikoyi') || lowerAddress.includes('victoria island')) {
          fee = 7000;
          zone = "Lagos (Island)";
        } else {
          fee = 5000;
          zone = "Lagos (Mainland)";
        }
      }

      setDeliveryFee(fee);
      setDeliveryZone(zone);
      if (autoCurrency !== currency) setCurrency(autoCurrency);
      showToast(`Dispatch Logged: ${zone}`);
      
    } catch (err) {
      showToast("Error processing verification rules.");
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
      
      {/* GLOBAL TOP ANNOUNCEMENT BAR */}
      <div className="w-full bg-[#0A0A0A] text-white h-9 overflow-hidden border-b border-zinc-900 relative" style={{ zIndex: 60 }}>
        <div className="transition-transform duration-700 cubic-bezier(0.25, 1, 0.5, 1) h-full w-full" style={{ transform: `translateY(-${tickerIndex * 100}%)` }}>
          {announcements.map((text, idx) => (
            <div key={idx} className="h-full w-full flex items-center justify-center text-[7.5px] sm:text-[9px] tracking-[0.15em] sm:tracking-[0.3em] uppercase font-light text-zinc-300 px-4 text-center select-none truncate">
              {text}
            </div>
          ))}
        </div>
      </div>

      <header className="bg-white text-black border-b border-zinc-200 sticky top-0" style={{ zIndex: 50 }}>
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
            <select 
              value={currency} 
              onChange={(e) => setCurrency(e.target.value)} 
              className="bg-transparent border-0 outline-none text-[9px] sm:text-[10px] font-bold tracking-[0.2em] cursor-pointer text-zinc-500 hover:text-black hidden sm:inline-block"
            >
              <option value="NGN">NGN ₦</option>
              <option value="USD">USD $</option>
              {isEuropeanUser && <option value="GBP">GBP £</option>}
              {isEuropeanUser && <option value="EUR">EUR €</option>}
            </select>

            <Link href="/dashboard?tab=wishlist" className="relative hover:text-zinc-500 transition-colors p-1 flex items-center">
              <svg className="w-[14px] h-[14px] sm:w-5 sm:h-5" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12z" />
              </svg>
              {wishlist.length > 0 && <span className="absolute -top-1 -right-1.5 w-3.5 h-3.5 bg-[#D31313] text-white flex items-center justify-center rounded-full text-[7.5px] font-bold">{wishlist.length}</span>}
            </Link>

            <Link href="/dashboard" className="relative hover:text-zinc-500 transition-colors p-1 flex items-center">
              <svg className="w-[14px] h-[14px] sm:w-5 sm:h-5" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" /></svg>
              {hasUnreadSupport && <span className="absolute top-0 right-0 w-2 h-2 bg-red-600 rounded-full animate-pulse"></span>}
            </Link>

            <button onClick={() => setIsCartOpen(true)} className="relative hover:text-zinc-500 transition-colors p-1 flex items-center">
              <svg className="w-[14px] h-[14px] sm:w-5 sm:h-5" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M15.75 10.5V6a3.75 3.75 0 10-7.5 0v4.5m11.356-1.993l1.263 12c.07.665-.45 1.243-1.119 1.243H4.25a1.125 1.125 0 01-1.12-1.243l1.264-12A1.125 1.125 0 015.513 7.5h12.974c.576 0 1.059.435 1.119 1.007z" /></svg>
              {cartItemCount > 0 && <span className="absolute -top-1 -right-1.5 w-3.5 h-3.5 bg-black text-white flex items-center justify-center rounded-full text-[7.5px] font-bold">{cartItemCount}</span>}
            </button>
          </div>
        </div>
      </header>

      {/* SINGLE-STAGE NEWSLETTER POPUP MODAL */}
      {showNewsletter && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in" style={{ zIndex: 999999 }}>
          <div className="bg-white text-black max-w-4xl w-full flex flex-col md:flex-row relative shadow-2xl overflow-hidden">
            <button onClick={() => { setShowNewsletter(false); sessionStorage.setItem('sikamore_newsletter', 'true'); }} className="absolute top-4 right-4 z-10 text-zinc-400 hover:text-black bg-white/80 p-1.5 rounded-full shadow-sm transition-colors">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12"/></svg>
            </button>
            
            <div className="w-full md:w-1/2 h-56 md:h-auto bg-zinc-100 relative shrink-0">
              <img 
                src={products.length > 0 ? products[0].image : ''} 
                alt="Join the Community" 
                onError={(e) => { e.target.src = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII='; }}
                className="w-full h-full object-cover" 
              />
            </div>

            <div className="w-full md:w-1/2 p-8 md:p-14 flex flex-col justify-center text-center bg-white">
              <div className="animate-fade-in">
                <h2 className="text-xl md:text-2xl font-normal tracking-[0.2em] uppercase font-serif mb-4">Join Our Community</h2>
                <p className="text-[10px] tracking-widest text-zinc-500 uppercase leading-relaxed mb-8">
                  Stay up to date with new arrivals and get exclusive offers delivered directly to your inbox first.
                </p>
                <form onSubmit={handlePopupSubscription} className="space-y-4">
                  <input 
                    type="email" 
                    value={subscriberEmail}
                    onChange={(e) => setSubscriberEmail(e.target.value)}
                    placeholder="ENTER YOUR EMAIL" 
                    required 
                    className="w-full bg-white p-4 border border-zinc-300 focus:border-black outline-none text-base md:text-xs uppercase tracking-widest text-center" 
                  />
                  <button type="submit" disabled={submittingEmail} className="w-full bg-black text-white py-4 text-[10px] tracking-[0.2em] uppercase hover:bg-zinc-800 transition-colors font-medium disabled:opacity-50">
                    {submittingEmail ? 'JOINING...' : 'JOIN NOW'}
                  </button>
                </form>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* DETAILED PRODUCT OVERLAY MODAL */}
      {quickViewProduct && (
        <div className="fixed inset-0 overflow-y-auto overscroll-contain bg-black/60 backdrop-blur-sm" style={{ zIndex: 9999999 }}>
          <div className="flex min-h-full items-start justify-center p-4 sm:p-6">
            <div className="bg-white text-black w-full max-w-3xl flex flex-col relative border border-zinc-200 rounded-sm mt-4 sm:mt-10 mb-12 shadow-2xl">
              <button onClick={() => setQuickViewProduct(null)} className="absolute top-4 right-4 z-10 text-zinc-400 hover:text-black transition-colors bg-white/80 p-1.5 rounded-full border border-zinc-100 shadow-sm">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12"/></svg>
              </button>
              
              <div className="flex flex-col md:flex-row">
                <div className="w-full md:w-1/2 bg-zinc-50 aspect-[3/4] md:aspect-auto">
                  {quickViewProduct.image && (
                    <img 
                      src={quickViewProduct.image} 
                      alt="Preview" 
                      onError={(e) => { e.target.src = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII='; }}
                      className="w-full h-full object-cover" 
                    /> 
                  )}
                </div>
                <div className="w-full md:w-1/2 p-6 sm:p-10 flex flex-col justify-center">
                  <div className="flex justify-between items-start mb-1">
                    <h2 className="text-base font-normal tracking-[0.2em] uppercase font-serif pr-4">{quickViewProduct.name}</h2>
                    <button onClick={(e) => handleWishlistClick(e, quickViewProduct)} className="text-black hover:scale-110 transition-transform mt-0.5 pointer-events-auto z-10">
                      <svg className="w-4 h-4 sm:w-5 sm:h-5" fill={wishlist.some(w => w.id === quickViewProduct.id) ? "#D31313" : "none"} stroke={wishlist.some(w => w.id === quickViewProduct.id) ? "#D31313" : "currentColor"} strokeWidth="1.5" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12z" /></svg>
                    </button>
                  </div>
                  <p className="text-xs tracking-widest font-medium mb-6 text-zinc-500">{formatPrice(quickViewProduct.price)}</p>
                  
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
                      <span className="w-8 text-center text-xs font-mono">{qty}</span>
                      <button onClick={() => setQty(qty + 1)} className="w-8 h-8 flex items-center justify-center text-zinc-400 hover:text-black">+</button>
                    </div>
                  </div>
                  
                  {/* FIXED: SUPPRESS DRAWER AUTO-OPEN */}
                  <button onClick={(e) => { 
                      addToCart(quickViewProduct, qty, selectedSize); 
                      setIsCartOpen(false); 
                      setTimeout(() => setIsCartOpen(false), 50); 
                      setQuickViewProduct(null);
                      showToast('Added to your bag.');
                    }} 
                    className="w-full bg-black text-white py-3 text-[9px] tracking-[0.2em] uppercase hover:bg-zinc-800 transition-colors font-medium mb-4"
                  >
                    Add to Bag • {formatPrice(quickViewProduct.price * qty)}
                  </button>
                </div>
              </div>

              <div className="border-t border-zinc-100 bg-white p-6 sm:p-10 space-y-2">
                {productTabs.map((tab) => (
                  <div key={tab.id} className="border border-zinc-200 rounded-sm overflow-hidden">
                    <button onClick={() => toggleAccordion(tab.id)} className="w-full bg-zinc-50 px-4 py-3 flex justify-between items-center text-[10px] tracking-widest uppercase text-zinc-700 font-medium transition-colors hover:bg-zinc-100">
                      <span>{tab.title}</span>
                      <span className="text-zinc-400">{openAccordion === tab.id ? '—' : '+'}</span>
                    </button>
                    {openAccordion === tab.id && (
                      <div className="p-5 text-zinc-500 text-[10px] leading-relaxed uppercase tracking-wide bg-white border-t border-zinc-100 whitespace-pre-wrap animate-fade-in">
                        {tab.content}
                      </div>
                    )}
                  </div>
                ))}
              </div>

            </div>
          </div>
        </div>
      )}

      {/* --- FULL-SCREEN DYNAMIC SEARCH MODAL --- */}
      {isSearchOpen && (
        <div className="fixed inset-0 bg-white flex flex-col overflow-y-auto animate-fade-in" style={{ zIndex: 999999 }}>
          <div className="w-full max-w-[1600px] mx-auto px-4 sm:px-8 pt-10 sm:pt-16 pb-6 flex justify-between items-center shrink-0">
            <h2 className="text-xl sm:text-2xl font-serif tracking-[0.1em] uppercase text-black">Find Your Perfect Piece</h2>
            <button onClick={() => { setIsSearchOpen(false); setSearchQuery(''); }} className="p-2 text-zinc-400 hover:text-black transition-colors">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12"/></svg>
            </button>
          </div>

          <div className="w-full max-w-[1600px] mx-auto px-4 sm:px-8 shrink-0">
            <div className="w-full relative flex items-center border-b-2 border-zinc-200 focus-within:border-black transition-colors py-4">
              <svg className="w-5 h-5 sm:w-6 sm:h-6 text-zinc-400 mr-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" /></svg>
              <input
                type="text"
                autoFocus
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full outline-none text-base md:text-2xl text-black uppercase tracking-widest bg-transparent placeholder-zinc-300 font-light"
                placeholder="WHAT ARE YOU LOOKING FOR TODAY?..."
              />
              {searchQuery && (
                <button onClick={() => setSearchQuery('')} className="ml-4 text-zinc-400 hover:text-black uppercase text-[10px] tracking-[0.2em] font-medium">Clear</button>
              )}
            </div>
          </div>

          <div className="w-full max-w-[1600px] mx-auto px-4 sm:px-8 mt-12 sm:mt-16 flex-1 pb-24">
            {searchQuery.trim() === '' ? (
              <div className="h-full flex flex-col items-center justify-start pt-10 text-zinc-400 text-center space-y-4">
                 <svg className="w-12 h-12 opacity-20" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
                 <p className="text-[10px] uppercase tracking-[0.2em]">Type a keyword or style to begin exploring our collection.</p>
              </div>
            ) : searchResults.length === 0 ? (
              <div className="text-center pt-10 text-[10px] tracking-[0.2em] text-zinc-400 uppercase">
                We couldn&apos;t quite find what you&apos;re looking for. Try a different search.
              </div>
            ) : (
              <>
                <div className="flex justify-between items-center mb-8 border-b border-zinc-100 pb-3">
                  <span className="text-[10px] uppercase tracking-widest text-zinc-500 font-medium">Your Matches</span>
                  <span className="text-[9px] uppercase tracking-widest text-zinc-400 font-mono">{searchResults.length} Match{searchResults.length !== 1 && 'es'}</span>
                </div>

                <div className={`grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6`}>
                  {searchResults.map((product) => {
                    const inWishlist = wishlist.some(w => w.id === product.id);

                    return (
                      <div key={`search-${product.id}`} className="group flex flex-col relative bg-white pb-4">
                        
                        <div className="bg-zinc-50 aspect-[3/4] w-full overflow-hidden relative rounded-sm border border-zinc-100">
                          
                          <div 
                            className="absolute inset-0 z-10 cursor-pointer"
                            onClick={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              if (!product.is_sold_out) {
                                setIsSearchOpen(false);
                                setSearchQuery('');
                                openQuickView(product);
                              }
                            }}
                          >
                            {product.image && (
                              <img 
                                src={product.image} 
                                alt={product.name} 
                                loading="lazy"
                                onError={(e) => { e.target.src = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII='; }}
                                className="w-full h-full object-cover transition-transform duration-[1000ms] lg:group-hover:scale-102" 
                              />
                            )}
                          </div>

                          <button 
                            type="button"
                            onClick={(e) => handleWishlistClick(e, product)} 
                            className="absolute top-3 right-3 z-30 pointer-events-auto p-2 text-black hover:scale-110 active:scale-95 transition-transform"
                          >
                            <svg className="w-5 h-5 pointer-events-none" fill={inWishlist ? "#D31313" : "none"} stroke={inWishlist ? "#D31313" : "currentColor"} strokeWidth="1.5" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12z" />
                            </svg>
                          </button>

                          <div className="absolute inset-x-0 bottom-6 opacity-100 lg:opacity-0 lg:group-hover:opacity-100 transition-opacity duration-300 flex flex-col items-center gap-2 z-30 pointer-events-none">
                            <button 
                              type="button"
                              onClick={(e) => handleCartClick(e, product)}
                              disabled={product.is_sold_out}
                              className={`pointer-events-auto flex items-center justify-center bg-black text-white h-8 w-32 rounded-sm text-[9px] uppercase tracking-widest hover:bg-zinc-800 active:scale-95 transition-all shadow-lg ${product.is_sold_out ? 'opacity-50 cursor-not-allowed' : ''}`}
                            >
                              Add to Cart
                            </button>
                            <button 
                              type="button"
                              onClick={(e) => { 
                                e.stopPropagation(); 
                                setIsSearchOpen(false); 
                                setSearchQuery(''); 
                                openQuickView(product); 
                              }}
                              className="pointer-events-auto flex items-center justify-center bg-white border border-zinc-200 text-black h-8 w-32 rounded-sm text-[9px] uppercase tracking-widest hover:bg-zinc-100 active:scale-95 transition-all shadow-lg"
                            >
                              View Product
                            </button>
                          </div>

                          {product.is_sold_out && (
                            <div className="absolute inset-0 bg-white/60 flex items-center justify-center pointer-events-none z-20"><div className="w-14 h-14 rounded-full bg-white border border-zinc-200 flex items-center justify-center"><span className="text-[8px] tracking-[0.15em] uppercase text-zinc-400">Sold Out</span></div></div>
                          )}
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

      {/* SLIDING MINI BAG CAROUSEL DRAWER WITH CUSTOM AUTOMATED DISPATCH */}
      <div className={`fixed inset-y-0 right-0 w-full sm:w-[400px] bg-[#0A0A0A] text-white shadow-2xl border-l border-zinc-900 transform transition-transform duration-500 ease-in-out ${isCartOpen ? 'translate-x-0' : 'translate-x-full'} flex flex-col`} style={{ zIndex: 999999 }}>
        <div className="flex items-center justify-between p-6 border-b border-zinc-900 shrink-0">
          <h2 className="text-[11px] tracking-[0.2em] uppercase font-medium">Your Shopping Bag ({cartItemCount})</h2>
          <button onClick={() => setIsCartOpen(false)} className="text-zinc-500 hover:text-white transition-colors">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12"/></svg>
          </button>
        </div>
        
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {cart.length === 0 ? (
            <div className="text-center text-zinc-600 text-[10px] tracking-widest uppercase mt-10">Your bag is currently empty. Let&apos;s find you something beautiful.</div>
          ) : (
            cart.map((item, idx) => (
              <div key={`${item.id}-${item.size}-${idx}`} className="flex gap-4">
                <div className="w-20 h-28 bg-[#111] shrink-0 border border-zinc-800">
                  {item.image && (
                    <img 
                      src={item.image} 
                      alt={item.name} 
                      onError={(e) => { e.target.src = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII='; }}
                      className="w-full h-full object-cover" 
                    />
                  )}
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
            
            {/* GOOGLE CONNECTED REAL-TIME DISPATCH INPUT */}
            <div className="mb-6 border-b border-zinc-800 pb-5">
              <label className="block text-[9px] text-zinc-500 uppercase tracking-widest mb-3">
                Calculate Verified Dispatch Route
              </label>
              <div className="flex gap-2">
                <input 
                  type="text" 
                  ref={autocompleteInputRef}
                  value={deliveryAddress}
                  onChange={(e) => setDeliveryAddress(e.target.value)}
                  placeholder="START TYPING YOUR DELIVERY ADDRESS..." 
                  className="flex-1 bg-transparent border border-zinc-700 text-white text-base md:text-[10px] uppercase tracking-widest p-3 outline-none focus:border-white placeholder-zinc-700 transition-colors"
                />
                <button 
                  onClick={calculateLiveDelivery} 
                  disabled={isCalculating}
                  className="bg-white text-black px-4 text-[9px] font-bold uppercase tracking-widest hover:bg-zinc-300 transition-colors disabled:opacity-50"
                >
                  {isCalculating ? 'WAIT...' : 'CONFIRM'}
                </button>
              </div>
            </div>

            {/* LIVE SUMMARY CONTAINER */}
            <div className="space-y-2 mb-6 text-xs uppercase tracking-widest">
              <div className="flex justify-between text-zinc-500">
                <span>Subtotal:</span>
                <span>{formatPrice(cartSubtotal)}</span>
              </div>
              
              {deliveryFee > 0 && (
                <div className="flex justify-between text-zinc-400 animate-fade-in text-[10px]">
                  <span>Dispatch ({deliveryZone}):</span>
                  <span>{formatPrice(deliveryFee, true)}</span>
                </div>
              )}
              
              <div className="flex justify-between font-medium text-white pt-3 border-t border-zinc-800 mt-3 text-[13px]">
                <span>Total:</span>
                <span>{getDisplayTotal()}</span>
              </div>
            </div>

            <div className="flex gap-3">
              <button onClick={() => setIsCartOpen(false)} className="flex-1 border border-white text-white text-center py-4 text-[9px] tracking-[0.2em] uppercase hover:bg-white hover:text-black transition-colors">
                Continue Shopping
              </button>
              <button 
                onClick={() => {
                  if (deliveryFee <= 0 || !deliveryAddress.trim()) {
                    showToast("PLEASE CALCULATE SHIPPING DESTINATION TO PROCEED.");
                    return;
                  }
                  localStorage.setItem('sikamore_delivery', JSON.stringify({ 
                    fee: deliveryFee, 
                    zone: deliveryZone, 
                    address: deliveryAddress, 
                    currency: currency,
                    countryCode: detectedCountryCode,
                    countryName: detectedCountryName
                  }));
                  setIsCartOpen(false);
                  window.location.href = '/checkout';
                }}
                className={`flex-1 text-center flex items-center justify-center py-4 text-[9px] tracking-[0.2em] uppercase transition-colors font-bold ${
                  deliveryFee <= 0 
                    ? 'bg-zinc-800 text-zinc-500 cursor-not-allowed' 
                    : 'bg-white text-black hover:bg-zinc-300'
                }`}
              >
                {deliveryFee <= 0 ? 'CALCULATE DELIVERY' : 'Proceed to Payment'}
              </button>
            </div>
          </div>
        )}
      </div>
      {isCartOpen && <div className="fixed inset-0 bg-black/40 backdrop-blur-sm transition-opacity" style={{ zIndex: 999998 }} onClick={() => setIsCartOpen(false)}></div>}

      <div className={`fixed inset-y-0 left-0 w-[280px] bg-white text-black shadow-2xl transform transition-transform duration-500 ease-in-out ${isMenuOpen ? 'translate-x-0' : '-translate-x-full'} flex flex-col`} style={{ zIndex: 999999 }}>
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
      {isMenuOpen && <div className="fixed inset-0 bg-black/60 backdrop-blur-sm" style={{ zIndex: 999998 }} onClick={() => setIsMenuOpen(false)}></div>}

      <section className="bg-white border-b border-zinc-200 relative" style={{ zIndex: 40 }}>
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
              <button onClick={() => { setViewCols(4); setIsListView(false); }} className={`flex gap-[2px] p-2 border transition-all ${viewCols === 4 && !isListView ? 'border-black bg-black text-white' : 'border-zinc-200 text-zinc-400'}`}><svg className="w-[22px] h-[14px]" fill="currentColor" viewBox="0 0 24 16"><rect width="4" height="14" x="1" y="1"/><rect width="4" height="14" x="6" y="1"/><rect width="4" height="14" x="11" y="1"/><rect width="4" height="14" x="16" y="1"/></svg></button>
            </div>
          </div>
          <select className="bg-transparent border-0 outline-none text-[9px] uppercase tracking-[0.2em] cursor-pointer text-zinc-500 hover:text-black font-light py-1 pr-2 max-w-[120px] text-right"><option>Sort by newest arrivals</option></select>
        </div>
      </section>

      <main className="max-w-[1600px] mx-auto px-4 sm:px-8 py-6 sm:py-16 bg-white relative z-10 pb-32">
        {loading ? (
          <div className="text-center py-32 tracking-[0.3em] text-zinc-500 uppercase text-[9px]">Preparing the Collection for You...</div>
        ) : (
          <div className={`grid ${isListView ? 'grid-cols-1 gap-y-6 max-w-xl mx-auto' : `grid-cols-2 ${viewCols === 2 ? 'md:grid-cols-2' : viewCols === 3 ? 'md:grid-cols-3' : 'md:grid-cols-3 lg:grid-cols-4'} gap-x-4 sm:gap-x-6 gap-y-8 sm:gap-y-12`}`}>
            {products.map((product) => {
              const inWishlist = wishlist.some(w => w.id === product.id);

              return (
                <div key={product.id} className="group flex flex-col relative bg-white pb-4">
                  
                  <div className="bg-zinc-50 aspect-[3/4] w-full overflow-hidden relative rounded-sm border border-zinc-100">
                    
                    <div 
                      className="absolute inset-0 z-10 cursor-pointer touch-pan-y"
                      onClick={(e) => {
                        e.stopPropagation();
                        if (!product.is_sold_out) openQuickView(product);
                      }}
                    >
                      {product.image && (
                        <img 
                          src={product.image} 
                          alt={product.name} 
                          loading="lazy"
                          onError={(e) => { e.target.src = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII='; }}
                          className="w-full h-full object-cover transition-transform duration-[1000ms] lg:group-hover:scale-102" 
                        />
                      )}
                    </div>
                    
                    <button 
                      type="button"
                      onClick={(e) => handleWishlistClick(e, product)} 
                      className="absolute top-3 right-3 z-30 pointer-events-auto p-2 text-black hover:scale-110 active:scale-95 transition-transform"
                    >
                      <svg className="w-5 h-5 pointer-events-none" fill={inWishlist ? "#D31313" : "none"} stroke={inWishlist ? "#D31313" : "currentColor"} strokeWidth="1.5" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12z" />
                      </svg>
                    </button>

                    <div className="absolute inset-x-0 bottom-6 opacity-0 lg:group-hover:opacity-100 transition-opacity duration-300 hidden lg:flex flex-col items-center gap-2 z-30 pointer-events-none">
                      <button 
                        type="button"
                        onClick={(e) => handleCartClick(e, product)}
                        disabled={product.is_sold_out}
                        className={`pointer-events-auto flex items-center justify-center bg-black text-white h-8 w-32 rounded-sm text-[9px] uppercase tracking-widest hover:bg-zinc-800 active:scale-95 transition-all shadow-lg ${product.is_sold_out ? 'opacity-50 cursor-not-allowed' : ''}`}
                      >
                        Add to Cart
                      </button>
                      <button 
                        type="button"
                        onClick={(e) => { e.stopPropagation(); openQuickView(product); }}
                        className="pointer-events-auto flex items-center justify-center bg-white border border-zinc-200 text-black h-8 w-32 rounded-sm text-[9px] uppercase tracking-widest hover:bg-zinc-100 active:scale-95 transition-all shadow-lg"
                      >
                        View Product
                      </button>
                    </div>

                    {product.is_sold_out && (
                      <div className="absolute inset-0 bg-white/60 flex items-center justify-center pointer-events-none z-20"><div className="w-14 h-14 rounded-full bg-white border border-zinc-200 flex items-center justify-center"><span className="text-[8px] tracking-[0.15em] uppercase text-zinc-400">Sold Out</span></div></div>
                    )}
                  </div>

                  <div className="flex flex-col gap-1 mt-4 text-left px-1">
                    <h3 className="text-[10px] sm:text-[11px] tracking-[0.15em] uppercase text-zinc-800 truncate">{product.name}</h3>
                    <p className="text-[11px] sm:text-[13px] tracking-widest text-black font-medium">{formatPrice(product.price)}</p>
                    
                    <div className="flex lg:hidden flex-col gap-2 mt-3 w-full">
                      <button 
                        type="button"
                        onClick={(e) => handleCartClick(e, product)}
                        disabled={product.is_sold_out}
                        className={`w-full bg-black text-white py-2.5 text-[8px] uppercase tracking-[0.2em] font-medium transition-colors ${product.is_sold_out ? 'opacity-50 cursor-not-allowed' : 'active:bg-zinc-800'}`}
                      >
                        Add to Cart
                      </button>
                      <button 
                        type="button"
                        onClick={(e) => { e.stopPropagation(); openQuickView(product); }}
                        className="w-full bg-white text-black border border-zinc-200 py-2.5 text-[8px] uppercase tracking-[0.2em] font-medium active:bg-zinc-50 transition-colors"
                      >
                        View Product
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>

      {/* FLOATING CART SUMMARY PILL - ELEVATED Z-INDEX */}
      {cartItemCount > 0 && !isCartOpen && (
        <div className="fixed bottom-8 sm:bottom-10 left-1/2 transform -translate-x-1/2 w-[90%] sm:w-auto z-[99999] pointer-events-auto animate-fade-in shadow-2xl">
          <div className="bg-black rounded-full flex items-center justify-between p-2 sm:p-2 border border-zinc-800 whitespace-nowrap">
            <div className="flex items-center gap-3 sm:gap-6 pl-4 sm:pl-6 pr-2">
              <span className="text-white text-[10px] sm:text-xs font-medium tracking-widest uppercase">
                Products Added - {cartItemCount}
              </span>
              <span className="text-zinc-500 hidden sm:inline">|</span>
              <span className="text-white text-[10px] sm:text-xs font-medium tracking-widest uppercase">
                Total - {formatPrice(cartSubtotal)}
              </span>
            </div>
            {/* ONLY THIS BUTTON TRIGGERS THE DRAWER NOW */}
            <button onClick={() => setIsCartOpen(true)} className="bg-white text-black px-6 sm:px-8 py-2.5 sm:py-3 rounded-full text-[10px] sm:text-xs font-bold uppercase tracking-widest hover:bg-zinc-200 transition-colors ml-4 shrink-0">
              View Bag
            </button>
          </div>
        </div>
      )}

      {/* FOOTER */}
      <footer className="border-t border-zinc-200 bg-white pt-16 pb-12 mt-16 sm:mt-20 text-black relative z-20">
        <div className="max-w-[1600px] mx-auto px-4 sm:px-8 mb-12 text-center border-b border-zinc-100 pb-12">
          <h2 className="text-xl sm:text-3xl tracking-[0.5em] uppercase font-normal text-black pl-[0.5em] select-none font-serif font-bold">
            S. SIKAMÒRE
          </h2>
        </div>
        <div className="max-w-[1600px] mx-auto px-4 sm:px-8 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-10 sm:gap-12 text-zinc-500 font-light tracking-widest">
          <div className="flex flex-col gap-3">
            <h4 className="text-black text-[10px] tracking-[0.2em] font-medium uppercase">About Our Atelier</h4>
            <p className="leading-relaxed text-[10px] text-zinc-400">Thoughtfully curated ready-to-wear luxury, designed to bring effortless elegance to your everyday life.</p>
            <p className="text-[9px] text-zinc-600 pt-1">Email: contact@ssikamore.com</p>
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

    </div>
  );
}
