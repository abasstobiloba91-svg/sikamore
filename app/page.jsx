'use client';
export const dynamic = 'force-dynamic'; // Tells Vercel to always fetch fresh data instantly

import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

export default function Home() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  // Automatically fetch live products from your Supabase database
  useEffect(() => {
    async function fetchProducts() {
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .order('created_at', { ascending: false }); // Newest items first

      if (!error && data) {
        setProducts(data);
      }
      setLoading(false);
    }
    fetchProducts();
  }, []);

  return (
    <main className="max-w-[1600px] mx-auto px-6 py-12 bg-white min-h-screen">
      <div className="text-center mb-16">
        {/* Your Logo / Brand Name */}
        <h1 className="text-4xl font-light tracking-[0.2em] uppercase mb-4 text-black">
          S. SIKAMÒRE
        </h1>
        <h2 className="text-xs tracking-[0.3em] text-gray-400 uppercase">
          Official Collection
        </h2>
      </div>

      {loading ? (
        <div className="text-center py-24 text-xs tracking-widest text-gray-400 uppercase animate-pulse">
          Loading Collection...
        </div>
      ) : products.length === 0 ? (
        <div className="text-center py-24 text-xs tracking-widest text-gray-400 uppercase">
          Collection is empty. Upload your first piece in the Admin panel.
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-x-6 gap-y-12">
          {products.map((product) => (
            <div key={product.id} className="group relative cursor-pointer">
              <div className="aspect-[3/4] w-full overflow-hidden bg-gray-50 border border-gray-100">
                <img 
                  src={product.image} 
                  alt={product.name} 
                  className="h-full w-full object-cover object-center group-hover:scale-105 transition-transform duration-700" 
                />
              </div>
              <div className="mt-4 flex justify-between items-start">
                <div>
                  <h3 className="text-xs font-medium tracking-widest uppercase text-gray-900">{product.name}</h3>
                  <p className="mt-1 text-xs tracking-widest text-gray-500">₦{product.price.toLocaleString()}</p>
                </div>
                <button className="bg-black text-white px-4 py-2 text-[10px] tracking-widest uppercase hover:bg-gray-800 transition-colors">
                  Add to Cart
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </main>
  );
}
