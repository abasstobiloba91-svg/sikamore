'use client';
export const dynamic = 'force-dynamic';

import { useState } from 'react';
import { supabase } from '../../lib/supabase';

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

      // 1. Upload the image to Supabase Storage
      if (imageFile) {
        // SAFETY CHECK: Fallback to 'jpg' if the filename behaves weirdly
        const fileExt = imageFile.name ? imageFile.name.split('.').pop() : 'jpg';
        const fileName = `${Math.random()}.${fileExt}`;
        
        const { error: uploadError } = await supabase.storage
          .from('product-images')
          .upload(fileName, imageFile);

        if (uploadError) throw uploadError;

        // Get the public URL to save in the database
        const { data } = supabase.storage.from('product-images').getPublicUrl(fileName);
        imageUrl = data.publicUrl;
      }

      // 2. Save the product details to the database
      const { error: dbError } = await supabase
        .from('products')
        .insert([{ name: name.toUpperCase(), price: parseFloat(price), image: imageUrl, is_sold_out: false }]);

      if (dbError) throw dbError;

      alert('Product successfully added to the store!');
      setName('');
      setPrice('');
      setImageFile(null);
      
      // Resets the file input field visually
      e.target.reset();
    } catch (error) {
      alert('Error: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto p-8 mt-12 bg-gray-50 border border-gray-200 rounded">
      <h1 className="text-2xl font-light tracking-widest uppercase mb-8 text-center">S. Sikamòre Admin</h1>
      
      <form onSubmit={handleSubmit} className="flex flex-col gap-6">
        <div>
          <label className="block text-xs tracking-widest text-gray-500 mb-2">PRODUCT NAME</label>
          <input type="text" value={name} onChange={(e) => setName(e.target.value)} required className="w-full p-3 border border-gray-300" placeholder="e.g. LUMIÈRE MAXI DRESS" />
        </div>

        <div>
          <label className="block text-xs tracking-widest text-gray-500 mb-2">PRICE (₦)</label>
          <input type="number" value={price} onChange={(e) => setPrice(e.target.value)} required className="w-full p-3 border border-gray-300" placeholder="e.g. 85000" />
        </div>

        <div>
          <label className="block text-xs tracking-widest text-gray-500 mb-2">PRODUCT IMAGE</label>
          {/* CRITICAL FIX: Ensure files is explicitly targeted */}
          <input type="file" accept="image/*" onChange={(e) => setImageFile(e.target.files ? e.target.files : null)} required className="w-full p-3 border border-gray-300 bg-white" />
        </div>

        <button type="submit" disabled={loading} className="w-full bg-black text-white py-4 text-xs tracking-widest uppercase font-medium mt-4 hover:bg-gray-800 transition-colors disabled:opacity-50">
          {loading ? 'Uploading...' : 'Add Product to Store'}
        </button>
      </form>
    </div>
  );
}
