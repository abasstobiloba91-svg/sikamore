'use client';

import Link from 'next/link';
import { useApp } from '../providers';

export default function ContactPage() {
  const { cart, wishlist, isCartOpen, setIsCartOpen, removeFromCart } = useApp();
  const cartItemCount = cart.reduce((acc, curr) => acc + curr.quantity, 0);
  const cartSubtotal = cart.reduce((total, item) => total + (item.price * item.quantity), 0);

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white font-sans antialiased text-[11px] relative overflow-x-hidden">
      
      {/* HEADER TOP BANNER */}
      <div className="bg-black text-white py-2.5 text-center text-[9px] tracking-[0.3em] uppercase font-light border-b border-zinc-900 select-none">
        WE SHIP OUR PRODUCTS WORLDWIDE • NEW IN | CORE COLLECTION
      </div>

      {/* HEADER */}
      <header className="bg-white text-black border-b border-gray-200 sticky top-0 z-40 shadow-sm">
        <div className="max-w-[1600px] mx-auto px-4 sm:px-8 h-20 sm:h-24 flex items-center justify-between">
          <Link href="/admin" className="tracking-[0.2em] text-gray-400 hover:text-black uppercase text-[10px]">Portal</Link>
          <Link href="/" className="text-base sm:text-xl font-normal tracking-[0.4em] uppercase text-center block pl-[0.4em] font-serif text-black">
            S. SIKAMÒRE
          </Link>
          <div className="flex items-center gap-4 sm:gap-6 text-black">
            <button className="hover:text-gray-500 transition-colors hidden sm:block">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" /></svg>
            </button>
            <button className="hover:text-gray-500 transition-colors hidden sm:block">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" /></svg>
            </button>
            <button onClick={() => setIsCartOpen(true)} className="relative hover:text-gray-500 transition-colors flex items-center gap-2">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M15.75 10.5V6a3.75 3.75 0 10-7.5 0v4.5m11.356-1.993l1.263 12c.07.665-.45 1.243-1.119 1.243H4.25a1.125 1.125 0 01-1.12-1.243l1.264-12A1.125 1.125 0 015.513 7.5h12.974c.576 0 1.059.435 1.119 1.007z" /></svg>
              <span className="text-[10px] font-medium pt-0.5">{cartItemCount}</span>
            </button>
          </div>
        </div>
        
        {/* WORKING NAVIGATION BAR */}
        <div className="border-t border-gray-100 bg-white">
          <div className="max-w-xl mx-auto h-11 flex items-center justify-center gap-8 sm:gap-10 tracking-[0.25em] text-[9px] sm:text-[10px] uppercase font-light text-gray-500 overflow-x-auto whitespace-nowrap px-6 scrollbar-none">
            <Link href="/" className="hover:text-black transition-colors shrink-0">Home</Link>
            <Link href="/" className="hover:text-black transition-colors shrink-0">New In</Link>
            <Link href="/about" className="hover:text-black transition-colors shrink-0">About Us</Link>
            <Link href="/contact" className="text-black font-normal border-b border-black pb-1 shrink-0">Contact Us</Link>
          </div>
        </div>
      </header>

      {/* CONTACT CONTENT */}
      <main className="max-w-[1200px] mx-auto px-4 sm:px-8 py-20 sm:py-32 grid grid-cols-1 md:grid-cols-2 gap-16">
        
        <div className="space-y-12">
          <div>
            <h1 className="text-2xl sm:text-3xl font-normal tracking-[0.3em] uppercase mb-6 font-serif text-white">Get In Touch</h1>
            <p className="text-zinc-400 text-xs tracking-widest leading-loose font-light">
              Every S. Sikamore piece is handmade and crafted with care and dedication.<br/><br/>
              For questions about our bags, collections, orders or shipping, we’re here to help.<br/><br/>
              We respond within 24hours, Monday - Friday.
            </p>
          </div>
          
          <div className="space-y-6 text-[10px] tracking-widest uppercase text-zinc-500">
            <div><span className="text-white block mb-1">General Inquiries</span>hello@ssikamore.com</div>
            <div><span className="text-white block mb-1">Logistics & Shipping</span>shipping@ssikamore.com</div>
            <div><span className="text-white block mb-1">Client Services</span>support@ssikamore.com</div>
            <div><span className="text-white block mb-1">Atelier Hours</span>Mon – Fri | 10:00 AM – 6:00 PM (WAT)</div>
          </div>
        </div>

        <div>
           <form onSubmit={(e) => { e.preventDefault(); alert("Message Dispatched Successfully."); e.target.reset(); }} className="space-y-6 bg-[#111] p-8 border border-zinc-900 shadow-2xl">
              <input type="text" required placeholder="FULL NAME" className="w-full bg-[#161616] p-4 border border-zinc-800 outline-none text-xs text-white uppercase tracking-wider focus:border-zinc-500 transition-colors" />
              <input type="email" required placeholder="EMAIL ADDRESS" className="w-full bg-[#161616] p-4 border border-zinc-800 outline-none text-xs text-white uppercase tracking-wider focus:border-zinc-500 transition-colors" />
              <textarea required placeholder="YOUR INQUIRY..." rows="5" className="w-full bg-[#161616] p-4 border border-zinc-800 outline-none text-xs text-white uppercase tracking-wider focus:border-zinc-500 transition-colors resize-none"></textarea>
              <button type="submit" className="w-full bg-white text-black py-4 text-[10px] tracking-[0.3em] uppercase hover:bg-zinc-200 transition-colors font-medium">Dispatch Message</button>
           </form>
        </div>

      </main>

      {/* SLIDING CART DRAWER */}
      <div className={`fixed inset-y-0 right-0 z-50 w-full sm:w-[400px] bg-white text-black shadow-2xl transform transition-transform duration-500 ease-in-out ${isCartOpen ? 'translate-x-0' : 'translate-x-full'} flex flex-col`}>
        <div className="flex items-center justify-between p-6 border-b border-gray-100 shrink-0">
          <h2 className="text-[11px] tracking-[0.2em] uppercase font-medium">Shopping Cart ({cartItemCount})</h2>
          <button onClick={() => setIsCartOpen(false)} className="text-gray-400 hover:text-black">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M6 18L18 6M6 6l12 12"/></svg>
          </button>
        </div>
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {cart.length === 0 ? (
            <div className="text-center text-gray-400 text-[10px] tracking-widest uppercase mt-10">Your bag is empty.</div>
          ) : (
            cart.map((item, idx) => (
              <div key={`${item.id}-${item.size}-${idx}`} className="flex gap-4">
                <div className="w-20 h-28 bg-gray-50 shrink-0 border border-gray-100">
                  <img src={item.image} alt={item.name} className="w-full h-full object-cover" />
                </div>
                <div className="flex-1 flex flex-col justify-between py-1">
                  <div>
                    <h3 className="text-[10px] tracking-widest uppercase font-medium">{item.name}</h3>
                    <p className="text-[10px] text-gray-500 mt-1 uppercase">Size: {item.size}</p>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] tracking-wider font-medium">₦{item.price.toLocaleString()}</span>
                    <div className="flex items-center gap-3 border border-gray-200 px-2 py-1">
                      <span className="text-[10px] text-gray-500">Qty: {item.quantity}</span>
                      <span className="text-gray-300">|</span>
                      <button onClick={() => removeFromCart(item.id, item.size)} className="text-[9px] uppercase tracking-wider text-red-500 hover:text-red-700">Remove</button>
                    </div>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
        {cart.length > 0 && (
          <div className="p-6 border-t border-gray-100 bg-gray-50 shrink-0">
            <div className="flex justify-between mb-6 text-xs uppercase tracking-widest">
              <span className="text-gray-500">Subtotal:</span>
              <span className="font-medium text-black">₦{cartSubtotal.toLocaleString()}</span>
            </div>
            <div className="flex gap-3">
              <Link href="/checkout" onClick={() => setIsCartOpen(false)} className="flex-1 border border-black text-black text-center py-4 text-[9px] tracking-[0.2em] uppercase hover:bg-black hover:text-white transition-colors">View Cart</Link>
              <Link href="/checkout" onClick={() => setIsCartOpen(false)} className="flex-1 bg-black text-white text-center py-4 text-[9px] tracking-[0.2em] uppercase hover:bg-zinc-800 transition-colors">Checkout</Link>
            </div>
          </div>
        )}
      </div>
      {isCartOpen && <div className="fixed inset-0 bg-black/30 z-40 backdrop-blur-sm" onClick={() => setIsCartOpen(false)}></div>}

      {/* FOOTER */}
      <footer className="border-t border-zinc-900 bg-[#020202] py-12 text-center text-zinc-600 text-[9px] tracking-[0.2em]">
        © 2026 S. SIKAMÒRE. ALL RIGHTS RESERVED.
      </footer>
    </div>
  );
}
