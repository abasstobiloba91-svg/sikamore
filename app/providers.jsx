'use client';

import { createContext, useContext, useState } from 'react';

const AppContext = createContext();

export function AppProvider({ children }) {
  const [cart, setCart] = useState([]);
  const [wishlist, setWishlist] = useState([]);
  
  // UI States for the new video flow
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [quickViewProduct, setQuickViewProduct] = useState(null);

  // Advanced Add to Cart (Handles quantities and variants)
  const addToCart = (product, quantity = 1, size = 'M') => {
    setCart((prev) => {
      // Check if exact item + size already exists
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
    
    // Close modal and auto-open the side drawer
    setQuickViewProduct(null);
    setIsCartOpen(true);
  };

  const removeFromCart = (productId, size) => {
    setCart((prev) => prev.filter(item => !(item.id === productId && item.size === size)));
  };

  const toggleWishlist = (product) => {
    setWishlist((prev) => {
      const exists = prev.find((item) => item.id === product.id);
      if (exists) return prev.filter((item) => item.id !== product.id);
      return [...prev, product];
    });
  };

  const clearCart = () => setCart([]);

  return (
    <AppContext.Provider value={{ 
      cart, wishlist, addToCart, removeFromCart, toggleWishlist, clearCart,
      isCartOpen, setIsCartOpen, quickViewProduct, setQuickViewProduct
    }}>
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  return useContext(AppContext);
}
