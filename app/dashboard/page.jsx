/* eslint-disable @next/next/no-img-element */
'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@supabase/supabase-js';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useApp } from '../providers';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
const supabase = createClient(supabaseUrl, supabaseAnonKey);

export default function UserDashboard() {
  const router = useRouter();
  const { showToast } = useApp();
  
  const [user, setUser] = useState(null);
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('orders'); // 'orders', 'profile', 'concierge'

  // Concierge (Support) Form State
  const [supportSubject, setSupportSubject] = useState('');
  const [supportMessage, setSupportMessage] = useState('');
  const [sendingSupport, setSendingSupport] = useState(false);

  useEffect(() => {
    async function fetchUserData() {
      try {
        // 1. Get logged-in user
        const { data: { user }, error: authError } = await supabase.auth.getUser();
        
        if (authError || !user) {
          router.push('/login'); // Kicks them to login page if not logged in
          return;
        }
        
        setUser(user);

        // 2. Fetch their specific orders
        const { data: orderData, error: orderError } = await supabase
          .from('orders')
          .select('*')
          .eq('customer_email', user.email)
          .order('created_at', { ascending: false });

        if (!orderError && orderData) {
          setOrders(orderData);
        }
      } catch (err) {
        console.error('Dashboard Error:', err);
      } finally {
        setLoading(false);
      }
    }

    fetchUserData();
  }, [router]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    showToast('LOGGED OUT SUCCESSFULLY.');
    router.push('/');
  };

  const handleSendSupportMessage = async (e) => {
    e.preventDefault();
    setSendingSupport(true);

    try {
      const { error } = await supabase.from('support_tickets').insert([{
        name: user.user_metadata?.first_name ? `${user.user_metadata.first_name} ${user.user_metadata.last_name || ''}` : 'Client',
        email: user.email,
        subject: supportSubject,
        message: supportMessage,
        status: 'unread'
      }]);

      if (error) throw error;

      showToast('MESSAGE DISPATCHED TO CONCIERGE.');
      setSupportSubject('');
      setSupportMessage('');
    } catch (error) {
      showToast(`ERROR: ${error.message.toUpperCase()}`);
    } finally {
      setSendingSupport(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#F5F5F4] flex items-center justify-center">
        <div className="text-[9px] tracking-[0.4em] text-zinc-400 uppercase animate-pulse">Loading Archive...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F5F5F4] text-black font-sans antialiased text-[11px]">
      
      {/* MINIMAL NAV HEADER */}
      <header className="border-b border-zinc-300 h-20 bg-[#F5F5F4] sticky top-0 z-40 flex items-center shadow-sm">
        <div className="w-full max-w-[1600px] mx-auto px-4 sm:px-8 flex items-center justify-between relative">
          <div className="z-10 flex items-center">
            <Link href="/shop" className="tracking-[0.2em] text-zinc-500 hover:text-black uppercase text-[10px] flex items-center gap-1.5 py-2 transition-colors">
              <span className="text-xs font-light">&larr;</span>
              <span className="hidden sm:inline pt-0.5">Return to Store</span>
            </Link>
          </div>
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none px-4">
            <h1 className="text-xs sm:text-base font-normal tracking-[0.4em] uppercase font-serif text-center text-black pl-[0.4em]">
              S. SIKAMÒRE
            </h1>
          </div>
          <div className="z-10 text-right flex items-center gap-4">
            <button onClick={handleLogout} className="text-[9px] text-zinc-500 hover:text-black uppercase tracking-widest transition-colors">
              Sign Out
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-[1000px] mx-auto px-4 sm:px-8 py-16 sm:py-24">
        
        {/* DASHBOARD HEADER */}
        <div className="mb-16 text-center">
          <p className="text-[9px] tracking-[0.3em] text-zinc-500 uppercase mb-4">Client Archive</p>
          <h2 className="text-2xl sm:text-3xl font-light tracking-[0.2em] uppercase text-black font-serif">
            Welcome, {user?.user_metadata?.first_name || 'Client'}
          </h2>
        </div>

        {/* TAB NAVIGATION */}
        <div className="flex justify-center border-b border-zinc-300 mb-12">
          <div className="flex gap-8 sm:gap-16 text-[9px] tracking-[0.2em] uppercase">
            <button 
              onClick={() => setActiveTab('orders')} 
              className={`pb-4 transition-colors ${activeTab === 'orders' ? 'border-b-2 border-black text-black' : 'text-zinc-500 hover:text-black'}`}
            >
              Order History
            </button>
            <button 
              onClick={() => setActiveTab('profile')} 
              className={`pb-4 transition-colors ${activeTab === 'profile' ? 'border-b-2 border-black text-black' : 'text-zinc-500 hover:text-black'}`}
            >
              Profile
            </button>
            <button 
              onClick={() => setActiveTab('concierge')} 
              className={`pb-4 transition-colors ${activeTab === 'concierge' ? 'border-b-2 border-black text-black' : 'text-zinc-500 hover:text-black'}`}
            >
              Concierge
            </button>
          </div>
        </div>

        {/* TAB 1: ORDER HISTORY */}
        {activeTab === 'orders' && (
          <div className="space-y-8 animate-fade-in-up">
            {orders.length === 0 ? (
              <div className="text-center py-20 bg-white border border-zinc-200">
                <p className="text-[10px] tracking-widest text-zinc-500 uppercase mb-6">You have no previous orders.</p>
                <Link href="/shop" className="inline-block bg-black text-white px-8 py-3.5 text-[9px] tracking-[0.2em] uppercase hover:bg-zinc-800 transition-colors">
                  Discover The Curation
                </Link>
              </div>
            ) : (
              orders.map((order) => (
                <div key={order.id} className="bg-white border border-zinc-200 shadow-sm overflow-hidden">
                  <div className="bg-zinc-50 border-b border-zinc-200 p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="flex flex-wrap gap-x-8 gap-y-2 text-[10px] tracking-widest uppercase">
                      <div>
                        <span className="text-zinc-400 block mb-1 text-[8px]">Order Date</span>
                        <span className="text-black font-medium">{new Date(order.created_at).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}</span>
                      </div>
                      <div>
                        <span className="text-zinc-400 block mb-1 text-[8px]">Total</span>
                        <span className="text-black font-medium">₦{order.total_amount?.toLocaleString() || 0}</span>
                      </div>
                      <div>
                        <span className="text-zinc-400 block mb-1 text-[8px]">Status</span>
                        <span className={`font-medium ${order.status === 'pending' ? 'text-amber-600' : 'text-green-600'}`}>{order.status}</span>
                      </div>
                    </div>
                    <div className="text-[9px] tracking-widest text-zinc-400 uppercase font-mono">
                      #{order.id.slice(0, 8)}
                    </div>
                  </div>
                  
                  <div className="p-6 space-y-6">
                    {order.items && order.items.map((item, idx) => (
                      <div key={idx} className="flex gap-6 items-center">
                        <div className="w-16 h-20 bg-zinc-100 shrink-0 border border-zinc-200">
                          <img src={item.image} alt={item.name} className="w-full h-full object-cover" />
                        </div>
                        <div className="flex-1">
                          <h4 className="text-[10px] uppercase tracking-widest font-medium text-black">{item.name}</h4>
                          <p className="text-[10px] text-zinc-500 mt-1 uppercase">Size: {item.size} • Qty: {item.quantity}</p>
                        </div>
                        <div className="text-[10px] tracking-wider text-black">
                          ₦{(item.price * item.quantity).toLocaleString()}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {/* TAB 2: PROFILE DETAILS */}
        {activeTab === 'profile' && (
          <div className="bg-white border border-zinc-200 p-8 sm:p-12 animate-fade-in-up">
            <h3 className="text-xs uppercase tracking-widest font-medium border-b border-zinc-200 pb-4 mb-8">Account Details</h3>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
              <div>
                <p className="text-[9px] tracking-widest text-zinc-400 uppercase mb-2">First Name</p>
                <p className="text-[11px] tracking-widest text-black uppercase">{user?.user_metadata?.first_name || 'N/A'}</p>
              </div>
              <div>
                <p className="text-[9px] tracking-widest text-zinc-400 uppercase mb-2">Last Name</p>
                <p className="text-[11px] tracking-widest text-black uppercase">{user?.user_metadata?.last_name || 'N/A'}</p>
              </div>
              <div className="sm:col-span-2">
                <p className="text-[9px] tracking-widest text-zinc-400 uppercase mb-2">Email Address</p>
                <p className="text-[11px] tracking-widest text-black">{user?.email}</p>
              </div>
            </div>
            
            <div className="mt-12 pt-8 border-t border-zinc-200">
              <button className="text-[9px] tracking-[0.2em] text-zinc-500 hover:text-black uppercase transition-colors underline underline-offset-4">
                Reset Password
              </button>
            </div>
          </div>
        )}

        {/* TAB 3: CONCIERGE (SUPPORT INBOX) */}
        {activeTab === 'concierge' && (
          <div className="bg-[#0A0A0A] text-white p-8 sm:p-12 shadow-2xl animate-fade-in-up">
            <h3 className="text-xs uppercase tracking-widest font-medium border-b border-zinc-800 pb-4 mb-8">Client Concierge</h3>
            <p className="text-[10px] tracking-widest text-zinc-400 mb-8 leading-relaxed uppercase">
              Send a direct dispatch to our team for sizing inquiries, order modifications, or priority assistance. A client advisor will respond to your email.
            </p>
            
            <form onSubmit={handleSendSupportMessage} className="space-y-6">
              <div>
                <label className="block text-[9px] tracking-[0.2em] text-zinc-500 mb-2 uppercase">Subject Inquiry</label>
                <input 
                  type="text" 
                  value={supportSubject} 
                  onChange={(e) => setSupportSubject(e.target.value)} 
                  required 
                  placeholder="E.G. ORDER #12345 UPDATE"
                  className="w-full bg-[#111] p-4 border border-zinc-800 focus:border-white outline-none text-base md:text-xs text-white uppercase tracking-wider transition-colors"
                />
              </div>
              <div>
                <label className="block text-[9px] tracking-[0.2em] text-zinc-500 mb-2 uppercase">Message</label>
                <textarea 
                  value={supportMessage} 
                  onChange={(e) => setSupportMessage(e.target.value)} 
                  required 
                  rows="5"
                  placeholder="How can we assist you today?"
                  className="w-full bg-[#111] p-4 border border-zinc-800 focus:border-white outline-none text-base md:text-xs text-white tracking-wider resize-none transition-colors"
                ></textarea>
              </div>
              <button type="submit" disabled={sendingSupport} className="w-full bg-white text-black py-4 text-[10px] tracking-[0.3em] uppercase hover:bg-zinc-200 transition-colors font-medium mt-4 disabled:opacity-50">
                {sendingSupport ? 'DISPATCHING...' : 'SEND DISPATCH'}
              </button>
            </form>
          </div>
        )}

      </main>
    </div>
  );
}
