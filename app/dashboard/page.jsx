/* eslint-disable @next/next/no-img-element */
'use client';
export const dynamic = 'force-dynamic';

import { useState, useEffect, useRef } from 'react';
import { createClient } from '@supabase/supabase-js';
import { useApp } from '../providers';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
const supabase = createClient(supabaseUrl, supabaseAnonKey);

export default function ClientDashboard() {
  const { showToast } = useApp();
  const [activeTab, setActiveTab] = useState('tickets'); // tickets, orders, settings
  const [userProfile, setUserProfile] = useState(null);
  const [tickets, setTickets] = useState([]);
  const [orders, setOrders] = useState([]);
  
  const [activeChat, setActiveChat] = useState(null);
  const [replyText, setReplyText] = useState('');
  const [sendingReply, setSendingReply] = useState(false);

  // --- NEW TICKET CREATION STATES ---
  const [newTicketSubject, setNewTicketSubject] = useState('');
  const [newTicketMessage, setNewTicketMessage] = useState('');
  const [creatingTicket, setCreatingTicket] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);

  // --- REALTIME TYPING STATES ---
  const [isAdminTyping, setIsAdminTyping] = useState(false);
  const typingChannelRef = useRef(null);
  const typingTimeoutRef = useRef(null);
  const chatEndRef = useRef(null);

  useEffect(() => {
    // Attempt to grab authenticated session info from local client storage
    const storedUser = localStorage.getItem('sikamore_user_profile');
    if (storedUser) {
      setUserProfile(JSON.parse(storedUser));
    } else {
      // Fallback fallback profile if no explicit login context exists yet
      const fallback = { name: 'VALUED CLIENT', email: 'client@sikamore.internal' };
      setUserProfile(fallback);
      localStorage.setItem('sikamore_user_profile', JSON.stringify(fallback));
    }
  }, []);

  useEffect(() => {
    if (!userProfile) return;

    async function loadClientData() {
      try {
        if (activeTab === 'tickets') {
          const { data } = await supabase
            .from('support_tickets')
            .select('*')
            .eq('email', userProfile.email)
            .order('created_at', { ascending: false });
          if (data) setTickets(data);
        }
        if (activeTab === 'orders') {
          const { data } = await supabase
            .from('orders')
            .select('*')
            .eq('customer_email', userProfile.email)
            .order('created_at', { ascending: false });
          if (data) setOrders(data);
        }
      } catch (err) {
        console.error("Client pipeline exception: ", err);
      }
    }
    loadClientData();
  }, [userProfile, activeTab]);

  // --- REAL-TIME MESSAGING SYNC ---
  useEffect(() => {
    if (!userProfile || activeTab !== 'tickets') return;

    const messageSync = supabase.channel('realtime_support_client')
      .on('postgres_changes', { 
        event: 'UPDATE', 
        schema: 'public', 
        table: 'support_tickets',
        filter: `email=eq.${userProfile.email}`
      }, (payload) => {
        setTickets((prev) => prev.map(t => t.id === payload.new.id ? payload.new : t));
        if (activeChat && activeChat.id === payload.new.id) {
          setActiveChat(payload.new);
        }
      })
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'support_tickets',
        filter: `email=eq.${userProfile.email}`
      }, (payload) => {
        setTickets((prev) => [payload.new, ...prev]);
      })
      .subscribe();

    return () => {
      supabase.removeChannel(messageSync);
    };
  }, [userProfile, activeTab, activeChat]);

  // --- REAL-TIME TYPING INDICATOR SYNC ---
  useEffect(() => {
    if (!activeChat) return;

    const channel = supabase.channel(`typing_support_${activeChat.id}`);
    typingChannelRef.current = channel;

    channel.on('broadcast', { event: 'typing' }, (payload) => {
      if (payload.payload.sender === 'admin') {
        setIsAdminTyping(payload.payload.isTyping);
        if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
        if (payload.payload.isTyping) {
          typingTimeoutRef.current = setTimeout(() => setIsAdminTyping(false), 3000);
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
    if (activeChat && chatEndRef.current) {
      chatEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [activeChat]);

  const handleClientTyping = (e) => {
    setReplyText(e.target.value);
    if (typingChannelRef.current) {
      typingChannelRef.current.send({
        type: 'broadcast',
        event: 'typing',
        payload: { sender: 'user', isTyping: e.target.value.length > 0 }
      });
    }
  };

  const handleCreateTicket = async (e) => {
    e.preventDefault();
    if (!newTicketSubject.trim() || !newTicketMessage.trim()) return;
    setCreatingTicket(true);

    try {
      const { data, error } = await supabase
        .from('support_tickets')
        .insert([{
          name: userProfile.name.toUpperCase(),
          email: userProfile.email,
          subject: newTicketSubject.toUpperCase(),
          message: newTicketMessage,
          status: 'unread',
          chat_history: [{ sender: 'user', text: newTicketMessage, timestamp: new Date().toISOString() }]
        }])
        .select();

      if (error) throw error;

      showToast('SUPPORT FILE RECORDED. DIRECT PORTAL OPEN.');
      setNewTicketSubject('');
      setNewTicketMessage('');
      setShowCreateModal(false);
      if (data && data) setActiveChat(data);
    } catch (err) {
      showToast(`CREATION ERROR: ${err.message.toUpperCase()}`);
    } finally {
      setCreatingTicket(false);
    }
  };

  const handleClientReply = async (e) => {
    e.preventDefault();
    if (!replyText.trim()) return;
    setSendingReply(true);

    try {
      const clientMessage = { sender: 'user', text: replyText, timestamp: new Date().toISOString() };
      const currentHistory = activeChat.chat_history && Array.isArray(activeChat.chat_history) && activeChat.chat_history.length > 0
        ? activeChat.chat_history
        : [{ sender: 'user', text: activeChat.message, timestamp: activeChat.created_at }];

      const updatedHistory = [...currentHistory, clientMessage];

      const { error } = await supabase
        .from('support_tickets')
        .update({ chat_history: updatedHistory, status: 'unread' })
        .eq('id', activeChat.id);

      if (error) throw error;
      
      if (typingChannelRef.current) {
        typingChannelRef.current.send({ type: 'broadcast', event: 'typing', payload: { sender: 'user', isTyping: false } });
      }

      setReplyText('');
    } catch (err) {
      showToast(`DISPATCH ERROR: ${err.message.toUpperCase()}`);
    } finally {
      setSendingReply(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F5F5F4] text-black py-12 px-4 sm:px-6 font-sans antialiased relative">
      <div className="max-w-5xl mx-auto">
        
        {/* TOP INTERACTIVE BANNER */}
        <div className="mb-10 text-center relative">
          <h1 className="text-2xl font-normal tracking-[0.4em] uppercase mb-2 font-serif text-black">S. SIKAMÒRE</h1>
          <p className="text-[9px] tracking-[0.2em] uppercase text-zinc-500 mb-8">Client Private Console</p>
          
          <div className="flex flex-wrap justify-center gap-4">
            {['tickets', 'orders'].map((tab) => (
              <button key={tab} onClick={() => { setActiveTab(tab); setActiveChat(null); }} className={`px-5 py-2 text-[9px] tracking-[0.2em] uppercase transition-colors border ${activeTab === tab ? 'bg-black text-white border-black' : 'bg-transparent text-zinc-500 border-zinc-300 hover:border-black hover:text-black'}`}>
                {tab === 'tickets' ? 'Concierge Messages' : 'Order Archives'}
              </button>
            ))}
          </div>
        </div>

        {/* --- CONCIERGE SUPPORT INBOX CHANNEL --- */}
        {activeTab === 'tickets' && (
          <div className="bg-[#0A0A0A] text-white p-0 flex flex-col md:flex-row h-[600px] border border-zinc-800 shadow-2xl relative overflow-hidden">
            
            {/* Ticket List Panel (Hidden on mobile when chat is opened) */}
            <div className={`w-full md:w-1/3 border-r border-zinc-800 bg-[#111] overflow-y-auto ${activeChat ? 'hidden md:block' : 'block'} h-full`}>
              <div className="p-6 border-b border-zinc-800 sticky top-0 bg-[#111] flex justify-between items-center z-10">
                <h2 className="text-xs tracking-[0.3em] text-zinc-400 uppercase">Your Tickets</h2>
                <button onClick={() => setShowCreateModal(true)} className="text-[8px] tracking-widest uppercase bg-white text-black font-semibold px-3 py-1.5 hover:bg-zinc-200 transition-colors">
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

            {/* Live Message Terminal Panel (Hidden on mobile when no chat is opened) */}
            <div className={`w-full md:w-2/3 flex-col bg-[#0A0A0A] ${!activeChat ? 'hidden md:flex' : 'flex'} h-full`}>
              {activeChat ? (
                <>
                  <div className="p-6 border-b border-zinc-800 bg-[#0A0A0A] flex justify-between items-center shrink-0">
                    <div>
                      <h3 className="text-xs uppercase tracking-widest text-white font-medium truncate max-w-[200px] sm:max-w-md">{activeChat.subject}</h3>
                      <p className="text-[8px] text-zinc-500 tracking-widest mt-1">ID: #{activeChat.id.slice(0,8).toUpperCase()}</p>
                    </div>
                    {/* Mobile Screen Return Flow Button */}
                    <button onClick={() => setActiveChat(null)} className="md:hidden text-[9px] tracking-widest uppercase border border-zinc-700 px-3 py-1.5 hover:bg-zinc-800 text-zinc-300 transition-colors">
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
                    
                    {/* Dynamic Real-time Typist Indicator */}
                    {isAdminTyping && (
                      <div className="flex flex-col items-start animate-fade-in">
                        <span className="text-[8px] tracking-[0.2em] text-green-400 uppercase mb-1">Support is typing...</span>
                      </div>
                    )}
                    <div ref={chatEndRef} />
                  </div>
                  
                  {/* Textarea field styled at text-base (16px) to block mobile viewport layout scaling and zooming */}
                  <form onSubmit={handleClientReply} className="p-6 border-t border-zinc-800 bg-[#111] flex gap-4 shrink-0">
                    <input type="text" value={replyText} onChange={handleClientTyping} placeholder="Type your message..." className="flex-1 bg-[#161616] p-4 border border-zinc-800 focus:border-white outline-none text-base text-white tracking-wide placeholder-zinc-600" />
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

        {/* --- ORDERS STREAM ARCHIVE --- */}
        {activeTab === 'orders' && (
          <div className="space-y-6">
            {orders.length === 0 ? (
              <div className="bg-[#0A0A0A] text-zinc-500 p-12 text-center border border-zinc-800 uppercase tracking-widest text-[10px]">No historical purchases found under this profile registry.</div>
            ) : (
              orders.map((order) => (
                <div key={order.id} className="bg-[#0A0A0A] text-white border border-zinc-900 shadow-xl p-6 sm:p-8 flex flex-col gap-6">
                  <div className="flex justify-between items-center border-b border-zinc-900 pb-4">
                    <div>
                      <p className="text-[8px] tracking-widest text-zinc-500 uppercase font-mono">ORDER REFERENCE: #{order.id.slice(0,8).toUpperCase()}</p>
                      <span className="text-[9px] text-zinc-400 block mt-1">{new Date(order.created_at).toLocaleDateString()}</span>
                    </div>
                    <span className="px-3 py-1 bg-zinc-900 border border-zinc-800 text-[8px] tracking-widest uppercase text-white font-medium">{order.status}</span>
                  </div>
                  <div className="space-y-2">
                    {order.items?.map((item, idx) => (
                      <div key={idx} className="flex justify-between text-[10px] uppercase tracking-wider text-zinc-300">
                        <span>{item.name} (SIZE: {item.size}) <strong className="text-white">x{item.quantity}</strong></span>
                        <span className="font-mono text-zinc-500">₦{(item.price * item.quantity).toLocaleString()}</span>
                      </div>
                    ))}
                    <div className="border-t border-zinc-900 mt-4 pt-3 flex justify-between text-white font-medium text-xs uppercase tracking-wider">
                      <span>Total Remitted</span>
                      <span>₦{order.total_amount?.toLocaleString()}</span>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {/* --- MODAL DIALOG LAYER: CREATE NEW TICKET TANK --- */}
        {showCreateModal && (
          <div className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-4 backdrop-blur-sm">
            <div className="bg-[#0A0A0A] border border-zinc-800 text-white max-w-md w-full p-6 sm:p-8 shadow-2xl relative">
              <button onClick={() => setShowCreateModal(false)} className="absolute top-4 right-4 text-zinc-400 hover:text-white transition-colors text-xs">✕</button>
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
