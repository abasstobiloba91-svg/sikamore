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

export default function ClientDashboard() {
  const { showToast, wishlist, toggleWishlist, addToCart } = useApp();
  
  const [activeTab, setActiveTab] = useState('orders'); 
  const [userProfile, setUserProfile] = useState(null);
  
  const [tickets, setTickets] = useState([]);
  const [orders, setOrders] = useState([]);
  
  const [activeChat, setActiveChat] = useState(null);
  const [replyText, setReplyText] = useState('');
  const [sendingReply, setSendingReply] = useState(false);

  const [newTicketSubject, setNewTicketSubject] = useState('');
  const [newTicketMessage, setNewTicketMessage] = useState('');
  const [creatingTicket, setCreatingTicket] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);

  const [isAdminTyping, setIsAdminTyping] = useState(false);
  const typingChannelRef = useRef(null);
  const typingTimeoutRef = useRef(null);
  const chatEndRef = useRef(null);

  const [isEditingAddress, setIsEditingAddress] = useState(false);
  const [addressInput, setAddressInput] = useState('');

  // SECURE AUTHENTICATION BRIDGE LOAD
  useEffect(() => {
    async function fetchSecureSession() {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        const profile = {
          name: session.user.user_metadata?.name || 'VALUED CLIENT',
          email: session.user.email,
          address: session.user.user_metadata?.address || ''
        };
        setUserProfile(profile);
        setAddressInput(profile.address);
      } else {
        // Look for local profile fallback if database sync delay occurs
        const localUser = localStorage.getItem('sikamore_user_profile');
        if (localUser) {
          setUserProfile(JSON.parse(localUser));
        } else {
          window.location.href = '/shop';
        }
      }
    }
    fetchSecureSession();
  }, []);

  // SMART URL ROUTING (Intercepts ?tab=wishlist parameter gracefully)
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const tab = params.get('tab');
      if (tab && ['orders', 'wishlist', 'support', 'profile'].includes(tab)) {
        setActiveTab(tab);
      }
    }
  }, []);

  useEffect(() => {
    if (!userProfile) return;
    async function loadClientData() {
      try {
        if (activeTab === 'support') {
          const { data } = await supabase.from('support_tickets').select('*').eq('email', userProfile.email).order('created_at', { ascending: false });
          if (data) setTickets(data);
        }
        if (activeTab === 'orders') {
          const { data } = await supabase.from('orders').select('*').eq('customer_email', userProfile.email).order('created_at', { ascending: false });
          if (data) setOrders(data);
        }
      } catch (err) {
        console.error("Data fetch exception: ", err);
      }
    }
    loadClientData();
  }, [userProfile, activeTab]);

  useEffect(() => {
    if (!userProfile || activeTab !== 'support') return;
    const messageSync = supabase.channel('realtime_support_client')
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'support_tickets', filter: `email=eq.${userProfile.email}` }, (payload) => {
        setTickets((prev) => prev.map(t => t.id === payload.new.id ? payload.new : t));
        if (activeChat && activeChat.id === payload.new.id) setActiveChat(payload.new);
      })
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'support_tickets', filter: `email=eq.${userProfile.email}` }, (payload) => {
        setTickets((prev) => [payload.new, ...prev]);
      }).subscribe();
    return () => { supabase.removeChannel(messageSync); };
  }, [userProfile, activeTab, activeChat]);

  useEffect(() => {
    if (!activeChat) return;
    const channel = supabase.channel(`typing_support_${activeChat.id}`);
    typingChannelRef.current = channel;
    channel.on('broadcast', { event: 'typing' }, (payload) => {
      if (payload.payload.sender === 'admin') {
        setIsAdminTyping(payload.payload.isTyping);
        if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
        if (payload.payload.isTyping) typingTimeoutRef.current = setTimeout(() => setIsAdminTyping(false), 3000);
      }
    }).subscribe();
    return () => {
      supabase.removeChannel(channel);
      if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
      typingChannelRef.current = null;
    };
  }, [activeChat?.id]);

  useEffect(() => {
    if (activeChat && chatEndRef.current) chatEndRef.current.scrollIntoView({ behavior: 'smooth' });
  }, [activeChat]);

  const handleClientTyping = (e) => {
    setReplyText(e.target.value);
    if (typingChannelRef.current) {
      typingChannelRef.current.send({ type: 'broadcast', event: 'typing', payload: { sender: 'user', isTyping: e.target.value.length > 0 } });
    }
  };

  const handleCreateTicket = async (e) => {
    e.preventDefault();
    setCreatingTicket(true);
    try {
      const { data, error } = await supabase.from('support_tickets').insert([{
        name: userProfile.name.toUpperCase(), email: userProfile.email, subject: newTicketSubject.toUpperCase(), message: newTicketMessage, status: 'unread', chat_history: [{ sender: 'user', text: newTicketMessage, timestamp: new Date().toISOString() }]
      }]).select();
      if (error) throw error;
      setNewTicketSubject(''); setNewTicketMessage(''); setShowCreateModal(false);
      showToast('SUPPORT FILE RECORDED. DIRECT PORTAL OPEN.');
      if (data && data[0]) setActiveChat(data[0]);
    } catch (err) { showToast(`ERROR: ${err.message.toUpperCase()}`); } finally { setCreatingTicket(false); }
  };

  const handleClientReply = async (e) => {
    e.preventDefault();
    setSendingReply(true);
    try {
      const updatedHistory = [...(activeChat.chat_history || []), { sender: 'user', text: replyText, timestamp: new Date().toISOString() }];
      const { error } = await supabase.from('support_tickets').update({ chat_history: updatedHistory, status: 'unread' }).eq('id', activeChat.id);
      if (error) throw error;
      if (typingChannelRef.current) typingChannelRef.current.send({ type: 'broadcast', event: 'typing', payload: { sender: 'user', isTyping: false } });
      setReplyText('');
    } catch (err) {
      showToast(`DISPATCH ERROR: ${err.message.toUpperCase()}`);
    } finally { setSendingReply(false); }
  };

  const handleSaveAddress = async () => {
    try {
      const { error } = await supabase.auth.updateUser({ data: { address: addressInput } });
      if (error) throw error;
      setUserProfile(prev => ({ ...prev, address: addressInput }));
      setIsEditingAddress(false);
      showToast('ADDRESS BOOK REGISTRY SAVED.');
    } catch (err) {
      showToast(`MUTATION ERROR: ${err.message.toUpperCase()}`);
    }
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    localStorage.removeItem('sikamore_user_profile');
    window.location.href='/';
  };

  if (!userProfile) return null;

  return (
    <div className="min-h-screen bg-white text-black py-12 px-4 sm:px-6 font-sans antialiased relative">
      <div className="max-w-6xl mx-auto">
        
        <div className="mb-12 text-center relative border-b border-zinc-200 pb-10">
          <Link href="/" className="text-2xl font-normal tracking-[0.4em] uppercase font-serif text-black hover:text-zinc-600 transition-colors">S. SIKAMÒRE</Link>
          <p className="text-[9px] tracking-[0.2em] uppercase text-zinc-500 mt-2 mb-8">Client Private Console</p>
          
          <div className="flex flex-wrap justify-center gap-2 sm:gap-4">
            {['orders', 'wishlist', 'support', 'profile'].map((tab) => (
              <button key={tab} onClick={() => { setActiveTab(tab); setActiveChat(null); }} className={`px-5 py-2.5 text-[9px] tracking-[0.2em] uppercase transition-colors border ${activeTab === tab ? 'bg-black text-white border-black shadow-md' : 'bg-transparent text-zinc-600 border-zinc-300 hover:border-black hover:text-black'}`}>
                {tab}
              </button>
            ))}
          </div>
        </div>

        {/* --- ORDERS ARCHIVE --- */}
        {activeTab === 'orders' && (
          <div className="max-w-4xl mx-auto space-y-6 animate-fade-in">
            {orders.length === 0 ? (
              <div className="bg-zinc-50 text-zinc-500 p-16 text-center border border-zinc-200 uppercase tracking-widest text-[10px]">No historical purchases found under this profile registry.</div>
            ) : (
              orders.map((order) => (
                <div key={order.id} className="bg-white text-black border border-zinc-200 shadow-sm hover:shadow-md transition-shadow p-6 sm:p-8 flex flex-col gap-6">
                  <div className="flex justify-between items-start border-b border-zinc-100 pb-4">
                    <div>
                      <p className="text-[9px] tracking-widest text-zinc-500 uppercase font-mono">ORDER REF: #{order.id.slice(0,8).toUpperCase()}</p>
                      <span className="text-[10px] text-zinc-400 block mt-1">{new Date(order.created_at).toLocaleDateString()}</span>
                    </div>
                    <div className="text-right">
                      <span className={`px-3 py-1 text-[9px] tracking-widest uppercase font-medium block ${order.status === 'shipped' ? 'bg-black text-white' : order.status === 'delivered' ? 'bg-green-100 text-green-800' : 'bg-zinc-100 text-zinc-800'}`}>
                        {order.status}
                      </span>
                      {order.status === 'shipped' && order.estimated_delivery && (
                        <span className="text-[9px] text-zinc-600 tracking-widest block mt-2 uppercase font-mono bg-zinc-50 border border-zinc-200 px-2 py-1">
                          ETA: {order.estimated_delivery}
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="space-y-3">
                    {order.items?.map((item, idx) => (
                      <div key={idx} className="flex justify-between text-[11px] uppercase tracking-wider text-black">
                        <span>{item.name} <span className="text-zinc-500">(SIZE: {item.size})</span> <strong className="ml-2 font-medium">x{item.quantity}</strong></span>
                        <span className="font-medium text-zinc-700">₦{(item.price * item.quantity).toLocaleString()}</span>
                      </div>
                    ))}
                  </div>
                  <div className="border-t border-zinc-100 mt-2 pt-4 flex justify-between text-black font-semibold text-xs uppercase tracking-wider">
                    <span>Total Remitted</span>
                    <span>₦{order.total_amount?.toLocaleString()}</span>
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {/* --- WISHLIST TAB --- */}
        {activeTab === 'wishlist' && (
          <div className="animate-fade-in">
            {wishlist.length === 0 ? (
              <div className="bg-zinc-50 text-zinc-500 p-16 text-center border border-zinc-200 uppercase tracking-widest text-[10px]">Your archive wishlist is currently empty.</div>
            ) : (
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6">
                {wishlist.map((item) => (
                  <div key={item.id} className="group flex flex-col relative bg-white border border-zinc-100 p-2 shadow-sm">
                    <div className="bg-zinc-50 aspect-[3/4] w-full overflow-hidden relative flex items-center justify-center rounded-sm">
                      <img src={item.image} alt={item.name} className="w-full h-full object-cover" />
                      <button onClick={() => toggleWishlist(item)} className="absolute top-2 right-2 text-red-500 hover:text-red-700 z-10 bg-white/80 p-1.5 rounded-full backdrop-blur-sm">✕</button>
                    </div>
                    <div className="flex flex-col mt-3 text-center pb-2">
                      <h3 className="text-[9px] sm:text-[10px] tracking-[0.15em] uppercase text-zinc-600 truncate">{item.name}</h3>
                      <p className="text-[10px] tracking-widest text-black font-medium mt-1">₦{Number(item.price).toLocaleString()}</p>
                      
                      {/* ADDS ITEM TO BAG AND AUTOMATICALLY CLEARS IT FROM WISHLIST SEAMLESSLY */}
                      <button 
                        onClick={() => { 
                          addToCart(item, 1, 'M'); 
                          toggleWishlist(item); 
                          showToast('ITEM TRANSFERRED TO YOUR SHOPPING BAG.'); 
                        }} 
                        className="mt-3 w-full bg-black text-white py-2 text-[8px] tracking-widest uppercase hover:bg-zinc-800 transition-colors font-medium"
                      >
                        Quick Add
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* --- PROFILE / SETTINGS TAB --- */}
        {activeTab === 'profile' && (
          <div className="max-w-xl mx-auto animate-fade-in">
            <div className="bg-white border border-zinc-200 shadow-sm p-8 sm:p-12 text-center flex flex-col items-center">
              <div className="w-20 h-20 bg-zinc-100 rounded-full flex items-center justify-center mb-6 border border-zinc-200">
                <span className="text-xl font-serif text-zinc-400">{userProfile?.name?.charAt(0) || 'C'}</span>
              </div>
              <h2 className="text-lg font-medium tracking-widest uppercase mb-1">{userProfile?.name}</h2>
              <p className="text-xs text-zinc-500 tracking-widest mb-8 font-mono">{userProfile?.email}</p>
              
              <div className="w-full text-left bg-zinc-50 border border-zinc-200 p-6 mb-8">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-[10px] tracking-widest uppercase font-medium text-black">Saved Dispatch Destination</h3>
                  {!isEditingAddress && (
                    <button onClick={() => setIsEditingAddress(true)} className="text-[9px] uppercase tracking-widest text-zinc-500 hover:text-black border-b border-zinc-300 hover:border-black transition-all">
                      Edit
                    </button>
                  )}
                </div>
                {isEditingAddress ? (
                  <div className="space-y-4">
                    <textarea 
                      value={addressInput} 
                      onChange={(e) => setAddressInput(e.target.value)} 
                      rows="3" 
                      className="w-full bg-white p-4 border border-zinc-300 text-base uppercase tracking-wider outline-none focus:border-black resize-none" 
                      placeholder="ENTER PRIMARY SHIPPING ADDRESS MATRIX (STREET, CITY, STATE)..." 
                    />
                    <div className="flex gap-2">
                      <button onClick={handleSaveAddress} className="flex-1 bg-black text-white py-2.5 text-[9px] tracking-widest uppercase font-medium transition-colors hover:bg-zinc-800">
                        Save Address
                      </button>
                      <button onClick={() => { setIsEditingAddress(false); setAddressInput(userProfile?.address || ''); }} className="flex-1 border border-zinc-300 text-black py-2.5 text-[9px] tracking-widest uppercase font-medium transition-colors hover:bg-zinc-100">
                        Cancel
                      </button>
                    </div>
                  </div>
                ) : (
                  <p className="text-xs text-zinc-600 uppercase tracking-widest leading-relaxed font-mono">
                    {userProfile?.address || "No fallback delivery itinerary logged to this profile."}
                  </p>
                )}
              </div>

              <div className="w-full space-y-4 border-t border-zinc-100 pt-8">
                <button onClick={handleSignOut} className="w-full bg-zinc-900 text-white py-4 text-[10px] tracking-widest uppercase hover:bg-black transition-colors font-medium">Sign Out Profile</button>
              </div>
            </div>
          </div>
        )}

        {/* --- CONCIERGE SUPPORT INBOX CHANNEL --- */}
        {activeTab === 'support' && (
          <div className="bg-[#0A0A0A] text-white p-0 flex flex-col md:flex-row h-[650px] border border-zinc-800 shadow-2xl relative overflow-hidden">
            
            <div className={`w-full md:w-1/3 border-r border-zinc-800 bg-[#111] overflow-y-auto ${activeChat ? 'hidden md:block' : 'block'} h-full`}>
              <div className="p-6 border-b border-zinc-800 sticky top-0 bg-[#111] flex justify-between items-center z-10">
                <h2 className="text-xs tracking-[0.3em] text-zinc-400 uppercase">Your Tickets</h2>
                <button onClick={() => setShowCreateModal(true)} className="text-[8px] tracking-widest uppercase bg-white text-black font-semibold px-3 py-1.5 hover:bg-zinc-200 transition-colors shadow-sm">
                  + New
                </button>
              </div>
              <div className="flex flex-col">
                {tickets.length === 0 ? (
                  <p className="text-[9px] text-zinc-600 uppercase tracking-widest text-center py-12">No active message logs found.</p>
                ) : (
                  tickets.map((ticket) => (
                    <button key={ticket.id} onClick={() => setActiveChat(ticket)} className={`p-5 text-left border-b border-zinc-800 hover:bg-[#161616] transition-colors flex flex-col gap-1 ${activeChat?.id === ticket.id ? 'bg-[#161616] border-l-2 border-l-white' : ''}`}>
                      <div className="flex justify-between items-center">
                        <span className="text-xs font-medium uppercase tracking-wider truncate max-w-[80%]">{ticket.subject}</span>
                        {ticket.status === 'replied' && <span className="w-1.5 h-1.5 bg-green-400 rounded-full animate-pulse"></span>}
                      </div>
                      <p className="text-[8px] text-zinc-500 uppercase tracking-widest mt-1">Status: {ticket.status}</p>
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
                      <h3 className="text-xs uppercase tracking-widest text-white font-medium truncate max-w-[200px] sm:max-w-md">{activeChat.subject}</h3>
                      <p className="text-[8px] text-zinc-500 tracking-widest mt-1">ID: #{activeChat.id.slice(0,8).toUpperCase()}</p>
                    </div>
                    <button onClick={() => setActiveChat(null)} className="md:hidden text-base md:text-[9px] tracking-widest uppercase border border-zinc-700 px-4 py-2 hover:bg-zinc-800 text-zinc-300 transition-colors rounded-sm">
                      &larr; Back
                    </button>
                  </div>

                  <div className="flex-1 p-6 overflow-y-auto space-y-4 bg-[#0D0D0D]">
                    {(activeChat.chat_history?.length > 0 ? activeChat.chat_history : [{ sender: 'user', text: activeChat.message, timestamp: activeChat.created_at }]).map((msg, idx) => (
                      <div key={idx} className={`flex flex-col ${msg.sender === 'user' ? 'items-end' : 'items-start'}`}>
                        <span className="text-[8px] tracking-[0.2em] text-zinc-600 uppercase mb-1">{msg.sender === 'user' ? 'You' : 'Sikamore Support'}</span>
                        <div className={`max-w-[85%] p-4 text-[11px] leading-relaxed tracking-wider border ${msg.sender === 'user' ? 'bg-[#161616] border-zinc-800 text-zinc-300' : 'bg-white border-white text-black font-medium'}`}>{msg.text}</div>
                      </div>
                    ))}
                    
                    {isAdminTyping && (
                      <div className="flex flex-col items-start animate-fade-in">
                        <span className="text-[8px] tracking-[0.2em] text-green-400 uppercase mb-1">Support is typing...</span>
                      </div>
                    )}
                    <div ref={chatEndRef} />
                  </div>
                  
                  <form onSubmit={handleClientReply} className="p-6 border-t border-zinc-800 bg-[#111] flex gap-4 shrink-0">
                    <input 
                      type="text" 
                      value={replyText} 
                      onChange={handleClientTyping} 
                      placeholder="Type your message..." 
                      className="flex-1 bg-[#161616] p-4 border border-zinc-800 focus:border-white outline-none text-base text-white tracking-wide placeholder-zinc-600" 
                    />
                    <button type="submit" disabled={sendingReply || !replyText.trim()} className="bg-white text-black px-6 text-[9px] tracking-widest uppercase font-medium hover:bg-zinc-200 transition-colors disabled:opacity-30">
                      {sendingReply ? 'SENDING...' : 'DISPATCH'}
                    </button>
                  </form>
                </>
              ) : (
                <div className="flex-1 flex items-center justify-center p-6">
                  <p className="text-[10px] tracking-[0.2em] text-zinc-600 uppercase text-center">Select an open ticket conversation stream or log a new support file request</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* --- MODAL DIALOG LAYER: CREATE NEW TICKET TANK --- */}
        {showCreateModal && (
          <div className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-4 backdrop-blur-sm">
            <div className="bg-[#0A0A0A] border border-zinc-800 text-white max-w-md w-full p-6 sm:p-8 shadow-2xl relative">
              <button onClick={() => { setShowCreateModal(false); }} className="absolute top-4 right-4 text-zinc-400 hover:text-white transition-colors text-xs p-2">✕</button>
              <h3 className="text-xs uppercase tracking-[0.25em] text-zinc-400 border-b border-zinc-900 pb-3 mb-6 font-medium">Log New Support File</h3>
              
              <form onSubmit={handleCreateTicket} className="space-y-6">
                <div>
                  <label className="block text-[8px] tracking-[0.2em] text-zinc-500 mb-2 uppercase">Subject Header</label>
                  <input type="text" value={newTicketSubject} onChange={(e) => setNewTicketSubject(e.target.value)} required placeholder="E.G. TRANSACTION DISCREPANCY / SIZE EXCHANGE" className="w-full bg-[#111] p-4 border border-zinc-800 focus:border-white outline-none text-base text-white uppercase tracking-wider transition-colors" />
                </div>
                <div>
                  <label className="block text-[8px] tracking-[0.2em] text-zinc-500 mb-2 uppercase">Detailed Message Context</label>
                  <textarea value={newTicketMessage} onChange={(e) => setNewTicketMessage(e.target.value)} required rows="5" placeholder="State your context inquiries clearly here..." className="w-full bg-[#111] p-4 border border-zinc-800 focus:border-white outline-none text-base text-white tracking-wider resize-none transition-colors" />
                </div>
                <button type="submit" disabled={creatingTicket} className="w-full bg-white text-black py-4 text-[9px] tracking-[0.3em] uppercase hover:bg-zinc-200 font-medium transition-colors disabled:opacity-40">
                  {creatingTicket ? 'DISPATCHING FILE...' : 'INITIALIZE CHAT CONNECT'}
                </button>
              </form>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
