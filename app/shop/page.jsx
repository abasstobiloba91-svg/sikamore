/* eslint-disable @next/next/no-img-element */
'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@supabase/supabase-js';
import Link from 'next/link';
import { useApp } from '../providers';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
const supabase = createClient(supabaseUrl, supabaseAnonKey);

export default function ShopCatalog() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // CURRENT USER SESSION
  const [userSession, setUserSession] = useState(null);

  // GRID LAYOUT STATE
  const [viewCols, setViewCols] = useState(4); 
  const [isListView, setIsListView] = useState(false);

  // SIDE MENU DRAWER STATE
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  // ACCORDION TABS STATE FOR PRODUCT VIEW PANEL
  const [openAccordion, setOpenAccordion] = useState('description');

  // GUEST WISHLIST AUTH MODAL STATES
  const [showWishlistAuthModal, setShowWishlistAuthModal] = useState(false);
  const [pendingWishlistProduct, setPendingWishlistProduct] = useState(null);
  const [authEmail, setAuthEmail] = useState('');
  const [authPassword, setAuthPassword] = useState('');
  const [isAuthenticating, setIsAuthenticating] = useState(false);

  // TWO-STAGE POPUP SUB-STATES
  const [showNewsletter, setShowNewsletter] = useState(false);
  const [grabDiscountClicked, setGrabDiscountClicked] = useState(false);
  const [subscriberEmail, setSubscriberEmail] = useState('');
  const [submittingEmail, setSubmittingEmail] = useState(false);

  const [tickerIndex, setTickerIndex] = useState(0);
  const announcements = [
    "COMPLIMENTARY WORLDWIDE SHIPPING ON ALL ORDERS",
    "DISCOVER THE ARCHIVE: NEW READY-TO-WEAR & ACCESSORIES NOW LIVE",
    "CRAFTED SILHOUETTES • A STUDY IN TEXTURE AND MINIMALIST FORM",
  ];

  const { 
    cart, wishlist, toggleWishlist, addToCart, removeFromCart,
    isCartOpen, setIsCartOpen, quickViewProduct, setQuickViewProduct,
    hasUnreadSupport, showToast
  } = useApp();

  const [selectedSize, setSelectedSize] = useState('M');
  const [qty, setQty] = useState(1);

  const [inlineAddId, setInlineAddId] = useState(null);
  const [inlineSize, setInlineSize] = useState('M');
  const [inlineQty, setInlineQty] = useState(1);

  useEffect(() => {
    // Check if user is logged in
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) setUserSession(session.user);
    });
  }, []);

  useEffect(() => {
    if (isMenuOpen || isCartOpen || showNewsletter || quickViewProduct || showWishlistAuthModal) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => { document.body.style.overflow = ''; };
  }, [isMenuOpen, isCartOpen, showNewsletter, quickViewProduct, showWishlistAuthModal]);

  useEffect(() => {
    async function transmitTrafficLog() {
      try { await supabase.from('page_analytics').insert([{ event_type: 'visit', page_path: '/shop' }]); } catch (err) {}
    }
    transmitTrafficLog();
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
    if (!sessionStorage.getItem('sikamore_newsletter')) {
      const timer = setTimeout(() => setShowNewsletter(true), 3000);
      return () => clearTimeout(timer);
    }
  }, []);

  const cartSubtotal = cart.reduce((total, item) => total + (item.price * item.quantity), 0);
  const cartItemCount = cart.reduce((acc, curr) => acc + curr.quantity, 0);

  const openQuickView = async (product) => {
    setQty(1);
    setSelectedSize('M');
    setOpenAccordion('description');
    setQuickViewProduct(product);
    try { await supabase.from('page_analytics').insert([{ event_type: 'click', page_path: '/shop', product_name: product.name }]); } catch (err) {}
  };

  const handleInlineAdd = (e, product) => {
    e.stopPropagation();
    addToCart(product, inlineQty, inlineSize);
    setTimeout(() => setIsCartOpen(false), 10);
    setInlineAddId(null);
    setInlineQty(1);
    setInlineSize('M');
  };

  // SMART WISHLIST HANDLER
  const handleWishlistClick = (e, product) => {
    e.stopPropagation();
    if (userSession) {
      toggleWishlist(product);
      showToast('WISHLIST UPDATED.');
    } else {
      setPendingWishlistProduct(product);
      setShowWishlistAuthModal(true);
    }
  };

  // IN-PAGE GUEST AUTHENTICATOR
  const handleGuestWishlistAuth = async (e) => {
    e.preventDefault();
    if (!authEmail || !authPassword) return;
    setIsAuthenticating(true);

    try {
      // Step 1: Scan if user exists. If yes, login. If no, register.
      const { data: existingUser } = await supabase.from('orders').select('customer_email').eq('customer_email', authEmail.toLowerCase()).limit(1);
      
      let sessionData = null;

      if (existingUser && existingUser.length > 0) {
        const { data, error } = await supabase.auth.signInWithPassword({ email: authEmail.toLowerCase(), password: authPassword });
        if (error) throw error;
        sessionData = data;
      } else {
        const { data, error } = await supabase.auth.signUp({ email: authEmail.toLowerCase(), password: authPassword });
        if (error) throw error;
        sessionData = data;
      }

      // Step 2: Auth successful, set state, add item, close modal.
      if (sessionData && sessionData.user) {
        setUserSession(sessionData.user);
        if (pendingWishlistProduct) {
          toggleWishlist(pendingWishlistProduct);
        }
        setShowWishlistAuthModal(false);
        showToast('PROFILE CONNECTED. ITEM SECURED TO WISHLIST.');
        setAuthEmail('');
        setAuthPassword('');
      }
    } catch (err) {
      showToast(`AUTH ERROR: ${err.message.toUpperCase()}`);
    } finally {
      setIsAuthenticating(false);
    }
  };

  const handlePopupSubscription = async (e) => {
    e.preventDefault();
    if (!subscriberEmail.trim()) return;
    setSubmittingEmail(true);
    try {
      const { error } = await supabase.from('subscribers').insert([{ email: subscriberEmail.toLowerCase().trim() }]);
      if (error && error.code !== '23505') throw error;
      showToast('PROFILE SECURED IN ARCHIVE REGISTRY.');
      setShowNewsletter(false);
      sessionStorage.setItem('sikamore_newsletter', 'true');
    } catch (err) {
      showToast(`REGISTRY ERROR: ${err.message.toUpperCase()}`);
    } finally {
      setSubmittingEmail(false);
    }
  };

  const copyCouponCode = () => {
    navigator.clipboard.writeText('CODE20OFF');
    showToast('DISCOUNT CODE SECURED TO CLIPBOARD.');
  };

  return (
    <div className="min-h-screen bg-white text-black font-sans antialiased text-[11px] relative overflow-x-hidden pb-24">
      
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
        <div className="max-w-[1600px] mx-auto px-4 sm:px-8 h-20 sm:h-24 grid grid-cols-3 items-center">
          <div className="flex items-center justify-start gap-4">
            <button onClick={() => setIsMenuOpen(true)} className="hover:text-zinc-500 transition-colors py-2">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" /></svg>
            </button>
            <Link href="/admin" className="tracking-[0.2em] text-zinc-500 hover:text-black uppercase text-[9px] sm:text-[10px] hidden sm:inline-block">Portal</Link>
          </div>
          <div className="flex items-center justify-center">
            <Link href="/" className="text-sm sm:text-xl font-normal tracking-[0.4em] uppercase font-serif text-center text-black pl-[0.4em] whitespace-nowrap">S. SIKAMÒRE</Link>
          </div>
          <div className="flex items-center justify-end gap-3 sm:gap-6">
            <button className="hover:text-zinc-500 transition-colors p-1">
              <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" /></svg>
            </button>
            <Link href="/dashboard" className="hover:text-zinc-500 transition-colors relative p-1">
              <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" /></svg>
              {hasUnreadSupport && <span className="absolute top-0 right-0 w-2 h-2 bg-red-600 rounded-full animate-pulse"></span>}
            </Link>
            <button onClick={() => setIsCartOpen(true)} className="relative hover:text-zinc-500 transition-colors p-1 flex items-center">
              <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M15.75 10.5V6a3.75 3.75 0 10-7.5 0v4.5m11.356-1.993l1.263 12c.07.665-.45 1.243-1.119 1.243H4.25a1.125 1.125 0 01-1.12-1.243l1.264-12A1.125 1.125 0 015.513 7.5h12.974c.576 0 1.059.435 1.119 1.007z" /></svg>
              {cartItemCount > 0 && <span className="absolute -top-1 -right-1.5 w-3.5 h-3.5 bg-red-600 text-white flex items-center justify-center rounded-full text-[7.5px] font-bold">{cartItemCount}</span>}
            </button>
          </div>
        </div>
      </header>

      <div className={`fixed inset-y-0 left-0 z- w-[280px] bg-white text-black shadow-2xl transform transition-transform duration-500 ease-in-out ${isMenuOpen ? 'translate-x-0' : '-translate-x-full'} flex flex-col`}>
        <div className="p-6 border-b border-zinc-200 flex justify-between items-center">
          <span className="text-[10px] tracking-[0.3em] font-serif uppercase">Index Menu</span>
          <button onClick={() => setIsMenuOpen(false)} className="text-zinc-400 hover:text-black transition-colors p-1"><svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12"/></svg></button>
        </div>
        <nav className="flex-1 px-6 py-8 space-y-6 text-xs font-normal tracking-[0.25em] uppercase border-b border-zinc-100">
          <Link href="/" onClick={() => setIsMenuOpen(false)} className="block py-1 hover:text-zinc-400 transition-colors">Home</Link>
          <Link href="/shop" onClick={() => setIsMenuOpen(false)} className="block py-1 hover:text-zinc-400 transition-colors border-b border-zinc-900 pb-2 text-black font-medium">New In</Link>
          <Link href="/dashboard" onClick={() => setIsMenuOpen(false)} className="block py-1 hover:text-zinc-400 transition-colors">Client Portal</Link>
          <Link href="/admin" onClick={() => setIsMenuOpen(false)} className="block py-1 hover:text-zinc-400 transition-colors">Management</Link>
        </nav>
        <div className="p-6 text-[8px] tracking-[0.2em] uppercase text-zinc-400">S. SIKAMÒRE COLLECTIVES © 2026</div>
      </div>
      {isMenuOpen && <div className="fixed inset-0 bg-black/60 z- backdrop-blur-sm" onClick={() => setIsMenuOpen(false)}></div>}

      <section className="bg-white border-b border-zinc-200 sticky top-[121px] sm:top-[137px] z-30">
        <div className="max-w-[1600px] mx-auto px-4 sm:px-8 py-3.5 flex items-center justify-between">
          <button className="flex items-center gap-2 border border-zinc-200 px-3.5 py-1.5 text-[9px] uppercase tracking-wider hover:border-black hover:bg-black hover:text-white transition-colors">Filter</button>
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
          <select className="bg-transparent border-0 outline-none text-[9px] uppercase tracking-[0.2em] cursor-pointer text-zinc-500 hover:text-black font-light py-1 pr-2 max-w-[120px] text-right"><option>Sort by latest</option></select>
        </div>
      </section>

      <main className="max-w-[1600px] mx-auto px-4 sm:px-8 py-6 sm:py-16 bg-white">
        {loading ? (
          <div className="text-center py-32 tracking-[0.3em] text-zinc-500 uppercase text-[9px]">Loading Archive...</div>
        ) : (
          <div className={`grid ${isListView ? 'grid-cols-1 gap-y-6 max-w-xl mx-auto' : `grid-cols-2 ${viewCols === 2 ? 'md:grid-cols-2' : viewCols === 3 ? 'md:grid-cols-3' : 'md:grid-cols-3 lg:grid-cols-4'} gap-x-4 sm:gap-x-6 gap-y-8 sm:gap-y-12`}`}>
            {products.map((product) => {
              const inWishlist = wishlist.some(w => w.id === product.id);

              if (isListView) {
                return (
                  <div key={product.id} className="flex gap-4 sm:gap-6 bg-white p-3 border border-zinc-100 items-center relative group">
                    <div className="w-28 sm:w-36 aspect-[3/4] shrink-0 overflow-hidden relative bg-zinc-50 rounded-sm cursor-pointer" onClick={() => !product.is_sold_out && openQuickView(product)}>
                      {product.image && <img src={product.image} alt={product.name} className="w-full h-full object-cover" />}
                      
                      {/* HEART ICON IN LIST VIEW */}
                      <button onClick={(e) => handleWishlistClick(e, product)} className="absolute top-2 right-2 z-10 p-1.5 bg-white/90 backdrop-blur-sm shadow-sm rounded-full text-black hover:scale-110 transition-transform">
                        <svg className="w-3.5 h-3.5" fill={inWishlist ? "black" : "none"} stroke={inWishlist ? "black" : "currentColor"} strokeWidth="1.5" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12z" /></svg>
                      </button>

                      {product.is_sold_out && (
                        <div className="absolute inset-0 bg-black/40 flex items-center justify-center"><span className="text-[7px] tracking-widest text-zinc-300 uppercase bg-black/80 px-2 py-1 rounded-sm">Sold Out</span></div>
                      )}
                    </div>
                    
                    <div className="flex-1 flex flex-col justify-center text-left space-y-1 sm:space-y-2 relative">
                      <h3 className="text-[10px] sm:text-[11px] tracking-[0.15em] uppercase font-medium text-black">{product.name}</h3>
                      <p className="text-[11px] sm:text-[12px] font-normal tracking-wider text-zinc-500">₦{Number(product.price).toLocaleString()}</p>
                      
                      <div className="flex items-center gap-2 pt-1">
                        <button onClick={(e) => { e.stopPropagation(); setInlineAddId(product.id); }} disabled={product.is_sold_out} className="px-4 py-2 border border-zinc-200 bg-white hover:bg-black hover:text-white text-black transition-colors duration-300 rounded-sm disabled:opacity-30 tracking-[0.2em] text-[8px] sm:text-[9px] uppercase font-medium whitespace-nowrap">Add To Bag</button>
                      </div>

                      {inlineAddId === product.id && (
                        <div className="absolute inset-0 bg-white border border-zinc-200 p-4 z-20 text-black rounded-sm flex flex-col justify-center animate-fade-in">
                           <button onClick={(e) => { e.stopPropagation(); setInlineAddId(null); }} className="absolute top-2 right-2 text-zinc-400 hover:text-black">✕</button>
                           <div className="flex gap-2 mb-3">
                              {['S', 'M', 'L'].map(s => (
                                <button key={s} onClick={(e) => { e.stopPropagation(); setInlineSize(s); }} className={`w-8 h-8 flex items-center justify-center text-[10px] border transition-colors ${inlineSize === s ? 'bg-black text-white border-black' : 'border-zinc-200 hover:border-black'}`}>{s}</button>
                              ))}
                           </div>
                           <div className="flex items-center gap-4">
                              <div className="flex items-center border border-zinc-200 w-[80px]">
                                <button onClick={(e) => { e.stopPropagation(); setInlineQty(Math.max(1, inlineQty - 1)); }} className="flex-1 py-1 hover:bg-zinc-50">-</button>
                                <span className="flex-1 text-center text-[10px]">{inlineQty}</span>
                                <button onClick={(e) => { e.stopPropagation(); setInlineQty(inlineQty + 1); }} className="flex-1 py-1 hover:bg-zinc-50">+</button>
                              </div>
                              <button onClick={(e) => handleInlineAdd(e, product)} className="bg-black text-white px-4 py-2 text-[9px] tracking-widest uppercase hover:bg-zinc-800 font-medium">Add</button>
                           </div>
                        </div>
                      )}
                    </div>
                  </div>
                );
              }

              return (
                <div key={product.id} className="group flex flex-col relative bg-white p-1">
                  <div className="bg-zinc-50 aspect-[3/4] w-full overflow-hidden relative flex items-center justify-center rounded-sm cursor-pointer border border-zinc-100" onClick={() => !product.is_sold_out && openQuickView(product)}>
                    {product.image && <img src={product.image} alt={product.name} className="w-full h-full object-cover transition-transform duration-[1000ms] group-hover:scale-102" />}
                    
                    {/* HEART ICON IN GRID VIEW */}
                    <button onClick={(e) => handleWishlistClick(e, product)} className="absolute top-3 right-3 z-10 p-1.5 bg-white/90 backdrop-blur-sm shadow-sm rounded-full text-black hover:scale-110 transition-transform">
                      <svg className="w-3.5 h-3.5" fill={inWishlist ? "black" : "none"} stroke={inWishlist ? "black" : "currentColor"} strokeWidth="1.5" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12z" /></svg>
                    </button>

                    <div className={`absolute inset-0 bg-white/95 backdrop-blur-sm flex flex-col items-center justify-center p-4 z-20 text-black transition-opacity duration-300 ${inlineAddId === product.id ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'}`}>
                      <button onClick={(e) => { e.stopPropagation(); setInlineAddId(null); }} className="absolute top-3 right-3 text-zinc-400 hover:text-black">✕</button>
                      <p className="text-[8px] uppercase tracking-[0.2em] text-zinc-500 mb-2">Select Size</p>
                      <div className="flex gap-1.5 mb-4">
                        {['S', 'M', 'L'].map(s => (
                          <button key={s} onClick={(e) => { e.stopPropagation(); setInlineSize(s); }} className={`w-8 h-8 flex items-center justify-center text-[10px] border transition-colors ${inlineSize === s ? 'bg-black text-white border-black' : 'border-zinc-200 hover:border-black'}`}>{s}</button>
                        ))}
                      </div>
                      <div className="flex items-center border border-zinc-200 mb-4 w-full max-w-[100px]">
                        <button onClick={(e) => { e.stopPropagation(); setInlineQty(Math.max(1, inlineQty - 1)); }} className="flex-1 py-1 text-[10px] hover:bg-zinc-100">-</button>
                        <span className="flex-1 text-center text-[9px]">{inlineQty}</span>
                        <button onClick={(e) => { e.stopPropagation(); setInlineQty(inlineQty + 1); }} className="flex-1 py-1 text-[10px] hover:bg-zinc-100">+</button>
                      </div>
                      <button onClick={(e) => handleInlineAdd(e, product)} className="w-full bg-black text-white py-2.5 text-[8px] sm:text-[9px] tracking-widest uppercase hover:bg-zinc-800 font-medium transition-colors">Confirm & Add</button>
                    </div>

                    {inlineAddId !== product.id && (
                      <div className="absolute inset-0 bg-black/[0.02] opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center z-10">
                        <div className="flex gap-2 bg-white p-1.5 rounded-sm border border-zinc-100">
                          <button onClick={(e) => { e.stopPropagation(); setInlineAddId(product.id); }} disabled={product.is_sold_out} className="p-2 text-black hover:text-zinc-500 transition-colors">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M15.75 10.5V6a3.75 3.75 0 10-7.5 0v4.5m11.356-1.993l1.263 12c.07.665-.45 1.243-1.119 1.243H4.25a1.125 1.125 0 01-1.12-1.243l1.264-12A1.125 1.125 0 015.513 7.5h12.974c.576 0 1.059.435 1.119 1.007z"/></svg>
                          </button>
                          <button onClick={(e) => { e.stopPropagation(); openQuickView(product); }} className="p-2 text-black hover:text-zinc-500 transition-colors border-l border-zinc-200">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z"/><path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/></svg>
                          </button>
                        </div>
                      </div>
                    )}

                    {product.is_sold_out && (
                      <div className="absolute inset-0 bg-white/60 flex items-center justify-center pointer-events-none z-10"><div className="w-14 h-14 rounded-full bg-white border border-zinc-200 flex items-center justify-center"><span className="text-[8px] tracking-[0.15em] uppercase text-zinc-400">Sold Out</span></div></div>
                    )}
                  </div>
                  <div className="flex flex-col gap-0.5 mt-3 text-center pb-1 px-1 bg-white">
                    <h3 className="text-[8px] sm:text-[10px] tracking-[0.15em] uppercase text-zinc-500 truncate">{product.name}</h3>
                    <p className="text-[9px] sm:text-[11px] tracking-widest text-black font-medium">₦{Number(product.price).toLocaleString()}</p>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>

      {/* --- IN-PAGE GUEST WISHLIST AUTHENTICATION MODAL --- */}
      {showWishlistAuthModal && (
        <div className="fixed inset-0 z- bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-white text-black max-w-sm w-full p-8 shadow-2xl relative">
            <button onClick={() => setShowWishlistAuthModal(false)} className="absolute top-4 right-4 text-zinc-400 hover:text-black">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12"/></svg>
            </button>
            
            <div className="text-center mb-6">
              <h2 className="text-base font-normal tracking-[0.2em] uppercase font-serif mb-2">Archive Access</h2>
              <p className="text-[10px] tracking-widest uppercase text-zinc-500 leading-relaxed">
                Connect a profile to secure items to your permanent wishlist.
              </p>
            </div>

            <form onSubmit={handleGuestWishlistAuth} className="space-y-4">
              <input 
                type="email" 
                value={authEmail} 
                onChange={(e) => setAuthEmail(e.target.value)} 
                placeholder="EMAIL ADDRESS" 
                required 
                className="w-full bg-white p-4 border border-zinc-300 focus:border-black outline-none text-base uppercase tracking-widest"
              />
              <input 
                type="password" 
                value={authPassword} 
                onChange={(e) => setAuthPassword(e.target.value)} 
                placeholder="PASSWORD" 
                required 
                className="w-full bg-white p-4 border border-zinc-300 focus:border-black outline-none text-base uppercase tracking-widest"
              />
              <button 
                type="submit" 
                disabled={isAuthenticating}
                className="w-full bg-black text-white py-4 text-[10px] tracking-[0.25em] uppercase hover:bg-zinc-800 transition-colors font-medium disabled:opacity-50 mt-2"
              >
                {isAuthenticating ? 'SECURING PROFILE...' : 'CONTINUE SHOPPING'}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* DETAILED PRODUCT OVERLAY MODAL */}
      {quickViewProduct && (
        <div className="fixed inset-0 z- overflow-y-auto bg-black/60 backdrop-blur-sm">
          <div className="flex min-h-full items-start justify-center p-4 sm:p-6">
            <div className="bg-white text-black w-full max-w-3xl flex flex-col relative border border-zinc-200 rounded-sm mt-4 sm:mt-10 mb-12 shadow-2xl">
              <button onClick={() => setQuickViewProduct(null)} className="absolute top-4 right-4 z-10 text-zinc-400 hover:text-black transition-colors bg-white/80 p-1.5 rounded-full border border-zinc-100 shadow-sm">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12"/></svg>
              </button>
              
              <div className="flex flex-col md:flex-row">
                <div className="w-full md:w-1/2 bg-zinc-50 aspect-[3/4] md:aspect-auto">
                  {quickViewProduct.image && <img src={quickViewProduct.image} alt="Preview" className="w-full h-full object-cover" />}
                </div>
                <div className="w-full md:w-1/2 p-6 sm:p-10 flex flex-col justify-center">
                  <h2 className="text-base font-normal tracking-[0.2em] uppercase mb-1 font-serif">{quickViewProduct.name}</h2>
                  <p className="text-xs tracking-widest font-medium mb-6 text-zinc-500">₦{quickViewProduct.price.toLocaleString()}</p>
                  
                  <div className="mb-5">
                    <span className="text-[8px] tracking-widest uppercase text-zinc-400 block mb-2">Size selection</span>
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

                  <button onClick={() => { addToCart(quickViewProduct, qty, selectedSize); setQuickViewProduct(null); }} className="w-full bg-black text-white py-3 text-[9px] tracking-[0.2em] uppercase hover:bg-zinc-800 transition-colors font-medium mb-4">
                    Add to Cart • ₦{(quickViewProduct.price * qty).toLocaleString()}
                  </button>
                </div>
              </div>

              {/* EXPANDABLE ACCORDION DYNAMIC DATABASE BINDING */}
              <div className="border-t border-zinc-100 bg-white p-6 sm:p-10 space-y-2">
                <div className="border border-zinc-200 rounded-sm overflow-hidden">
                  <button onClick={() => setOpenAccordion(openAccordion === 'description' ? '' : 'description')} className="w-full bg-zinc-50 px-4 py-3 flex justify-between items-center text-[10px] tracking-widest uppercase text-zinc-700 font-medium">
                    <span>Description</span>
                    <span>{openAccordion === 'description' ? '—' : '+'}</span>
                  </button>
                  {openAccordion === 'description' && (
                    <div className="p-4 text-zinc-500 text-[10px] leading-relaxed uppercase tracking-wide bg-white border-t border-zinc-100 whitespace-pre-wrap">
                      {quickViewProduct.description || "Embroidered mesh fuller silhouette piece with a micro structural alignment framing rule."}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* SLIDING MINI BAG CAROUSEL DRAWER */}
      <div className={`fixed inset-y-0 right-0 z- w-full sm:w-[400px] bg-[#0A0A0A] text-white shadow-2xl border-l border-zinc-900 transform transition-transform duration-500 ease-in-out ${isCartOpen ? 'translate-x-0' : 'translate-x-full'} flex flex-col`}>
        <div className="flex items-center justify-between p-6 border-b border-zinc-900 shrink-0">
          <h2 className="text-[11px] tracking-[0.2em] uppercase font-medium">Shopping Cart ({cartItemCount})</h2>
          <button onClick={() => setIsCartOpen(false)} className="text-zinc-500 hover:text-white transition-colors">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12"/></svg>
          </button>
        </div>
        
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {cart.length === 0 ? (
            <div className="text-center text-zinc-600 text-[10px] tracking-widest uppercase mt-10">Your bag is empty.</div>
          ) : (
            cart.map((item, idx) => (
              <div key={`${item.id}-${item.size}-${idx}`} className="flex gap-4">
                <div className="w-20 h-28 bg-[#111] shrink-0 border border-zinc-800">
                  {item.image && <img src={item.image} alt={item.name} className="w-full h-full object-cover" />}
                </div>
                <div className="flex-1 flex flex-col justify-between py-1">
                  <div>
                    <h3 className="text-[10px] tracking-widest uppercase font-medium">{item.name}</h3>
                    <p className="text-[10px] text-zinc-500 mt-1 uppercase">Size: {item.size}</p>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] tracking-wider font-medium text-zinc-300">₦{item.price.toLocaleString()}</span>
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
            <div className="flex justify-between mb-6 text-xs uppercase tracking-widest">
              <span className="text-zinc-500">Subtotal:</span>
              <span className="font-medium text-white">₦{cartSubtotal.toLocaleString()}</span>
            </div>
            <div className="flex gap-3">
              <button onClick={() => setIsCartOpen(false)} className="flex-1 border border-white text-white text-center py-4 text-[9px] tracking-[0.2em] uppercase hover:bg-white hover:text-black transition-colors">
                Continue
              </button>
              <Link href="/checkout" onClick={() => setIsCartOpen(false)} className="flex-1 bg-white text-black text-center py-4 text-[9px] tracking-[0.2em] uppercase hover:bg-zinc-300 transition-colors">
                Checkout
              </Link>
            </div>
          </div>
        )}
      </div>
      {isCartOpen && <div className="fixed inset-0 bg-black/40 z- backdrop-blur-sm transition-opacity" onClick={() => setIsCartOpen(false)}></div>}

      {/* STICKY BOTTOM QUICK CHECKOUT BAR */}
      <div className={`fixed bottom-0 left-0 w-full z- transition-transform duration-500 ease-in-out ${cart.length > 0 ? 'translate-y-0' : 'translate-y-full'}`}>
        <div className="bg-[#0A0A0A] text-white h-[72px] sm:h-[80px] w-full border-t border-zinc-800 flex items-center justify-center shadow-lg">
          <div className="w-full max-w-[1600px] mx-auto px-6 sm:px-12 flex items-center justify-between">
            <div className="flex items-center gap-4 sm:gap-8">
              <span className="text-[10px] sm:text-xs tracking-[0.2em] uppercase font-light text-zinc-300 flex items-center gap-2">
                <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse hidden sm:block"></span>
                {cartItemCount} Item{cartItemCount > 1 ? 's' : ''}
              </span>
              <span className="text-zinc-700 hidden sm:inline">|</span>
              <span className="text-[11px] sm:text-sm tracking-widest font-medium">
                ₦{cartSubtotal.toLocaleString()}
              </span>
            </div>
            <Link href="/checkout" className="bg-white text-black px-6 sm:px-12 py-3.5 sm:py-4 text-[9px] sm:text-[10px] tracking-[0.3em] uppercase font-medium hover:bg-zinc-200 transition-colors">
              CHECK OUT &rarr;
            </Link>
          </div>
        </div>
      </div>

      {/* DYNAMIC TWO-STAGE INTERACTIVE CONVERSION POPUP MODAL (DESKTOP HORIZONTAL SPLIT) */}
      <div className={`fixed inset-0 z- overflow-y-auto bg-black/60 backdrop-blur-sm transition-opacity duration-500 ${showNewsletter ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'}`}>
        <div className="flex min-h-full items-center justify-center p-4">
          <div className="w-full max-w-md md:max-w-4xl bg-white relative flex flex-col md:flex-row rounded-sm shadow-2xl my-8 overflow-hidden">
            
            <button onClick={() => { setShowNewsletter(false); sessionStorage.setItem('sikamore_newsletter', 'true'); }} className="absolute top-4 right-4 z-50 p-2 bg-white/80 md:bg-transparent rounded-full md:rounded-none text-black hover:text-zinc-500 transition-colors">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12"/></svg>
            </button>

            <div className="relative w-full md:w-1/2 flex flex-col shrink-0 border-b md:border-b-0 md:border-r border-zinc-200 min-h-[400px]">
              <div className="absolute inset-0 bg-black">
                {products.length > 0 && products?.image ? (
                  <img src={products.image} className="w-full h-full object-cover opacity-60" alt="Background" />
                ) : null}
              </div>
              
              <div className="relative z-10 p-8 sm:p-12 flex-1 flex flex-col justify-center text-center space-y-4 text-white">
                {!grabDiscountClicked ? (
                  <div className="animate-fade-in w-full max-w-[280px] mx-auto flex flex-col items-center">
                    <h3 className="text-2xl sm:text-3xl font-normal tracking-wide font-serif mb-2">Wait! before you leave...</h3>
                    <p className="text-[11px] tracking-widest text-zinc-200 mb-6">Get 10% off for your first order</p>
                    
                    <div className="bg-white text-black py-3 px-6 flex items-center justify-center gap-4 rounded-sm mb-6 w-full shadow-md">
                      <span className="font-sans text-[13px] tracking-widest font-bold">CODE20OFF</span>
                    </div>

                    <p className="text-[10px] leading-relaxed text-white mb-6">
                      Use above code to get 10% OFF for your first order when checkout
                    </p>

                    <button 
                      type="button" 
                      onClick={() => setGrabDiscountClicked(true)}
                      className="w-full bg-[#D31313] hover:bg-red-700 text-white py-3.5 text-[11px] tracking-[0.1em] font-medium transition-colors rounded-sm shadow-md"
                    >
                      Grab the discount
                    </button>
                  </div>
                ) : (
                  <div className="animate-fade-in w-full max-w-[280px] mx-auto flex flex-col items-center">
                    <h3 className="text-2xl sm:text-3xl font-normal tracking-wide font-serif mb-2">Secure Your Discount</h3>
                    <p className="text-[11px] tracking-widest text-zinc-200 mb-6">Enter email to join the registry</p>
                    
                    <form onSubmit={handlePopupSubscription} className="space-y-3 w-full">
                      <input 
                        type="email" 
                        value={subscriberEmail}
                        onChange={(e) => setSubscriberEmail(e.target.value)}
                        placeholder="YOUR EMAIL ADDRESS" 
                        required 
                        className="w-full bg-white/10 p-3.5 border border-white/30 text-white placeholder-zinc-300 outline-none text-base md:text-xs text-center tracking-widest uppercase focus:border-white rounded-sm backdrop-blur-sm"
                      />
                      <button 
                        type="submit" 
                        disabled={submittingEmail}
                        className="w-full bg-[#D31313] text-white py-3.5 text-[11px] tracking-[0.1em] font-medium hover:bg-red-700 disabled:opacity-40 rounded-sm transition-colors shadow-md"
                      >
                        {submittingEmail ? 'REGISTERING...' : 'SUBMIT REGISTRY'}
                      </button>
                    </form>
                  </div>
                )}
              </div>
            </div>

            <div className="w-full md:w-1/2 bg-white p-6 sm:p-10 flex flex-col">
              <div className="flex justify-between items-center mb-6">
                 <h4 className="text-[14px] font-medium text-black">Recommended Products</h4>
                 <div className="w-6 h-6"></div> 
              </div>
              
              <div className="space-y-5 flex-1 overflow-y-auto">
                {products.slice(0, 3).map((recProd) => (
                  <div 
                    key={recProd.id} 
                    onClick={() => { setShowNewsletter(false); openQuickView(recProd); }}
                    className="flex gap-5 items-center bg-white p-0 cursor-pointer group"
                  >
                    <div className="w-[72px] h-[90px] bg-zinc-100 shrink-0 overflow-hidden border border-zinc-100">
                      {recProd.image && <img src={recProd.image} alt={recProd.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />}
                    </div>
                    <div className="flex-1 text-left min-w-0">
                      <div className="flex text-zinc-300 text-[10px] mb-1.5">
                        ★ ★ ★ ★ ★ <span className="text-zinc-400 ml-1 font-mono">(0)</span>
                      </div>
                      <h5 className="text-[11px] font-medium uppercase tracking-wider text-black truncate mb-1">{recProd.name}</h5>
                      <p className="text-[12px] text-black font-semibold tracking-wide">₦{Number(recProd.price).toLocaleString()}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

          </div>
        </div>
      </div>

      {/* GRAND FOOTER SYSTEM */}
      <footer className="border-t border-zinc-200 bg-white pt-16 pb-12 mt-16 sm:mt-20 text-black relative z-40">
        <div className="max-w-[1600px] mx-auto px-4 sm:px-8 mb-12 text-center border-b border-zinc-100 pb-12">
          <h2 className="text-xl sm:text-3xl tracking-[0.5em] uppercase font-normal text-black pl-[0.5em] select-none font-serif font-bold">
            S. SIKAMÒRE
          </h2>
        </div>
        <div className="max-w-[1600px] mx-auto px-4 sm:px-8 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-10 sm:gap-12 text-zinc-500 font-light tracking-widest">
          <div className="flex flex-col gap-3">
            <h4 className="text-black text-[10px] tracking-[0.2em] font-medium uppercase">Information Outline</h4>
            <p className="leading-relaxed text-[10px] text-zinc-400">Curated high-fashion textiles and ready-to-wear luxury conceptualized for the modern vanguard.</p>
            <p className="text-[9px] text-zinc-600 pt-1">Email: contact@sikamoreofficial.com</p>
          </div>
          <div className="flex flex-col gap-2.5 text-[10px]">
            <h4 className="text-black text-[10px] tracking-[0.2em] font-medium uppercase mb-1">Help</h4>
            <Link href="/contact" className="hover:text-black cursor-pointer transition-colors">Contact Us</Link>
            <Link href="/about" className="hover:text-black cursor-pointer transition-colors">About Us</Link>
            <span className="hover:text-black cursor-pointer transition-colors">Privacy Policy</span>
            <span className="hover:text-black cursor-pointer transition-colors">Terms & Conditions</span>
          </div>
          <div className="flex flex-col gap-2.5 text-[10px]">
            <h4 className="text-black text-[10px] tracking-[0.2em] font-medium uppercase mb-1">Useful Links</h4>
            <span className="hover:text-black cursor-pointer transition-colors">Dresses</span>
            <span className="hover:text-black cursor-pointer transition-colors">Bottoms</span>
            <span className="hover:text-black cursor-pointer transition-colors">Tops</span>
            <span className="hover:text-black cursor-pointer transition-colors">Blazers</span>
          </div>
          <div className="flex flex-col gap-3">
            <h4 className="text-black text-[10px] tracking-[0.2em] font-medium uppercase">Sign up for email</h4>
            <p className="text-[10px] text-zinc-400 leading-relaxed">Stay informed about the latest releases and luxury lookbooks.</p>
            <form onSubmit={async (e) => { e.preventDefault(); showToast('Email submitted.'); }} className="flex border-b border-zinc-200 py-1.5 mt-1">
              <input type="email" placeholder="Your email address" required className="w-full bg-transparent border-0 outline-none placeholder-zinc-300 text-base md:text-[10px] text-black tracking-widest uppercase font-light" />
              <button type="submit" className="text-[9px] font-medium tracking-widest text-black uppercase hover:text-zinc-500 transition-colors">Subscribe</button>
            </form>
          </div>
        </div>
      </footer>
    </div>
  );
}
