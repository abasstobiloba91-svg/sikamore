'use client';
export const dynamic = 'force-dynamic';

import { useState } from 'react';
import { supabase } from '../../lib/supabase';
import Link from 'next/link';

export default function AdminDashboard() {
  // Authentication State
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [passcode, setPasscode] = useState('');

  // Form State
  const [name, setName] = useState('');
  const [price, setPrice] = useState('');
  const [imageFile, setImageFile] = useState(null);
  const [loading, setLoading] = useState(false);

  // The secret passcode to unlock the page
  const ADMIN_PASSCODE = 'SIKAMORE-ADMIN';

  const handleLogin = (e) => {
    e.preventDefault();
    if (passcode === ADMIN_PASSCODE) {
      setIsAuthenticated(true);
    } else {
      alert('Access Denied: Incorrect Passcode.');
      setPasscode('');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!imageFile) {
      alert('Please select an image first.');
      return;
    }

    setLoading(true);

    try {
      // 1. Generate a unique file name
      const fileExt = imageFile.name ? imageFile.name.split('.').pop().toLowerCase() : 'jpg';
      const fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`;
      
      // 2. THE FIX: Safety fallback so it NEVER sends a blank header
      const safeContentType = imageFile.type || (fileExt === 'png' ? 'image/png' : 'image/jpeg');

      // 3. Upload the actual binary file to Supabase Storage
      const { error: uploadError } = await supabase.storage
        .from('product-images')
        .upload(fileName, imageFile, {
          cacheControl: '3600',
          upsert: false,
          contentType: safeContentType 
        });

      if (uploadError) {
        throw new Error('Failed to upload image: ' + uploadError.message);
      }

      // 4. Get the public URL for the newly uploaded image
      const { data } = supabase.storage
        .from('product-images')
        .getPublicUrl(fileName);
        
      const imageUrl = data.publicUrl;

      // 5. Save the product details + correct image URL to the database
      const { error: dbError } = await supabase
        .from('products')
        .insert([{ 
          name: name.toUpperCase(), 
          price: parseFloat(price), 
          image: imageUrl, 
          is_sold_out: false 
        }]);

      if (dbError) {
        throw new Error('Failed to save to database: ' + dbError.message);
      }

      // 6. Success! Reset the form visually and in state
      alert('Item uploaded successfully! It is now live.');
      setName('');
      setPrice('');
      setImageFile(null);
      e.target.reset();

    } catch (error) {
      alert(error.message);
    } finally {
      setLoading(false);
    }
  };

  // SHOW LOGIN SCREEN IF NOT AUTHENTICATED
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center px-6">
        <div className="max-w-md w-full bg-white p-10 border border-gray-200 shadow-sm text-center">
          <h1 className="text-xl font-light tracking-[0.2em] uppercase mb-8">Admin Access</h1>
          <form onSubmit={handleLogin} className="flex flex-col gap-6">
            <input 
              type="password" 
              value={passcode} 
              onChange={(e) => setPasscode(e.target.value)} 
              placeholder="Enter Passcode" 
              required 
              className="w-full p-4 border border-gray-200 focus:border-black outline-none transition-colors text-sm text-center tracking-widest"
            />
            <button type="submit" className="w-full bg-black text-white py-4 text-[10px] tracking-[0.2em] uppercase hover:bg-gray-800 transition-colors">
              Unlock Dashboard
            </button>
          </form>
          <Link href="/" className="text-[10px] tracking-[0.2em] uppercase text-gray-500 hover:text-black mt-8 block">
            &larr; Back to Storefront
          </Link>
        </div>
      </div>
    );
  }

  // SHOW UPLOAD DASHBOARD IF AUTHENTICATED
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
            <input 
              type="text" 
              value={name} 
              onChange={(e) => setName(e.target.value)} 
              required 
              className="w-full p-4 border border-gray-200 focus:border-black outline-none transition-colors text-sm" 
              placeholder="e.g. LUMIÈRE MAXI DRESS" 
            />
          </div>
          
          <div>
            <label className="block text-[10px] tracking-[0.2em] text-gray-400 mb-3 uppercase">Price (₦)</label>
            <input 
              type="number" 
              value={price} 
              onChange={(e) => setPrice(e.target.value)} 
              required 
              className="w-full p-4 border border-gray-200 focus:border-black outline-none transition-colors text-sm" 
              placeholder="e.g. 85000" 
            />
          </div>
          
          <div>
            <label className="block text-[10px] tracking-[0.2em] text-gray-400 mb-3 uppercase">Product Image</label>
            <input 
              type="file" 
              accept="image/*" 
              onChange={(e) => {
                if (e.target.files && e.target.files.length > 0) {
                  setImageFile(e.target.files);
                } else {
                  setImageFile(null);
                }
              }} 
              required 
              className="w-full p-4 border border-gray-200 text-sm file:mr-4 file:py-2 file:px-4 file:border-0 file:text-[10px] file:tracking-widest file:bg-black file:text-white cursor-pointer" 
            />
          </div>
          
          <button 
            type="submit" 
            disabled={loading} 
            className="w-full bg-black text-white py-5 text-[10px] tracking-[0.2em] uppercase mt-4 hover:bg-gray-800 transition-colors disabled:opacity-50"
          >
            {loading ? 'UPLOADING...' : 'PUSH TO LIVE STORE'}
          </button>
        </form>
      </div>
    </div>
  );
}
