'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@supabase/supabase-js';
import Link from 'next/link';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
const supabase = createClient(supabaseUrl, supabaseAnonKey);

// THE PERFECT DESIGN FALLBACK: Your exact uploaded files mapped to a luxury collection
const HARDCODED_COLLECTION = [
  { id: 'p1', name: 'LUMIÈRE MAXI DRESS', price: 85000, image: '/product 1.jpeg', is_sold_out: false },
  { id: 'p2', name: 'ESPRIT SILK BLOUSE', price: 45000, image: '/Product 2.jpeg', is_sold_out: false },
  { id: 'p3', name: 'MONARCH TAILORED TROUSER', price: 60000, image: '/Product 3.jpeg', is_sold_out: false },
  { id: 'p4', name: 'NOIR COUTURE BLAZER', price: 125000, image: '/Product 4.jpeg', is_sold_out: false }
];

export default function Storefront() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchProducts() {
      try {
        const { data, error } = await supabase
          .from('products')
          .select('*')
          .order('created_at', { ascending: false });

        if (error) throw error;

        // If your database has items, use them; otherwise, load your beautiful public files
        if (data && data.length > 0) {
          setProducts(data);
        } else {
          setProducts(HARDCODED_COLLECTION);
        }
      } catch (err) {
        console.log('Using luxury fallback collection:', err);
        setProducts(HARDCODED_COLLECTION);
      } finally {
        setLoading(false);
      }
    }
    fetchProducts();
  }, []);

  return (
    <div className="min-h-screen bg-white text-black font-sans antialiased">
      {/* Premium Minimal Navigation Header */}
      <header className="border-b border-gray-100 sticky top-0 bg-white/80 backdrop-blur-md z-50">
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
          <Link href="/admin" className="text-[10px] tracking-[0.2em] text-gray-400 hover:text-black uppercase transition-colors">
            Portal
          </Link>
          
          {/* Your Formal Text Logo (Preserved and Perfected) */}
          <Link href="/" className="text-lg font-light tracking-[0.3em] uppercase text-center block pl-[0.3em]">
            S. SIKAMÒRE
          </Link>

          <div className="text-[10px] tracking-[0.2em] text-gray-400 uppercase">
            Bag (0)
          </div>
        </div>
      </header>

      {/* Hero Banner Banner */}
      <section className="bg-gray-50 py-16 text-center border-b border-gray-100">
        <p className="text-[10px] tracking-[0.4em] text-gray-400 uppercase mb-2">Summer / Autumn 2026</p>
        <h2 className="text-2xl font-light tracking-[0.15em] uppercase">The Core Collection</h2>
      </section>

      {/* Product Display Grid Layout */}
      <main className="max-w-7xl mx-auto px-6 py-16">
        {loading ? (
          <div className="text-center py-20 text-[10px] tracking-[0.2em] text-gray-400 uppercase">Loading Curation...</div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-x-6 gap-y-12">
            {products.map((product) => (
              <div key={product.id} className="group flex flex-col cursor-pointer">
                {/* Image Frame Container */}
                <div className="bg-gray-50 aspect-[3/4] w-full overflow-hidden mb-4 relative border border-gray-100">
                  <img
                    src={product.image}
                    alt={product.name}
                    className="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-700 ease-out"
                    onError={(e) => {
                      // If a database path breaks, smoothly default back to a public image format
                      e.target.src = '/product 1.jpeg';
                    }}
                  />
                  {product.is_sold_out && (
                    <span className="absolute top-3 right-3 bg-white px-2 py-1 text-[8px] tracking-widest uppercase border border-gray-200">
                      Sold Out
                    </span>
                  )}
                </div>

                {/* Typography Labels */}
                <div className="flex justify-between items-start pt-1">
                  <h3 className="text-[11px] tracking-[0.2em] uppercase font-light text-gray-800 group-hover:text-black transition-colors max-w-[75%] leading-relaxed">
                    {product.name}
                  </h3>
                  <p className="text-[11px] font-medium tracking-wide text-gray-600">
                    ₦{Number(product.price).toLocaleString()}
                  </p>
                </div>
                <span className="text-[9px] tracking-[0.15em] text-gray-400 mt-1 uppercase font-light">View Details</span>
              </div>
            ))}
          </div>
        )}
      </main>

      {/* Editorial House Footer */}
      <footer className="border-t border-gray-100 py-12 bg-gray-50 text-center">
        <p className="text-[9px] tracking-[0.2em] text-gray-400 uppercase">© 2026 S. SIKAMÒRE. ALL RIGHTS RESERVED.</p>
      </footer>
    </div>
  );
}
