'use client';

import { useState } from 'react';
import { createClient } from '@supabase/supabase-js';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useApp } from '../providers';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
const supabase = createClient(supabaseUrl, supabaseAnonKey);

export default function ClientLogin() {
  const router = useRouter();
  const { showToast } = useApp();
  
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [loading, setLoading] = useState(false);

  const handleAuth = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (isLogin) {
        // LOGIN FLOW
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        if (error) throw error;
        
        showToast('ACCESS GRANTED. WELCOME BACK.');
        router.push('/dashboard');
        
      } else {
        // SIGNUP FLOW
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: {
              first_name: firstName,
              last_name: lastName,
            }
          }
        });
        if (error) throw error;
        
        showToast('ARCHIVE ACCOUNT CREATED.');
        router.push('/dashboard');
      }
    } catch (error) {
      showToast(`ERROR: ${error.message.toUpperCase()}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F5F5F4] text-black font-sans antialiased flex flex-col relative">
      
      {/* MINIMAL NAV HEADER */}
      <header className="border-b border-zinc-300 h-20 bg-[#F5F5F4] absolute top-0 w-full z-40 flex items-center">
        <div className="w-full max-w-[1600px] mx-auto px-4 sm:px-8 flex items-center justify-between">
          <div className="z-10">
            <Link href="/shop" className="tracking-[0.2em] text-zinc-500 hover:text-black uppercase text-[10px] flex items-center gap-1.5 transition-colors">
              <span className="text-xs font-light">&larr;</span>
              <span className="hidden sm:inline pt-0.5">Store</span>
            </Link>
          </div>
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <h1 className="text-xs sm:text-base font-normal tracking-[0.4em] uppercase font-serif text-black pl-[0.4em]">
              S. SIKAMÒRE
            </h1>
          </div>
          <div className="z-10 w-[60px]"></div> {/* Spacer */}
        </div>
      </header>

      {/* AUTHENTICATION CARD */}
      <main className="flex-1 flex items-center justify-center px-4 pt-20">
        <div className="w-full max-w-md bg-[#0A0A0A] text-white p-10 sm:p-14 shadow-2xl border border-zinc-800 animate-fade-in-up">
          
          <div className="text-center mb-10">
            <h2 className="text-xl font-normal tracking-[0.4em] uppercase mb-2 font-serif">
              {isLogin ? 'Client Portal' : 'Join Archive'}
            </h2>
            <p className="text-[9px] tracking-[0.2em] uppercase text-zinc-500">
              {isLogin ? 'Access your orders & concierge' : 'Create your luxury profile'}
            </p>
          </div>

          <form onSubmit={handleAuth} className="space-y-6">
            
            {!isLogin && (
              <div className="grid grid-cols-2 gap-4">
                <div className="flex flex-col gap-2">
                  <label className="text-[9px] tracking-[0.2em] text-zinc-500 uppercase">First Name</label>
                  <input 
                    type="text" 
                    value={firstName} 
                    onChange={(e) => setFirstName(e.target.value)} 
                    required={!isLogin}
                    className="w-full bg-[#111] p-4 border border-zinc-800 focus:border-white outline-none text-base md:text-xs tracking-wider text-white uppercase"
                  />
                </div>
                <div className="flex flex-col gap-2">
                  <label className="text-[9px] tracking-[0.2em] text-zinc-500 uppercase">Last Name</label>
                  <input 
                    type="text" 
                    value={lastName} 
                    onChange={(e) => setLastName(e.target.value)} 
                    required={!isLogin}
                    className="w-full bg-[#111] p-4 border border-zinc-800 focus:border-white outline-none text-base md:text-xs tracking-wider text-white uppercase"
                  />
                </div>
              </div>
            )}

            <div className="flex flex-col gap-2">
              <label className="text-[9px] tracking-[0.2em] text-zinc-500 uppercase">Email Address</label>
              <input 
                type="email" 
                value={email} 
                onChange={(e) => setEmail(e.target.value)} 
                required 
                className="w-full bg-[#111] p-4 border border-zinc-800 focus:border-white outline-none text-base md:text-xs tracking-wider text-white"
              />
            </div>

            <div className="flex flex-col gap-2">
              <div className="flex justify-between items-end">
                <label className="text-[9px] tracking-[0.2em] text-zinc-500 uppercase">Password</label>
                {isLogin && (
                  <button type="button" className="text-[8px] text-zinc-600 hover:text-white uppercase tracking-widest transition-colors">
                    Forgot?
                  </button>
                )}
              </div>
              <input 
                type="password" 
                value={password} 
                onChange={(e) => setPassword(e.target.value)} 
                required 
                className="w-full bg-[#111] p-4 border border-zinc-800 focus:border-white outline-none text-base md:text-xs tracking-widest text-white"
              />
            </div>

            <button 
              type="submit" 
              disabled={loading} 
              className="w-full bg-white text-black py-5 text-[10px] tracking-[0.3em] uppercase hover:bg-zinc-200 transition-colors font-medium mt-4 disabled:opacity-50"
            >
              {loading ? 'AUTHENTICATING...' : (isLogin ? 'LOG IN' : 'CREATE ACCOUNT')}
            </button>
          </form>

          <div className="mt-8 text-center border-t border-zinc-800 pt-8">
            <button 
              onClick={() => setIsLogin(!isLogin)} 
              className="text-[9px] tracking-[0.2em] text-zinc-400 hover:text-white uppercase transition-colors"
            >
              {isLogin ? "Don't have an account? Sign up" : "Already have an account? Log in"}
            </button>
          </div>

        </div>
      </main>
    </div>
  );
}
