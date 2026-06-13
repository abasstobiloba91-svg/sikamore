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
  
  // NEW: GLOBAL NOTIFICATION STATE FOR UNREAD MESSAGES
  const [hasUnreadSupport, setHasUnreadSupport] = useState(false);

  // LOAD CART, WISHLIST & CHECK NOTIFICATIONS
  useEffect(() => {
    const savedCart = localStorage.getItem('sikamore_cart');
    const savedWishlist = localStorage.getItem('sikamore_wishlist');
    if (savedCart) try { setCart(JSON.parse(savedCart)); } catch (e) {}
    if (savedWishlist) try { setWishlist(JSON.parse(savedWishlist)); } catch (e) {}

    // Check for unread admin responses silently in the background
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
    setTimeout(() => setToastMessage(''), 3000);
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
      {toastMessage && (
        <div className="fixed bottom-10 left-1/2 -translate-x-1/2 z-[200] bg-[#0A0A0A] text-white px-6 py-3 text-[10px] tracking-[0.2em] uppercase font-medium shadow-2xl border border-zinc-800 animate-fade-in-up whitespace-nowrap">
          {toastMessage}
        </div>
      )}
    </AppContext.Provider>
  );
}

export const useApp = () => useContext(AppContext);
