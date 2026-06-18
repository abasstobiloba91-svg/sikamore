'use client';

import { createContext, useContext, useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
const supabase = createClient(supabaseUrl, supabaseAnonKey);

const AppContext = createContext();

export function AppProvider({ children }) {
  const [cart, setCart] = useState([]);
  const [wishlist, setWishlist] = useState([]);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [quickViewProduct, setQuickViewProduct] = useState(null);
  const [toastMessage, setToastMessage] = useState('');
  
  const [hasUnreadSupport, setHasUnreadSupport] = useState(false);

  useEffect(() => {
    const savedCart = localStorage.getItem('sikamore_cart');
    const savedWishlist = localStorage.getItem('sikamore_wishlist');
    if (savedCart) try { setCart(JSON.parse(savedCart)); } catch (e) {}
    if (savedWishlist) try { setWishlist(JSON.parse(savedWishlist)); } catch (e) {}

    const checkNotifications = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data } = await supabase
          .from('support_tickets')
          .select('id')
          .eq('email', user.email)
          .eq('has_unread_user', true);
        if (data && data.length > 0) setHasUnreadSupport(true);
      }
    };
    checkNotifications();
  }, []);

  useEffect(() => { localStorage.setItem('sikamore_cart', JSON.stringify(cart)); }, [cart]);
  useEffect(() => { localStorage.setItem('sikamore_wishlist', JSON.stringify(wishlist)); }, [wishlist]);

  const addToCart = (product, quantity, size) => {
    setCart(prev => {
      const existing = prev.find(item => item.id === product.id && item.size === size);
      if (existing) return prev.map(item => item.id === product.id && item.size === size ? { ...item, quantity: item.quantity + quantity } : item);
      return [...prev, { ...product, quantity, size }];
    });
    setIsCartOpen(true); 
    showToast('ADDED TO BAG.');
  };

  const removeFromCart = (id, size) => setCart(prev => prev.filter(item => !(item.id === id && item.size === size)));
  const clearCart = () => setCart([]);

  const toggleWishlist = (product) => {
    setWishlist(prev => {
      const exists = prev.some(item => item.id === product.id);
      if (exists) {
        showToast('REMOVED FROM WISHLIST.');
        return prev.filter(item => item.id !== product.id);
      }
      showToast('ADDED TO WISHLIST.');
      return [...prev, product];
    });
  };

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(''), 4500);
  };

  return (
    <AppContext.Provider value={{
      cart, addToCart, removeFromCart, clearCart,
      wishlist, toggleWishlist,
      isCartOpen, setIsCartOpen,
      quickViewProduct, setQuickViewProduct,
      toastMessage, showToast,
      hasUnreadSupport, setHasUnreadSupport
    }}>
      {children}
      
      {/* MODERN EDITORIAL NOTIFICATION CANVAS */}
      {toastMessage && (
        <div className="fixed top-6 left-1/2 -translate-x-1/2 z-[100000000] w-[90%] sm:max-w-md bg-white text-black px-5 py-4 rounded-sm shadow-[0_25px_60px_-15px_rgba(0,0,0,0.3)] border border-neutral-200/80 text-center transition-all duration-300 ease-out animate-fade-in whitespace-normal break-words">
          <div className="flex flex-col items-center justify-center gap-1.5">
            <span className="text-[7.5px] text-neutral-400 tracking-[0.35em] font-light uppercase select-none font-mono">— System Dispatch —</span>
            <p className="text-[10px] sm:text-[11px] leading-relaxed text-neutral-900 font-medium tracking-[0.15em] uppercase">
              {toastMessage}
            </p>
          </div>
        </div>
      )}
    </AppContext.Provider>
  );
}

export const useApp = () => useContext(AppContext);
