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
  const [intlFeeAfrica, setIntlFeeAfrica] = useState(45);
  const [intlFeeGlobal, setIntlFeeGlobal] = useState(55);

  const [deliveryAddress, setDeliveryAddress] = useState('');
  const [deliveryFee, setDeliveryFee] = useState(0);
  const [deliveryZone, setDeliveryZone] = useState('');
  const [isCalculating, setIsCalculating] = useState(false);
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
          if (data.international_fee_africa) setIntlFeeAfrica(parseFloat(data.international_fee_africa));
          if (data.international_fee_global) setIntlFeeGlobal(parseFloat(data.international_fee_global));
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

  const formatPrice = (ngnPrice, isFee = false) => {
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

  const calculateLiveDelivery = async () => {
    if (!deliveryAddress.trim()) return showToast("PLEASE ENTER YOUR COMPLETE DELIVERY ADDRESS.");
    setIsCalculating(true);
    try {
      showToast("VALIDATING SHIPPING DESTINATION...");
      
      const res = await fetch('/api/shipping-calc', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ address: deliveryAddress, countryCode: detectedCountryCode, countryName: detectedCountryName }),
      });

      let data;
      try { data = await res.json(); } catch (parseError) { throw new Error("SYSTEM ROUTE MISSING."); }

      let autoCurrency = detectedCountryCode === 'NG' ? 'NGN' : 'USD';
      if (detectedCountryCode === 'GB') autoCurrency = 'GBP';
      else if (isEuropeanUser) autoCurrency = 'EUR';

      if (!data.success) {
        if (detectedCountryCode !== 'NG') {
          const actualIntlFee = detectedContinentCode === 'AF' ? intlFeeAfrica : intlFeeGlobal;
          const explicitFee = (actualIntlFee * usdToNgnRate);
          setDeliveryAddress(deliveryAddress.toUpperCase() + " (UNVERIFIED INTERNATIONAL)");
          setDeliveryFee(explicitFee);
          setDeliveryZone(`International Delivery (${detectedCountryName})`);
          if (autoCurrency !== currency) setCurrency(autoCurrency);
          showToast("SATELLITE SYNC SKIPPED. LOGGED TEXT ADDRESS FOR DISPATCH.");
          return;
        } else {
          const { data: rules } = await supabase.from('shipping_settings').select('*').eq('id', 1).single();
          const mainlandRate = rules ? parseFloat(rules.mainland_fee) : 5000;
          const islandRate = rules ? parseFloat(rules.island_fee) : 8000;
          const interstateRate = rules ? parseFloat(rules.interstate_fee) : 20000;
          
          let fallbackFee = mainlandRate;
          let fallbackZone = "Lagos Mainland Flat Rate";
          const lowerAddress = deliveryAddress.toLowerCase();

          if (lowerAddress.includes('island') || lowerAddress.includes('lekki') || lowerAddress.includes('ajah') || lowerAddress.includes('ikoyi') || lowerAddress.includes('victoria')) {
            fallbackFee = islandRate;
            fallbackZone = "Lagos Island Flat Rate";
          } else if (lowerAddress.includes('abuja') || lowerAddress.includes('port harcourt') || lowerAddress.includes('state') || lowerAddress.includes('delta')) {
            fallbackFee = interstateRate;
            fallbackZone = "Interstate Flat Rate";
          }

          setDeliveryAddress(deliveryAddress.toUpperCase() + " (ESTIMATED)");
          setDeliveryFee(fallbackFee);
          setDeliveryZone(fallbackZone);
          if (autoCurrency !== currency) setCurrency(autoCurrency);
          showToast(`EXACT ROUTE UNKNOWN. APPLIED ₦${fallbackFee.toLocaleString()} RATE.`);
          return;
        }
      }

      setDeliveryAddress(data.matchedAddress); 
      setDeliveryFee(data.shippingFee);
      
      if (data.isInternational) {
        setDeliveryZone(`International Delivery (${detectedCountryName})`);
        showToast(`Global Address Validated: Localized within ${detectedCountryName}.`);
      } else {
        const dist = data.distanceKm || 15;
        if (dist <= 30) setDeliveryZone(`Lagos Mainland Dispatch (${dist}km)`);
        else if (dist <= 65) setDeliveryZone(`Lagos Island Dispatch (${dist}km)`);
        else setDeliveryZone(`Interstate Freight Delivery (${dist}km)`);
        showToast(`Route Calculated: ${dist}km layout validated.`);
      }

      if (autoCurrency !== currency) setCurrency(autoCurrency);

    } catch (err) {
      setDeliveryFee(detectedCountryCode === 'NG' ? 5000 : 0);
      setDeliveryZone(detectedCountryCode === 'NG' ? "Lagos Delivery (Estimated)" : "International Delivery");
      showToast("CONNECTION TIMEOUT. STANDARD PROTOCOL ENGAGED.");
    } finally {
      setIsCalculating(false);
    }
  };

  return (
    <>
      {/* FLOATING CART PILL - VISIBLE ON /shop AND /product/* */}
      {cartItemCount > 0 && !isCartOpen && (pathname === '/shop' || pathname.startsWith('/product')) && (
        <div className="fixed bottom-6 left-1/2 transform -translate-x-1/2 w-[92%] sm:w-auto pointer-events-auto animate-fade-in shadow-2xl" style={{ zIndex: 9999990 }}>
          <div className="bg-black rounded-full flex items-center justify-between p-1.5 sm:p-2 border border-zinc-800">
            <div className="flex items-center gap-2 sm:gap-4 pl-4 text-white text-[10px] sm:text-[11px] font-medium tracking-widest uppercase flex-1 whitespace-nowrap">
              <span>{cartItemCount} ITEM{cartItemCount !== 1 && 'S'}</span>
              <span className="text-zinc-600">|</span>
              <span>{formatPrice(cartSubtotal)}</span>
            </div>
            <button 
              onClick={() => setIsCartOpen(true)} 
              className="bg-red-600 text-white px-4 sm:px-6 py-2.5 sm:py-3 rounded-full text-[9px] sm:text-[10px] font-bold uppercase tracking-widest hover:bg-red-700 transition-colors shrink-0 ml-2 shadow-[0_0_15px_rgba(220,38,38,0.3)]"
            >
              View Bag
            </button>
          </div>
        </div>
      )}

      {/* SLIDE-OUT DRAWER */}
      {isCartOpen && <div className="fixed inset-0 bg-black/80 transition-opacity" style={{ zIndex: 9999900 }} onClick={() => setIsCartOpen(false)}></div>}
      <div className={`fixed inset-y-0 right-0 w-full sm:w-[400px] bg-[#0A0A0A] text-white shadow-2xl border-l border-zinc-900 transform transition-transform duration-500 ease-in-out ${isCartOpen ? 'translate-x-0' : 'translate-x-full'} flex flex-col`} style={{ zIndex: 9999999 }}>
        <div className="flex items-center justify-between p-6 border-b border-zinc-900 shrink-0">
          <h2 className="text-[11px] tracking-[0.2em] uppercase font-medium">Your Bag ({cartItemCount})</h2>
          <button onClick={() => setIsCartOpen(false)} className="text-zinc-500 hover:text-white transition-colors"><svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12"/></svg></button>
        </div>
        
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {cart.length === 0 ? (
            <div className="text-center text-zinc-600 text-[10px] tracking-widest uppercase mt-10">Your bag is currently empty. Let's find you something beautiful.</div>
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
            <div className="mb-6 border-b border-zinc-800 pb-5">
              <label className="block text-[9px] text-zinc-500 uppercase tracking-widest mb-3">Calculate Dynamic Routing Logistics</label>
              <div className="flex gap-2">
                <input type="text" value={deliveryAddress} onChange={(e) => setDeliveryAddress(e.target.value)} placeholder="ENTER NEAREST BUS STOP, LANDMARK, OR ZIP CODE..." className="flex-1 bg-transparent border border-zinc-700 text-white text-base md:text-[10px] uppercase tracking-widest p-3 outline-none focus:border-white placeholder-zinc-600 transition-colors" />
                <button onClick={calculateLiveDelivery} disabled={isCalculating} className="bg-white text-black px-4 text-[9px] font-bold uppercase tracking-widest hover:bg-zinc-300 transition-colors disabled:opacity-50">{isCalculating ? 'WAIT...' : 'CALCULATE'}</button>
              </div>
            </div>
            <div className="space-y-2 mb-6 text-xs uppercase tracking-widest">
              <div className="flex justify-between text-zinc-500"><span>Subtotal:</span><span>{formatPrice(cartSubtotal)}</span></div>
              {deliveryZone !== '' && ( <div className="flex justify-between text-zinc-400 animate-fade-in text-[10px]"><span>Dispatch ({deliveryZone}):</span><span>{formatPrice(deliveryFee, true)}</span></div> )}
              <div className="flex justify-between font-medium text-white pt-3 border-t border-zinc-800 mt-3 text-[13px]"><span>Total:</span><span>{getDisplayTotal()}</span></div>
            </div>
            <div className="flex gap-3">
              <button onClick={() => setIsCartOpen(false)} className="flex-1 border border-white text-white text-center py-4 text-[9px] tracking-[0.2em] uppercase hover:bg-white hover:text-black transition-colors">Continue Shopping</button>
              <button 
                onClick={() => { 
                  if (deliveryZone === '' || !deliveryAddress.trim()) return showToast("PLEASE CALCULATE ROUTING EXPENDITURES TO PROCEED."); 
                  localStorage.setItem('sikamore_delivery', JSON.stringify({ fee: deliveryFee, zone: deliveryZone, address: deliveryAddress, currency: currency, countryCode: detectedCountryCode, countryName: detectedCountryName })); 
                  setIsCartOpen(false); 
                  router.push('/checkout'); 
                }} 
                className={`flex-1 text-center flex items-center justify-center py-4 text-[9px] tracking-[0.2em] uppercase transition-colors font-bold ${deliveryZone === '' ? 'bg-zinc-800 text-zinc-500 cursor-not-allowed' : 'bg-white text-black hover:bg-zinc-300'}`}
              >
                {deliveryZone === '' ? 'CALCULATE SHIPPING' : 'Proceed to Payment'}
              </button>
            </div>
          </div>
        )}
      </div>
    </>
  );
}
