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
  const [activeTab, setActiveTab] = useState('inventory');
  
  // --- STATE LEDGERS ---
  const [productsList, setProductsList] = useState([
    { id: Date.now(), name: '', price: '', stock: '', description: '', additional_information: '', store_policies: '', inquiries: '', file: null, preview: null }
  ]);
  const [loading, setLoading] = useState(false);

  const [orders, setOrders] = useState([]);
  const [subscribers, setSubscribers] = useState([]);
  const [campaigns, setCampaigns] = useState([]);
  const [tickets, setTickets] = useState([]);
  
  const [vendors, setVendors] = useState([]);
  const [activeVendor, setActiveVendor] = useState(null);
  const [vendorOrders, setVendorOrders] = useState([]);
  const [analyticsData, setAnalyticsData] = useState([]);
  
  const [activeChat, setActiveChat] = useState(null);
  const [replyText, setReplyText] = useState('');
  const [sendingReply, setSendingReply] = useState(false);
  
  // --- REALTIME TYPING STATES ---
  const [isUserTyping, setIsUserTyping] = useState(false);
  const typingChannelRef = useRef(null);
  const typingTimeoutRef = useRef(null);

  const [newsletterSubj, setNewsletterSubj] = useState('');
  const [newsletterMsg, setNewsletterMsg] = useState('');
  const [sendingNewsletter, setSendingNewsletter] = useState(false);

  const chatEndRef = useRef(null);
  const ADMIN_PASSCODE = 'SIKAMORE-ADMIN';

  useEffect(() => {
    const savedAuth = localStorage.getItem('sikamore_admin_authenticated');
    if (savedAuth === 'true') {
      setIsAuthenticated(true);
    }
  }, []);

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
        if (activeTab === 'vendors') {
          const { data } = await supabase.from('vendors').select('*').order('name', { ascending: true });
          if (data) setVendors(data);
        }
        if (activeTab === 'analytics') {
          const { data } = await supabase.from('page_analytics').select('*').order('created_at', { ascending: false });
          if (data) setAnalyticsData(data);
        }
      } catch (err) {
        console.error("Data fetch exception: ", err);
      }
    }
    loadAdminData();
  }, [isAuthenticated, activeTab]);

  // --- REAL-TIME MESSAGING SYNC ---
  useEffect(() => {
    if (!isAuthenticated || activeTab !== 'support') return;

    const messageSync = supabase.channel('realtime_support_admin')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'support_tickets' }, (payload) => {
        if (payload.eventType === 'INSERT') {
          setTickets((prev) => [payload.new, ...prev]);
        } else if (payload.eventType === 'UPDATE') {
          setTickets((prev) => prev.map(t => t.id === payload.new.id ? payload.new : t));
          setActiveChat((prev) => prev?.id === payload.new.id ? payload.new : prev);
        }
      })
      .subscribe();

    return () => {
      supabase.removeChannel(messageSync);
    };
  }, [isAuthenticated, activeTab]);

  // --- REAL-TIME TYPING INDICATOR SYNC ---
  useEffect(() => {
    if (!activeChat) return;

    const channel = supabase.channel(`typing_support_${activeChat.id}`);
    typingChannelRef.current = channel;

    channel.on('broadcast', { event: 'typing' }, (payload) => {
      if (payload.payload.sender !== 'admin') {
        setIsUserTyping(payload.payload.isTyping);
        if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
        if (payload.payload.isTyping) {
          typingTimeoutRef.current = setTimeout(() => setIsUserTyping(false), 3000);
        }
      }
    }).subscribe();

    return () => {
      supabase.removeChannel(channel);
      if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
      typingChannelRef.current = null;
    };
  }, [activeChat?.id]);

  useEffect(() => {
    if (activeVendor) {
      async function fetchVendorOrderHistory() {
        const { data } = await supabase
          .from('orders')
          .select('*')
          .eq('customer_email', activeVendor.email)
          .order('created_at', { ascending: false });
        if (data) setVendorOrders(data);
      }
      fetchVendorOrderHistory();
    }
  }, [activeVendor]);

  useEffect(() => {
    if (activeChat && chatEndRef.current) {
      chatEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [activeChat]);

  const handleLogin = (e) => {
    e.preventDefault();
    if (passcode === ADMIN_PASSCODE) {
      setIsAuthenticated(true);
      localStorage.setItem('sikamore_admin_authenticated', 'true');
      showToast('ACCESS GRANTED. WELCOME BACK.');
    } else {
      showToast('ACCESS DENIED: INCORRECT PASSCODE.');
      setPasscode('');
    }
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
    localStorage.removeItem('sikamore_admin_authenticated');
    showToast('PORTAL SESSION TERMINATED.');
  };

  const addProductRow = () => {
    setProductsList(prev => [...prev, { id: Date.now() + Math.random(), name: '', price: '', stock: '', description: '', additional_information: '', store_policies: '', inquiries: '', file: null, preview: null }]);
  };

  const removeProductRow = (id) => {
    setProductsList(prev => prev.filter(p => p.id !== id));
  };

  const updateProductData = (id, field, value) => {
    setProductsList(prev => prev.map(p => p.id === id ? { ...p, [field]: value } : p));
  };

  const handleImageChange = (id, e) => {
    const file = e.target.files;
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
          description: product.description || null,
          additional_information: product.additional_information || null,
          store_policies: product.store_policies || null,
          inquiries: product.inquiries || null,
          image: data.publicUrl, 
          is_sold_out: parseInt(product.stock) <= 0 
        }]);

        if (dbError) throw new Error(dbError.message);
      }

      showToast(`SUCCESS! ${productsList.length} PRODUCT(S) PUSHED TO STOREFRONT.`);
      setProductsList([{ id: Date.now(), name: '', price: '', stock: '', description: '', additional_information: '', store_policies: '', inquiries: '', file: null, preview: null }]);
    } catch (error) {
      showToast(`UPLOAD ERROR: ${error.message.toUpperCase()}`);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateOrderStatus = async (orderId, currentStatus) => {
    try {
      const { error } = await supabase.from('orders').update({ status: currentStatus }).eq('id', orderId);
      if (error) throw error;
      showToast(`ORDER FULFILLMENT STATUS SWITCHED TO: ${currentStatus.toUpperCase()}`);
      setOrders(prev => prev.map(o => o.id === orderId ? { ...o, status: currentStatus } : o));
    } catch (err) {
      showToast(`FULFILLMENT ERROR: ${err.message.toUpperCase()}`);
    }
  };

  const handleSendBrandedNewsletter = async (e) => {
    e.preventDefault();
    if (!newsletterSubj.trim() || !newsletterMsg.trim()) return;
    setSendingNewsletter(true);

    try {
      const formattedLines = newsletterMsg.replace(/\n/g, '<br />');
      const customHTMLTemplate = `
        <!DOCTYPE html>
        <html>
          <head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
          <body style="margin:0; padding:0; background-color:#F5F5F4; font-family:-apple-system, sans-serif;">
            <table width="100%" border="0" cellspacing="0" cellpadding="0" style="background-color:#F5F5F4; padding:60px 20px;">
              <tr>
                <td align="center">
                  <table width="550" border="0" cellspacing="0" cellpadding="0" style="background-color:#0A0A0A; color:#FFFFFF; padding:45px; border:1px solid #1c1c1a;">
                    <tr>
                      <td align="center" style="padding-bottom:40px; border-bottom:1px solid #1A1A1A;">
                        <h1 style="font-family:serif; font-weight:normal; letter-spacing:0.45em; font-size:22px; margin:0; color:#FFFFFF; text-transform:uppercase;">S. SIKAMÒRE</h1>
                      </td>
                    </tr>
                    <tr><td style="padding:50px 10px; font-size:11px; line-height:2.0; letter-spacing:0.12em; color:#D4D4D4; text-transform:uppercase;">${formattedLines}</td></tr>
                  </table>
                </td>
              </tr>
            </table>
          </body>
        </html>
      `;

      const { data, error } = await supabase.from('campaigns').insert([{
          subject: newsletterSubj.toUpperCase(),
          message: newsletterMsg,
          recipient_count: subscribers.length,
          html_payload: customHTMLTemplate
        }]).select();

      if (error) throw error;
      
      showToast(`DISPATCH SUCCESS! PRIVATE EDITORIAL DEPLOYED TO ${subscribers.length} INBOXES.`);
      setCampaigns(prev => [data, ...prev]);
      setNewsletterSubj('');
      setNewsletterMsg('');
    } catch (err) {
      showToast(`DISPATCH ERROR: ${err.message.toUpperCase()}`);
    } finally {
      setSendingNewsletter(false);
    }
  };

  const handleAdminTyping = (e) => {
    setReplyText(e.target.value);
    if (typingChannelRef.current) {
      typingChannelRef.current.send({
        type: 'broadcast',
        event: 'typing',
        payload: { sender: 'admin', isTyping: e.target.value.length > 0 }
      });
    }
  };

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

      const { error } = await supabase.from('support_tickets').update({ chat_history: updatedHistory, status: 'replied', has_unread_user: true }).eq('id', activeChat.id);

      if (error) throw error;
      
      if (typingChannelRef.current) {
        typingChannelRef.current.send({ type: 'broadcast', event: 'typing', payload: { sender: 'admin', isTyping: false } });
      }

      showToast('DISPATCH TRANSKICKED TO CLIENT PORTAL.');
      setReplyText('');
    } catch (err) {
      showToast(`ERROR: ${err.message.toUpperCase()}`);
    } finally {
      setSendingReply(false);
    }
  };

  const totalVisits = analyticsData.filter(a => a.event_type === 'visit').length;
  const totalClicks = analyticsData.filter(a => a.event_type === 'click').length;
  const clickThroughRate = totalVisits > 0 ? ((totalClicks / totalVisits) * 100).toFixed(1) : 0;

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-[#F5F5F4] text-black flex flex-col items-center justify-center px-6 font-sans antialiased">
        <div className="max-w-md w-full bg-[#0A0A0A] text-white p-10 shadow-2xl text-center">
          <h1 className="text-xl font-normal tracking-[0.4em] uppercase mb-2 font-serif">S. SIKAMÒRE</h1>
          <p className="text-[9px] tracking-[0.2em] uppercase text-zinc-400 mb-8">Admin Portal Access</p>
          <form onSubmit={handleLogin} className="flex flex-col gap-6">
            <input type="password" value={passcode} onChange={(e) => setPasscode(e.target.value)} placeholder="ENTER PASSCODE" required className="w-full bg-[#161616] p-4 border border-zinc-800 focus:border-white outline-none text-base text-center tracking-widest text-white uppercase" />
            <button type="submit" className="w-full bg-white text-black py-4 text-[10px] tracking-[0.2em] uppercase hover:bg-zinc-200 font-medium">Unlock Dashboard</button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F5F5F4] text-black py-12 px-4 sm:px-6 font-sans antialiased relative">
      <div className="max-w-5xl mx-auto">
        
        {/* TOP COMMAND NAVIGATION */}
        <div className="mb-10 text-center relative">
          <div className="absolute right-0 top-0">
            <button onClick={handleLogout} className="text-[8px] sm:text-[9px] tracking-widest text-zinc-400 hover:text-black uppercase transition-colors border border-zinc-300 hover:border-black px-3 py-1.5 font-medium">
              Sign Out
            </button>
          </div>
          <h1 className="text-2xl font-normal tracking-[0.4em] uppercase mb-2 font-serif text-black">S. SIKAMÒRE</h1>
          <div className="flex flex-wrap justify-center gap-2 sm:gap-4 mt-8">
            {['inventory', 'tracker', 'newsletter', 'support', 'vendors', 'analytics'].map((tab) => (
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
                  
                  {/* Base Core Data */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                    <div>
                      <label className="block text-[9px] tracking-[0.2em] text-zinc-400 mb-2 uppercase">Product Name</label>
                      <input type="text" value={product.name} onChange={(e)=>updateProductData(product.id, 'name', e.target.value)} required className="w-full bg-[#161616] p-3 border border-zinc-800 focus:border-white outline-none text-base text-white uppercase" placeholder="E.G. LUMIÈRE DRESS" />
                    </div>
                    <div>
                      <label className="block text-[9px] tracking-[0.2em] text-zinc-400 mb-2 uppercase">Price (₦)</label>
                      <input type="number" value={product.price} onChange={(e)=>updateProductData(product.id, 'price', e.target.value)} required className="w-full bg-[#161616] p-3 border border-zinc-800 focus:border-white outline-none text-base text-white" placeholder="E.G. 85000" />
                    </div>
                    <div>
                      <label className="block text-[9px] tracking-[0.2em] text-zinc-400 mb-2 uppercase">Stock Qty</label>
                      <input type="number" value={product.stock} onChange={(e)=>updateProductData(product.id, 'stock', e.target.value)} required className="w-full bg-[#161616] p-3 border border-zinc-800 focus:border-white outline-none text-base text-white" placeholder="E.G. 15" />
                    </div>
                  </div>

                  {/* Optional Dynamic Accordion Modules */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6 pt-4 border-t border-zinc-800">
                    <div>
                      <label className="block text-[8px] tracking-[0.2em] text-zinc-500 mb-2 uppercase">Description (Optional)</label>
                      <textarea value={product.description} onChange={(e)=>updateProductData(product.id, 'description', e.target.value)} rows="3" className="w-full bg-[#161616] p-3 border border-zinc-800 focus:border-white outline-none text-base text-white uppercase resize-none" placeholder="E.G. EMBROIDERED MESH FULLER SILHOUETTE PIECE..." />
                    </div>
                    <div>
                      <label className="block text-[8px] tracking-[0.2em] text-zinc-500 mb-2 uppercase">Additional Information (Optional)</label>
                      <textarea value={product.additional_information} onChange={(e)=>updateProductData(product.id, 'additional_information', e.target.value)} rows="3" className="w-full bg-[#161616] p-3 border border-zinc-800 focus:border-white outline-none text-base text-white uppercase resize-none" placeholder="E.G. COMPOSITION: 100% VAN-GUARD TEXTILE LINING..." />
                    </div>
                    <div>
                      <label className="block text-[8px] tracking-[0.2em] text-zinc-500 mb-2 uppercase">Store Policies (Optional)</label>
                      <textarea value={product.store_policies} onChange={(e)=>updateProductData(product.id, 'store_policies', e.target.value)} rows="3" className="w-full bg-[#161616] p-3 border border-zinc-800 focus:border-white outline-none text-base text-white uppercase resize-none" placeholder="E.G. COMPLIMENTARY DROPS REQUIRE 3-5 BUSINESS DAYS..." />
                    </div>
                    <div>
                      <label className="block text-[8px] tracking-[0.2em] text-zinc-500 mb-2 uppercase">Inquiries (Optional)</label>
                      <textarea value={product.inquiries} onChange={(e)=>updateProductData(product.id, 'inquiries', e.target.value)} rows="3" className="w-full bg-[#161616] p-3 border border-zinc-800 focus:border-white outline-none text-base text-white uppercase resize-none" placeholder="E.G. CONTACT OUR DIRECT CLIENT CONCIERGE NETWORK..." />
                    </div>
                  </div>

                  {/* Image Attachment Payload */}
                  <div className="flex items-center gap-6">
                    <div className="w-16 h-20 shrink-0 bg-[#0a0a0a] border border-zinc-800 flex items-center justify-center overflow-hidden">
                      {product.preview ? <img src={product.preview} alt="Preview" className="w-full h-full object-cover" /> : <span className="text-[7px] text-zinc-600 uppercase tracking-widest text-center">Img</span>}
                    </div>
                    <div className="flex-1">
                      <input type="file" accept="image/*" onChange={(e)=>handleImageChange(product.id, e)} required className="w-full text-base file:mr-4 file:py-2 file:px-4 file:border-0 file:text-[8px] file:tracking-widest file:bg-white file:text-black file:uppercase file:cursor-pointer text-zinc-500" />
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
                      <select value={order.status} onChange={(e) => handleUpdateOrderStatus(order.id, e.target.value)} className="bg-[#111] text-white border border-zinc-800 text-base md:text-xs tracking-widest uppercase p-2.5 outline-none focus:border-white">
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
            <div className="lg:col-span-2 bg-[#0A0A0A] text-white p-6 sm:p-8 border border-zinc-900 shadow-2xl flex flex-col justify-between">
              <div>
                <h3 className="text-xs uppercase tracking-widest font-medium border-b border-zinc-900 pb-3 mb-6">Create Registry Broadcast</h3>
                <form onSubmit={handleSendBrandedNewsletter} className="space-y-6">
                  <div>
                    <label className="block text-[8px] tracking-[0.2em] text-zinc-500 mb-2 uppercase">Dispatch Subject</label>
                    <input type="text" value={newsletterSubj} onChange={(e) => setNewsletterSubj(e.target.value)} required placeholder="E.G. THE EDITIONS DROP: AUTUMN SILHOUETTES" className="w-full bg-[#111] p-4 border border-zinc-800 focus:border-white outline-none text-base text-white uppercase tracking-wider transition-colors"/>
                  </div>
                  <div>
                    <label className="block text-[8px] tracking-[0.2em] text-zinc-500 mb-2 uppercase">Custom Editorial Content</label>
                    <textarea value={newsletterMsg} onChange={(e) => setNewsletterMsg(e.target.value)} required rows="8" placeholder="Type your dynamic announcement here..." className="w-full bg-[#111] p-4 border border-zinc-800 focus:border-white outline-none text-base text-white tracking-wider resize-none transition-colors" />
                  </div>
                  <button type="submit" disabled={sendingNewsletter || subscribers.length === 0} className="w-full bg-white text-black py-4 text-[9px] tracking-[0.3em] uppercase hover:bg-zinc-200 font-medium disabled:opacity-40 transition-colors">
                    {sendingNewsletter ? 'BROADCASTING PAYLOAD...' : `SEND PRIVATE DISPATCH TO ${subscribers.length} PROFILES`}
                  </button>
                </form>
              </div>
            </div>

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
                        <p className="text-[8px] text-zinc-500 uppercase tracking-widest mt-1">{new Date(camp.created_at).toLocaleDateString()} • {camp.recipient_count} Recipients</p>
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
          <div className="bg-[#0A0A0A] text-white p-0 flex flex-col md:flex-row h-[600px] border border-zinc-800 shadow-2xl animate-fade-in relative overflow-hidden">
            
            <div className={`w-full md:w-1/3 border-r border-zinc-800 bg-[#111] overflow-y-auto ${activeChat ? 'hidden md:block' : 'block'} h-full`}>
              <div className="p-6 border-b border-zinc-800 sticky top-0 bg-[#111]">
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

            <div className={`w-full md:w-2/3 flex-col bg-[#0A0A0A] ${!activeChat ? 'hidden md:flex' : 'flex'} h-full`}>
              {activeChat ? (
                <>
                  <div className="p-6 border-b border-zinc-800 bg-[#0A0A0A] flex justify-between items-center shrink-0">
                    <div>
                      <h3 className="text-xs uppercase tracking-widest text-white font-medium">{activeChat.name}</h3>
                      <p className="text-[9px] text-zinc-500 tracking-[0.1em] mt-1">{activeChat.email} | {activeChat.subject}</p>
                    </div>
                    <button onClick={() => setActiveChat(null)} className="md:hidden text-[9px] tracking-widest uppercase border border-zinc-700 px-3 py-1.5 hover:bg-zinc-800 text-zinc-300 transition-colors">
                      &larr; Back
                    </button>
                  </div>
                  
                  <div className="flex-1 p-6 overflow-y-auto space-y-4 bg-[#0D0D0D]">
                    {(activeChat.chat_history?.length > 0 ? activeChat.chat_history : [{ sender: 'user', text: activeChat.message, timestamp: activeChat.created_at }]).map((msg, idx) => (
                      <div key={idx} className={`flex flex-col ${msg.sender === 'admin' ? 'items-end' : 'items-start'}`}>
                        <span className="text-[8px] tracking-[0.2em] text-zinc-600 uppercase mb-1">{msg.sender === 'admin' ? 'You' : activeChat.name}</span>
                        <div className={`max-w-[85%] p-4 text-[11px] leading-relaxed tracking-wider border ${msg.sender === 'admin' ? 'bg-[#161616] border-zinc-800 text-zinc-300' : 'bg-white border-white text-black font-medium'}`}>{msg.text}</div>
                      </div>
                    ))}
                    
                    {isUserTyping && (
                      <div className="flex flex-col items-start animate-fade-in">
                        <span className="text-[8px] tracking-[0.2em] text-zinc-500 uppercase mb-1">{activeChat.name} IS TYPING...</span>
                      </div>
                    )}
                    <div ref={chatEndRef} />
                  </div>
                  
                  <form onSubmit={handleAdminReply} className="p-6 border-t border-zinc-800 bg-[#111] flex gap-4 shrink-0">
                    <input type="text" value={replyText} onChange={handleAdminTyping} placeholder="Type a response to dispatch..." className="flex-1 bg-[#161616] p-4 border border-zinc-800 focus:border-white outline-none text-base text-white tracking-wide" />
                    <button type="submit" disabled={sendingReply || !replyText.trim()} className="bg-white text-black px-6 text-[9px] tracking-widest uppercase font-medium hover:bg-zinc-200 transition-colors disabled:opacity-30">{sendingReply ? 'SENDING...' : 'DISPATCH'}</button>
                  </form>
                </>
              ) : (
                <div className="flex-1 flex items-center justify-center p-6 text-center">
                  <p className="text-[10px] tracking-[0.2em] text-zinc-600 uppercase">Select an active ticket from the archive log</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* --- TAB 5: VENDOR LEDGER & DIRECT HISTORICAL PURCHASES --- */}
        {activeTab === 'vendors' && (
          <div className="bg-[#0A0A0A] text-white border border-zinc-900 shadow-2xl flex flex-col md:flex-row h-[600px] animate-fade-in">
            <div className="w-full md:w-1/3 border-r border-zinc-800 bg-[#111] overflow-y-auto h-full">
              <div className="p-6 border-b border-zinc-800 sticky top-0 bg-[#111] z-10">
                <h3 className="text-xs uppercase tracking-widest text-zinc-400">Vendor Profiles</h3>
              </div>
              <div className="flex flex-col">
                {vendors.length === 0 ? (
                  <p className="text-[9px] text-zinc-600 text-center uppercase py-8 tracking-widest">No registered vendors found.</p>
                ) : (
                  vendors.map(v => (
                    <button key={v.id} onClick={() => setActiveVendor(v)} className={`p-5 text-left border-b border-zinc-800 hover:bg-[#161616] transition-colors flex flex-col gap-1 ${activeVendor?.id === v.id ? 'bg-[#161616] border-l-2 border-l-white' : ''}`}>
                      <span className="text-xs font-medium uppercase tracking-wider text-white">{v.name}</span>
                      <span className="text-[9px] text-zinc-500 font-serif tracking-widest uppercase">{v.company || 'Independent Vendor'}</span>
                    </button>
                  ))
                )}
              </div>
            </div>

            <div className="w-full md:w-2/3 flex flex-col bg-[#0A0A0A] overflow-y-auto p-6 sm:p-10 h-full">
              {activeVendor ? (
                <div className="space-y-8">
                  <div className="border-b border-zinc-900 pb-6">
                    <span className="text-[8px] tracking-[0.2em] text-zinc-600 uppercase block mb-1">Vendor Contact Directory</span>
                    <h2 className="text-lg font-light uppercase text-white font-serif tracking-wide">{activeVendor.name}</h2>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-3 text-[10px] tracking-wider uppercase text-zinc-400">
                      <p><span className="text-zinc-600 font-mono">EMAIL:</span> {activeVendor.email}</p>
                      <p><span className="text-zinc-600 font-mono">PHONE:</span> {activeVendor.phone || 'N/A'}</p>
                    </div>
                  </div>
                  <div>
                    <h4 className="text-[9px] uppercase tracking-widest text-zinc-500 mb-4 font-medium">Historical Orders Fulfilled</h4>
                    {vendorOrders.length === 0 ? (
                      <p className="text-[9px] text-zinc-600 uppercase tracking-widest py-4">This vendor profile has no registered purchasing streams.</p>
                    ) : (
                      <div className="space-y-4">
                        {vendorOrders.map(vo => (
                          <div key={vo.id} className="bg-[#111] border border-zinc-800 p-4 rounded-sm">
                            <div className="flex justify-between text-[8px] font-mono text-zinc-500 uppercase border-b border-zinc-900 pb-2 mb-3">
                              <span>ORDER STAMP: #{vo.id.slice(0,8)}</span>
                              <span>{new Date(vo.created_at).toLocaleDateString()}</span>
                            </div>
                            <div className="space-y-1 text-[10px] tracking-wide text-zinc-300 uppercase">
                              {vo.items?.map((item, i) => (
                                <div key={i} className="flex justify-between">
                                  <span>{item.name} (SIZE: {item.size}) <strong>x{item.quantity}</strong></span>
                                  <span className="font-mono text-zinc-600">₦{(item.price * item.quantity).toLocaleString()}</span>
                                </div>
                              ))}
                            </div>
                            <div className="border-t border-zinc-900 mt-3 pt-2 flex justify-between text-[11px] text-white font-medium uppercase tracking-wider">
                              <span>Total Value</span>
                              <span>₦{vo.total_amount?.toLocaleString()}</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                <div className="h-full flex items-center justify-center text-center">
                  <p className="text-[10px] tracking-[0.2em] text-zinc-600 uppercase">Select a vendor to audit profile analytics and order logs</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* --- TAB 6: REAL-TIME E-COMMERCE TRAFFIC ANALYTICS BREAKDOWN --- */}
        {activeTab === 'analytics' && (
          <div className="space-y-6 animate-fade-in">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="bg-white border border-zinc-300 p-6 shadow-sm rounded-sm">
                <span className="text-[8px] text-zinc-400 block tracking-widest uppercase mb-1">Total Page Visits</span>
                <h2 className="text-3xl font-light tracking-wide text-black font-serif animate-pulse">{totalVisits.toLocaleString()} <span className="text-[9px] tracking-widest text-zinc-400 uppercase font-sans">Logs</span></h2>
              </div>
              <div className="bg-[#0A0A0A] text-white border border-zinc-900 p-6 shadow-sm rounded-sm">
                <span className="text-[8px] text-zinc-500 block tracking-widest uppercase mb-1">Interactive Product Clicks</span>
                <h2 className="text-3xl font-light tracking-wide text-white font-serif">{totalClicks.toLocaleString()} <span className="text-[9px] tracking-widest text-zinc-500 uppercase font-sans">Interactions</span></h2>
              </div>
              <div className="bg-white border border-zinc-300 p-6 shadow-sm rounded-sm">
                <span className="text-[8px] text-zinc-400 block tracking-widest uppercase mb-1">Click-Through Engagement</span>
                <h2 className="text-3xl font-light tracking-wide text-black font-serif">{clickThroughRate}% <span className="text-[9px] tracking-widest text-zinc-400 uppercase font-sans">Rate</span></h2>
              </div>
            </div>
            <div className="bg-[#0A0A0A] text-white border border-zinc-900 p-6 sm:p-8 shadow-2xl rounded-sm">
              <div className="border-b border-zinc-800 pb-3 mb-4 flex justify-between items-center">
                <h4 className="text-[10px] tracking-widest uppercase text-zinc-400 font-medium">Real-Time Interaction Feed Matrix</h4>
                <span className="text-[7.5px] bg-green-900/50 text-green-400 border border-green-800 px-2 py-0.5 rounded-full uppercase tracking-widest animate-pulse">Live</span>
              </div>
              {analyticsData.length === 0 ? (
                <p className="text-[9px] text-zinc-600 uppercase tracking-widest text-center py-8">Awaiting real-time pipeline event transfers...</p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-[10px] tracking-wider uppercase divide-y divide-zinc-900 text-zinc-400">
                    <thead>
                      <tr className="text-zinc-600 text-[8px] tracking-widest border-b border-zinc-900 pb-2">
                        <th className="py-2.5 font-medium">Timestamp</th>
                        <th className="py-2.5 font-medium">Action Event</th>
                        <th className="py-2.5 font-medium">Target Canvas Log</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-zinc-900">
                      {analyticsData.slice(0, 20).map((metric) => (
                        <tr key={metric.id} className="hover:bg-[#111] transition-colors">
                          <td className="py-3 font-mono text-[8.5px] text-zinc-500">{new Date(metric.created_at).toLocaleTimeString()}</td>
                          <td className="py-3">
                            <span className={`px-2 py-0.5 rounded-sm text-[8px] font-medium tracking-widest ${metric.event_type === 'visit' ? 'bg-zinc-800 text-zinc-300' : 'bg-white text-black'}`}>
                              {metric.event_type}
                            </span>
                          </td>
                          <td className="py-3 text-white truncate max-w-[240px]">
                            {metric.event_type === 'click' ? `Clicked Product: ${metric.product_name || 'Item Tile'}` : `Viewed Path: ${metric.page_path}`}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
