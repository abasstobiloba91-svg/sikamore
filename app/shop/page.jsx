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

const ATELIER_LONG = 3.4215;
const ATELIER_LAT = 6.4281;

// FOR QUICK VIEW: Separates the messy backend string for the popup
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

// FOR THE GRID: Brutally snatch ONLY the first valid image and ignore the rest
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

export default function ShopCatalog() {
  // --- 1. GLOBAL CURRENCY & REAL-TIME LOGISTICS STATES ---
  const [usdToNgnRate, setUsdToNgnRate] = useState(1500);
  const [intlMarkupMultiplier, setIntlMarkupMultiplier] = useState(1.5);
  const [internationalFee, setInternationalFee] = useState(55);
  const [isInternationalFree, setIsInternationalFree] = useState(true);

  // --- 2. STANDARD STOREFRONT CORE STATES ---
  const [loading, setLoading] = useState(true);
  const [products, setProducts] = useState([]);
  const [userSession, setUserSession] = useState(null);
  const [currency, setCurrency] = useState('NGN');

  const [detectedCountryCode, setDetectedCountryCode] = useState('NG');
  const [detectedCountryName, setDetectedCountryName] = useState('Nigeria');
  const [isEuropeanUser, setIsEuropeanUser] = useState(false);

  const [viewCols, setViewCols] = useState(4); 
  const [isListView, setIsListView] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  
  // Search & Filter States
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [activeSort, setActiveSort] = useState('newest');
  
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [currentCategory, setCurrentCategory] = useState(null);
  
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
  
  // Animation states
  const [tickerIndex, setTickerIndex] = useState(0);
  const [bannerIndex, setBannerIndex] = useState(0);
  const [accessoryImages, setAccessoryImages] = useState([]);

  // --- 3. REAL-TIME MULTI-CURRENCY & LOGISTICS POSTGRES PIPELINE ---
  useEffect(() => {
    async function loadMasterLogistics() {
      try {
        const { data } = await supabase.from('shipping_settings').select('*').eq('id', 1).single();
        if (data) {
          if (data.usd_to_ngn_rate) setUsdToNgnRate(parseFloat(data.usd_to_ngn_rate));
          if (data.intl_markup_multiplier) setIntlMarkupMultiplier(parseFloat(data.intl_markup_multiplier));
          if (data.international_fee) setInternationalFee(parseFloat(data.international_fee));
          setIsInternationalFree(data.international_free);
        }
      } catch (e) {}
    }
    loadMasterLogistics();

    const logisticsLiveChannel = supabase.channel('realtime_logistics_flux')
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'shipping_settings', filter: 'id=eq.1' }, (payload) => {
        const updatedMatrix = payload.new;
        if (updatedMatrix.usd_to_ngn_rate) setUsdToNgnRate(parseFloat(updatedMatrix.usd_to_ngn_rate));
        if (updatedMatrix.intl_markup_multiplier) setIntlMarkupMultiplier(parseFloat(updatedMatrix.intl_markup_multiplier));
        if (updatedMatrix.international_fee) setInternationalFee(parseFloat(updatedMatrix.international_fee));
        setIsInternationalFree(updatedMatrix.international_free);
        showToast("LOGISTICS ENGINE UPDATED LIVE BY ATELIER.");
      })
      .subscribe();

    return () => {
      supabase.removeChannel(logisticsLiveChannel);
    };
  }, []);

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
    
    const dynamicExchangeRates = { 
      NGN: 1, 
      USD: 1 / usdToNgnRate, 
      GBP: 1 / (usdToNgnRate * 1.32),
      EUR: 1 / (usdToNgnRate * 1.12) 
    };
    
    const rate = dynamicExchangeRates[currency] || 1;
    const markupRate = (detectedCountryCode === 'NG' || isShipping) ? 1.0 : intlMarkupMultiplier;
    const converted = Number(ngnPrice) * markupRate * rate;
    if (isNaN(converted)) return '';
    if (currency === 'NGN') return `₦${Math.round(converted).toLocaleString()}`;
    return `${currencySymbols[currency] || '$'}${converted.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  const getDisplayTotal = () => {
    const dynamicExchangeRates = { NGN: 1, USD: 1 / usdToNgnRate, GBP: 1 / (usdToNgnRate * 1.32), EUR: 1 / (usdToNgnRate * 1.12) };
    const markupRate = detectedCountryCode === 'NG' ? 1.0 : intlMarkupMultiplier;
    
    const productsConverted = cartSubtotal * markupRate * (dynamicExchangeRates[currency] || 1);
    const shippingConverted = deliveryFee * 1.0 * (dynamicExchangeRates[currency] || 1);
    
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

  // --- DYNAMICALLY EXTRACT ACCESSORIES IMAGES FOR THE SLIDESHOW ---
  useEffect(() => {
    if (products.length > 0) {
      const accProducts = products.filter(p => p.category && p.category.toLowerCase() === 'accessories');
      let extractedImgs = [];
      
      accProducts.forEach(p => {
        const urls = extractCleanUrls(p.image);
        urls.forEach(u => {
          if (u && !extractedImgs.includes(u)) extractedImgs.push(u);
        });
      });

      if (extractedImgs.length > 0) {
        setAccessoryImages(extractedImgs.slice(0, 5)); // Take top 5 for slides
      } else {
        // Safe fallback just in case no accessories are uploaded yet
        setAccessoryImages(["https://images.unsplash.com/photo-1611591437281-460bfbe1220a?q=80&w=2000&auto=format&fit=crop"]);
      }
    }
  }, [products]);

  // --- BULLETPROOF FILTERING LOGIC ---
  useEffect(() => {
    let result = [...products];
    let cat = null;

    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      cat = params.get('category');
      setCurrentCategory(cat);
    }

    if (cat) {
      result = result.filter(p => {
        const productCat = p.category ? p.category.toLowerCase() : 'bags';
        return productCat === cat.toLowerCase(); // Case-insensitive exact match
      });
    }

    if (searchQuery.trim()) {
      const lowerQ = searchQuery.toLowerCase();
      result = result.filter(p => {
        const n = p.name ? p.name.toLowerCase() : '';
        const d = p.description ? p.description.toLowerCase() : '';
        return n.includes(lowerQ) || d.includes(lowerQ);
      });
    }

    if (activeSort === 'low_to_high') {
      result.sort((a, b) => Number(a.price) - Number(b.price));
    } else if (activeSort === 'high_to_low') {
      result.sort((a, b) => Number(b.price) - Number(a.price));
    } else {
      result.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
    }

    setSearchResults(result);
  }, [searchQuery, products, activeSort]);

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

  // HEADER TEXT ANIMATION
  useEffect(() => {
    const tickerTimer = setInterval(() => setTickerIndex((prev) => (prev + 1) % announcements.length), 5000);
    return () => clearInterval(tickerTimer);
  }, [announcements.length]);

  // BANNER SLIDESHOW ANIMATION
  useEffect(() => {
    if (accessoryImages.length <= 1) return;
    const bannerTimer = setInterval(() => {
      setBannerIndex((prev) => (prev + 1) % accessoryImages.length);
    }, 5000);
    return () => clearInterval(bannerTimer);
  }, [accessoryImages.length]);

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
    if (!deliveryAddress.trim()) return showToast("PLEASE ENTER YOUR COMPLETE DELIVERY ADDRESS.");
    setIsCalculating(true);
    try {
      showToast("VALIDATING SHIPPING DESTINATION...");
      
      const res = await fetch('/api/shipping-calc', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          address: deliveryAddress,
          countryCode: detectedCountryCode,
          countryName: detectedCountryName
        }),
      });

      let data;
      try {
        data = await res.json();
      } catch (parseError) {
        throw new Error("SYSTEM ROUTE MISSING.");
      }

      let autoCurrency = detectedCountryCode === 'NG' ? 'NGN' : 'USD';
      if (detectedCountryCode === 'GB') autoCurrency = 'GBP';
      else if (isEuropeanUser) autoCurrency = 'EUR';

      if (!data.success) {
        if (detectedCountryCode !== 'NG') {
          const fallbackFee = isInternationalFree ? 0 : (internationalFee * usdToNgnRate);
          setDeliveryAddress(deliveryAddress.toUpperCase() + " (UNVERIFIED INTERNATIONAL)");
          setDeliveryFee(fallbackFee);
          setDeliveryZone(isInternationalFree ? "Free Shipping" : `International Delivery (${detectedCountryName})`);
          if (autoCurrency !== currency) setCurrency(autoCurrency);
          showToast("SATELLITE SYNC SKIPPED. LOGGED TEXT ADDRESS FOR DISPATCH.");
          return;
        } else {
          const { data: rules } = await supabase.from('shipping_settings').select('*').eq('id', 1).single();
          const mainlandRate = rules ? parseFloat(rules.mainland_fee) : 5000;
          const islandRate = rules ? parseFloat(rules.island_fee) : 8000;
          const interstateRate = rules ? parseFloat(rules.interstate_fee) : 20000;
          
          let fallbackFee = mainlandRate;
          let fallbackZone = "Lagos Mainland Flat Rate";
          const lowerAddress = deliveryAddress.toLowerCase();

          if (lowerAddress.includes('island') || lowerAddress.includes('lekki') || lowerAddress.includes('ajah') || lowerAddress.includes('ikoyi') || lowerAddress.includes('victoria')) {
            fallbackFee = islandRate;
            fallbackZone = "Lagos Island Flat Rate";
          } else if (lowerAddress.includes('abuja') || lowerAddress.includes('port harcourt') || lowerAddress.includes('state') || lowerAddress.includes('delta')) {
            fallbackFee = interstateRate;
            fallbackZone = "Interstate Flat Rate";
          }

          setDeliveryAddress(deliveryAddress.toUpperCase() + " (ESTIMATED)");
          setDeliveryFee(fallbackFee);
          setDeliveryZone(fallbackZone);
          if (autoCurrency !== currency) setCurrency(autoCurrency);
          showToast(`EXACT ROUTE UNKNOWN. APPLIED ₦${fallbackFee.toLocaleString()} RATE.`);
          return;
        }
      }

      setDeliveryAddress(data.matchedAddress); 
      setDeliveryFee(data.shippingFee);
      
      if (data.isInternational) {
        setDeliveryZone(isInternationalFree ? "Complimentary Premium Dispatch" : `International Delivery (${detectedCountryName})`);
        showToast(`Global Address Validated: Localized within ${detectedCountryName}.`);
      } else {
        const dist = data.distanceKm || 15;
        if (dist <= 30) {
          setDeliveryZone(`Lagos Mainland Dispatch (${dist}km)`);
        } else if (dist <= 65) {
          setDeliveryZone(`Lagos Island Dispatch (${dist}km)`);
        } else {
          setDeliveryZone(`Interstate Freight Delivery (${dist}km)`);
        }
        showToast(`Route Calculated: ${dist}km layout validated.`);
      }

      if (autoCurrency !== currency) setCurrency(autoCurrency);

    } catch (err) {
      setDeliveryFee(detectedCountryCode === 'NG' ? 5000 : 0);
      setDeliveryZone(detectedCountryCode === 'NG' ? "Lagos Delivery (Estimated)" : "Complimentary Premium Dispatch");
      showToast("CONNECTION TIMEOUT. STANDARD PROTOCOL ENGAGED.");
    } finally {
      setIsCalculating(false);
    }
  };
  
  const toggleAccordion = (tabId) => {
    setOpenAccordion(openAccordion === tabId ? '' : tabId);
  };

  const productTabs = [
    { id: 'description', title: 'The Details', content: quickViewProduct?.description || "A beautifully detailed silhouette crafted to elevate your everyday wardrobe with effortless grace." },
    { id: 'additional', title: 'Additional Info', content: quickViewProduct?.additional_information || "Designed in-house. We recommend dry cleaning to preserve the integrity of the fabrics and true-to-size fit." },
    { id: 'policies', title: 'Store Policies', content: quickViewProduct?.store_policies || "We offer complimentary worldwide shipping on all orders. Returns are seamlessly accepted within 14 days of delivery." },
    { id: 'inquiries', title: 'Inquiries', content: quickViewProduct?.inquiries || "Questions about styling or fit? Our Client Advisory team is here for you. Reach out through the Support tab on your dashboard." }
  ];

  // Helper function to render a product card exactly as you have it
  const renderProductCard = (product) => {
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
            <div className="absolute inset-0 bg-zinc-100 flex items-center justify-center text-[8px] tracking-widest text-zinc-400 uppercase">Awaiting Restock</div>
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
  };

  return (
    <div className="min-h-screen bg-white text-black font-sans antialiased text-[11px] pb-0 relative">
      
      {/* THE HEADER */}
      <div className="sticky top-0 w-full" style={{ zIndex: 9999950 }}>
        <div className="w-full bg-[#0A0A0A] text-white h-9 overflow-hidden border-b border-zinc-900 relative">
          <div className="transition-transform duration-700 cubic-bezier(0.25, 1, 0.5, 1) h-full w-full" style={{ transform: `translateY(-${tickerIndex * 100}%)` }}>
            {announcements.map((text, idx) => (
              <div key={idx} className="h-full w-full flex items-center justify-center text-[7.5px] sm:text-[9px] tracking-[0.15em] sm:tracking-[0.3em] uppercase font-light text-zinc-300 px-4 text-center select-none truncate">
                {text}
              </div>
            ))}
          </div>
        </div>

        <header className="bg-white text-black border-b border-zinc-200">
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
              <Link href="/" className="text-[15px] sm:text-xl font-bold tracking-[0.3em] sm:tracking-[0.4em] uppercase font-serif text-center text-black pl-[0.3em] whitespace-nowrap">
                S. SIKAMÒRE
              </Link>
            </div>
            
            <div className="flex-1 flex items-center justify-end gap-3 sm:gap-6">
              <select value={currency} onChange={(e) => setCurrency(e.target.value)} className="bg-transparent border-0 outline-none text-[9px] sm:text-[10px] font-bold tracking-[0.2em] cursor-pointer text-zinc-500 hover:text-black hidden sm:inline-block">
                <option value="NGN">NGN ₦</option>
                <option value="USD">USD $</option>
                <option value="GBP">GBP £</option>
                <option value="EUR">EUR €</option>
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
      </div>

      <section className="bg-white border-b border-zinc-200 relative z-">
        <div className="max-w-[1600px] mx-auto px-4 sm:px-8 py-3.5 flex items-center justify-between">
          <button onClick={() => setIsFilterOpen(true)} className="flex items-center gap-2 border border-zinc-200 px-3.5 py-1.5 text-[9px] uppercase tracking-wider hover:border-black hover:bg-black hover:text-white transition-colors">Refine</button>
          
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

      {/* --- THE MAIN SHOP GRID WITH THE SPLIT BANNER LOGIC --- */}
      <main className="max-w-[1600px] mx-auto px-4 sm:px-8 py-6 sm:py-16 bg-white relative z- pb-32">
        {loading ? (
          <div className="text-center py-32 tracking-[0.3em] text-zinc-500 uppercase text-[9px]">Preparing the Collection for You...</div>
        ) : searchResults.length === 0 ? (
          <div className="text-center py-32 tracking-[0.3em] text-zinc-500 uppercase text-[9px]">No items found in this category.</div>
        ) : (
          <div className="w-full flex flex-col">
            
            {/* If NO category is selected (Main Shop View), show the split layout with the banner */}
            {!currentCategory && searchResults.length > 4 ? (
              <>
                <div className={"grid gap-x-4 sm:gap-x-6 gap-y-8 sm:gap-y-12 w-full " + (isListView ? "grid-cols-1 gap-y-6 max-w-xl mx-auto" : viewCols === 2 ? "grid-cols-2 md:grid-cols-2" : viewCols === 3 ? "grid-cols-2 md:grid-cols-3" : "grid-cols-2 md:grid-cols-3 lg:grid-cols-4")}>
                  {searchResults.slice(0, 4).map((product) => renderProductCard(product))}
                </div>

                <div className="w-screen h-[70vh] sm:h-[85vh] relative flex flex-col items-center justify-center overflow-hidden my-16 sm:my-28 left-1/2 right-1/2 -ml-[50vw] -mr-[50vw] bg-[#050505]">
                  <style dangerouslySetInnerHTML={{__html: `
                    @keyframes subtleZoom {
                      0% { transform: scale(1); }
                      100% { transform: scale(1.15); }
                    }
                    .animate-subtle-zoom {
                      animation: subtleZoom 25s ease-in-out infinite alternate;
                    }
                  `}} />

                  {accessoryImages.map((img, idx) => (
                    <img 
                      key={idx}
                      src={img} 
                      alt="Fine Jewelry Accessories" 
                      className={`absolute inset-0 w-full h-full object-cover animate-subtle-zoom transition-opacity duration-[2000ms] ease-in-out ${idx === bannerIndex ? 'opacity-60' : 'opacity-0'}`}
                    />
                  ))}

                  <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/30 to-black/70" />
                  
                  <div className="relative z-10 flex flex-col items-center text-center px-4 animate-fade-in">
                    <h2 className="text-4xl sm:text-6xl md:text-7xl tracking-[0.4em] font-serif font-light uppercase text-white drop-shadow-2xl pl-[0.2em] mb-10">
                      Accessories
                    </h2>
                    <a 
                      href="/shop?category=accessories" 
                      className="bg-white/10 backdrop-blur-md border border-white/30 text-white px-10 py-4 sm:px-14 sm:py-5 text-[9px] sm:text-[10px] tracking-[0.3em] uppercase font-bold hover:bg-white hover:text-black transition-all shadow-2xl"
                    >
                      Shop Accessories
                    </a>
                  </div>
                </div>

                <div className={"grid gap-x-4 sm:gap-x-6 gap-y-8 sm:gap-y-12 w-full " + (isListView ? "grid-cols-1 gap-y-6 max-w-xl mx-auto" : viewCols === 2 ? "grid-cols-2 md:grid-cols-2" : viewCols === 3 ? "grid-cols-2 md:grid-cols-3" : "grid-cols-2 md:grid-cols-3 lg:grid-cols-4")}>
                  {searchResults.slice(4).map((product) => renderProductCard(product))}
                </div>
              </>
            ) : (
              /* If a specific category IS selected (like "Bags"), just show a normal clean grid! */
              <div className={"grid gap-x-4 sm:gap-x-6 gap-y-8 sm:gap-y-12 w-full " + (isListView ? "grid-cols-1 gap-y-6 max-w-xl mx-auto" : viewCols === 2 ? "grid-cols-2 md:grid-cols-2" : viewCols === 3 ? "grid-cols-2 md:grid-cols-3" : "grid-cols-2 md:grid-cols-3 lg:grid-cols-4")}>
                {searchResults.map((product) => renderProductCard(product))}
              </div>
            )}

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
            <h4 className="text-black text-[10px] tracking-[0.2em] font-medium uppercase">About Us</h4>
            <p className="leading-relaxed text-[10px] text-zinc-400">Finely crafted pieces for audacious women who carry light.</p>
            <p className="text-[9px] text-zinc-600 pt-1">Email: hello@ssikamore.com</p>
          </div>
         <div className="flex flex-col gap-2.5 text-[10px]">
            <h4 className="text-black text-[10px] tracking-[0.2em] font-medium uppercase mb-1">Explore</h4>
            <Link href="/collections" className="hover:text-black cursor-pointer transition-colors">Collections View</Link>
            <a href="/shop?category=bags" className="hover:text-black cursor-pointer transition-colors block">Bags</a>
            <a href="/shop?category=accessories" className="hover:text-black cursor-pointer transition-colors block">Accessories</a>
            <a href="/shop?category=clothing" className="hover:text-black cursor-pointer transition-colors block">Clothing</a>
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
            <div className="w-full md:w-1/2 h-56 md:h-auto bg-zinc-950 relative shrink-0 flex items-center justify-center">
              {products && products.length > 0 && (() => {
                try {
                  const rawProductDump = JSON.stringify(products);
                  const match = rawProductDump.match(/https?:\/\/[^,;"'\[\]\s]+\.(?:jpg|jpeg|png|webp)/i);
                  const parsedUrl = match ? match[0] : '';
                  return parsedUrl ? (
                    <img src={parsedUrl} alt="Sikamore Curated Acquisition" className="w-full h-full object-cover animate-fade-in" />
                  ) : (
                    <div className="text-zinc-500 text-[8px] tracking-[0.3em] uppercase font-light">S. Sikamòre Collection</div>
                  );
                } catch (e) {
                  return <div className="text-zinc-500 text-[8px] tracking-[0.3em] uppercase font-light">S. Sikamòre Collection</div>;
                }
              })()}
              {(!products || products.length === 0) && (
                <div className="text-zinc-400 text-[8px] tracking-[0.3em] uppercase font-light animate-pulse">Loading Archives...</div>
              )}
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
              <div className="w-full md:w-1/2 p-6 sm:p-10 flex flex-col justify-start bg-white">
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

                <div className="mt-8 border-t border-zinc-200">
                  {productTabs.map((tab) => (
                    <div key={tab.id} className="border-b border-zinc-200">
                      <button
                        onClick={() => toggleAccordion(tab.id)}
                        className="w-full py-4 flex justify-between items-center text-[9px] tracking-[0.2em] uppercase text-black hover:text-zinc-500 transition-colors"
                      >
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
              <div className="grid grid-cols-2 lg:grid-cols-3 gap-x-4 gap-y-10 sm:gap-x-8 sm:gap-y-16">
                {searchResults.map((product) => renderProductCard(product))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* 4. SLIDING MINI BAG DRAWER GRID (Z-INDEX 9999999) WITH OVERLAY AT 9999900 */}
      {isCartOpen && <div className="fixed inset-0 bg-black/80 transition-opacity" style={{ zIndex: 9999900 }} onClick={() => setIsCartOpen(false)}></div>}
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
              {deliveryZone !== '' && ( <div className="flex justify-between text-zinc-400 animate-fade-in text-[10px]"><span>Dispatch ({deliveryZone}):</span><span>{deliveryFee === 0 ? 'COMPLIMENTARY' : formatPrice(deliveryFee, true)}</span></div> )}
              <div className="flex justify-between font-medium text-white pt-3 border-t border-zinc-800 mt-3 text-[13px]"><span>Total:</span><span>{getDisplayTotal()}</span></div>
            </div>
            <div className="flex gap-3">
              <button onClick={() => setIsCartOpen(false)} className="flex-1 border border-white text-white text-center py-4 text-[9px] tracking-[0.2em] uppercase hover:bg-white hover:text-black transition-colors">Continue Shopping</button>
              <button onClick={() => { if (deliveryZone === '' || !deliveryAddress.trim()) return showToast("PLEASE CALCULATE ROUTING EXPENDITURES TO PROCEED."); localStorage.setItem('sikamore_delivery', JSON.stringify({ fee: deliveryFee, zone: deliveryZone, address: deliveryAddress, currency: currency, countryCode: detectedCountryCode, countryName: detectedCountryName })); setIsCartOpen(false); window.location.href = '/checkout'; }} className={`flex-1 text-center flex items-center justify-center py-4 text-[9px] tracking-[0.2em] uppercase transition-colors font-bold ${deliveryZone === '' ? 'bg-zinc-800 text-zinc-500 cursor-not-allowed' : 'bg-white text-black hover:bg-zinc-300'}`}>{deliveryZone === '' ? 'CALCULATE SHIPPING' : 'Proceed to Payment'}</button>
            </div>
          </div>
        )}
      </div>

      {/* 4.5 SLIDING REFINE/FILTER DRAWER */}
      {isFilterOpen && <div className="fixed inset-0 bg-black/80 transition-opacity" style={{ zIndex: 9999900 }} onClick={() => setIsFilterOpen(false)}></div>}
      <div className={`fixed inset-y-0 left-0 w-[280px] sm:w-[350px] bg-white text-black shadow-2xl transform transition-transform duration-500 ease-in-out ${isFilterOpen ? 'translate-x-0' : '-translate-x-full'} flex flex-col`} style={{ zIndex: 9999999 }}>
        <div className="p-6 border-b border-zinc-200 flex justify-between items-center">
          <span className="text-[10px] tracking-[0.3em] font-serif uppercase">Refine Catalog</span>
          <button onClick={() => setIsFilterOpen(false)} className="text-zinc-400 hover:text-black transition-colors p-1"><svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12"/></svg></button>
        </div>
        
        <div className="flex-1 overflow-y-auto p-6 space-y-8">
          <div>
            <h3 className="text-[9px] tracking-[0.2em] text-zinc-400 uppercase font-medium mb-4">Sort By</h3>
            <div className="space-y-3">
              <label className="flex items-center gap-3 cursor-pointer group">
                <input type="radio" name="sort" checked={activeSort === 'newest'} onChange={() => setActiveSort('newest')} className="w-4 h-4 accent-black" />
                <span className="text-[10px] uppercase tracking-widest group-hover:text-zinc-500 transition-colors">Newest Arrivals</span>
              </label>
              <label className="flex items-center gap-3 cursor-pointer group">
                <input type="radio" name="sort" checked={activeSort === 'low_to_high'} onChange={() => setActiveSort('low_to_high')} className="w-4 h-4 accent-black" />
                <span className="text-[10px] uppercase tracking-widest group-hover:text-zinc-500 transition-colors">Price: Low to High</span>
              </label>
              <label className="flex items-center gap-3 cursor-pointer group">
                <input type="radio" name="sort" checked={activeSort === 'high_to_low'} onChange={() => setActiveSort('high_to_low')} className="w-4 h-4 accent-black" />
                <span className="text-[10px] uppercase tracking-widest group-hover:text-zinc-500 transition-colors">Price: High to Low</span>
              </label>
            </div>
          </div>
        </div>

        <div className="p-6 border-t border-zinc-200 shrink-0 flex gap-3">
          <button onClick={() => { setActiveSort('newest'); setIsFilterOpen(false); }} className="flex-1 border border-zinc-200 text-black py-4 text-[9px] tracking-[0.2em] uppercase hover:bg-zinc-50 transition-colors">Reset</button>
          <button onClick={() => setIsFilterOpen(false)} className="flex-1 bg-black text-white py-4 text-[9px] tracking-[0.2em] uppercase hover:bg-zinc-800 transition-colors">Apply</button>
        </div>
      </div>

      {/* 5. MOBILE MENU INTERACTION EXPANSION (OVERLAY AT 9999900) */}
      {isMenuOpen && <div className="fixed inset-0 bg-black/80 transition-opacity" style={{ zIndex: 9999900 }} onClick={() => setIsMenuOpen(false)}></div>}
      <div className={`fixed inset-y-0 left-0 w-[280px] bg-white text-black shadow-2xl transform transition-transform duration-500 ease-in-out ${isMenuOpen ? 'translate-x-0' : '-translate-x-full'} flex flex-col`} style={{ zIndex: 9999999 }}>
        <div className="p-6 border-b border-zinc-200 flex justify-between items-center">
          <span className="text-[10px] tracking-[0.3em] font-serif uppercase">Explore</span>
          <button onClick={() => setIsMenuOpen(false)} className="text-zinc-400 hover:text-black transition-colors p-1"><svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12"/></svg></button>
        </div>
        <nav className="flex-1 px-6 py-8 space-y-6 text-xs font-normal tracking-[0.25em] uppercase border-b border-zinc-100 flex flex-col">
          <Link href="/" onClick={() => setIsMenuOpen(false)} className="py-1 hover:text-zinc-400 transition-colors">Home</Link>
          
          <div className="flex flex-col gap-4">
            <a href="/shop" onClick={() => setIsMenuOpen(false)} className="py-1 hover:text-zinc-400 transition-colors border-b border-zinc-900 pb-2 text-black font-medium block">
              Latest Arrivals
            </a>
            <div className="pl-4 border-l border-zinc-200 flex flex-col gap-4">
              <a href="/shop?category=bags" onClick={() => setIsMenuOpen(false)} className="text-[10px] text-zinc-500 hover:text-black transition-colors block">Shop Bags</a>
              <a href="/shop?category=accessories" onClick={() => setIsMenuOpen(false)} className="text-[10px] text-zinc-500 hover:text-black transition-colors block">Shop Accessories</a>
              <a href="/shop?category=clothing" onClick={() => setIsMenuOpen(false)} className="text-[10px] text-zinc-500 hover:text-black transition-colors block">Shop Clothing</a>
            </div>
          </div>

          <Link href="/login" onClick={() => setIsMenuOpen(false)} className="py-1 hover:text-zinc-400 transition-colors">My Account</Link>
          <Link href="/about" onClick={() => setIsMenuOpen(false)} className="py-1 hover:text-zinc-400 transition-colors">About Us</Link>
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
