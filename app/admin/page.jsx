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
  const [activeTab, setActiveTab] = useState('inventory'); // Tabs: inventory, tracker, newsletter, support
  
  // --- BULK/VISUAL UPLOAD STATE ---
  const [productsList, setProductsList] = useState([
    { id: Date.now(), name: '', price: '', stock: '', file: null, preview: null }
  ]);
  const [loading, setLoading] = useState(false);

  // --- SUPPORT INBOX STATE ---
  const [activeChat, setActiveChat] = useState(null);
  const [replyText, setReplyText] = useState('');
  const mockTickets = [
    { id: 1, name: 'Tobiloba', email: 'tobi@example.com', subject: 'Order #4092 Delay', message: 'Hello, I wanted to know when my dress will be shipped.', status: 'unread' },
    { id: 2, name: 'Aisha', email: 'aisha@example.com', subject: 'Sizing Question', message: 'Does the Lumière dress stretch?', status: 'read' }
  ];

  // Tracker & Newsletter State
  const [liveOrders, setLiveOrders] = useState([]);
  const [emailOpens, setEmailOpens] = useState(0);
  const [newsletterSubj, setNewsletterSubj] = useState('');

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

  // --- DYNAMIC UPLOADER LOGIC ---
  const addProductRow = () => {
    setProductsList([...productsList, { id: Date.now(), name: '', price: '', stock: '', file: null, preview: null }]);
  };

  const removeProductRow = (id) => {
    if (productsList.length > 1) {
      setProductsList(productsList.filter(p => p.id !== id));
    }
  };

  const updateProductData = (id, field, value) => {
    setProductsList(productsList.map(p => p.id === id ? { ...p, [field]: value } : p));
  };

  const handleImageChange = (id, e) => {
    const file = e.target.files[0];
    if (file) {
      const preview = URL.createObjectURL(file);
      setProductsList(productsList.map(p => p.id === id ? { ...p, file, preview } : p));
    }
  };

  const handleBulkSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Basic validation
      const invalid = productsList.find(p => !p.name || !p.price || !p.stock || !p.file);
      if (invalid) {
        setLoading(false);
        return showToast('ERROR: PLEASE FILL ALL FIELDS AND ADD IMAGES FOR EVERY PRODUCT.');
      }

      for (const product of productsList) {
        const fileExt = product.file.name.split('.').pop().toLowerCase();
        const fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`;
        const safeContentType = product.file.type || `image/jpeg`;

        const { error: uploadError } = await supabase.storage
          .from('product-images')
          .upload(fileName, product.file, { cacheControl: '3600', upsert: false, contentType: safeContentType });

        if (uploadError) throw new Error(uploadError.message);

        const { data } = supabase.storage.from('product-images').getPublicUrl(fileName);
        
        const { error: dbError } = await supabase.from('products').insert([{ 
          name: product.name.toUpperCase(), 
          price: parseFloat(product.price), 
          stock_quantity: parseInt(product.stock),
          image: data.publicUrl, 
          is_sold_out: parseInt(product.stock) <= 0 
        }]);

        if (dbError) throw new Error(dbError.message);
      }

      showToast(`SUCCESS! ${productsList.length} PRODUCT(S) PUSHED TO STOREFRONT.`);
      setProductsList([{ id: Date.now(), name: '', price: '', stock: '', file: null, preview: null }]);
    } catch (error) {
      showToast(`UPLOAD ERROR: ${error.message.toUpperCase()}`);
    } finally {
      setLoading(false);
    }
  };

  // --- LOGIN VIEW ---
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-[#F5F5F4] text-black flex flex-col items-center justify-center px-6 font-sans antialiased">
        <div className="max-w-md w-full bg-[#0A0A0A] text-white p-10 shadow-2xl text-center">
          <h1 className="text-xl font-normal tracking-[0.4em] uppercase mb-2 font-serif">S. SIKAMÒRE</h1>
          <p className="text-[9px] tracking-[0.2em] uppercase text-zinc-400 mb-8">Admin Portal Access</p>
          <form onSubmit={handleLogin} className="flex flex-col gap-6">
            <input type="password" value={passcode} onChange={(e) => setPasscode(e.target.value)} placeholder="ENTER PASSCODE" required className="w-full bg-[#161616] p-4 border border-zinc-800 focus:border-white outline-none text-base md:text-xs text-center tracking-widest text-white uppercase" />
            <button type="submit" className="w-full bg-white text-black py-4 text-[10px] tracking-[0.2em] uppercase hover:bg-zinc-200 font-medium">Unlock Dashboard</button>
          </form>
        </div>
      </div>
    );
  }

  // --- DASHBOARD VIEW ---
  return (
    <div className="min-h-screen bg-[#F5F5F4] text-black py-12 px-4 sm:px-6 font-sans antialiased">
      <div className="max-w-5xl mx-auto">
        
        {/* HEADER & NAV */}
        <div className="mb-10 text-center">
          <h1 className="text-2xl font-normal tracking-[0.4em] uppercase mb-2 font-serif text-black">S. SIKAMÒRE</h1>
          <div className="flex flex-wrap justify-center gap-2 sm:gap-4 mt-8">
            {['inventory', 'tracker', 'newsletter', 'support'].map((tab) => (
              <button key={tab} onClick={() => setActiveTab(tab)} className={`px-4 py-2 text-[9px] tracking-[0.2em] uppercase transition-colors border ${activeTab === tab ? 'bg-black text-white border-black' : 'bg-transparent text-zinc-500 border-zinc-300 hover:border-black hover:text-black'}`}>
                {tab}
              </button>
            ))}
          </div>
        </div>

        {/* TAB 1: VISUAL BULK UPLOADER + INVENTORY COUNTER */}
        {activeTab === 'inventory' && (
          <div className="bg-[#0A0A0A] text-white p-6 sm:p-10 shadow-2xl">
            <div className="flex justify-between items-center border-b border-zinc-800 pb-4 mb-8">
              <h2 className="text-xs tracking-[0.3em] text-zinc-400 uppercase">Product Deployment</h2>
              <button onClick={addProductRow} className="text-[9px] bg-zinc-800 hover:bg-zinc-700 px-4 py-2 uppercase tracking-widest">+ Add Row</button>
            </div>
            
            <form onSubmit={handleBulkSubmit} className="flex flex-col gap-10">
              {productsList.map((product, index) => (
                <div key={product.id} className="relative border border-zinc-800 p-6 bg-[#111]">
                  {productsList.length > 1 && (
                    <button type="button" onClick={() => removeProductRow(product.id)} className="absolute top-4 right-4 text-zinc-500 hover:text-red-500 text-xs">✕</button>
                  )}
                  <p className="text-[9px] tracking-[0.2em] text-zinc-500 mb-4 uppercase">Item 0{index + 1}</p>
                  
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                    <div>
                      <label className="block text-[9px] tracking-[0.2em] text-zinc-400 mb-2 uppercase">Product Name</label>
                      <input type="text" value={product.name} onChange={(e)=>updateProductData(product.id, 'name', e.target.value)} required className="w-full bg-[#161616] p-3 border border-zinc-800 focus:border-white outline-none text-base md:text-xs text-white uppercase" placeholder="E.G. LUMIÈRE DRESS" />
                    </div>
                    <div>
                      <label className="block text-[9px] tracking-[0.2em] text-zinc-400 mb-2 uppercase">Price (₦)</label>
                      <input type="number" value={product.price} onChange={(e)=>updateProductData(product.id, 'price', e.target.value)} required className="w-full bg-[#161616] p-3 border border-zinc-800 focus:border-white outline-none text-base md:text-xs text-white" placeholder="E.G. 85000" />
                    </div>
                    <div>
                      <label className="block text-[9px] tracking-[0.2em] text-zinc-400 mb-2 uppercase">Stock Qty</label>
                      <input type="number" value={product.stock} onChange={(e)=>updateProductData(product.id, 'stock', e.target.value)} required className="w-full bg-[#161616] p-3 border border-zinc-800 focus:border-white outline-none text-base md:text-xs text-white" placeholder="E.G. 15" />
                    </div>
                  </div>

                  <div className="flex items-center gap-6">
                    <div className="w-16 h-20 shrink-0 bg-[#0a0a0a] border border-zinc-800 flex items-center justify-center overflow-hidden">
                      {product.preview ? <img src={product.preview} alt="Preview" className="w-full h-full object-cover" /> : <span className="text-[7px] text-zinc-600 uppercase tracking-widest text-center">Img</span>}
                    </div>
                    <div className="flex-1">
                      <input type="file" accept="image/*" onChange={(e)=>handleImageChange(product.id, e)} required className="w-full text-base md:text-xs file:mr-4 file:py-2 file:px-4 file:border-0 file:text-[8px] file:tracking-widest file:bg-white file:text-black file:uppercase file:cursor-pointer text-zinc-500" />
                    </div>
                  </div>
                </div>
              ))}

              <button type="submit" disabled={loading} className="w-full bg-white text-black py-5 text-[10px] tracking-[0.3em] uppercase font-medium hover:bg-zinc-200 transition-colors disabled:opacity-50 mt-4">
                {loading ? 'DEPLOYING TO STORE...' : `PUBLISH ${productsList.length} ITEM(S)`}
              </button>
            </form>
          </div>
        )}

        {/* TAB 4: CUSTOMER SUPPORT INBOX */}
        {activeTab === 'support' && (
          <div className="bg-[#0A0A0A] text-white flex flex-col md:flex-row h-[600px] border border-zinc-800 shadow-2xl">
            
            {/* Left Panel: Ticket List */}
            <div className="w-full md:w-1/3 border-r border-zinc-800 bg-[#111] overflow-y-auto">
              <div className="p-6 border-b border-zinc-800 sticky top-0 bg-[#111]">
                <h2 className="text-xs tracking-[0.3em] text-zinc-400 uppercase">Support Inbox</h2>
              </div>
              <div className="flex flex-col">
                {mockTickets.map((ticket) => (
                  <button 
                    key={ticket.id} 
                    onClick={() => setActiveChat(ticket)}
                    className={`p-5 text-left border-b border-zinc-800 hover:bg-[#161616] transition-colors ${activeChat?.id === ticket.id ? 'bg-[#161616] border-l-2 border-l-white' : ''}`}
                  >
                    <div className="flex justify-between items-center mb-1">
                      <span className="text-xs font-medium uppercase tracking-wider">{ticket.name}</span>
                      {ticket.status === 'unread' && <span className="w-2 h-2 bg-white rounded-full"></span>}
                    </div>
                    <p className="text-[10px] text-zinc-500 truncate">{ticket.subject}</p>
                  </button>
                ))}
              </div>
            </div>

            {/* Right Panel: Chat Interface */}
            <div className="w-full md:w-2/3 flex flex-col bg-[#0A0A0A]">
              {activeChat ? (
                <>
                  {/* Chat Header */}
                  <div className="p-6 border-b border-zinc-800">
                    <h3 className="text-xs uppercase tracking-widest">{activeChat.name}</h3>
                    <p className="text-[9px] text-zinc-500 tracking-[0.1em]">{activeChat.email} | {activeChat.subject}</p>
                  </div>
                  {/* Chat Body */}
                  <div className="flex-1 p-6 overflow-y-auto">
                    <div className="bg-[#161616] p-4 inline-block max-w-[80%] border border-zinc-800 mb-4">
                      <p className="text-xs leading-relaxed text-zinc-300">{activeChat.message}</p>
                    </div>
                  </div>
                  {/* Reply Input */}
                  <div className="p-6 border-t border-zinc-800 bg-[#111] flex gap-4">
                    <input 
                      type="text" 
                      value={replyText} 
                      onChange={(e) => setReplyText(e.target.value)} 
                      placeholder="Type your reply..." 
                      className="flex-1 bg-[#161616] p-3 border border-zinc-800 focus:border-white outline-none text-base md:text-xs text-white"
                    />
                    <button className="bg-white text-black px-6 text-[9px] tracking-widest uppercase font-medium hover:bg-zinc-200">
                      Send
                    </button>
                  </div>
                </>
              ) : (
                <div className="flex-1 flex items-center justify-center">
                  <p className="text-[10px] tracking-[0.2em] text-zinc-600 uppercase">Select a ticket to respond</p>
                </div>
              )}
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
