/* eslint-disable @next/next/no-img-element */
'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useApp } from './providers'; 
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
const supabase = createClient(supabaseUrl, supabaseAnonKey);

const currencySymbols = { NGN: '₦', USD: '$', GBP: '£', EUR: '€' };

export default function GlobalCart() {
  const router = useRouter();
  const pathname = usePathname();
  
  const appContext = useApp() || {};
  const cart = appContext.cart || [];
  const removeFromCart = appContext.removeFromCart || (() => {});
  const isCartOpen = appContext.isCartOpen || false;
  const setIsCartOpen = appContext.setIsCartOpen || (() => {});
  const showToast = appContext.showToast || ((msg) => console.log(msg));

  const [currency, setCurrency] = useState('NGN');
  const [usdToNgnRate, setUsdToNgnRate] = useState(1500);
  
  // Logistics Data from Admin
  const [logistics, setLogistics] = useState({
    mainland: 4500,
    island: 6000,
    interstate: 10000,
    africaUsd: 45,
    globalUsd: 55
  });

  const [selectedDelivery, setSelectedDelivery] = useState(null);
  const [deliveryFee, setDeliveryFee] = useState(0);
  const [deliveryZone, setDeliveryZone] = useState('');
  
  const [detectedCountryCode, setDetectedCountryCode] = useState('NG');
  const [detectedCountryName, setDetectedCountryName] = useState('Nigeria');
  const [detectedContinentCode, setDetectedContinentCode] = useState('AF');
  const [isEuropeanUser, setIsEuropeanUser] = useState(false);

  const cartSubtotal = cart ? cart.reduce((total, item) => total + (Number(item.price || 0) * Number(item.quantity || 1)), 0) : 0;
  const cartItemCount = cart ? cart.reduce((acc, curr) => acc + curr.quantity, 0) : 0;

  useEffect(() => {
    async function loadMasterSettings() {
      try {
        const { data } = await supabase.from('shipping_settings').select('*').eq('id', 1).single();
        if (data) {
          if (data.usd_to_ngn_rate) setUsdToNgnRate(parseFloat(data.usd_to_ngn_rate));
          setLogistics({
            mainland: data.mainland_fee || 4500,
            island: data.island_fee || 6000,
            interstate: data.interstate_fee || 10000,
            africaUsd: data.international_fee_africa || 45,
            globalUsd: data.international_fee_global || 55
          });
        }
      } catch (e) {}
    }
    loadMasterSettings();

    async function locateClientNetwork() {
      try {
        const res = await fetch('https://ipapi.co/json/');
        const data = await res.json();
        if (data && data.country_code) {
          setDetectedCountryCode(data.country_code);
          setDetectedCountryName(data.country_name);
          setDetectedContinentCode(data.continent_code);
          const checkEurope = data.in_eu || ['FR', 'DE', 'IT', 'ES', 'NL', 'GB'].includes(data.country_code);
          setIsEuropeanUser(checkEurope);
          if (data.country_code === 'NG') setCurrency('NGN');
          else if (data.continent_code === 'AF') setCurrency('USD'); 
          else if (data.country_code === 'GB') setCurrency('GBP');
          else if (checkEurope) setCurrency('EUR');
          else setCurrency('USD');
        }
      } catch (err) {}
    }
    locateClientNetwork();
  }, []);

  const hiddenPaths = ['/', '/login', '/signup', '/register', '/checkout'];
  if (hiddenPaths.includes(pathname) || pathname.startsWith('/admin')) {
    return null;
  }

  const formatPrice = (ngnPrice) => {
    if (ngnPrice === undefined || ngnPrice === null) return '';
    const dynamicExchangeRates = { 
      NGN: 1, 
      USD: 1 / usdToNgnRate, 
      GBP: 1 / (usdToNgnRate * 1.32),
      EUR: 1 / (usdToNgnRate * 1.12) 
    };
    const rate = dynamicExchangeRates[currency] || 1;
    const converted = Number(ngnPrice) * rate; 
    if (isNaN(converted)) return '';
    if (currency === 'NGN') return `₦${Math.round(converted).toLocaleString()}`;
    return `${currencySymbols[currency] || '$'}${converted.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  const getDisplayTotal = () => {
    const dynamicExchangeRates = { NGN: 1, USD: 1 / usdToNgnRate, GBP: 1 / (usdToNgnRate * 1.32), EUR: 1 / (usdToNgnRate * 1.12) };
    const productsConverted = cartSubtotal * (dynamicExchangeRates[currency] || 1); 
    const shippingConverted = deliveryFee * 1.0 * (dynamicExchangeRates[currency] || 1);
    const combinedTotal = productsConverted + shippingConverted;
    if (currency === 'NGN') return `₦${Math.round(combinedTotal).toLocaleString()}`;
    return `${currencySymbols[currency] || '$'}${combinedTotal.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  const deliveryOptions = [
    { id: 'mainland', title: 'LAGOS MAINLAND', desc: 'Delivery within Lagos Mainland', fee: logistics.mainland, currency: 'NGN', isCalculated: false },
    { id: 'island', title: 'LAGOS ISLAND', desc: 'Delivery within Lagos Island', fee: logistics.island, currency: 'NGN', isCalculated: false },
    { id: 'south', title: 'OUTSIDE LAGOS (SOUTH)', desc: 'Port Harcourt, Abuja, Enugu, Benin, etc.', fee: logistics.interstate, currency: 'NGN', isCalculated: false },
    { id: 'north', title: 'NORTHERN STATES', desc: 'Kano, Kaduna, Jos, Maiduguri, Sokoto, etc.', fee: logistics.interstate + 3500, currency: 'NGN', isCalculated: false },
    { id: 'africa', title: 'AFRICA', desc: 'Delivery to other African countries', fee: logistics.africaUsd, currency: 'USD', isCalculated: true },
    { id: 'international', title: 'INTERNATIONAL', desc: 'Delivery to the rest of the world', fee: logistics.globalUsd, currency: 'USD', isCalculated: true }
  ];

  const handleSelectDelivery = (opt) => {
    setSelectedDelivery(opt);
    setDeliveryZone(opt.title);
    setDeliveryFee(opt.currency === 'USD' ? opt.fee * usdToNgnRate : opt.fee);
  };

  return (
    <>
      {/* FLOATING CART PILL - ENTIRELY RED BACKGROUND WITH PROPER ROUNDED SHADOW */}
      {cartItemCount > 0 && !isCartOpen && (pathname === '/shop' || pathname.startsWith('/product')) && (
        <div className="fixed bottom-6 left-1/2 transform -translate-x-1/2 w-[92%] sm:w-auto pointer-events-auto animate-fade-in" style={{ zIndex: 9999990 }}>
          <div className="bg-red-600 rounded-full flex items-center justify-between p-1.5 sm:p-2 border border-red-500 shadow-[0_10px_30px_rgba(220,38,38,0.4)]">
            <div className="flex items-center gap-2 sm:gap-4 pl-4 text-white text-[10px] sm:text-[11px] font-medium tracking-widest uppercase flex-1 whitespace-nowrap">
              <span>{cartItemCount} ITEM{cartItemCount !== 1 && 'S'}</span>
              <span className="text-red-300">|</span>
              <span>{formatPrice(cartSubtotal)}</span>
            </div>
            <button 
              onClick={() => setIsCartOpen(true)} 
              className="bg-white text-red-600 px-4 sm:px-6 py-2.5 sm:py-3 rounded-full text-[9px] sm:text-[10px] font-bold uppercase tracking-widest hover:bg-zinc-100 transition-colors shrink-0 ml-2 shadow-sm"
            >
              View Cart
            </button>
          </div>
        </div>
      )}

      {/* SLIDE-OUT DRAWER */}
      {isCartOpen && <div className="fixed inset-0 bg-black/80 transition-opacity" style={{ zIndex: 9999900 }} onClick={() => setIsCartOpen(false)}></div>}
      <div className={`fixed inset-y-0 right-0 w-full sm:w-[450px] bg-[#0A0A0A] text-white shadow-2xl border-l border-zinc-900 transform transition-transform duration-500 ease-in-out ${isCartOpen ? 'translate-x-0' : 'translate-x-full'} flex flex-col`} style={{ zIndex: 9999999 }}>
        
        <div className="flex items-center justify-between p-6 border-b border-zinc-900 shrink-0">
          <h2 className="text-[11px] tracking-[0.2em] uppercase font-medium">Your Cart ({cartItemCount})</h2>
          <button onClick={() => setIsCartOpen(false)} className="text-zinc-500 hover:text-white transition-colors text-[10px] tracking-widest uppercase">&larr; Continue Shopping</button>
        </div>
        
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {cart.length === 0 ? (
            <div className="text-center text-zinc-600 text-[10px] tracking-widest uppercase mt-10">Your cart is currently empty. Let's find you something beautiful.</div>
          ) : (
            cart.map((item, idx) => (
              <div key={`${item.id}-${item.size}-${idx}`} className="flex gap-4">
                <div className="w-20 h-28 bg-[#111] shrink-0 border border-zinc-800">
                  {item.image && ( <img src={item.image} alt={item.name} className="w-full h-full object-cover" /> )}
                </div>
                <div className="flex-1 flex flex-col justify-between py-1">
                  <div>
                    <h3 className="text-[10px] tracking-widest uppercase font-medium">{item.name}</h3>
                    <p className="text-[10px] text-zinc-500 mt-1 uppercase">Size: {item.size}</p>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] tracking-wider font-medium text-zinc-300">{formatPrice(item.price)}</span>
                    <div className="flex items-center gap-3 border border-zinc-800 px-2 py-1">
                      <span className="text-[10px] text-zinc-500">Qty: {item.quantity}</span>
                      <span className="text-zinc-800">|</span>
                      <button onClick={() => removeFromCart(item.id, item.size)} className="text-[9px] uppercase tracking-wider text-red-500 hover:text-red-400">Remove</button>
                    </div>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
        
        {cart.length > 0 && (
          <div className="p-6 border-t border-zinc-900 bg-[#111] shrink-0">
            
            {/* NEW: REFINED DELIVERY OPTIONS */}
            <div className="mb-6 border-b border-zinc-800 pb-5">
              <h3 className="text-[11px] text-white uppercase tracking-[0.2em] mb-1 font-medium">Delivery Options</h3>
              <p className="text-[9px] text-zinc-400 tracking-wider mb-4">Where should we deliver your order?</p>
              
              <div className="flex flex-col gap-2">
                {deliveryOptions.map(opt => (
                  <button 
                    key={opt.id}
                    onClick={() => handleSelectDelivery(opt)}
                    className={`flex items-center justify-between p-3 border text-left transition-all ${selectedDelivery?.id === opt.id ? 'border-white bg-white text-black shadow-md' : 'border-zinc-800 text-white hover:border-zinc-600 bg-transparent'}`}
                  >
                    <div className="flex items-center gap-3">
                      <div className={`w-3 h-3 rounded-full border flex items-center justify-center shrink-0 ${selectedDelivery?.id === opt.id ? 'border-black' : 'border-zinc-500'}`}>
                        {selectedDelivery?.id === opt.id && <div className="w-1.5 h-1.5 bg-black rounded-full"></div>}
                      </div>
                      <div>
                        <h4 className="text-[9px] font-bold tracking-widest uppercase">{opt.title}</h4>
                        <p className={`text-[7.5px] tracking-wider mt-0.5 uppercase ${selectedDelivery?.id === opt.id ? 'text-zinc-700' : 'text-zinc-500'}`}>{opt.desc}</p>
                      </div>
                    </div>
                    <div className={`text-[9px] font-mono tracking-wider ${selectedDelivery?.id === opt.id ? 'text-black font-bold' : 'text-zinc-400'}`}>
                      {opt.isCalculated ? 'Calculated' : formatPrice(opt.fee)}
                    </div>
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-2 mb-6 text-[10px] uppercase tracking-widest">
              <div className="flex justify-between text-zinc-400">
                <span>Subtotal</span>
                <span className="font-mono">{formatPrice(cartSubtotal)}</span>
              </div>
              {selectedDelivery && ( 
                <div className="flex justify-between text-zinc-400 animate-fade-in">
                  <span>Delivery ({selectedDelivery.title})</span>
                  <span className="font-mono">{selectedDelivery.isCalculated ? 'Calculated at checkout' : formatPrice(deliveryFee, true)}</span>
                </div> 
              )}
              <div className="flex justify-between font-bold text-white pt-3 border-t border-zinc-800 mt-3 text-xs">
                <span>Total</span>
                <span className="font-mono">{selectedDelivery?.isCalculated ? 'Calculated at checkout' : getDisplayTotal()}</span>
              </div>
            </div>

            <button 
              onClick={() => { 
                if (!selectedDelivery) return showToast("PLEASE SELECT A DELIVERY REGION TO PROCEED."); 
                localStorage.setItem('sikamore_delivery', JSON.stringify({ fee: deliveryFee, zone: deliveryZone, currency: currency, countryCode: detectedCountryCode, countryName: detectedCountryName, isCalculated: selectedDelivery.isCalculated })); 
                setIsCartOpen(false); 
                router.push('/checkout'); 
              }} 
              className={`w-full text-center flex items-center justify-center py-4 text-[10px] tracking-[0.2em] uppercase transition-colors font-bold ${!selectedDelivery ? 'bg-zinc-800 text-zinc-500 cursor-not-allowed' : 'bg-white text-black hover:bg-zinc-300'}`}
            >
              CONTINUE TO CHECKOUT &rarr;
            </button>
          </div>
        )}
      </div>
    </>
  );
}
