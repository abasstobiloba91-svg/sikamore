'use client';

import { createContext, useContext, useState } from 'react';

const AppContext = createContext();

export function AppProvider({ children }) {
  const [cart, setCart] = useState([]);
  const [wishlist, setWishlist] = useState([]);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [quickViewProduct, setQuickViewProduct] = useState(null);

  // PREMIUM TOAST NOTIFICATION STATE
  const [toast, setToast] = useState({ visible: false, message: '' });

  const showToast = (message) => {
    setToast({ visible: true, message });
    setTimeout(() => {
      setToast((prev) => ({ ...prev, visible: false }));
    }, 4000); // Auto-hides after 4 seconds
  };

  const addToCart = (product, quantity = 1, size = 'M') => {
    setCart((prev) => {
      const existing = prev.find(item => item.id === product.id && item.size === size);
      if (existing) {
        return prev.map(item => 
          item.id === product.id && item.size === size 
            ? { ...item, quantity: item.quantity + quantity }
            : item
        );
      }
      return [...prev, { ...product, quantity, size }];
    });
    
    setQuickViewProduct(null);
    setIsCartOpen(true);
  };

  const removeFromCart = (productId, size) => {
    setCart((prev) => prev.filter(item => !(item.id === productId && item.size === size)));
  };

  const toggleWishlist = (product) => {
    setWishlist((prev) => {
      const exists = prev.find((item) => item.id === product.id);
      if (exists) {
        showToast(`${product.name} REMOVED FROM WISHLIST`);
        return prev.filter((item) => item.id !== product.id);
      }
      showToast(`${product.name} ADDED TO WISHLIST`);
      return [...prev, product];
    });
  };

  const clearCart = () => setCart([]);

  return (
    <AppContext.Provider value={{ 
      cart, wishlist, addToCart, removeFromCart, toggleWishlist, clearCart,
      isCartOpen, setIsCartOpen, quickViewProduct, setQuickViewProduct, showToast
    }}>
      {children}

      {/* S. SIKAMÒRE CUSTOM POPUP (TOAST) */}
      <div className={`fixed bottom-8 left-1/2 -translate-x-1/2 z- transition-all duration-500 ease-in-out ${toast.visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4 pointer-events-none'}`}>
        <div className="bg-black text-white border border-zinc-800 px-8 py-4 shadow-2xl flex items-center gap-6">
          <span className="text-[9px] uppercase tracking-[0.3em] font-light">{toast.message}</span>
          <button onClick={() => setToast({ visible: false, message: '' })} className="text-zinc-500 hover:text-white transition-colors">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M6 18L18 6M6 6l12 12"/></svg>
          </button>
        </div>
      </div>

    </AppContext.Provider>
  );
}

export function useApp() {
  return useContext(AppContext);
}
