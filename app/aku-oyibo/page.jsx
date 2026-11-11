'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
const supabase = createClient(supabaseUrl, supabaseAnonKey);

export default function AkuOyiboWaitlist() {
  const [products, setProducts] = useState([]);
  const [selectedProduct, setSelectedProduct] = useState(null); 
  const [activeImageIndex, setActiveImageIndex] = useState(0); 

  const [cart, setCart] = useState([]);
  const [showInterceptModal, setShowInterceptModal] = useState(false);
  const [lastAdded, setLastAdded] = useState(null);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState(null); 
  const [formData, setFormData] = useState({ firstName: '', email: '', whatsapp: '', country: '', designInterest: '', purchaseIntent: '' });

  useEffect(() => {
    async function fetchProducts() {
      const { data } = await supabase.from('waitlist_products').select('*').order('created_at', { ascending: true });
      if (data) setProducts(data);
    }
    fetchProducts();
  }, []);

  useEffect(() => {
    setFormData(prev => ({ ...prev, designInterest: cart.join(', ') }));
  }, [cart]);

  const handleChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (cart.length === 0) {
      alert("Please select at least one design from the gallery before joining the waitlist.");
      return;
    }
    setIsSubmitting(true);
    try {
      await supabase.from('waitlist_leads').insert([{
        first_name: formData.firstName, email: formData.email.toLowerCase(), whatsapp: formData.whatsapp || null, country: formData.country, design_interest: formData.designInterest, purchase_intent: formData.purchaseIntent
      }]);
      setSubmitStatus('success');
      setFormData({ firstName: '', email: '', whatsapp: '', country: '', designInterest: '', purchaseIntent: '' });
      setCart([]);
    } catch (err) { setSubmitStatus('error'); } 
    finally { setIsSubmitting(false); }
  };

  const openModal = (product) => {
    setSelectedProduct(product);
    setActiveImageIndex(0);
    document.body.style.overflow = 'hidden'; 
  };

  const closeModal = () => {
    setSelectedProduct(null);
    document.body.style.overflow = 'auto';
  };

  const handleAddToCart = (product) => {
    if (!cart.includes(product.name)) {
      setCart(prev => [...prev, product.name]);
    }
    setLastAdded(product);
    closeModal();
    setShowInterceptModal(true);
  };

  const handleRequestNow = () => {
    setShowInterceptModal(false);
    document.getElementById('waitlist-form').scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <div className="min-h-screen bg-[#F5F0E6] text-[#4A3025] font-sans selection:bg-[#A3523B] selection:text-white relative">
      
      <section className="relative min-h-[90vh] md:min-h-screen flex flex-col bg-[#4A3025]">
        <div className="absolute inset-0 z-0">
          {products.length > 0 ? (
            <img src={products[0].image_url} alt="Hero" className="w-full h-full object-cover object-center md:object-right" />
          ) : (
            <div className="w-full h-full bg-[#4A3025]"></div>
          )}
          
          <div className="absolute inset-0 bg-[#4A3025]/40 backdrop-blur-md"></div>
          <div className="absolute inset-0 bg-gradient-to-b from-[#4A3025]/90 via-[#4A3025]/60 to-[#4A3025]/90 md:bg-gradient-to-r md:from-[#4A3025]/95 md:via-[#4A3025]/70 md:to-transparent"></div>
        </div>

        <header className="w-full pt-8 px-6 sm:px-12 flex justify-between items-center z-10 relative">
          <Link href="/" className="text-sm tracking-[0.3em] font-serif uppercase text-[#F4EFE6]">S. Sikamòre</Link>
          <nav className="hidden md:flex gap-10 text-[9px] uppercase tracking-widest text-[#D1C7BD]">
            <Link href="/collections" className="hover:text-white transition-colors">Collections</Link>
            <Link href="/bags" className="hover:text-white transition-colors">Bags</Link>
            <Link href="/accessories" className="hover:text-white transition-colors">Accessories</Link>
          </nav>
        </header>

        <div className="flex-1 flex flex-col justify-center px-6 sm:px-12 z-10 relative max-w-[1400px] mx-auto w-full pt-16 md:pt-0">
          <div className="max-w-xl">
            <span className="text-[11px] tracking-[0.5em] uppercase text-[#D1C7BD] mb-4 block">T H E</span>
            <h1 className="text-5xl sm:text-7xl font-serif font-light uppercase leading-none mb-4 text-[#F4EFE6] drop-shadow-sm">AKU OYIBO</h1>
            <span className="text-[11px] tracking-[0.5em] uppercase text-[#D1C7BD] mb-8 block">W A I T L I S T</span>
            
            <div className="w-16 h-px bg-[#D1C7BD] mb-8"></div>
            
            <p className="font-serif italic text-lg sm:text-xl text-[#F4EFE6] mb-6 drop-shadow-sm">
              Some pieces are made to be worn.<br/>Others are made to be kept.
            </p>
            
            <div className="text-[11px] tracking-[0.05em] text-[#D1C7BD] mb-8 space-y-4 leading-loose">
              <p>Aku Oyibo is a collectible expression of thoughtful craftsmanship, the beauty of transformed materials and intricate hand-beadwork.</p>
              <p>Crafted from natural coconut shells, no two pieces are exactly alike. Each shell carries its own markings, shape and colour, making every Aku Oyibo a one-of-one piece.</p>
              <p>Created for the woman who appreciates pieces with character, craftsmanship and a story.</p>
            </div>
            
            <p className="text-[10px] tracking-widest text-[#D1C7BD] mb-12 uppercase">From Ala Oma — Resort 2027.</p>
            
            <button onClick={() => document.getElementById('waitlist-form').scrollIntoView({ behavior: 'smooth' })} className="bg-[#A3523B] text-white px-8 py-3.5 text-[9px] tracking-[0.2em] uppercase font-bold hover:bg-[#8A422D] shadow-xl hover:shadow-2xl transition-all w-full sm:w-auto">
              JOIN THE WAITLIST →
            </button>
          </div>
        </div>
      </section>

      <section className="py-20 md:py-24 bg-[#F5F0E6]">
        <div className="max-w-[1400px] mx-auto px-6 sm:px-12 text-center">
          <h2 className="text-lg md:text-xl tracking-[0.25em] font-serif uppercase mb-3 text-[#4A3025]">Explore the Aku Oyibo Collection</h2>
          <p className="text-[10px] md:text-[11px] tracking-wider text-[#735A4D] mb-12 md:mb-16">Click on any piece to view details and full gallery.</p>
          
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 md:gap-6">
            {products.map((item) => (
              <div key={item.id} onClick={() => openModal(item)} className="flex flex-col items-center group cursor-pointer">
                <div className="w-full aspect-[4/5] mb-4 relative overflow-hidden bg-[#EAE2D6] shadow-sm group-hover:shadow-md transition-shadow">
                  {item.badge && <span className="absolute bottom-2 left-2 bg-[#A3523B] text-white text-[6px] md:text-[7px] px-2 py-1 uppercase tracking-widest z-10 font-bold shadow-sm">{item.badge}</span>}
                  <img src={item.image_url} alt={item.name} className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" />
                </div>
                <h3 className="text-[9px] md:text-[11px] tracking-widest mb-1 text-[#4A3025] font-medium leading-tight group-hover:text-[#A3523B] transition-colors">{item.name}</h3>
                <p className="text-[10px] md:text-[11px] font-bold text-[#A3523B]">{item.price}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id="waitlist-form" className="py-20 md:py-24 px-6 sm:px-12 max-w-[1400px] mx-auto border-t border-[#D1C7BD] grid md:grid-cols-12 gap-12 lg:gap-24">
        <div className="md:col-span-7 lg:col-span-8">
          <h2 className="text-xl md:text-2xl tracking-[0.2em] font-serif uppercase mb-3 text-[#4A3025]">Join the Waitlist</h2>
          <p className="text-[10px] md:text-[11px] tracking-wider text-[#735A4D] mb-8 leading-relaxed font-medium">Be the first to know when the private reserve unlocks.</p>

          {submitStatus === 'success' ? (
            <div className="bg-[#EAE2D6] p-10 border border-[#D1C7BD] text-center animate-fade-in"><h3 className="text-sm tracking-[0.2em] uppercase font-bold text-[#4A3025] mb-4">You're on the list</h3><p className="text-[11px] tracking-wider text-[#735A4D] leading-relaxed">Thank you for your interest. You will be notified directly when the private reserve unlocks.</p></div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4 md:space-y-5 relative">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 md:gap-5">
                <input type="text" name="firstName" placeholder="First Name *" required value={formData.firstName} onChange={handleChange} className="w-full bg-white/50 border border-[#C6B6A5] px-4 py-3.5 text-base md:text-[11px] uppercase tracking-wider focus:bg-white focus:border-[#4A3025] focus:outline-none transition-all rounded-sm shadow-sm" />
                <input type="email" name="email" placeholder="Email Address *" required value={formData.email} onChange={handleChange} className="w-full bg-white/50 border border-[#C6B6A5] px-4 py-3.5 text-base md:text-[11px] uppercase tracking-wider focus:bg-white focus:border-[#4A3025] focus:outline-none transition-all rounded-sm shadow-sm" />
              </div>
              <input type="tel" name="whatsapp" placeholder="WhatsApp Number (Optional)" value={formData.whatsapp} onChange={handleChange} className="w-full bg-white/50 border border-[#C6B6A5] px-4 py-3.5 text-base md:text-[11px] uppercase tracking-wider focus:bg-white focus:border-[#4A3025] focus:outline-none transition-all rounded-sm shadow-sm" />
              <select name="country" required value={formData.country} onChange={handleChange} className="w-full bg-white/50 border border-[#C6B6A5] px-4 py-3.5 text-base md:text-[11px] tracking-wider uppercase focus:bg-white focus:border-[#4A3025] focus:outline-none transition-all appearance-none rounded-sm shadow-sm">
                <option value="" disabled>Country of Residence *</option>
                <option value="NG">Nigeria</option>
                <option value="US">United States</option>
                <option value="UK">United Kingdom</option>
              </select>
              
              <div className="relative">
                <input 
                  type="text" 
                  name="designInterest" 
                  readOnly 
                  required 
                  value={formData.designInterest} 
                  placeholder="SELECTED DESIGNS (ADD FROM GALLERY) *" 
                  className="w-full bg-[#EAE2D6] border border-[#C6B6A5] px-4 py-3.5 text-base md:text-[11px] uppercase tracking-wider transition-all rounded-sm shadow-sm cursor-not-allowed text-[#A3523B] font-bold" 
                />
                {cart.length === 0 && <span className="absolute right-4 top-1/2 -translate-y-1/2 text-[8px] text-[#A3523B] tracking-widest uppercase">Required</span>}
              </div>

              <select name="purchaseIntent" required value={formData.purchaseIntent} onChange={handleChange} className="w-full bg-white/50 border border-[#C6B6A5] px-4 py-3.5 text-base md:text-[11px] tracking-wider uppercase focus:bg-white focus:border-[#4A3025] focus:outline-none transition-all appearance-none rounded-sm shadow-sm"><option value="" disabled>Intent to pre-order? *</option><option value="Yes">Yes</option><option value="Maybe">Maybe</option></select>
              <button type="submit" disabled={isSubmitting} className="w-full sm:w-auto bg-[#A3523B] text-white px-10 py-4 mt-2 text-[10px] tracking-[0.2em] uppercase font-bold rounded-sm hover:bg-[#8A422D] shadow-md hover:shadow-lg transition-all">{isSubmitting ? 'TRANSMITTING...' : 'JOIN WAITLIST →'}</button>
            </form>
          )}
        </div>

        <div className="md:col-span-5 lg:col-span-4 flex flex-col justify-center space-y-8 md:space-y-10 md:pl-10 md:border-l border-[#D1C7BD] mt-8 md:mt-0">
          <div className="flex gap-4 md:gap-5 items-start">
            <svg className="w-6 h-6 md:w-8 md:h-8 text-[#A3523B] shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1" d="M7 11.5V14m0-2.5v-6a1.5 1.5 0 113 0m-3 6a1.5 1.5 0 00-3 0v2a7.5 7.5 0 0015 0v-5a1.5 1.5 0 00-3 0m-6-3V11m0-5.5v-1a1.5 1.5 0 013 0v1m0 0V11m0-5.5a1.5 1.5 0 013 0v3m0 0V11" /></svg>
            <div>
              <h4 className="text-[11px] md:text-[12px] tracking-[0.1em] font-bold text-[#4A3025] uppercase mb-1">Handcrafted</h4>
              <p className="text-[10px] md:text-[11px] tracking-wide text-[#735A4D] leading-relaxed">Thoughtfully made with attention to detail.</p>
            </div>
          </div>
          <div className="flex gap-4 md:gap-5 items-start">
            <svg className="w-6 h-6 md:w-8 md:h-8 text-[#A3523B] shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" /></svg>
            <div>
              <h4 className="text-[11px] md:text-[12px] tracking-[0.1em] font-bold text-[#4A3025] uppercase mb-1">Collectible Design</h4>
              <p className="text-[10px] md:text-[11px] tracking-wide text-[#735A4D] leading-relaxed">A statement piece to wear, keep and pass on.</p>
            </div>
          </div>
          <div className="flex gap-4 md:gap-5 items-start">
            <svg className="w-6 h-6 md:w-8 md:h-8 text-[#A3523B] shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1" d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" /></svg>
            <div>
              <h4 className="text-[11px] md:text-[12px] tracking-[0.1em] font-bold text-[#4A3025] uppercase mb-1">Limited Production</h4>
              <p className="text-[10px] md:text-[11px] tracking-wide text-[#735A4D] leading-relaxed">Produced in small batches to ensure quality and craftsmanship.</p>
            </div>
          </div>
        </div>
      </section>

      {selectedProduct && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 animate-fade-in">
          <div className="absolute inset-0 bg-[#4A3025]/80 backdrop-blur-md cursor-pointer" onClick={closeModal}></div>
          
          <div className="bg-[#F5F0E6] w-full max-w-5xl max-h-[90vh] overflow-y-auto relative z-10 flex flex-col md:flex-row shadow-2xl rounded-sm">
            <button onClick={closeModal} className="absolute top-4 right-4 z-20 bg-white/70 hover:bg-white p-2 text-[#4A3025] shadow-sm transition-colors rounded-full">✕</button>
            
            <div className="w-full md:w-1/2 bg-[#EAE2D6] relative min-h-[40vh] md:min-h-[60vh] flex flex-col border-b md:border-b-0 md:border-r border-[#D1C7BD]">
              <div className="flex-1 relative">
                <img src={(selectedProduct.images && selectedProduct.images.length > 0) ? selectedProduct.images[activeImageIndex] : selectedProduct.image_url} alt={selectedProduct.name} className="absolute inset-0 w-full h-full object-cover" />
              </div>
              {selectedProduct.images && selectedProduct.images.length > 1 && (
                <div className="flex gap-2 p-4 bg-[#F5F0E6] overflow-x-auto border-t border-[#D1C7BD]">
                  {selectedProduct.images.map((img, i) => (
                    <button key={i} onClick={() => setActiveImageIndex(i)} className={`w-16 h-20 shrink-0 border-2 transition-colors ${activeImageIndex === i ? 'border-[#A3523B]' : 'border-transparent opacity-60 hover:opacity-100'}`}>
                      <img src={img} className="w-full h-full object-cover" />
                    </button>
                  ))}
                </div>
              )}
            </div>

            <div className="w-full md:w-1/2 p-8 sm:p-12 flex flex-col justify-center">
              {selectedProduct.badge && <span className="inline-block bg-[#A3523B] text-white text-[8px] px-2 py-1 uppercase tracking-widest font-bold mb-4 self-start shadow-sm">{selectedProduct.badge}</span>}
              <h2 className="text-2xl md:text-3xl font-serif uppercase text-[#4A3025] mb-2">{selectedProduct.name}</h2>
              <p className="text-[14px] font-bold tracking-widest text-[#A3523B] mb-8">{selectedProduct.price}</p>
              
              <div className="w-12 h-px bg-[#D1C7BD] mb-8"></div>
              
              <div className="text-[11px] tracking-wide text-[#735A4D] leading-loose mb-10 whitespace-pre-wrap">
                {selectedProduct.description || "A collectible expression of craftsmanship and design. Crafted to be worn, made to be kept."}
              </div>
              
              <button onClick={() => handleAddToCart(selectedProduct)} className="bg-[#4A3025] text-white px-8 py-4 text-[10px] tracking-[0.2em] uppercase font-bold hover:bg-[#34211A] shadow-md hover:shadow-lg transition-all w-full sm:w-auto text-center rounded-sm">
                ADD TO RESERVATION →
              </button>
            </div>
          </div>
        </div>
      )}

      {showInterceptModal && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 sm:p-6 animate-fade-in">
          <div className="absolute inset-0 bg-[#4A3025]/60 backdrop-blur-md cursor-pointer" onClick={() => setShowInterceptModal(false)}></div>
          <div className="bg-[#F5F0E6]/95 backdrop-blur-xl border border-[#D1C7BD] w-full max-w-md p-8 sm:p-12 relative z-10 text-center shadow-2xl rounded-sm">
            <h3 className="text-xl font-serif uppercase text-[#4A3025] mb-2">Item Reserved</h3>
            <p className="text-[11px] tracking-wider text-[#735A4D] mb-8 font-medium">"{lastAdded?.name}" has been added to your waitlist folio.</p>
            
            <div className="flex flex-col gap-3">
              <button onClick={handleRequestNow} className="w-full bg-[#A3523B] text-white py-4 text-[10px] tracking-[0.2em] uppercase font-bold hover:bg-[#8A422D] shadow-md transition-all">
                Complete Request Now
              </button>
              <button onClick={() => setShowInterceptModal(false)} className="w-full bg-transparent border border-[#C6B6A5] text-[#4A3025] py-4 text-[10px] tracking-[0.2em] uppercase font-bold hover:bg-white transition-all">
                Check More Products
              </button>
            </div>
          </div>
        </div>
      )}

      {cart.length > 0 && !showInterceptModal && (
        <div className="fixed bottom-6 right-6 md:bottom-10 md:right-10 z-40 animate-fade-in">
          <button onClick={handleRequestNow} className="bg-[#4A3025]/90 backdrop-blur-md text-white px-6 py-4 text-[9px] tracking-[0.2em] uppercase font-bold shadow-2xl hover:bg-[#34211A] transition-all rounded-full flex items-center gap-3 border border-[#735A4D]">
            <span className="bg-[#A3523B] w-5 h-5 flex items-center justify-center rounded-full text-white text-[10px]">
              {cart.length}
            </span>
            Complete Request →
          </button>
        </div>
      )}

    </div>
  );
}
