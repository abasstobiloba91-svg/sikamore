'use client';

import { createContext, useContext, useState, useEffect } from 'react';

const AppContext = createContext();

export function AppProvider({ children }) {
  // 1. Initial states
  const [cart, setCart] = useState([]);
  const [wishlist, setWishlist] = useState([]);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [quickViewProduct, setQuickViewProduct] = useState(null);
  const [toastMessage, setToastMessage] = useState('');

  // 2. LOAD FROM LOCAL STORAGE ON MOUNT
  // We use useEffect so it runs safely on the client side without breaking Next.js hydration
  useEffect(() => {
    const savedCart = localStorage.getItem('sikamore_cart');
    const savedWishlist = localStorage.getItem('sikamore_wishlist');
    
    if (savedCart) {
      try { setCart(JSON.parse(savedCart)); } catch (e) {}
    }
    if (savedWishlist) {
      try { setWishlist(JSON.parse(savedWishlist)); } catch (e) {}
    }
  }, []);

  // 3. SAVE TO LOCAL STORAGE WHENEVER CART OR WISHLIST CHANGES
  useEffect(() => {
    localStorage.setItem('sikamore_cart', JSON.stringify(cart));
  }, [cart]);

  useEffect(() => {
    localStorage.setItem('sikamore_wishlist', JSON.stringify(wishlist));
  }, [wishlist]);

  // --- ACTIONS ---

  const addToCart = (product, quantity, size) => {
    setCart(prev => {
      // Check if exact item + size already exists in cart
      const existing = prev.find(item => item.id === product.id && item.size === size);
      
      if (existing) {
        // Just increase quantity
        return prev.map(item => 
          item.id === product.id && item.size === size 
            ? { ...item, quantity: item.quantity + quantity }
            : item
        );
      }
      // Add as new line item
      return [...prev, { ...product, quantity, size }];
    });
    
    // Default action is to open the cart (components can override this by immediately setting false)
    setIsCartOpen(true); 
    showToast('ADDED TO BAG.');
  };

  const removeFromCart = (id, size) => {
    setCart(prev => prev.filter(item => !(item.id === id && item.size === size)));
  };

  const clearCart = () => {
    setCart([]);
  };

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
      showToast
    }}>
      {children}
      
      {/* GLOBAL TOAST NOTIFICATION COMPONENT */}
      {toastMessage && (
        <div className="fixed bottom-10 left-1/2 -translate-x-1/2 z-[200] bg-[#0A0A0A] text-white px-6 py-3 text-[10px] tracking-[0.2em] uppercase font-medium shadow-2xl border border-zinc-800 animate-fade-in-up whitespace-nowrap">
          {toastMessage}
        </div>
      )}
    </AppContext.Provider>
  );
}

export const useApp = () => useContext(AppContext);
