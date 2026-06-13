/* eslint-disable @next/next/no-img-element */
'use client';
export const dynamic = 'force-dynamic';

import { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';
import Link from 'next/link';
import { useApp } from '../providers';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
const supabase = createClient(supabaseUrl, supabaseAnonKey);

export default function AdminDashboard() {
  const { showToast } = useApp();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [passcode, setPasscode] = useState('');
  const [activeTab, setActiveTab] = useState('inventory'); // Tabs: inventory, bulk, tracker, newsletter, support
  
  // Single Upload State
  const [imagePreview, setImagePreview] = useState(null);
  const [loading, setLoading] = useState(false);

  // Newsletter State
  const [newsletterSubj, setNewsletterSubj] = useState('');
  const [newsletterLoading, setNewsletterLoading] = useState(false);

  // Real-time Tracker State
  const [liveOrders, setLiveOrders] = useState([]);
  const [emailOpens, setEmailOpens] = useState(0);

  const ADMIN_PASSCODE = 'SIKAMORE-ADMIN';

  // --- REAL-TIME WEB SOCKETS (ZERO REFRESH) ---
  useEffect(() => {
    if (!isAuthenticated) return;

    // Listen for new orders instantly
    const orderChannel = supabase
      .channel('realtime-orders')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'orders' }, (payload) => {
        setLiveOrders((prev) => [payload.new, ...prev]);
        showToast('🟢 NEW ORDER RECEIVED IN REAL-TIME!');
      })
      .subscribe();

    // Listen for newsletter opens instantly
    const analyticsChannel = supabase
      .channel('realtime-analytics')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'email_opens' }, () => {
        setEmailOpens((prev) => prev + 1);
      })
      .subscribe();

    return () => {
      supabase.removeChannel(orderChannel);
      supabase.removeChannel(analyticsChannel);
    };
  }, [isAuthenticated, showToast]);

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

  // --- INVENTORY UPLOAD LOGIC ---
  const handleImageChange = (e) => {
    const file = e.target.files && e.target.files ? e.target.files[0] : null;
    if (file) setImagePreview(URL.createObjectURL(file));
    else setImagePreview(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const dataForm = new FormData(e.currentTarget);
      const actualFile = dataForm.get('product-image-file');

      if (!actualFile || actualFile.size === 0) {
        setLoading(false);
        return showToast('ERROR: PLEASE SELECT A VALID IMAGE.');
      }

      const fileExt = actualFile.name ? actualFile.name.split('.').pop().toLowerCase() : 'jpg';
      const fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`;
      const safeContentType = actualFile.type || `image/${fileExt === 'jpg' ? 'jpeg' : fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from('product-images')
        .upload(fileName, actualFile, { cacheControl: '3600', upsert: false, contentType: safeContentType });

      if (uploadError) throw new Error(uploadError.message);

      const { data } = supabase.storage.from('product-images').getPublicUrl(fileName);
      const imageUrl = data.publicUrl;

      const { error: dbError } = await supabase
        .from('products')
        .insert([{ 
          name: dataForm.get('product-name').toUpperCase(), 
          price: parseFloat(dataForm.get('product-price')), 
          image: imageUrl, 
          is_sold_out: false 
        }]);

      if (dbError) throw new Error(dbError.message);

      showToast('SUCCESS! PRODUCT PUSHED TO LIVE STOREFRONT.');
      setImagePreview(null);
      e.target.reset();
    } catch (error) {
      showToast(`UPLOAD ERROR: ${error.message.toUpperCase()}`);
    } finally {
      setLoading(false);
    }
  };

  // --- NEWSLETTER DISPATCH LOGIC ---
  const handleSendNewsletter = async (e) => {
    e.preventDefault();
    setNewsletterLoading(true);
    try {
      // Fetch subscribers from Supabase (Mocking array for demo)
      const subscribers = [{ email: 'test@example.com' }]; 
      
      // Send to the Resend API route we just built
      for (const sub of subscribers) {
        await fetch('/api/send', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email: sub.email, subject: newsletterSubj, type: 'newsletter' })
        });
      }
      showToast('NEWSLETTER DISPATCHED SUCCESSFULLY.');
      setNewsletterSubj('');
    } catch (error) {
      showToast('ERROR SENDING NEWSLETTER.');
    } finally {
      setNewsletterLoading(false);
    }
  };

  // ==========================================
  // LOGIN VIEW (OFF-WHITE + BLACK CARD)
  // ==========================================
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-[#F5F5F4] text-black flex flex-col items-center justify-center px-6 font-sans antialiased">
        <div className="max-w-md w-full bg-[#0A0A0A] text-white p-10 shadow-2xl text-center">
          <h1 className="text-xl font-normal tracking-[0.4em] uppercase mb-2 font-serif">S. SIKAMÒRE</h1>
          <p className="text-[9px] tracking-[0.2em] uppercase text-zinc-400 mb-8">Admin Portal Access</p>
          <form onSubmit={handleLogin} className="flex flex-col gap-6">
            <input 
              type="password" 
              value={passcode} 
              onChange={(e) => setPasscode(e.target.value)} 
              placeholder="ENTER PASSCODE" 
              required 
              // MOBILE ZOOM FIX ADDED HERE (text-base md:text-xs)
              className="w-full bg-[#161616] p-4 border border-zinc-800 focus:border-white outline-none transition-colors text-base md:text-xs text-center tracking-widest text-white uppercase"
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

  // ==========================================
  // DASHBOARD VIEW (OFF-WHITE + BLACK CARDS)
  // ==========================================
  return (
    <div className="min-h-screen bg-[#F5F5F4] text-black py-12 px-4 sm:px-6 font-sans antialiased">
      <div className="max-w-4xl mx-auto">
        
        {/* HEADER & NAVIGATION */}
        <div className="mb-10 text-center">
          <h1 className="text-2xl font-normal tracking-[0.4em] uppercase mb-2 font-serif text-black">S. SIKAMÒRE</h1>
          <p className="text-[10px] tracking-[0.2em] text-zinc-500 uppercase mb-8">Command Center</p>
          
          <div className="flex flex-wrap justify-center gap-2 sm:gap-4 mb-8">
            {['inventory', 'bulk', 'tracker', 'newsletter', 'support'].map((tab) => (
              <button 
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-4 py-2 text-[9px] tracking-[0.2em] uppercase transition-colors border ${
                  activeTab === tab ? 'bg-black text-white border-black' : 'bg-transparent text-zinc-500 border-zinc-300 hover:border-black hover:text-black'
                }`}
              >
                {tab}
              </button>
            ))}
          </div>
        </div>

        {/* TAB 1: SINGLE INVENTORY UPLOAD */}
        {activeTab === 'inventory' && (
          <div className="bg-[#0A0A0A] text-white p-8 sm:p-12 shadow-2xl">
            <h2 className="text-xs tracking-[0.3em] text-zinc-400 mb-8 border-b border-zinc-800 pb-4 uppercase">Single Item Push</h2>
            <form onSubmit={handleSubmit} className="flex flex-col gap-8">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div>
                  <label className="block text-[10px] tracking-[0.2em] text-zinc-400 mb-3 uppercase">Product Name</label>
                  <input type="text" name="product-name" required className="w-full bg-[#161616] p-4 border border-zinc-800 focus:border-white outline-none transition-colors text-base md:text-xs text-white uppercase tracking-wider" placeholder="E.G. LUMIÈRE DRESS" />
                </div>
                <div>
                  <label className="block text-[10px] tracking-[0.2em] text-zinc-400 mb-3 uppercase">Price (₦)</label>
                  <input type="number" name="product-price" required className="w-full bg-[#161616] p-4 border border-zinc-800 focus:border-white outline-none transition-colors text-base md:text-xs text-white tracking-wider" placeholder="E.G. 85000" />
                </div>
              </div>
              <div className="flex flex-col gap-4 border border-zinc-800 p-6 bg-[#161616]">
                <label className="block text-[10px] tracking-[0.2em] text-zinc-400 uppercase">Product Image</label>
                <div className="flex flex-col sm:flex-row items-center gap-6">
                  <div className="w-24 h-32 shrink-0 bg-[#0a0a0a] border border-zinc-800 flex items-center justify-center overflow-hidden">
                    {imagePreview ? <img src={imagePreview} alt="Preview" className="w-full h-full object-cover" /> : <span className="text-[8px] text-zinc-600 uppercase tracking-widest text-center px-2">Preview</span>}
                  </div>
                  <div className="flex-1 w-full">
                    <input type="file" name="product-image-file" accept="image/*" onChange={handleImageChange} required className="w-full text-base md:text-xs file:mr-4 file:py-3 file:px-6 file:border-0 file:text-[9px] file:tracking-widest file:bg-white file:text-black file:uppercase file:cursor-pointer file:hover:bg-zinc-200 text-zinc-400" />
                  </div>
                </div>
              </div>
              <button type="submit" disabled={loading} className="w-full bg-white text-black py-5 text-[10px] tracking-[0.3em] uppercase font-medium hover:bg-zinc-200 transition-colors disabled:opacity-50">
                {loading ? 'UPLOADING...' : 'PUBLISH PRODUCT'}
              </button>
            </form>
          </div>
        )}

        {/* TAB 2: BULK UPLOAD */}
        {activeTab === 'bulk' && (
          <div className="bg-[#0A0A0A] text-white p-8 sm:p-12 shadow-2xl">
            <h2 className="text-xs tracking-[0.3em] text-zinc-400 mb-8 border-b border-zinc-800 pb-4 uppercase">Bulk CSV Upload</h2>
            <div className="border border-dashed border-zinc-600 p-12 text-center bg-[#161616]">
              <p className="text-[10px] tracking-[0.2em] text-zinc-400 mb-4 uppercase">Upload Database CSV File</p>
              <input type="file" accept=".csv" className="mx-auto text-base md:text-xs file:mr-4 file:py-3 file:px-6 file:border-0 file:text-[9px] file:tracking-widest file:bg-white file:text-black file:uppercase file:cursor-pointer text-zinc-400" />
            </div>
            <button className="w-full bg-white text-black py-5 text-[10px] tracking-[0.3em] uppercase font-medium mt-6 hover:bg-zinc-200">
              PROCESS BATCH
            </button>
          </div>
        )}

        {/* TAB 3: PROCUREMENT TRACKER */}
        {activeTab === 'tracker' && (
          <div className="bg-[#0A0A0A] text-white p-8 sm:p-12 shadow-2xl">
            <div className="flex justify-between items-center border-b border-zinc-800 pb-4 mb-8">
              <h2 className="text-xs tracking-[0.3em] text-zinc-400 uppercase">Live Orders & Procurement</h2>
              <span className="text-[8px] tracking-widest text-green-500 flex items-center gap-2"><span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span> LIVE SYNC</span>
            </div>
            {liveOrders.length === 0 ? (
              <p className="text-center text-[10px] tracking-widest text-zinc-600 uppercase py-10">Awaiting new incoming orders...</p>
            ) : (
              <div className="flex flex-col gap-4">
                {liveOrders.map((order, idx) => (
                  <div key={idx} className="bg-[#161616] border border-zinc-800 p-4 flex justify-between items-center">
                    <div>
                      <p className="text-xs tracking-wider text-white uppercase">{order.customer_name}</p>
                      <p className="text-[9px] tracking-widest text-zinc-500">{order.product_name} - {order.location}</p>
                    </div>
                    <span className="text-[9px] tracking-[0.2em] px-3 py-1 bg-white text-black font-medium uppercase">Pending</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* TAB 4: NEWSLETTER */}
        {activeTab === 'newsletter' && (
          <div className="bg-[#0A0A0A] text-white p-8 sm:p-12 shadow-2xl">
            <div className="flex justify-between items-center border-b border-zinc-800 pb-4 mb-8">
              <h2 className="text-xs tracking-[0.3em] text-zinc-400 uppercase">Newsletter Dispatch</h2>
              <span className="text-[9px] tracking-widest text-zinc-500 uppercase">Live Opens: <span className="text-white">{emailOpens}</span></span>
            </div>
            <form onSubmit={handleSendNewsletter} className="flex flex-col gap-6">
              <div>
                <label className="block text-[10px] tracking-[0.2em] text-zinc-400 mb-3 uppercase">Campaign Subject</label>
                <input type="text" value={newsletterSubj} onChange={(e)=>setNewsletterSubj(e.target.value)} required className="w-full bg-[#161616] p-4 border border-zinc-800 focus:border-white outline-none text-base md:text-xs text-white" placeholder="E.G. THE NEW CAPSULE IS LIVE" />
              </div>
              <div>
                <label className="block text-[10px] tracking-[0.2em] text-zinc-400 mb-3 uppercase">Campaign Message</label>
                <textarea rows="5" required className="w-full bg-[#161616] p-4 border border-zinc-800 focus:border-white outline-none text-base md:text-xs text-white resize-none" placeholder="Draft your email here..."></textarea>
              </div>
              <button type="submit" disabled={newsletterLoading} className="w-full bg-white text-black py-5 text-[10px] tracking-[0.3em] uppercase font-medium hover:bg-zinc-200 disabled:opacity-50">
                {newsletterLoading ? 'DISPATCHING...' : 'BLAST NEWSLETTER'}
              </button>
            </form>
          </div>
        )}

        {/* TAB 5: SUPPORT */}
        {activeTab === 'support' && (
          <div className="bg-[#0A0A0A] text-white p-8 sm:p-12 shadow-2xl text-center">
            <h2 className="text-xs tracking-[0.3em] text-zinc-400 mb-8 border-b border-zinc-800 pb-4 uppercase">System Support</h2>
            <p className="text-[10px] tracking-[0.2em] text-zinc-500 mb-6 uppercase leading-relaxed">
              For technical assistance, server updates, or custom modifications to your S. Sikamòre platform.
            </p>
            <div className="inline-block border border-zinc-800 p-6 bg-[#161616]">
              <p className="text-[11px] tracking-widest text-white uppercase mb-2">Developer Vanguard Solutions</p>
              <p className="text-[9px] tracking-[0.2em] text-zinc-400 mb-6 uppercase">Priority IT Support Channel</p>
              <button className="bg-white text-black px-8 py-3 text-[9px] tracking-widest uppercase font-medium hover:bg-zinc-200">
                Contact Support (WhatsApp)
              </button>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
