'use client';
export const dynamic = 'force-dynamic';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { supabase } from '../lib/supabase';

export default function Home() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchProducts() {
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .order('created_at', { ascending: false });

      if (data) setProducts(data);
      setLoading(false);
    }
    fetchProducts();
  }, []);

  return (
    <div className="min-h-screen bg-white text-black font-sans">
      
      {/* NAVBAR */}
      <nav className="bg-black text-white px-8 py-5 flex items-center justify-between text-[10px] tracking-[0.2em] uppercase w-full">
        <div className="flex gap-8">
          <Link href="#" className="hover:text-gray-400 transition-colors duration-300">SHOP ALL</Link>
          <Link href="#" className="hover:text-gray-400 transition-colors duration-300">COLLECTIONS</Link>
        </div>
        
        {/* LOGO AREA */}
        <div className="text-sm tracking-[0.3em] font-light">
          S. SIKAMÒRE
        </div>
        
        <div className="flex gap-8 items-center">
          <Link href="/admin" className="border border-gray-700 px-6 py-2 hover:bg-white hover:text-black transition-all duration-300">
            DASHBOARD
          </Link>
          <Link href="#" className="hover:text-gray-400 transition-colors duration-300">
            CART ({products.length})
          </Link>
        </div>
      </nav>

      {/* MAIN CONTENT */}
      <main className="max-w-[1400px] mx-auto px-8 py-16">
        <h1 className="text-center text-3xl font-light tracking-[0.25em] mb-16 uppercase">
          THE S. SIKAMÒRE COLLECTION
        </h1>

        {/* TOOLBAR */}
        <div className="flex justify-between items-center text-[10px] tracking-[0.2em] text-gray-500 border-b border-gray-100 pb-4 mb-16 uppercase">
          <span>SHOWING {products.length} ITEMS</span>
          <div className="flex items-center gap-4">
            <span>GRID:</span>
            <div className="flex gap-2">
              {/* List Icon Mockup */}
              <div className="flex gap-[2px] cursor-pointer hover:opacity-60 transition-opacity">
                <div className="w-[6px] h-[14px] bg-gray-300"></div>
                <div className="w-[6px] h-[14px] bg-gray-300"></div>
              </div>
              {/* Grid Icon Mockup */}
              <div className="grid grid-cols-2 gap-[2px] cursor-pointer hover:opacity-60 transition-opacity">
                <div className="w-[6px] h-[6px] bg-black"></div><div className="w-[6px] h-[6px] bg-black"></div>
                <div className="w-[6px] h-[6px] bg-black"></div><div className="w-[6px] h-[6px] bg-black"></div>
              </div>
            </div>
          </div>
        </div>

        {/* PRODUCTS GRID / EMPTY STATE */}
        {loading ? (
          <div className="text-center text-[10px] tracking-[0.2em] text-gray-400 uppercase animate-pulse mt-32">
            Loading Collection...
          </div>
        ) : products.length === 0 ? (
          <div className="text-center text-[10px] tracking-[0.2em] text-gray-400 uppercase mt-32">
            NO PRODUCTS FOUND. USE THE /ADMIN PANEL TO ADD YOUR FIRST ITEM!
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-x-6 gap-y-12">
            {products.map((product) => (
              <div key={product.id} className="group cursor-pointer">
                <div className="aspect-[3/4] w-full overflow-hidden bg-gray-50">
                  <img 
                    src={product.image} 
                    alt={product.name} 
                    className="h-full w-full object-cover object-center group-hover:scale-105 transition-transform duration-700 ease-in-out" 
                  />
                </div>
                <div className="mt-4 text-center">
                  <h3 className="text-[11px] font-medium tracking-[0.2em] uppercase text-black">{product.name}</h3>
                  <p className="mt-2 text-[10px] tracking-[0.15em] text-gray-500">₦ {product.price.toLocaleString()}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
