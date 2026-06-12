'use client';
export const dynamic = 'force-dynamic';

import { useState } from 'react';
import { createClient } from '@supabase/supabase-js';
import Link from 'next/link';
import { useApp } from '../providers'; // Import global toast system

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
const supabase = createClient(supabaseUrl, supabaseAnonKey);

export default function AdminDashboard() {
  const { showToast } = useApp(); // Connect custom popup
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [passcode, setPasscode] = useState('');

  const [name, setName] = useState('');
  const [price, setPrice] = useState('');
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [loading, setLoading] = useState(false);

  const ADMIN_PASSCODE = 'SIKAMORE-ADMIN';

  const handleLogin = (e) => {
    e.preventDefault();
    if (passcode === ADMIN_PASSCODE) {
      setIsAuthenticated(true);
      showToast('ACCESS GRANTED. WELCOME BACK.');
    } else {
      showToast('ACCESS DENIED: INCORRECT PASSCODE.');
      setPasscode('');
    }
  };

  const handleImageChange = (e) => {
    const file = e.target.files;
    if (file) {
      setImageFile(file); // Strictly binds the raw File object
      setImagePreview(URL.createObjectURL(file));
    } else {
      setImageFile(null);
      setImagePreview(null);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!imageFile) return showToast('ERROR: PLEASE SELECT AN IMAGE.');
    setLoading(true);

    try {
      const fileExt = imageFile.name ? imageFile.name.split('.').pop().toLowerCase() : 'jpg';
      const fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`;
      const safeContentType = imageFile.type || `image/${fileExt === 'jpg' ? 'jpeg' : fileExt}`;

      // Uploads the standard File object natively (No ArrayBuffer needed)
      const { error: uploadError } = await supabase.storage
        .from('product-images')
        .upload(fileName, imageFile, {
          cacheControl: '3600',
          upsert: false,
          contentType: safeContentType
        });

      if (uploadError) throw new Error(uploadError.message);

      const { data } = supabase.storage.from('product-images').getPublicUrl(fileName);
      const imageUrl = data.publicUrl;

      const { error: dbError } = await supabase
        .from('products')
        .insert([{ 
          name: name.toUpperCase(), 
          price: parseFloat(price), 
          image: imageUrl, 
          is_sold_out: false 
        }]);

      if (dbError) throw new Error(dbError.message);

      showToast('SUCCESS! PRODUCT PUSHED TO LIVE STOREFRONT.');
      
      setName('');
      setPrice('');
      setImageFile(null);
      setImagePreview(null);
      e.target.reset();
      
    } catch (error) {
      showToast(`UPLOAD ERROR: ${error.message.toUpperCase()}`);
    } finally {
      setLoading(false);
    }
  };

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] text-white flex flex-col items-center justify-center px-6 font-sans antialiased">
        <div className="max-w-md w-full bg-[#111] p-10 border border-zinc-900 shadow-2xl text-center">
          <h1 className="text-xl font-normal tracking-[0.4em] uppercase mb-2 font-serif">S. SIKAMÒRE</h1>
          <p className="text-[9px] tracking-[0.2em] uppercase text-zinc-500 mb-8">Admin Portal Access</p>
          <form onSubmit={handleLogin} className="flex flex-col gap-6">
            <input 
              type="password" 
              value={passcode} 
              onChange={(e) => setPasscode(e.target.value)} 
              placeholder="ENTER PASSCODE" 
              required 
              className="w-full bg-[#161616] p-4 border border-zinc-800 focus:border-white outline-none transition-colors text-xs text-center tracking-widest text-white uppercase"
            />
            <button type="submit" className="w-full bg-white text-black py-4 text-[10px] tracking-[0.2em] uppercase hover:bg-zinc-200 transition-colors font-medium">
              Unlock Dashboard
            </button>
          </form>
          <Link href="/" className="text-[9px] tracking-[0.2em] uppercase text-zinc-500 hover:text-white mt-8 block transition-colors">
            &larr; Back to Storefront
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white py-12 px-4 sm:px-6 font-sans antialiased">
      <Link href="/" className="text-[9px] tracking-[0.2em] uppercase text-zinc-500 hover:text-white mb-8 block text-center transition-colors">
        &larr; Back to Storefront
      </Link>
      
      <div className="max-w-2xl mx-auto p-8 sm:p-12 bg-[#111] border border-zinc-900 shadow-2xl">
        <h1 className="text-xl font-normal tracking-[0.4em] uppercase text-center mb-2 font-serif">S. SIKAMÒRE</h1>
        <p className="text-[9px] tracking-[0.2em] text-zinc-500 mb-10 text-center uppercase">Inventory Management</p>
        
        <form onSubmit={handleSubmit} className="flex flex-col gap-8">
          
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <div>
              <label className="block text-[10px] tracking-[0.2em] text-zinc-400 mb-3 uppercase">Product Name</label>
              <input type="text" value={name} onChange={(e) => setName(e.target.value)} required className="w-full bg-[#161616] p-4 border border-zinc-800 focus:border-white outline-none transition-colors text-xs text-white uppercase tracking-wider" placeholder="E.G. LUMIÈRE DRESS" />
            </div>
            <div>
              <label className="block text-[10px] tracking-[0.2em] text-zinc-400 mb-3 uppercase">Price (₦)</label>
              <input type="number" value={price} onChange={(e) => setPrice(e.target.value)} required className="w-full bg-[#161616] p-4 border border-zinc-800 focus:border-white outline-none transition-colors text-xs text-white tracking-wider" placeholder="E.G. 85000" />
            </div>
          </div>
          
          <div className="flex flex-col gap-4 border border-zinc-800 p-6 bg-[#161616]">
            <label className="block text-[10px] tracking-[0.2em] text-zinc-400 uppercase">Product Image</label>
            
            <div className="flex flex-col sm:flex-row items-center gap-6">
              <div className="w-24 h-32 shrink-0 bg-[#0a0a0a] border border-zinc-800 flex items-center justify-center overflow-hidden shadow-inner">
                {imagePreview ? (
                  <img src={imagePreview} alt="Preview" className="w-full h-full object-cover" />
                ) : (
                  <span className="text-[8px] text-zinc-600 uppercase tracking-widest text-center px-2">Image Preview</span>
                )}
              </div>
              
              <div className="flex-1 w-full">
                <input type="file" accept="image/*" onChange={handleImageChange} required className="w-full text-xs file:mr-4 file:py-3 file:px-6 file:border-0 file:text-[9px] file:tracking-widest file:bg-white file:text-black file:uppercase file:cursor-pointer file:hover:bg-zinc-200 file:transition-colors text-zinc-400 cursor-pointer" />
                <p className="text-[9px] text-zinc-500 tracking-wider mt-3 uppercase">Recommended: High-res portrait (3:4 ratio). Jpg or Png.</p>
              </div>
            </div>
          </div>
          
          <button type="submit" disabled={loading} className="w-full bg-white text-black py-5 text-[10px] tracking-[0.3em] uppercase font-medium mt-4 hover:bg-zinc-200 transition-colors disabled:opacity-50">
            {loading ? 'UPLOADING TO STOREFRONT...' : 'PUBLISH PRODUCT'}
          </button>
        </form>
      </div>
    </div>
  );
}
