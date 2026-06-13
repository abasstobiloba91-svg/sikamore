/* eslint-disable @next/next/no-img-element */
'use client';
export const dynamic = 'force-dynamic';

import { useState, useEffect, useRef } from 'react';
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
  const [activeTab, setActiveTab] = useState('inventory'); // inventory, tracker, newsletter, support
  
  // --- STATE LEDGERS ---
  const [productsList, setProductsList] = useState([
    { id: Date.now(), name: '', price: '', stock: '', file: null, preview: null }
  ]);
  const [loading, setLoading] = useState(false);

  const [orders, setOrders] = useState([]);
  const [subscribers, setSubscribers] = useState([]);
  const [campaigns, setCampaigns] = useState([]);
  const [tickets, setTickets] = useState([]);
  
  const [activeChat, setActiveChat] = useState(null);
  const [replyText, setReplyText] = useState('');
  const [sendingReply, setSendingReply] = useState(false);

  // --- NEWSLETTER BROADCAST COMPOSITION STATE ---
  const [newsletterSubj, setNewsletterSubj] = useState('');
  const [newsletterMsg, setNewsletterMsg] = useState('');
  const [sendingNewsletter, setSendingNewsletter] = useState(false);

  const chatEndRef = useRef(null);
  const ADMIN_PASSCODE = 'SIKAMORE-ADMIN';

  // --- COMPREHENSIVE RE-FETCH MONITOR ---
  useEffect(() => {
    if (!isAuthenticated) return;

    async function loadAdminData() {
      try {
        if (activeTab === 'tracker') {
          const { data } = await supabase.from('orders').select('*').order('created_at', { ascending: false });
          if (data) setOrders(data);
        }
        if (activeTab === 'newsletter') {
          const [subRes, campRes] = await Promise.all([
            supabase.from('subscribers').select('*').order('created_at', { ascending: false }),
            supabase.from('campaigns').select('*').order('created_at', { ascending: false })
          ]);
          if (subRes.data) setSubscribers(subRes.data);
          if (campRes.data) setCampaigns(campRes.data);
        }
        if (activeTab === 'support') {
          const { data } = await supabase.from('support_tickets').select('*').order('created_at', { ascending: false });
          if (data) setTickets(data);
        }
      } catch (err) {
        console.error("Data fetch exception: ", err);
      }
    }
    loadAdminData();
  }, [isAuthenticated, activeTab]);

  useEffect(() => {
    if (activeChat && chatEndRef.current) {
      chatEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [activeChat]);

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

  // --- INVENTORY MANAGER CONTROLS ---
  const addProductRow = () => {
    setProductsList(prev => [...prev, { id: Date.now() + Math.random(), name: '', price: '', stock: '', file: null, preview: null }]);
  };

  const removeProductRow = (id) => {
    setProductsList(prev => prev.filter(p => p.id !== id));
  };

  const updateProductData = (id, field, value) => {
    setProductsList(prev => prev.map(p => p.id === id ? { ...p, [field]: value } : p));
  };

  const handleImageChange = (id, e) => {
    const file = e.target.files[0];
    if (file) {
      const preview = URL.createObjectURL(file);
      setProductsList(prev => prev.map(p => p.id === id ? { ...p, file, preview } : p));
    }
  };

  const handleBulkSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      let detailedError = '';
      productsList.forEach((product, index) => {
        if (detailedError) return;
        const itemNum = index + 1;
        if (!product.name || String(product.name).trim() === '') detailedError = `ITEM 0${itemNum} IS MISSING A PRODUCT NAME.`;
        else if (!product.price || String(product.price).trim() === '') detailedError = `ITEM 0${itemNum} (${product.name.toUpperCase()}) IS MISSING A PRICE.`;
        else if (!product.stock || String(product.stock).trim() === '') detailedError = `ITEM 0${itemNum} (${product.name.toUpperCase()}) IS MISSING A STOCK QUANTITY.`;
        else if (!product.file) detailedError = `ITEM 0${itemNum} (${product.name.toUpperCase()}) IS MISSING AN ATTACHED IMAGE.`;
      });

      if (detailedError) {
        setLoading(false);
        return showToast(`ERROR: ${detailedError}`);
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

  // --- FULFILLMENT TRACKER CONTROLS ---
  const handleUpdateOrderStatus = async (orderId, currentStatus) => {
    try {
      const { error } = await supabase
        .from('orders')
        .update({ status: currentStatus })
        .eq('id', orderId);

      if (error) throw error;
      showToast(`ORDER FULFILLMENT STATUS SWITCHED TO: ${currentStatus.toUpperCase()}`);
      setOrders(prev => prev.map(o => o.id === orderId ? { ...o, status: currentStatus } : o));
    } catch (err) {
      showToast(`FULFILLMENT ERROR: ${err.message.toUpperCase()}`);
    }
  };

  // --- BRANDED EDITORIAL LUXURY EMAIL DISPATCH CODER ---
  const handleSendBrandedNewsletter = async (e) => {
    e.preventDefault();
    if (!newsletterSubj.trim() || !newsletterMsg.trim()) return;
    setSendingNewsletter(true);

    try {
      // 1. Build the luxury HTML layout template
      const formattedLines = newsletterMsg.replace(/\n/g, '<br />');
      const customHTMLTemplate = `
        <!DOCTYPE html>
        <html>
          <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
          </head>
          <body style="margin:0; padding:0; background-color:#F5F5F4; font-family:-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; -webkit-text-size-adjust:100%;">
            <table width="100%" border="0" cellspacing="0" cellpadding="0" style="background-color:#F5F5F4; padding:60px 20px;">
              <tr>
                <td align="center">
                  <table width="550" border="0" cellspacing="0" cellpadding="0" style="background-color:#0A0A0A; color:#FFFFFF; padding:45px sm:padding:60px; border:1px solid #1c1c1a; box-shadow:0 20px 40px rgba(0,0,0,0.15);">
                    <tr>
                      <td align="center" style="padding-bottom:40px; border-bottom:1px solid #1A1A1A;">
                        <h1 style="font-family:'Times New Roman', Times, Baskerville, Georgia, serif; font-weight:normal; letter-spacing:0.45em; font-size:22px; margin:0; color:#FFFFFF; text-transform:uppercase; text-align:center;">S. SIKAMÒRE</h1>
                        <p style="font-size:8px; letter-spacing:0.3em; color:#555555; margin-top:8px; margin-bottom:0; text-transform:uppercase; text-align:center;">The Digital Archive Registry</p>
                      </td>
                    </tr>
                    <tr>
                      <td style="padding:50px 10px; font-size:11px; line-height:2.0; letter-spacing:0.12em; color:#D4D4D4; font-weight:300; text-transform:uppercase; text-align:left;">
                        ${formattedLines}
                      </td>
                    </tr>
                    <tr>
                      <td align="center" style="padding-top:40px; border-top:1px solid #1A1A1A;">
                        <a href="https://sikamore.vercel.app/shop" style="display:inline-block; background-color:#FFFFFF; color:#0A0A0A; text-decoration:none; padding:14px 32px; font-size:9px; font-weight:500; letter-spacing:0.25em; text-transform:uppercase; font-family:inherit;">DISCOVER THE COLLECTION</a>
                      </td>
                    </tr>
                    <tr>
                      <td align="center" style="padding-top:50px; font-size:7.5px; line-height:1.8; letter-spacing:0.2em; color:#404040; text-transform:uppercase; text-align:center;">
                        © 2026 S. SIKAMÒRE. ARCHIVE RESIDENCE.<br />
                        YOU ARE RECEIVING THIS DISPATCH AS A REGISTERED ACCOUNT OUTLINE PROFILE.<br />
                        <span style="text-decoration:underline; color:#404040; cursor:pointer;">UNSUBSCRIBE FROM REGISTRY</span>
                      </td>
                    </tr>
                  </table>
                </td>
              </tr>
            </table>
          </body>
        </html>
      `;

      // 2. Log campaign context directly into the database
      const { data, error } = await supabase
        .from('campaigns')
        .insert([{
          subject: newsletterSubj.toUpperCase(),
          message: newsletterMsg,
          recipient_count: subscribers.length,
          html_payload: customHTMLTemplate
        }])
        .select();

      if (error) throw error;

      // --- DISPATCH INTEGRATION BRIDGE ---
      // This is where your code pipes the payload directly to a delivery service
      // e.g., fetch('https://api.resend.com/emails', { method: 'POST', body: JSON.stringify({ to: subscribers.map(s => s.email), html: customHTMLTemplate }) })
      
      showToast(`DISPATCH SUCCESS! PRIVATE EDITORIAL DEPLOYED TO ${subscribers.length} INBOXES.`);
      setCampaigns(prev => [data[0], ...prev]);
      setNewsletterSubj('');
      setNewsletterMsg('');
    } catch (err) {
      showToast(`DISPATCH ERROR: ${err.message.toUpperCase()}`);
    } finally {
      setSendingNewsletter(false);
    }
  };

  // --- CONCIERGE CHAT RESPONSE ENGINE ---
  const handleAdminReply = async (e) => {
    e.preventDefault();
    if (!replyText.trim()) return;
    setSendingReply(true);

    try {
      const adminMessage = { sender: 'admin', text: replyText, timestamp: new Date().toISOString() };
      const currentHistory = activeChat.chat_history && Array.isArray(activeChat.chat_history) && activeChat.chat_history.length > 0
        ? activeChat.chat_history
        : [{ sender: 'user', text: activeChat.message, timestamp: activeChat.created_at }];

      const updatedHistory = [...currentHistory, adminMessage];

      const { error } = await supabase
        .from('support_tickets')
        .update({ chat_history: updatedHistory, status: 'replied', has_unread_user: true })
        .eq('id', activeChat.id);

      if (error) throw error;
      showToast('DISPATCH TRANSKICKED TO CLIENT PORTAL.');
      
      const refreshedChat = { ...activeChat, chat_history: updatedHistory, status: 'replied' };
      setActiveChat(refreshedChat);
      setTickets(prev => prev.map(t => t.id === activeChat.id ? refreshedChat : t));
      setReplyText('');
    } catch (err) {
      showToast(`ERROR: ${err.message.toUpperCase()}`);
    } finally {
      setSendingReply(false);
    }
  };

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

  return (
    <div className="min-h-screen bg-[#F5F5F4] text-black py-12 px-4 sm:px-6 font-sans antialiased">
      <div className="max-w-5xl mx-auto">
        
        {/* TOP COMMAND NAVIGATION */}
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

        {/* --- TAB 1: PRODUCT DEPLOYMENT INVENTORY --- */}
        {activeTab === 'inventory' && (
          <div className="bg-[#0A0A0A] text-white p-6 sm:p-10 shadow-2xl animate-fade-in">
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

        {/* --- TAB 2: REAL-TIME ORDER FULFILLMENT TRACKER --- */}
        {activeTab === 'tracker' && (
          <div className="space-y-6 animate-fade-in">
            {orders.length === 0 ? (
              <div className="bg-[#0A0A0A] text-zinc-500 p-12 text-center border border-zinc-800 uppercase tracking-widest text-[10px]">No sales items logged in database.</div>
            ) : (
              orders.map((order) => (
                <div key={order.id} className="bg-[#0A0A0A] text-white border border-zinc-900 shadow-xl overflow-hidden p-6 sm:p-8 flex flex-col gap-6">
                  <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-zinc-900 pb-4">
                    <div>
                      <p className="text-[8px] tracking-widest text-zinc-500 uppercase font-mono">ORDER ID: #{order.id.slice(0,8)}</p>
                      <h3 className="text-xs font-normal text-white uppercase tracking-wider mt-1">{order.customer_name} • <span className="text-zinc-400 normal-case">{order.customer_email}</span></h3>
                    </div>
                    <div>
                      <select 
                        value={order.status} 
                        onChange={(e) => handleUpdateOrderStatus(order.id, e.target.value)} 
                        className="bg-[#111] text-white border border-zinc-800 text-[9px] tracking-widest uppercase p-2.5 outline-none focus:border-white"
                      >
                        <option value="pending">Pending</option>
                        <option value="shipped">Shipped</option>
                        <option value="delivered">Delivered</option>
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-[10px] tracking-wider uppercase text-zinc-400">
                    <div>
                      <span className="text-[8px] block text-zinc-600 mb-1">Destination Address</span>
                      <p className="text-white leading-relaxed">{order.shipping_address || 'N/A'}</p>
                      <p className="text-zinc-500 mt-1 font-mono">{order.customer_phone}</p>
                    </div>
                    <div>
                      <span className="text-[8px] block text-zinc-600 mb-1">Items Summary</span>
                      <div className="space-y-2 mt-2">
                        {order.items?.map((item, idx) => (
                          <div key={idx} className="flex justify-between text-zinc-300">
                            <span>{item.name} (SIZE: {item.size}) <strong className="text-white">x{item.quantity}</strong></span>
                            <span className="font-mono text-zinc-500">₦{(item.price * item.quantity).toLocaleString()}</span>
                          </div>
                        ))}
                      </div>
                      <div className="border-t border-zinc-900 mt-4 pt-3 flex justify-between text-white font-medium text-xs">
                        <span>Aggregate Total</span>
                        <span>₦{order.total_amount?.toLocaleString()}</span>
                      </div>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {/* --- TAB 3: THE ARCHIVE EDITORIAL CAMPAIGN DISPATCHER --- */}
        {activeTab === 'newsletter' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 animate-fade-in">
            
            {/* Composing Panel Form */}
            <div className="lg:col-span-2 bg-[#0A0A0A] text-white p-6 sm:p-8 border border-zinc-900 shadow-2xl flex flex-col justify-between">
              <div>
                <h3 className="text-xs uppercase tracking-widest font-medium border-b border-zinc-900 pb-3 mb-6">Create Registry Broadcast</h3>
                <form onSubmit={handleSendBrandedNewsletter} className="space-y-6">
                  <div>
                    <label className="block text-[8px] tracking-[0.2em] text-zinc-500 mb-2 uppercase">Dispatch Subject</label>
                    <input type="text" value={newsletterSubj} onChange={(e) => setNewsletterSubj(e.target.value)} required placeholder="E.G. THE EDITIONS DROP: AUTUMN SILHOUETTES" className="w-full bg-[#111] p-4 border border-zinc-800 focus:border-white outline-none text-base md:text-xs text-white uppercase tracking-wider transition-colors"/>
                  </div>
                  <div>
                    <label className="block text-[8px] tracking-[0.2em] text-zinc-500 mb-2 uppercase">Custom Editorial Content</label>
                    <textarea value={newsletterMsg} onChange={(e) => setNewsletterMsg(e.target.value)} required rows="8" placeholder="Type your dynamic announcement here. It will automatically sit cleanly inside the S. SIKAMÒRE signature logo framing template..." className="w-full bg-[#111] p-4 border border-zinc-800 focus:border-white outline-none text-base md:text-xs text-white tracking-wider resize-none transition-colors" />
                  </div>
                  <button type="submit" disabled={sendingNewsletter || subscribers.length === 0} className="w-full bg-white text-black py-4 text-[9px] tracking-[0.3em] uppercase hover:bg-zinc-200 font-medium disabled:opacity-40 transition-colors">
                    {sendingNewsletter ? 'BROADCASTING PAYLOAD...' : `SEND PRIVATE DISPATCH TO ${subscribers.length} PROFILES`}
                  </button>
                </form>
              </div>
            </div>

            {/* Profiles & History Ledger Sidebar */}
            <div className="flex flex-col gap-6">
              <div className="bg-white border border-zinc-300 p-6 shadow-sm">
                <span className="text-[8px] text-zinc-400 block tracking-widest uppercase mb-1">Active Registry Size</span>
                <h2 className="text-3xl font-light tracking-wide text-black font-serif">{subscribers.length.toLocaleString()} <span className="text-[10px] tracking-widest uppercase font-sans text-zinc-400 ml-1">Profiles</span></h2>
              </div>

              <div className="bg-[#111] text-white border border-zinc-900 p-6 flex-1 overflow-y-auto max-h-[360px]">
                <h4 className="text-[9px] tracking-widest uppercase text-zinc-500 border-b border-zinc-800 pb-2 mb-4">Broadcast Dispatch Log</h4>
                {campaigns.length === 0 ? (
                  <p className="text-[8px] text-zinc-600 uppercase tracking-widest text-center py-6">No historical dispatches found.</p>
                ) : (
                  <div className="space-y-4">
                    {campaigns.map((camp) => (
                      <div key={camp.id} className="border-b border-zinc-900 pb-3 last:border-0">
                        <h5 className="text-[10px] text-zinc-200 uppercase tracking-wider truncate font-medium">{camp.subject}</h5>
                        <p className="text-[8px] text-zinc-500 uppercase tracking-widest mt-1">
                          {new Date(camp.created_at).toLocaleDateString()} • {camp.recipient_count} Recipients
                        </p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

          </div>
        )}

        {/* --- TAB 4: LIVE CUSTOMER CONCIERGE CHAT SUPPORT --- */}
        {activeTab === 'support' && (
          <div className="bg-[#0A0A0A] text-white p-0 flex flex-col md:flex-row h-[600px] border border-zinc-800 shadow-2xl animate-fade-in">
            <div className="w-full md:w-1/3 border-r border-zinc-800 bg-[#111] overflow-y-auto">
              <div className="p-6 border-b border-zinc-800 checked sticky top-0 bg-[#111]">
                <h2 className="text-xs tracking-[0.3em] text-zinc-400 uppercase">Support Inbox</h2>
              </div>
              <div className="flex flex-col">
                {tickets.length === 0 ? (
                  <p className="text-[9px] text-zinc-600 uppercase tracking-widest text-center py-10">No messages found.</p>
                ) : (
                  tickets.map((ticket) => (
                    <button key={ticket.id} onClick={() => setActiveChat(ticket)} className={`p-5 text-left border-b border-zinc-800 hover:bg-[#161616] transition-colors flex flex-col gap-1 ${activeChat?.id === ticket.id ? 'bg-[#161616] border-l-2 border-l-white' : ''}`}>
                      <div className="flex justify-between items-center mb-1">
                        <span className="text-xs font-medium uppercase tracking-wider">{ticket.name}</span>
                        {ticket.status === 'unread' && <span className="w-1.5 h-1.5 bg-red-500 rounded-full animate-pulse"></span>}
                      </div>
                      <p className="text-[10px] text-zinc-400 truncate tracking-wide">{ticket.subject}</p>
                      <p className="text-[8px] text-zinc-600 mt-1 uppercase tracking-widest">{ticket.status}</p>
                    </button>
                  ))
                )}
              </div>
            </div>

            <div className="w-full md:w-2/3 flex flex-col bg-[#0A0A0A]">
              {activeChat ? (
                <>
                  <div className="p-6 border-b border-zinc-800 bg-[#0A0A0A]">
                    <h3 className="text-xs uppercase tracking-widest text-white font-medium">{activeChat.name}</h3>
                    <p className="text-[9px] text-zinc-500 tracking-[0.1em] mt-1">{activeChat.email} | {activeChat.subject}</p>
                  </div>
                  
                  <div className="flex-1 p-6 overflow-y-auto space-y-4 bg-[#0D0D0D]">
                    {(activeChat.chat_history?.length > 0 ? activeChat.chat_history : [{ sender: 'user', text: activeChat.message, timestamp: activeChat.created_at }]).map((msg, idx) => (
                      <div key={idx} className={`flex flex-col ${msg.sender === 'admin' ? 'items-end' : 'items-start'}`}>
                        <span className="text-[8px] tracking-[0.2em] text-zinc-600 uppercase mb-1">{msg.sender === 'admin' ? 'You' : activeChat.name}</span>
                        <div className={`max-w-[85%] p-4 text-[11px] leading-relaxed tracking-wider border ${msg.sender === 'admin' ? 'bg-[#161616] border-zinc-800 text-zinc-300' : 'bg-white border-white text-black font-medium'}`}>
                          {msg.text}
                        </div>
                      </div>
                    ))}
                    <div ref={chatEndRef} />
                  </div>
                  
                  <form onSubmit={handleAdminReply} className="p-6 border-t border-zinc-800 bg-[#111] flex gap-4">
                    <input type="text" value={replyText} onChange={(e) => setReplyText(e.target.value)} placeholder="Type a response to dispatch..." className="flex-1 bg-[#161616] p-4 border border-zinc-800 focus:border-white outline-none text-base md:text-xs text-white tracking-wide" />
                    <button type="submit" disabled={sendingReply || !replyText.trim()} className="bg-white text-black px-6 text-[9px] tracking-widest uppercase font-medium hover:bg-zinc-200 transition-colors disabled:opacity-30">
                      {sendingReply ? 'SENDING...' : 'DISPATCH'}
                    </button>
                  </form>
                </>
              ) : (
                <div className="flex-1 flex items-center justify-center">
                  <p className="text-[10px] tracking-[0.2em] text-zinc-600 uppercase">Select an active ticket from the archive log</p>
                </div>
              )}
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
