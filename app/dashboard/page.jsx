/* eslint-disable @next/next/no-img-element */
'use client';

import { useEffect, useState, useRef } from 'react';
import { createClient } from '@supabase/supabase-js';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useApp } from '../providers';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
const supabase = createClient(supabaseUrl, supabaseAnonKey);

export default function UserDashboard() {
  const router = useRouter();
  const { showToast, hasUnreadSupport, setHasUnreadSupport } = useApp();
  
  const [user, setUser] = useState(null);
  const [orders, setOrders] = useState([]);
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('orders');

  // Chat UI States
  const [activeTicket, setActiveTicket] = useState(null);
  const [showNewTicketForm, setShowNewTicketForm] = useState(false);
  const [supportSubject, setSupportSubject] = useState('');
  const [supportMessage, setSupportMessage] = useState('');
  const [replyText, setReplyText] = useState('');
  const [sendingSupport, setSendingSupport] = useState(false);
  const chatEndRef = useRef(null);

  useEffect(() => {
    async function fetchUserData() {
      try {
        const { data: { user }, error: authError } = await supabase.auth.getUser();
        if (authError || !user) { router.push('/login'); return; }
        setUser(user);

        const [orderRes, ticketRes] = await Promise.all([
          supabase.from('orders').select('*').eq('customer_email', user.email).order('created_at', { ascending: false }),
          supabase.from('support_tickets').select('*').eq('email', user.email).order('created_at', { ascending: false })
        ]);

        if (orderRes.data) setOrders(orderRes.data);
        if (ticketRes.data) setTickets(ticketRes.data);

      } catch (err) { console.error(err); } 
      finally { setLoading(false); }
    }
    fetchUserData();
  }, [router]);

  // Scroll to bottom of chat automatically
  useEffect(() => {
    if (activeTicket && chatEndRef.current) {
      chatEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [activeTicket]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    showToast('LOGGED OUT SUCCESSFULLY.');
    router.push('/');
  };

  const openTicketChat = async (ticket) => {
    setActiveTicket(ticket);
    // If it had a red dot, clear it
    if (ticket.has_unread_user) {
      await supabase.from('support_tickets').update({ has_unread_user: false }).eq('id', ticket.id);
      setTickets(prev => prev.map(t => t.id === ticket.id ? { ...t, has_unread_user: false } : t));
      
      // Update global notification if no other unread tickets exist
      const stillUnread = tickets.some(t => t.id !== ticket.id && t.has_unread_user);
      if (!stillUnread) setHasUnreadSupport(false);
    }
  };

  const handleSendNewTicket = async (e) => {
    e.preventDefault();
    setSendingSupport(true);
    try {
      const { data, error } = await supabase.from('support_tickets').insert([{
        name: user.user_metadata?.first_name ? `${user.user_metadata.first_name} ${user.user_metadata.last_name || ''}` : 'Client',
        email: user.email,
        subject: supportSubject,
        message: supportMessage,
        status: 'unread',
        chat_history: [{ sender: 'user', text: supportMessage, timestamp: new Date().toISOString() }]
      }]).select();

      if (error) throw error;
      showToast('INQUIRY DISPATCHED TO CONCIERGE.');
      setTickets([data[0], ...tickets]);
      setShowNewTicketForm(false);
      setSupportSubject('');
      setSupportMessage('');
    } catch (error) { showToast(`ERROR: ${error.message.toUpperCase()}`); } 
    finally { setSendingSupport(false); }
  };

  const handleSendReply = async (e) => {
    e.preventDefault();
    if (!replyText.trim()) return;
    setSendingSupport(true);

    try {
      const newMsg = { sender: 'user', text: replyText, timestamp: new Date().toISOString() };
      
      // Merge old message format with new chat history
      const currentHistory = activeTicket.chat_history?.length > 0 
        ? activeTicket.chat_history 
        : [{ sender: 'user', text: activeTicket.message, timestamp: activeTicket.created_at }];
      
      const newHistory = [...currentHistory, newMsg];

      const { error } = await supabase.from('support_tickets').update({
        chat_history: newHistory,
        status: 'unread',
        has_unread_user: false
      }).eq('id', activeTicket.id);

      if (error) throw error;

      const updatedTicket = { ...activeTicket, chat_history: newHistory, status: 'unread', has_unread_user: false };
      setActiveTicket(updatedTicket);
      setTickets(prev => prev.map(t => t.id === activeTicket.id ? updatedTicket : t));
      setReplyText('');
    } catch (error) { showToast(`ERROR: ${error.message.toUpperCase()}`); } 
    finally { setSendingSupport(false); }
  };

  if (loading) {
    return <div className="min-h-screen bg-[#F5F5F4] flex items-center justify-center"><div className="text-[9px] tracking-[0.4em] text-zinc-400 uppercase animate-pulse">Loading Archive...</div></div>;
  }

  return (
    <div className="min-h-screen bg-[#F5F5F4] text-black font-sans antialiased text-[11px]">
      
      <header className="border-b border-zinc-300 h-20 bg-[#F5F5F4] sticky top-0 z-40 flex items-center shadow-sm">
        <div className="w-full max-w-[1600px] mx-auto px-4 sm:px-8 flex items-center justify-between relative">
          <div className="z-10 flex items-center">
            <Link href="/shop" className="tracking-[0.2em] text-zinc-500 hover:text-black uppercase text-[10px] flex items-center gap-1.5 py-2 transition-colors">
              <span className="text-xs font-light">&larr;</span><span className="hidden sm:inline pt-0.5">Return to Store</span>
            </Link>
          </div>
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none px-4">
            <h1 className="text-xs sm:text-base font-normal tracking-[0.4em] uppercase font-serif text-center text-black pl-[0.4em]">S. SIKAMÒRE</h1>
          </div>
          <div className="z-10 text-right flex items-center gap-4">
            <button onClick={handleLogout} className="text-[9px] text-zinc-500 hover:text-black uppercase tracking-widest transition-colors">Sign Out</button>
          </div>
        </div>
      </header>

      <main className="max-w-[1000px] mx-auto px-4 sm:px-8 py-16 sm:py-24">
        
        <div className="mb-16 text-center">
          <p className="text-[9px] tracking-[0.3em] text-zinc-500 uppercase mb-4">Client Archive</p>
          <h2 className="text-2xl sm:text-3xl font-light tracking-[0.2em] uppercase text-black font-serif">Welcome, {user?.user_metadata?.first_name || 'Client'}</h2>
        </div>

        <div className="flex justify-center border-b border-zinc-300 mb-12">
          <div className="flex gap-8 sm:gap-16 text-[9px] tracking-[0.2em] uppercase">
            <button onClick={() => setActiveTab('orders')} className={`pb-4 transition-colors ${activeTab === 'orders' ? 'border-b-2 border-black text-black' : 'text-zinc-500 hover:text-black'}`}>Order History</button>
            <button onClick={() => setActiveTab('profile')} className={`pb-4 transition-colors ${activeTab === 'profile' ? 'border-b-2 border-black text-black' : 'text-zinc-500 hover:text-black'}`}>Profile</button>
            <button onClick={() => setActiveTab('concierge')} className={`pb-4 transition-colors relative ${activeTab === 'concierge' ? 'border-b-2 border-black text-black' : 'text-zinc-500 hover:text-black'}`}>
              Concierge
              {hasUnreadSupport && <span className="absolute top-0 -right-3 w-1.5 h-1.5 bg-red-600 rounded-full animate-pulse"></span>}
            </button>
          </div>
        </div>

        {/* ORDERS TAB (Unchanged) */}
        {activeTab === 'orders' && (
          <div className="space-y-8 animate-fade-in-up">
            {orders.length === 0 ? (
              <div className="text-center py-20 bg-white border border-zinc-200">
                <p className="text-[10px] tracking-widest text-zinc-500 uppercase mb-6">You have no previous orders.</p>
                <Link href="/shop" className="inline-block bg-black text-white px-8 py-3.5 text-[9px] tracking-[0.2em] uppercase hover:bg-zinc-800 transition-colors">Discover The Curation</Link>
              </div>
            ) : (
              orders.map((order) => (
                <div key={order.id} className="bg-white border border-zinc-200 shadow-sm overflow-hidden">
                  <div className="bg-zinc-50 border-b border-zinc-200 p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="flex flex-wrap gap-x-8 gap-y-2 text-[10px] tracking-widest uppercase">
                      <div><span className="text-zinc-400 block mb-1 text-[8px]">Order Date</span><span className="text-black font-medium">{new Date(order.created_at).toLocaleDateString()}</span></div>
                      <div><span className="text-zinc-400 block mb-1 text-[8px]">Total</span><span className="text-black font-medium">₦{order.total_amount?.toLocaleString()}</span></div>
                      <div><span className="text-zinc-400 block mb-1 text-[8px]">Status</span><span className={`font-medium ${order.status === 'pending' ? 'text-amber-600' : 'text-green-600'}`}>{order.status}</span></div>
                    </div>
                    <div className="text-[9px] tracking-widest text-zinc-400 uppercase font-mono">#{order.id.slice(0, 8)}</div>
                  </div>
                  <div className="p-6 space-y-6">
                    {order.items && order.items.map((item, idx) => (
                      <div key={idx} className="flex gap-6 items-center">
                        <div className="w-16 h-20 bg-zinc-100 shrink-0 border border-zinc-200"><img src={item.image} alt={item.name} className="w-full h-full object-cover" /></div>
                        <div className="flex-1"><h4 className="text-[10px] uppercase tracking-widest font-medium text-black">{item.name}</h4><p className="text-[10px] text-zinc-500 mt-1 uppercase">Size: {item.size} • Qty: {item.quantity}</p></div>
                        <div className="text-[10px] tracking-wider text-black">₦{(item.price * item.quantity).toLocaleString()}</div>
                      </div>
                    ))}
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {/* PROFILE TAB (Unchanged) */}
        {activeTab === 'profile' && (
          <div className="bg-white border border-zinc-200 p-8 sm:p-12 animate-fade-in-up">
            <h3 className="text-xs uppercase tracking-widest font-medium border-b border-zinc-200 pb-4 mb-8">Account Details</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
              <div><p className="text-[9px] tracking-widest text-zinc-400 uppercase mb-2">First Name</p><p className="text-[11px] tracking-widest text-black uppercase">{user?.user_metadata?.first_name || 'N/A'}</p></div>
              <div><p className="text-[9px] tracking-widest text-zinc-400 uppercase mb-2">Last Name</p><p className="text-[11px] tracking-widest text-black uppercase">{user?.user_metadata?.last_name || 'N/A'}</p></div>
              <div className="sm:col-span-2"><p className="text-[9px] tracking-widest text-zinc-400 uppercase mb-2">Email Address</p><p className="text-[11px] tracking-widest text-black">{user?.email}</p></div>
            </div>
          </div>
        )}

        {/* CONCIERGE CHAT TAB */}
        {activeTab === 'concierge' && (
          <div className="bg-[#0A0A0A] text-white shadow-2xl animate-fade-in-up border border-zinc-900 overflow-hidden flex flex-col h-[600px]">
            
            {!activeTicket && !showNewTicketForm && (
              <div className="p-8 sm:p-12 overflow-y-auto flex-1">
                <div className="flex justify-between items-end border-b border-zinc-800 pb-4 mb-8">
                  <h3 className="text-xs uppercase tracking-widest font-medium">Your Inquiries</h3>
                  <button onClick={() => setShowNewTicketForm(true)} className="text-[9px] tracking-[0.2em] uppercase text-zinc-400 hover:text-white border border-zinc-800 px-4 py-2 transition-colors">Start New Inquiry</button>
                </div>
                
                {tickets.length === 0 ? (
                  <p className="text-[10px] text-zinc-500 uppercase tracking-widest text-center py-10">No active inquiries.</p>
                ) : (
                  <div className="space-y-4">
                    {tickets.map(ticket => (
                      <div key={ticket.id} onClick={() => openTicketChat(ticket)} className="bg-[#111] border border-zinc-800 p-6 flex justify-between items-center cursor-pointer hover:border-zinc-500 transition-colors group">
                        <div>
                          <div className="flex items-center gap-3 mb-2">
                            {ticket.has_unread_user && <span className="w-2 h-2 bg-red-600 rounded-full animate-pulse"></span>}
                            <h4 className="text-[11px] uppercase tracking-widest font-medium group-hover:text-white text-zinc-200">{ticket.subject}</h4>
                          </div>
                          <p className="text-[9px] text-zinc-500 uppercase tracking-widest">{new Date(ticket.created_at).toLocaleDateString()} • {ticket.status}</p>
                        </div>
                        <span className="text-zinc-600 group-hover:text-white transition-colors">&rarr;</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {showNewTicketForm && (
              <div className="p-8 sm:p-12 overflow-y-auto flex-1">
                <button onClick={() => setShowNewTicketForm(false)} className="text-[9px] tracking-[0.2em] text-zinc-500 hover:text-white uppercase mb-8">&larr; Back to Inquiries</button>
                <h3 className="text-xs uppercase tracking-widest font-medium border-b border-zinc-800 pb-4 mb-8">Client Concierge</h3>
                <form onSubmit={handleSendNewTicket} className="space-y-6">
                  <div>
                    <label className="block text-[9px] tracking-[0.2em] text-zinc-500 mb-2 uppercase">Subject Inquiry</label>
                    <input type="text" value={supportSubject} onChange={(e) => setSupportSubject(e.target.value)} required placeholder="E.G. ORDER #12345 UPDATE" className="w-full bg-[#111] p-4 border border-zinc-800 focus:border-white outline-none text-base md:text-xs text-white uppercase tracking-wider transition-colors"/>
                  </div>
                  <div>
                    <label className="block text-[9px] tracking-[0.2em] text-zinc-500 mb-2 uppercase">Message</label>
                    <textarea value={supportMessage} onChange={(e) => setSupportMessage(e.target.value)} required rows="5" className="w-full bg-[#111] p-4 border border-zinc-800 focus:border-white outline-none text-base md:text-xs text-white tracking-wider resize-none transition-colors"></textarea>
                  </div>
                  <button type="submit" disabled={sendingSupport} className="w-full bg-white text-black py-4 text-[10px] tracking-[0.3em] uppercase hover:bg-zinc-200 transition-colors font-medium mt-4 disabled:opacity-50">
                    {sendingSupport ? 'DISPATCHING...' : 'SEND DISPATCH'}
                  </button>
                </form>
              </div>
            )}

            {/* THE CHAT INTERFACE */}
            {activeTicket && (
              <div className="flex flex-col h-full bg-[#0A0A0A]">
                <div className="bg-[#111] border-b border-zinc-800 p-6 flex justify-between items-center shrink-0">
                  <div>
                    <button onClick={() => setActiveTicket(null)} className="text-[9px] tracking-[0.2em] text-zinc-500 hover:text-white uppercase mb-2 block">&larr; Back</button>
                    <h3 className="text-[11px] uppercase tracking-widest font-medium">{activeTicket.subject}</h3>
                  </div>
                  <span className={`text-[9px] px-3 py-1 uppercase tracking-widest border ${activeTicket.status === 'replied' ? 'border-green-800 text-green-500' : 'border-zinc-700 text-zinc-400'}`}>
                    {activeTicket.status}
                  </span>
                </div>
                
                <div className="flex-1 overflow-y-auto p-6 sm:p-8 space-y-6 bg-[#0A0A0A]">
                  {(activeTicket.chat_history?.length > 0 ? activeTicket.chat_history : [{ sender: 'user', text: activeTicket.message, timestamp: activeTicket.created_at }]).map((msg, idx) => (
                    <div key={idx} className={`flex flex-col ${msg.sender === 'user' ? 'items-end' : 'items-start'}`}>
                      <span className="text-[8px] tracking-[0.2em] text-zinc-600 uppercase mb-1">{msg.sender === 'user' ? 'You' : 'S. Sikamòre Concierge'}</span>
                      <div className={`max-w-[85%] p-4 text-[11px] leading-relaxed tracking-wider border ${msg.sender === 'user' ? 'bg-[#111] border-zinc-800 text-white' : 'bg-white border-white text-black font-medium'}`}>
                        {msg.text}
                      </div>
                    </div>
                  ))}
                  <div ref={chatEndRef} />
                </div>

                <form onSubmit={handleSendReply} className="p-6 border-t border-zinc-800 bg-[#111] shrink-0 flex gap-4">
                  <input type="text" value={replyText} onChange={(e) => setReplyText(e.target.value)} placeholder="Type a response..." className="flex-1 bg-transparent border-b border-zinc-700 focus:border-white outline-none text-[11px] text-white tracking-widest px-2" />
                  <button type="submit" disabled={sendingSupport || !replyText.trim()} className="bg-white text-black px-6 py-3 text-[9px] tracking-[0.3em] uppercase hover:bg-zinc-200 transition-colors font-medium disabled:opacity-50">
                    Send
                  </button>
                </form>
              </div>
            )}

          </div>
        )}

      </main>
    </div>
  );
}
