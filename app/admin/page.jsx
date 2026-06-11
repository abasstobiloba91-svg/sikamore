'use client';
export const dynamic = 'force-dynamic';

import { useState } from 'react';
import { supabase } from '../../lib/supabase';
import Link from 'next/link';

export default function AdminDashboard() {
  const [name, setName] = useState('');
  const [price, setPrice] = useState('');
  const [imageFile, setImageFile] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      let imageUrl = '';

      if (imageFile) {
        // Upload to Supabase 'product-images' bucket
        const fileExt = imageFile.name ? imageFile.name.split('.').pop() : 'jpg';
        const fileName = `${Math.random()}.${fileExt}`;
        
        const { error: uploadError } = await supabase.storage
          .from('product-images')
          .upload(fileName, imageFile);

        if (uploadError) throw uploadError;

        // Get public URL
        const { data } = supabase.storage.from('product-images').getPublicUrl(fileName);
        imageUrl = data.publicUrl;
      }

      // Save to Supabase 'products' table
      const { error: dbError } = await supabase
        .from('products')
        .insert([{ name: name.toUpperCase(), price: parseFloat(price), image: imageUrl, is_sold_out: false }]);

      if (dbError) throw dbError;

      alert('Item uploaded successfully! It is now live.');
      setName('');
      setPrice('');
      setImageFile(null);
      e.target.reset();
    } catch (error) {
      alert('Upload failed: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-6">
      <Link href="/" className="text-[10px] tracking-[0.2em] uppercase text-gray-500 hover:text-black mb-8 block text-center">
        &larr; BACK TO STOREFRONT
      </Link>
      
      <div className="max-w-xl mx-auto p-10 bg-white border border-gray-200 shadow-sm">
        <h1 className="text-xl font-light tracking-[0.2em] uppercase mb-10 text-center">S. Sikamòre Admin</h1>
        
        <form onSubmit={handleSubmit} className="flex flex-col gap-8">
          <div>
            <label className="block text-[10px] tracking-[0.2em] text-gray-400 mb-3 uppercase">Product Name</label>
            <input type="text" value={name} onChange={(e) => setName(e.target.value)} required className="w-full p-4 border border-gray-200 focus:border-black outline-none transition-colors text-sm" placeholder="e.g. LUMIÈRE MAXI DRESS" />
          </div>
          <div>
            <label className="block text-[10px] tracking-[0.2em] text-gray-400 mb-3 uppercase">Price (₦)</label>
            <input type="number" value={price} onChange={(e) => setPrice(e.target.value)} required className="w-full p-4 border border-gray-200 focus:border-black outline-none transition-colors text-sm" placeholder="e.g. 85000" />
          </div>
          <div>
            <label className="block text-[10px] tracking-[0.2em] text-gray-400 mb-3 uppercase">Product Image</label>
            <input type="file" accept="image/*" onChange={(e) => setImageFile(e.target.files ? e.target.files : null)} required className="w-full p-4 border border-gray-200 text-sm file:mr-4 file:py-2 file:px-4 file:border-0 file:text-[10px] file:tracking-widest file:bg-black file:text-white cursor-pointer" />
          </div>
          <button type="submit" disabled={loading} className="w-full bg-black text-white py-5 text-[10px] tracking-[0.2em] uppercase mt-4 hover:bg-gray-800 transition-colors disabled:opacity-50">
            {loading ? 'UPLOADING...' : 'PUSH TO LIVE STORE'}
          </button>
        </form>
      </div>
    </div>
  );
}
