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
  const [showPassword, setShowPassword] = useState(false);
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
        
        showToast('Logged in successfully.');
        router.push('/dashboard');
        
      } else {
        // SIGNUP FLOW
        const { data: authData, error } = await supabase.auth.signUp({
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

        // SYNC TO ADMIN DASHBOARD DIRECTORY
        if (authData?.user) {
          await supabase.from('client_profiles').insert([{
            id: authData.user.id,
            email: email.toLowerCase().trim(),
            first_name: firstName,
            last_name: lastName
          }]);
        }
        
        showToast('Account created successfully.');
        router.push('/dashboard');
      }
    } catch (error) {
      showToast(`Error: ${error.message}`);
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
              {isLogin ? 'Welcome Back' : 'Create Account'}
            </h2>
            <p className="text-[9px] tracking-[0.2em] uppercase text-zinc-500">
              {isLogin ? 'Sign in to access your orders' : 'Sign up to manage your orders'}
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
              <div className="relative">
                <input 
                  type={showPassword ? "text" : "password"} 
                  value={password} 
                  onChange={(e) => setPassword(e.target.value)} 
                  required 
                  className="w-full bg-[#111] p-4 border border-zinc-800 focus:border-white outline-none text-base md:text-xs tracking-widest text-white pr-12"
                />
                <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-4 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-white">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d={showPassword ? "M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0l-3.29-3.29" : "M15 12a3 3 0 11-6 0 3 3 0 016 0z M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268-2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"} /></svg>
                </button>
              </div>
            </div>

            <button 
              type="submit" 
              disabled={loading} 
              className="w-full bg-white text-black py-5 text-[10px] tracking-[0.3em] uppercase hover:bg-zinc-200 transition-colors font-medium mt-4 disabled:opacity-50"
            >
              {loading ? 'PLEASE WAIT...' : (isLogin ? 'LOG IN' : 'CREATE ACCOUNT')}
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
