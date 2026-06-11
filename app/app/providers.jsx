'use client';

import { createContext, useContext, useState, useEffect } from 'react';

const AppContext = createContext();

export function AppProvider({ children }) {
  const [cart, setCart] = useState([]);
  const [wishlist, setWishlist] = useState([]);

  // Add to cart with alert notification
  const addToCart = (product) => {
    setCart((prev) => [...prev, product]);
    alert(`${product.name} added to your bag.`);
  };

  // Toggle item inside wishlist
  const toggleWishlist = (product) => {
    setWishlist((prev) => {
      const exists = prev.find((item) => item.id === product.id);
      if (exists) {
        alert(`${product.name} removed from wishlist.`);
        return prev.filter((item) => item.id !== product.id);
      } else {
        alert(`${product.name} added to wishlist.`);
        return [...prev, product];
      }
    });
  };

  const clearCart = () => setCart([]);

  return (
    <AppContext.Provider value={{ cart, wishlist, addToCart, toggleWishlist, clearCart }}>
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  return useContext(AppContext);
}
