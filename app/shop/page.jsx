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

  // SEARCH OVERLAY STATE
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);

  // PRODUCT VIEW MODAL
  const [quickViewProduct, setQuickViewProduct] = useState(null);
  const [openAccordion, setOpenAccordion] = useState('description');

  // GUEST AUTH MODAL STATES (For Cart & Wishlist)
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [pendingAction, setPendingAction] = useState(null); // { type: 'cart' | 'wishlist', product: object }
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

  // Quick View States
  const [selectedSize, setSelectedSize] = useState('M');
  const [qty, setQty] = useState(1);

  const [inlineAddId, setInlineAddId] = useState(null);
  const [inlineSize, setInlineSize] = useState('M');
  const [inlineQty, setInlineQty] = useState(1);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        setUserSession(session.user);
      } else {
        const localUser = localStorage.getItem('sikamore_user_profile');
        if (localUser) {
          setUserSession(JSON.parse(localUser)); 
        }
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

  // INLINE ADD TO CART (For Modal/Overlay - No Drawer)
  const handleInlineAdd = (e, product) => {
    e.preventDefault();
    e.stopPropagation();
    addToCart(product, inlineQty, inlineSize);
    setInlineAddId(null);
    setInlineQty(1);
    setInlineSize('M');
    showToast('Added to your bag.');
  };

  // GRID ADD TO CART LOGIC (No Drawer)
  const handleCartClick = (e, product) => {
    e.preventDefault();
    e.stopPropagation();
    
    const localUser = localStorage.getItem('sikamore_user_profile');
    if (userSession || localUser) {
      // User is logged in. Add to cart instantly, DO NOT open drawer.
      addToCart(product, 1, 'M'); // Defaulting to 1 quantity, Size M for instant add.
      showToast('Added to your bag.');
    } else {
      // User is not logged in. Pop up the Auth Modal.
      setPendingAction({ type: 'cart', product });
      setShowAuthModal(true);
    }
  };

  // WISHLIST LOGIC
  const handleWishlistClick = (e, product) => {
    e.preventDefault();
    e.stopPropagation();
    
    const localUser = localStorage.getItem('sikamore_user_profile');
    if (userSession || localUser) {
      toggleWishlist(product);
      const isCurrentlyInWishlist = wishlist.some(w => w.id === product.id);
      showToast(isCurrentlyInWishlist ? 'Removed from your wishlist.' : 'Added to your beautifully curated wishlist.');
    } else {
      setPendingAction({ type: 'wishlist', product });
      setShowAuthModal(true);
    }
  };

  const handleGuestAuth = async (e) => {
    e.preventDefault();
    if (!authEmail || !authPassword) return;
    setIsAuthenticating(true);

    try {
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

      if (sessionData && sessionData.user) {
        setUserSession(sessionData.user);
        
        localStorage.setItem('sikamore_user_profile', JSON.stringify({
          email: sessionData.user.email,
          name: 'VALUED CLIENT'
        }));

        // Execute the pending action after successful login
        if (pendingAction) {
          if (pendingAction.type === 'wishlist') {
            toggleWishlist(pendingAction.product);
            showToast('Welcome! Your piece is safely stored in your wishlist.');
          } else if (pendingAction.type === 'cart') {
            addToCart(pendingAction.product, 1, 'M');
            showToast('Welcome! Item added to your bag.');
          }
        }
        
        setShowAuthModal(false);
        setAuthEmail('');
        setAuthPassword('');
        setPendingAction(null);
      }
    } catch (err) {
      showToast(`Oops, there was an issue: ${err.message}`);
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
      showToast('Thank you for joining our community.');
      setShowNewsletter(false);
      sessionStorage.setItem('sikamore_newsletter', 'true');
    } catch (err) {
      showToast(`Oops, there was an issue: ${err.message}`);
    } finally {
      setSubmittingEmail(false);
    }
  };

  return (
    <div className="min-h-screen bg-white text-black font-sans antialiased text-[11px] pb-24 relative">
      
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
              <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" /></svg>
            </button>
            <Link href="/admin" className="tracking-[0.2em] text-zinc-500 hover:text-black uppercase text-[9px] sm:text-[10px] hidden sm:inline-block">Atelier</Link>
          </div>
          
          <div className="flex-none flex items-center justify-center">
            <Link href="/" className="text-[13px] sm:text-xl font-normal tracking-[0.3em] sm:tracking-[0.4em] uppercase font-serif text-center text-black pl-[0.3em] whitespace-nowrap">S. SIKAMÒRE</Link>
          </div>
          
          <div className="flex-1 flex items-center justify-end gap-3 sm:gap-6">
            <button onClick={() => setIsSearchOpen(true)} className="hover:text-zinc-500 transition-colors p-1">
              <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" /></svg>
            </button>
            
            <Link href="/dashboard?tab=wishlist" className="relative hover:text-zinc-500 transition-colors p-1 flex items-center">
              <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12z" />
              </svg>
              {wishlist.length > 0 && <span className="absolute -top-1 -right-1.5 w-3.5 h-3.5 bg-[#D31313] text-white flex items-center justify-center rounded-full text-[7.5px] font-bold">{wishlist.length}</span>}
            </Link>

            <Link href="/dashboard" className="relative hover:text-zinc-500 transition-colors p-1 flex items-center">
              <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" /></svg>
              {hasUnreadSupport && <span className="absolute top-0 right-0 w-2 h-2 bg-red-600 rounded-full animate-pulse"></span>}
            </Link>

            {/* HEADER CART ICON - OPENS DRAWER */}
            <button onClick={() => setIsCartOpen(true)} className="relative hover:text-zinc-500 transition-colors p-1 flex items-center">
              <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M15.75 10.5V6a3.75 3.75 0 10-7.5 0v4.5m11.356-1.993l1.263 12c.07.665-.45 1.243-1.119 1.243H4.25a1.125 1.125 0 01-1.12-1.243l1.264-12A1.125 1.125 0 015.513 7.5h12.974c.576 0 1.059.435 1.119 1.007z" /></svg>
              {cartItemCount > 0 && <span className="absolute -top-1 -right-1.5 w-3.5 h-3.5 bg-black text-white flex items-center justify-center rounded-full text-[7.5px] font-bold">{cartItemCount}</span>}
            </button>
          </div>
          
        </div>
      </header>

      {/* 2-STAGE NEWSLETTER POPUP MODAL */}
      {showNewsletter && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in" style={{ zIndex: 999999 }}>
          <div className="bg-white text-black max-w-4xl w-full flex flex-col md:flex-row relative shadow-2xl max-h-[90vh] overflow-hidden">
            <button onClick={() => setShowNewsletter(false)} className="absolute top-4 right-4 z-10 text-zinc-400 hover:text-black bg-white/80 p-1.5 rounded-full shadow-sm transition-colors">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12"/></svg>
            </button>
            
            <div className="w-full md:w-1/2 h-56 md:h-auto bg-zinc-100 relative shrink-0">
              <img src="https://images.unsplash.com/photo-1490481651871-ab68de25d43d?q=80&w=2070&auto=format&fit=crop" alt="10% Off Promotion" className="w-full h-full object-cover" />
              <div className="absolute inset-0 bg-black/20 flex items-center justify-center p-6">
                <span className="bg-white/10 text-white border border-white/40 backdrop-blur-md px-6 py-3 text-sm md:text-base tracking-[0.3em] uppercase font-medium shadow-2xl text-center">
                  Unlock 10% Off
                </span>
              </div>
            </div>

            <div className="w-full md:w-1/2 p-8 md:p-14 flex flex-col justify-center text-center bg-white overflow-y-auto">
              {!grabDiscountClicked ? (
                <div className="animate-fade-in">
                  <h2 className="text-xl md:text-2xl font-normal tracking-[0.2em] uppercase font-serif mb-4">A Gift For You</h2>
                  <p className="text-[10px] tracking-widest text-zinc-500 uppercase leading-relaxed mb-8">
                    Join the Sikamòre circle to receive exclusive access to new arrivals, bespoke styling inspiration, and a complimentary 10% off your first atelier purchase.
                  </p>
                  <button onClick={() => setGrabDiscountClicked(true)} className="w-full bg-black text-white py-4 text-[10px] tracking-[0.2em] uppercase hover:bg-zinc-800 transition-colors font-medium">
                    Reveal My 10% Discount
                  </button>
                </div>
              ) : (
                <div className="animate-fade-in">
                  <h2 className="text-xl md:text-2xl font-normal tracking-[0.2em] uppercase font-serif mb-4">Welcome to the Circle</h2>
                  <p className="text-[10px] tracking-widest text-zinc-500 uppercase leading-relaxed mb-8">
                    Enter your email to receive your 10% off code and finalize your subscription.
                  </p>
                  <form onSubmit={handlePopupSubscription} className="space-y-4">
                    <input 
                      type="email" 
                      value={subscriberEmail}
                      onChange={(e) => setSubscriberEmail(e.target.value)}
                      placeholder="EMAIL ADDRESS" 
                      required 
                      className="w-full bg-white p-4 border border-zinc-300 focus:border-black outline-none text-xs uppercase tracking-widest text-center" 
                    />
                    <button type="submit" disabled={submittingEmail} className="w-full bg-black text-white py-4 text-[10px] tracking-[0.2em] uppercase hover:bg-zinc-800 transition-colors font-medium disabled:opacity-50">
                      {submittingEmail ? 'VERIFYING...' : 'SUBSCRIBE & CLAIM OFFER'}
                    </button>
                  </form>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* FIXED Z-INDEX: GUEST AUTHENTICATION MODAL */}
      {showAuthModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in" style={{ zIndex: 999999 }}>
          <div className="bg-white text-black max-w-sm w-full p-8 shadow-2xl relative">
            <button onClick={() => setShowAuthModal(false)} className="absolute top-4 right-4 text-zinc-400 hover:text-black">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12"/></svg>
            </button>
            <div className="text-center mb-6">
              <h2 className="text-base font-normal tracking-[0.2em] uppercase font-serif mb-2">Account Required</h2>
              <p className="text-[10px] tracking-widest uppercase text-zinc-500 leading-relaxed">
                Create or connect your profile to {pendingAction?.type === 'wishlist' ? 'save your favorite pieces' : 'add items to your bag'}.
              </p>
            </div>
            <form onSubmit={handleGuestAuth} className="space-y-4">
              <input type="email" value={authEmail} onChange={(e) => setAuthEmail(e.target.value)} placeholder="EMAIL ADDRESS" required className="w-full bg-white p-4 border border-zinc-300 focus:border-black outline-none text-base uppercase tracking-widest" />
              <input type="password" value={authPassword} onChange={(e) => setAuthPassword(e.target.value)} placeholder="PASSWORD" required className="w-full bg-white p-4 border border-zinc-300 focus:border-black outline-none text-base uppercase tracking-widest" />
              <button type="submit" disabled={isAuthenticating} className="w-full bg-black text-white py-4 text-[10px] tracking-[0.25em] uppercase hover:bg-zinc-800 transition-colors font-medium disabled:opacity-50 mt-2">
                {isAuthenticating ? 'CONNECTING...' : 'LOGIN OR CREATE ACCOUNT'}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* DETAILED PRODUCT OVERLAY MODAL */}
      {quickViewProduct && (
        <div className="fixed inset-0 overflow-y-auto bg-black/60 backdrop-blur-sm" style={{ zIndex: 9999999 }}>
          <div className="flex min-h-full items-start justify-center p-4 sm:p-6">
            <div className="bg-white text-black w-full max-w-3xl flex flex-col relative border border-zinc-200 rounded-sm mt-4 sm:mt-10 mb-12 shadow-2xl">
              <button onClick={() => setQuickViewProduct(null)} className="absolute top-4 right-4 z-10 text-zinc-400 hover:text-black transition-colors bg-white/80 p-1.5 rounded-full border border-zinc-100 shadow-sm">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12"/></svg>
              </button>
              
              <div className="flex flex-col md:flex-row">
                <div className="w-full md:w-1/2 bg-zinc-50 aspect-[3/4] md:aspect-auto">
                  {quickViewProduct.image && <img src={quickViewProduct.image} alt="Preview" className="w-full h-full object-cover" /> }
                </div>
                <div className="w-full md:w-1/2 p-6 sm:p-10 flex flex-col justify-center">
                  <div className="flex justify-between items-start mb-1">
                    <h2 className="text-base font-normal tracking-[0.2em] uppercase font-serif pr-4">{quickViewProduct.name}</h2>
                    <button onClick={(e) => handleWishlistClick(e, quickViewProduct)} className="text-black hover:scale-110 transition-transform mt-0.5 pointer-events-auto z-10">
                      <svg className="w-4 h-4 sm:w-5 sm:h-5" fill={wishlist.some(w => w.id === quickViewProduct.id) ? "#D31313" : "none"} stroke={wishlist.some(w => w.id === quickViewProduct.id) ? "#D31313" : "currentColor"} strokeWidth="1.5" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12z" /></svg>
                    </button>
                  </div>
                  <p className="text-xs tracking-widest font-medium mb-6 text-zinc-500">₦{quickViewProduct.price.toLocaleString()}</p>
                  
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
                  
                  {/* Inside Quick View - Standard Add to Cart doesn't open drawer, just updates header */}
                  <button onClick={(e) => { 
                      const localUser = localStorage.getItem('sikamore_user_profile');
                      if (userSession || localUser) {
                        addToCart(quickViewProduct, qty, selectedSize); 
                        setQuickViewProduct(null);
                        showToast('Added to your bag.');
                      } else {
                        setPendingAction({ type: 'cart', product: quickViewProduct });
                        setShowAuthModal(true);
                      }
                    }} 
                    className="w-full bg-black text-white py-3 text-[9px] tracking-[0.2em] uppercase hover:bg-zinc-800 transition-colors font-medium mb-4"
                  >
                    Add to Bag • ₦{(quickViewProduct.price * qty).toLocaleString()}
                  </button>
                </div>
              </div>

              {/* 4-TAB LUXURY EXPANDABLE ACCORDION */}
              <div className="border-t border-zinc-100 bg-white p-6 sm:p-10 space-y-2">
                <div className="border border-zinc-200 rounded-sm overflow-hidden">
                  <button onClick={() => setOpenAccordion(openAccordion === 'description' ? '' : 'description')} className="w-full bg-zinc-50 px-4 py-3 flex justify-between items-center text-[10px] tracking-widest uppercase text-zinc-700 font-medium transition-colors hover:bg-zinc-100">
                    <span>The Details</span>
                    <span className="text-zinc-400">{openAccordion === 'description' ? '—' : '+'}</span>
                  </button>
                  {openAccordion === 'description' && (
                    <div className="p-5 text-zinc-500 text-[10px] leading-relaxed uppercase tracking-wide bg-white border-t border-zinc-100 whitespace-pre-wrap animate-fade-in">
                      {quickViewProduct.description || "A beautifully detailed silhouette crafted to elevate your everyday wardrobe with effortless grace."}
                    </div>
                  )}
                </div>

                <div className="border border-zinc-200 rounded-sm overflow-hidden">
                  <button onClick={() => setOpenAccordion(openAccordion === 'additional' ? '' : 'additional')} className="w-full bg-zinc-50 px-4 py-3 flex justify-between items-center text-[10px] tracking-widest uppercase text-zinc-700 font-medium transition-colors hover:bg-zinc-100">
                    <span>More Information</span>
                    <span className="text-zinc-400">{openAccordion === 'additional' ? '—' : '+'}</span>
                  </button>
                  {openAccordion === 'additional' && (
                    <div className="p-5 text-zinc-500 text-[10px] leading-relaxed uppercase tracking-wide bg-white border-t border-zinc-100 whitespace-pre-wrap animate-fade-in">
                      {quickViewProduct.additional_information || "No additional styling or fit specifications provided by our atelier."}
                    </div>
                  )}
                </div>

                <div className="border border-zinc-200 rounded-sm overflow-hidden">
                  <button onClick={() => setOpenAccordion(openAccordion === 'policies' ? '' : 'policies')} className="w-full bg-zinc-50 px-4 py-3 flex justify-between items-center text-[10px] tracking-widest uppercase text-zinc-700 font-medium transition-colors hover:bg-zinc-100">
                    <span>Shipping & Returns</span>
                    <span className="text-zinc-400">{openAccordion === 'policies' ? '—' : '+'}</span>
                  </button>
                  {openAccordion === 'policies' && (
                    <div className="p-5 text-zinc-500 text-[10px] leading-relaxed uppercase tracking-wide bg-white border-t border-zinc-100 whitespace-pre-wrap animate-fade-in">
                      {quickViewProduct.store_policies || "Enjoy complimentary shipping on your favorites, thoughtfully packaged and delivered within 3-5 business days."}
                    </div>
                  )}
                </div>

                <div className="border border-zinc-200 rounded-sm overflow-hidden">
                  <button onClick={() => setOpenAccordion(openAccordion === 'inquiries' ? '' : 'inquiries')} className="w-full bg-zinc-50 px-4 py-3 flex justify-between items-center text-[10px] tracking-widest uppercase text-zinc-700 font-medium transition-colors hover:bg-zinc-100">
                    <span>Need Help?</span>
                    <span className="text-zinc-400">{openAccordion === 'inquiries' ? '—' : '+'}</span>
                  </button>
                  {openAccordion === 'inquiries' && (
                    <div className="p-5 text-zinc-500 text-[10px] leading-relaxed uppercase tracking-wide bg-white border-t border-zinc-100 whitespace-pre-wrap animate-fade-in">
                      {quickViewProduct.inquiries || "Looking for custom sizing or styling advice? Our concierge team is always here to help you."}
                    </div>
                  )}
                </div>
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
              <svg className="w-5 h-5 sm:w-6 sm:h-6 text-zinc-400 mr-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
              <input
                type="text"
                autoFocus
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full outline-none text-base sm:text-2xl text-black uppercase tracking-widest bg-transparent placeholder-zinc-300 font-light"
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
                 <svg className="w-12 h-12 opacity-20" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
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
                            {product.image && <img src={product.image} alt={product.name} className="w-full h-full object-cover transition-transform duration-[1000ms] lg:group-hover:scale-102" />}
                          </div>

                          {/* WISHLIST BUTTON */}
                          <button 
                            type="button"
                            onClick={(e) => handleWishlistClick(e, product)} 
                            className="absolute top-3 right-3 z-30 pointer-events-auto p-2 text-black hover:scale-110 active:scale-95 transition-transform"
                          >
                            <svg className="w-5 h-5 pointer-events-none" fill={inWishlist ? "#D31313" : "none"} stroke={inWishlist ? "#D31313" : "currentColor"} strokeWidth="1.5" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12z" />
                            </svg>
                          </button>

                          {/* FIXED STACKED ACTION BUTTONS */}
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
                                e.preventDefault(); 
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
                          <p className="text-[11px] sm:text-[13px] tracking-widest text-black font-medium">₦{Number(product.price).toLocaleString()}</p>
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

      {/* SLIDING MINI BAG CAROUSEL DRAWER - OPENS ON CART ICON CLICK OR CHECKOUT PILL CLICK */}
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
            {/* UPDATED CTAS IN SLIDE DRAWER */}
            <div className="flex gap-3">
              <button onClick={() => setIsCartOpen(false)} className="flex-1 border border-white text-white text-center py-4 text-[9px] tracking-[0.2em] uppercase hover:bg-white hover:text-black transition-colors">
                Continue Shopping
              </button>
              <Link href="/checkout" onClick={() => setIsCartOpen(false)} className="flex-1 bg-white text-black text-center flex items-center justify-center py-4 text-[9px] tracking-[0.2em] uppercase hover:bg-zinc-300 transition-colors font-bold">
                Proceed to Payment
              </Link>
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
          <Link href="/admin" onClick={() => setIsMenuOpen(false)} className="block py-1 hover:text-zinc-400 transition-colors">Atelier Management</Link>
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

      <main className="max-w-[1600px] mx-auto px-4 sm:px-8 py-6 sm:py-16 bg-white relative z-10">
        {loading ? (
          <div className="text-center py-32 tracking-[0.3em] text-zinc-500 uppercase text-[9px]">Preparing the Collection for You...</div>
        ) : (
          <div className={`grid ${isListView ? 'grid-cols-1 gap-y-6 max-w-xl mx-auto' : `grid-cols-2 ${viewCols === 2 ? 'md:grid-cols-2' : viewCols === 3 ? 'md:grid-cols-3' : 'md:grid-cols-3 lg:grid-cols-4'} gap-x-4 sm:gap-x-6 gap-y-8 sm:gap-y-12`}`}>
            {products.map((product) => {
              const inWishlist = wishlist.some(w => w.id === product.id);

              if (isListView) {
                return (
                  <div key={product.id} className="flex gap-4 sm:gap-6 bg-white p-3 border border-zinc-100 items-center relative group">
                    <div className="w-28 sm:w-36 aspect-[3/4] shrink-0 overflow-hidden relative bg-zinc-50 rounded-sm border border-zinc-100">
                      
                      <div className="absolute inset-0 z-10 cursor-pointer" onClick={(e) => { e.preventDefault(); e.stopPropagation(); if (!product.is_sold_out) openQuickView(product); }}>
                        {product.image && <img src={product.image} alt={product.name} className="w-full h-full object-cover" />}
                      </div>

                      {/* WISHLIST BUTTON (TOP RIGHT) */}
                      <button 
                        type="button"
                        onClick={(e) => handleWishlistClick(e, product)} 
                        className="absolute top-2 right-2 z-30 pointer-events-auto p-2 text-black hover:scale-110 active:scale-95 transition-transform"
                      >
                        <svg className="w-5 h-5 pointer-events-none" fill={inWishlist ? "#D31313" : "none"} stroke={inWishlist ? "#D31313" : "currentColor"} strokeWidth="1.5" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12z" />
                        </svg>
                      </button>

                      {product.is_sold_out && (
                        <div className="absolute inset-0 bg-black/40 flex items-center justify-center pointer-events-none z-20"><span className="text-[7px] tracking-widest text-zinc-300 uppercase bg-black/80 px-2 py-1 rounded-sm">Sold Out</span></div>
                      )}
                    </div>
                    
                    <div className="flex-1 flex flex-col justify-center text-left space-y-1 sm:space-y-2 relative">
                      <h3 className="text-[10px] sm:text-[11px] tracking-[0.15em] uppercase font-medium text-black">{product.name}</h3>
                      <p className="text-[11px] sm:text-[12px] font-normal tracking-wider text-zinc-500">₦{Number(product.price).toLocaleString()}</p>
                      
                      <div className="flex items-center gap-2 pt-1">
                        <button onClick={(e) => handleCartClick(e, product)} disabled={product.is_sold_out} className="px-4 py-2 border border-zinc-200 bg-white hover:bg-black hover:text-white text-black transition-colors duration-300 rounded-sm disabled:opacity-30 tracking-[0.2em] text-[8px] sm:text-[9px] uppercase font-medium whitespace-nowrap">Add To Bag</button>
                      </div>
                    </div>
                  </div>
                );
              }

              return (
                <div key={product.id} className="group flex flex-col relative bg-white pb-4">
                  
                  {/* WRAPPER */}
                  <div className="bg-zinc-50 aspect-[3/4] w-full overflow-hidden relative rounded-sm border border-zinc-100">
                    
                    <div 
                      className="absolute inset-0 z-10 cursor-pointer"
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        if (!product.is_sold_out) openQuickView(product);
                      }}
                    >
                      {product.image && <img src={product.image} alt={product.name} className="w-full h-full object-cover transition-transform duration-[1000ms] lg:group-hover:scale-102" />}
                    </div>
                    
                    {/* WISHLIST BUTTON (TOP RIGHT) */}
                    <button 
                      type="button"
                      onClick={(e) => handleWishlistClick(e, product)} 
                      className="absolute top-3 right-3 z-30 pointer-events-auto p-2 text-black hover:scale-110 active:scale-95 transition-transform"
                    >
                      <svg className="w-5 h-5 pointer-events-none" fill={inWishlist ? "#D31313" : "none"} stroke={inWishlist ? "#D31313" : "currentColor"} strokeWidth="1.5" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12z" />
                      </svg>
                    </button>

                    {/* FIXED STACKED ACTION BUTTONS */}
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
                          e.preventDefault(); 
                          e.stopPropagation(); 
                          openQuickView(product); 
                        }}
                        className="pointer-events-auto flex items-center justify-center bg-white border border-zinc-200 text-black h-8 w-32 rounded-sm text-[9px] uppercase tracking-widest hover:bg-zinc-100 active:scale-95 transition-all shadow-lg"
                      >
                        View Product
                      </button>
                    </div>

                    {/* SOLD OUT LAYER */}
                    {product.is_sold_out && (
                      <div className="absolute inset-0 bg-white/60 flex items-center justify-center pointer-events-none z-20"><div className="w-14 h-14 rounded-full bg-white border border-zinc-200 flex items-center justify-center"><span className="text-[8px] tracking-[0.15em] uppercase text-zinc-400">Sold Out</span></div></div>
                    )}
                  </div>

                  <div className="flex flex-col gap-1 mt-4 text-left px-1">
                    <h3 className="text-[10px] sm:text-[11px] tracking-[0.15em] uppercase text-zinc-800 truncate">{product.name}</h3>
                    <p className="text-[11px] sm:text-[13px] tracking-widest text-black font-medium">₦{Number(product.price).toLocaleString()}</p>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>

      {/* FLOATING CART SUMMARY PILL (OPENS DRAWER ON CLICK) */}
      {cartItemCount > 0 && (
        <div className="fixed bottom-6 left-1/2 transform -translate-x-1/2 w-[95%] sm:w-auto z-[90] pointer-events-auto animate-fade-in shadow-2xl">
          <div className="bg-black rounded-full flex items-center justify-between p-1.5 sm:p-2 border border-zinc-800 whitespace-nowrap">
            <div className="flex items-center gap-3 sm:gap-6 pl-4 sm:pl-6 pr-2">
              <span className="text-white text-[9px] sm:text-xs font-medium tracking-widest uppercase">
                Products Added - {cartItemCount}
              </span>
              <span className="text-zinc-500 hidden sm:inline">|</span>
              <span className="text-white text-[9px] sm:text-xs font-medium tracking-widest uppercase">
                Total - ₦{cartSubtotal.toLocaleString()}
              </span>
            </div>
            <button onClick={() => setIsCartOpen(true)} className="bg-white text-black px-6 sm:px-8 py-2.5 sm:py-3 rounded-full text-[9px] sm:text-xs font-bold uppercase tracking-widest hover:bg-zinc-200 transition-colors ml-4 shrink-0">
              Checkout
            </button>
          </div>
        </div>
      )}

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
            <p className="text-[9px] text-zinc-600 pt-1">Email: contact@sikamoreofficial.com</p>
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
