'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
const supabase = createClient(supabaseUrl, supabaseAnonKey);

const COUNTRIES = [
  { code: 'AF', name: 'Afghanistan' }, { code: 'AL', name: 'Albania' }, { code: 'DZ', name: 'Algeria' },
  { code: 'AD', name: 'Andorra' }, { code: 'AO', name: 'Angola' }, { code: 'AG', name: 'Antigua and Barbuda' },
  { code: 'AR', name: 'Argentina' }, { code: 'AM', name: 'Armenia' }, { code: 'AU', name: 'Australia' },
  { code: 'AT', name: 'Austria' }, { code: 'AZ', name: 'Azerbaijan' }, { code: 'BS', name: 'Bahamas' },
  { code: 'BH', name: 'Bahrain' }, { code: 'BD', name: 'Bangladesh' }, { code: 'BB', name: 'Barbados' },
  { code: 'BY', name: 'Belarus' }, { code: 'BE', name: 'Belgium' }, { code: 'BZ', name: 'Belize' },
  { code: 'BJ', name: 'Benin' }, { code: 'BT', name: 'Bhutan' }, { code: 'BO', name: 'Bolivia' },
  { code: 'BA', name: 'Bosnia and Herzegovina' }, { code: 'BW', name: 'Botswana' }, { code: 'BR', name: 'Brazil' },
  { code: 'BN', name: 'Brunei' }, { code: 'BG', name: 'Bulgaria' }, { code: 'BF', name: 'Burkina Faso' },
  { code: 'BI', name: 'Burundi' }, { code: 'CV', name: 'Cabo Verde' }, { code: 'KH', name: 'Cambodia' },
  { code: 'CM', name: 'Cameroon' }, { code: 'CA', name: 'Canada' }, { code: 'CF', name: 'Central African Republic' },
  { code: 'TD', name: 'Chad' }, { code: 'CL', name: 'Chile' }, { code: 'CN', name: 'China' },
  { code: 'CO', name: 'Colombia' }, { code: 'KM', name: 'Comoros' }, { code: 'CD', name: 'Congo (DRC)' },
  { code: 'CG', name: 'Congo (Republic)' }, { code: 'CR', name: 'Costa Rica' }, { code: 'CI', name: "Côte d'Ivoire" },
  { code: 'HR', name: 'Croatia' }, { code: 'CU', name: 'Cuba' }, { code: 'CY', name: 'Cyprus' },
  { code: 'CZ', name: 'Czech Republic' }, { code: 'DK', name: 'Denmark' }, { code: 'DJ', name: 'Djibouti' },
  { code: 'DM', name: 'Dominica' }, { code: 'DO', name: 'Dominican Republic' }, { code: 'EC', name: 'Ecuador' },
  { code: 'EG', name: 'Egypt' }, { code: 'SV', name: 'El Salvador' }, { code: 'GQ', name: 'Equatorial Guinea' },
  { code: 'ER', name: 'Eritrea' }, { code: 'EE', name: 'Estonia' }, { code: 'SZ', name: 'Eswatini' },
  { code: 'ET', name: 'Ethiopia' }, { code: 'FJ', name: 'Fiji' }, { code: 'FI', name: 'Finland' },
  { code: 'FR', name: 'France' }, { code: 'GA', name: 'Gabon' }, { code: 'GM', name: 'Gambia' },
  { code: 'GE', name: 'Georgia' }, { code: 'DE', name: 'Germany' }, { code: 'GH', name: 'Ghana' },
  { code: 'GR', name: 'Greece' }, { code: 'GD', name: 'Grenada' }, { code: 'GT', name: 'Guatemala' },
  { code: 'GN', name: 'Guinea' }, { code: 'GW', name: 'Guinea-Bissau' }, { code: 'GY', name: 'Guyana' },
  { code: 'HT', name: 'Haiti' }, { code: 'HN', name: 'Honduras' }, { code: 'HU', name: 'Hungary' },
  { code: 'IS', name: 'Iceland' }, { code: 'IN', name: 'India' }, { code: 'ID', name: 'Indonesia' },
  { code: 'IR', name: 'Iran' }, { code: 'IQ', name: 'Iraq' }, { code: 'IE', name: 'Ireland' },
  { code: 'IL', name: 'Israel' }, { code: 'IT', name: 'Italy' }, { code: 'JM', name: 'Jamaica' },
  { code: 'JP', name: 'Japan' }, { code: 'JO', name: 'Jordan' }, { code: 'KZ', name: 'Kazakhstan' },
  { code: 'KE', name: 'Kenya' }, { code: 'KI', name: 'Kiribati' }, { code: 'KP', name: 'North Korea' },
  { code: 'KR', name: 'South Korea' }, { code: 'KW', name: 'Kuwait' }, { code: 'KG', name: 'Kyrgyzstan' },
  { code: 'LA', name: 'Laos' }, { code: 'LV', name: 'Latvia' }, { code: 'LB', name: 'Lebanon' },
  { code: 'LS', name: 'Lesotho' }, { code: 'LR', name: 'Liberia' }, { code: 'LY', name: 'Libya' },
  { code: 'LI', name: 'Liechtenstein' }, { code: 'LT', name: 'Lithuania' }, { code: 'LU', name: 'Luxembourg' },
  { code: 'MG', name: 'Madagascar' }, { code: 'MW', name: 'Malawi' }, { code: 'MY', name: 'Malaysia' },
  { code: 'MV', name: 'Maldives' }, { code: 'ML', name: 'Mali' }, { code: 'MT', name: 'Malta' },
  { code: 'MH', name: 'Marshall Islands' }, { code: 'MR', name: 'Mauritania' }, { code: 'MU', name: 'Mauritius' },
  { code: 'MX', name: 'Mexico' }, { code: 'FM', name: 'Micronesia' }, { code: 'MD', name: 'Moldova' },
  { code: 'MC', name: 'Monaco' }, { code: 'MN', name: 'Mongolia' }, { code: 'ME', name: 'Montenegro' },
  { code: 'MA', name: 'Morocco' }, { code: 'MZ', name: 'Mozambique' }, { code: 'MM', name: 'Myanmar' },
  { code: 'NA', name: 'Namibia' }, { code: 'NR', name: 'Nauru' }, { code: 'NP', name: 'Nepal' },
  { code: 'NL', name: 'Netherlands' }, { code: 'NZ', name: 'New Zealand' }, { code: 'NI', name: 'Nicaragua' },
  { code: 'NE', name: 'Niger' }, { code: 'NG', name: 'Nigeria' }, { code: 'MK', name: 'North Macedonia' },
  { code: 'NO', name: 'Norway' }, { code: 'OM', name: 'Oman' }, { code: 'PK', name: 'Pakistan' },
  { code: 'PW', name: 'Palau' }, { code: 'PS', name: 'Palestine' }, { code: 'PA', name: 'Panama' },
  { code: 'PG', name: 'Papua New Guinea' }, { code: 'PY', name: 'Paraguay' }, { code: 'PE', name: 'Peru' },
  { code: 'PH', name: 'Philippines' }, { code: 'PL', name: 'Poland' }, { code: 'PT', name: 'Portugal' },
  { code: 'QA', name: 'Qatar' }, { code: 'RO', name: 'Romania' }, { code: 'RU', name: 'Russia' },
  { code: 'RW', name: 'Rwanda' }, { code: 'KN', name: 'Saint Kitts and Nevis' }, { code: 'LC', name: 'Saint Lucia' },
  { code: 'VC', name: 'Saint Vincent and the Grenadines' }, { code: 'WS', name: 'Samoa' }, { code: 'SM', name: 'San Marino' },
  { code: 'ST', name: 'Sao Tome and Principe' }, { code: 'SA', name: 'Saudi Arabia' }, { code: 'SN', name: 'Senegal' },
  { code: 'RS', name: 'Serbia' }, { code: 'SC', name: 'Seychelles' }, { code: 'SL', name: 'Sierra Leone' },
  { code: 'SG', name: 'Singapore' }, { code: 'SK', name: 'Slovakia' }, { code: 'SI', name: 'Slovenia' },
  { code: 'SB', name: 'Solomon Islands' }, { code: 'SO', name: 'Somalia' }, { code: 'ZA', name: 'South Africa' },
  { code: 'SS', name: 'South Sudan' }, { code: 'ES', name: 'Spain' }, { code: 'LK', name: 'Sri Lanka' },
  { code: 'SD', name: 'Sudan' }, { code: 'SR', name: 'Suriname' }, { code: 'SE', name: 'Sweden' },
  { code: 'CH', name: 'Switzerland' }, { code: 'SY', name: 'Syria' }, { code: 'TW', name: 'Taiwan' },
  { code: 'TJ', name: 'Tajikistan' }, { code: 'TZ', name: 'Tanzania' }, { code: 'TH', name: 'Thailand' },
  { code: 'TL', name: 'Timor-Leste' }, { code: 'TG', name: 'Togo' }, { code: 'TO', name: 'Tonga' },
  { code: 'TT', name: 'Trinidad and Tobago' }, { code: 'TN', name: 'Tunisia' }, { code: 'TR', name: 'Turkey' },
  { code: 'TM', name: 'Turkmenistan' }, { code: 'TV', name: 'Tuvalu' }, { code: 'UG', name: 'Uganda' },
  { code: 'UA', name: 'Ukraine' }, { code: 'AE', name: 'United Arab Emirates' }, { code: 'GB', name: 'United Kingdom' },
  { code: 'US', name: 'United States' }, { code: 'UY', name: 'Uruguay' }, { code: 'UZ', name: 'Uzbekistan' },
  { code: 'VU', name: 'Vanuatu' }, { code: 'VA', name: 'Vatican City' }, { code: 'VE', name: 'Venezuela' },
  { code: 'VN', name: 'Vietnam' }, { code: 'YE', name: 'Yemen' }, { code: 'ZM', name: 'Zambia' },
  { code: 'ZW', name: 'Zimbabwe' },
];

export default function AkuOyiboWaitlist() {
  const [products, setProducts] = useState([]);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [activeImageIndex, setActiveImageIndex] = useState(0);

  const [cart, setCart] = useState([]);
  const [showInterceptModal, setShowInterceptModal] = useState(false);
  const [lastAdded, setLastAdded] = useState(null);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState(null);
  const [formData, setFormData] = useState({
    firstName: '', email: '', whatsapp: '', country: '', designInterest: '', purchaseIntent: '',
  });

  const [userCountryCode, setUserCountryCode] = useState('NG');
  const [exchangeRate, setExchangeRate] = useState(1500);

  useEffect(() => {
    async function fetchProducts() {
      const { data } = await supabase.from('waitlist_products').select('*').order('created_at', { ascending: true });
      if (data) setProducts(data);
    }
    fetchProducts();

    supabase.from('shipping_settings').select('usd_to_ngn_rate').eq('id', 1).single()
      .then(({ data }) => { if (data?.usd_to_ngn_rate) setExchangeRate(data.usd_to_ngn_rate); });

    fetch('https://ipapi.co/json/')
      .then(res => res.json())
      .then(data => {
        if (data.country_code) setUserCountryCode(data.country_code);
        if (data.country_name) setFormData(prev => ({ ...prev, country: data.country_name }));
      }).catch(() => {});
  }, []);
      const { data } = await supabase
        .from('waitlist_products')
        .select('*')
        .order('created_at', { ascending: true });
      if (data) setProducts(data);
    }
    fetchProducts();
  }, []);

  useEffect(() => {
    setFormData((prev) => ({ ...prev, designInterest: cart.join(', ') }));
  }, [cart]);

  const formatPrice = (priceStr) => {
    if (!priceStr) return '';
    const num = parseFloat(String(priceStr).replace(/[^\d.]/g, ''));
    if (isNaN(num)) return priceStr;
    if (userCountryCode !== 'NG') {
      return `$${Math.round(num / exchangeRate).toLocaleString()}`;
    }
    return `₦${num.toLocaleString()}`;
  };

  const handleChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (cart.length === 0) {
      alert('Please select at least one design from the gallery before joining the waitlist.');
      return;
    }
    setIsSubmitting(true);
    try {
      const { error } = await supabase.from('waitlist_leads').insert([
        {
          first_name: formData.firstName,
          email: formData.email.toLowerCase(),
          whatsapp: formData.whatsapp || null,
          country: formData.country,
          design_interest: formData.designInterest,
          purchase_intent: formData.purchaseIntent,
        },
      ]);

      if (error) throw error; 

      setSubmitStatus('success');
      setFormData({
        firstName: '',
        email: '',
        whatsapp: '',
        country: '',
        designInterest: '',
        purchaseIntent: '',
      });
      setCart([]);
    } catch (err) {
      console.error("SUPABASE SUBMIT ERROR:", err);
      alert(`DATABASE ERROR: ${err.message}`);
      setSubmitStatus(null); 
    } finally {
      setIsSubmitting(false);
    }
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
      setCart((prev) => [...prev, product.name]);
    }
    setLastAdded(product);
    closeModal();
    setShowInterceptModal(true);
  };

  const handleRequestNow = () => {
    setShowInterceptModal(false);
    document.getElementById('waitlist-form')?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleExploreGallery = () => {
    document.getElementById('collection-gallery')?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <div className="min-h-screen bg-[#F5F0E6] text-[#4A3025] font-sans selection:bg-[#A3523B] selection:text-white relative">
      <section className="relative min-h-[90vh] md:min-h-screen flex flex-col bg-[#2A1810]">
        <div className="absolute inset-0 z-0 overflow-hidden">
          {products.length > 0 ? (
            <img
              src={products[0].image_url}
              alt="Hero Backdrop"
              className="w-full h-full object-cover object-center md:object-right filter brightness-90 contrast-105"
            />
          ) : (
            <div className="w-full h-full bg-[#2A1810]"></div>
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-[#2A1810] via-[#2A1810]/75 to-[#2A1810]/30 md:bg-gradient-to-r md:from-[#2A1810] md:via-[#2A1810]/80 md:to-transparent"></div>
        </div>

        <header className="w-full pt-8 px-6 sm:px-12 flex justify-between items-center z-10 relative">
          <Link href="/" className="text-sm tracking-[0.3em] font-serif uppercase text-[#F4EFE6]">
            S. Sikamòre
          </Link>
          <nav className="hidden md:flex gap-10 text-[9px] uppercase tracking-widest text-[#D1C7BD]">
            <Link href="/collections" className="hover:text-white transition-colors">
              Collections
            </Link>
            <Link href="/bags" className="hover:text-white transition-colors">
              Bags
            </Link>
            <Link href="/accessories" className="hover:text-white transition-colors">
              Accessories
            </Link>
          </nav>
        </header>

        <div className="flex-1 flex flex-col justify-center px-6 sm:px-12 z-10 relative max-w-[1400px] mx-auto w-full pt-16 md:pt-0">
          <div className="max-w-xl">
            <span className="text-[11px] tracking-[0.5em] uppercase text-[#D1C7BD] mb-4 block">T H E</span>
            <h1 className="text-5xl sm:text-7xl font-serif font-light uppercase leading-none mb-4 text-[#F4EFE6] drop-shadow-md">
              AKU OYIBO
            </h1>
            <span className="text-[11px] tracking-[0.5em] uppercase text-[#D1C7BD] mb-8 block">
              W A I T L I S T
            </span>

            <div className="w-16 h-px bg-[#D1C7BD] mb-8"></div>

            <p className="font-serif italic text-lg sm:text-xl text-[#F4EFE6] mb-6 drop-shadow-sm">
              Some pieces are made to be worn.<br />Others are made to be kept.
            </p>

            <div className="text-[11px] tracking-[0.05em] text-[#E0D7CD] mb-8 space-y-4 leading-loose drop-shadow-sm">
              <p>
                Aku Oyibo is a collectible expression of thoughtful craftsmanship, the beauty of transformed
                materials and intricate hand-beadwork.
              </p>
              <p>
                Crafted from natural coconut shells, no two pieces are exactly alike. Each shell carries its own
                markings, shape and colour, making every Aku Oyibo a one-of-one piece.
              </p>
              <p>Created for the woman who appreciates pieces with character, craftsmanship and a story.</p>
            </div>

            <p className="text-[10px] tracking-widest text-[#D1C7BD] mb-12 uppercase">
              From Ala Oma — Resort 2027.
            </p>

            <button
              onClick={handleExploreGallery}
              className="bg-[#A3523B] text-white px-8 py-3.5 text-[9px] tracking-[0.2em] uppercase font-bold hover:bg-[#8A422D] shadow-xl hover:shadow-2xl transition-all w-full sm:w-auto"
            >
              JOIN THE WAITLIST →
            </button>
          </div>
        </div>
      </section>

      <section id="collection-gallery" className="py-20 md:py-24 bg-[#F5F0E6] scroll-mt-6">
        <div className="max-w-[1400px] mx-auto px-6 sm:px-12 text-center">
          <h2 className="text-lg md:text-xl tracking-[0.25em] font-serif uppercase mb-3 text-[#4A3025]">
            Explore the Aku Oyibo Collection
          </h2>
          <p className="text-[10px] md:text-[11px] tracking-wider text-[#735A4D] mb-12 md:mb-16">
            Click on any piece to view details and full gallery.
          </p>

          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 md:gap-6">
            {products.map((item) => (
              <div
                key={item.id}
                onClick={() => openModal(item)}
                className="flex flex-col items-center group cursor-pointer"
              >
                <div className="w-full aspect-[4/5] mb-4 relative overflow-hidden bg-[#EAE2D6] shadow-sm group-hover:shadow-md transition-shadow">
                  {item.badge && (
                    <span className="absolute bottom-2 left-2 bg-[#A3523B] text-white text-[6px] md:text-[7px] px-2 py-1 uppercase tracking-widest z-10 font-bold shadow-sm">
                      {item.badge}
                    </span>
                  )}
                  <img
                    src={item.image_url}
                    alt={item.name}
                    className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                  />
                </div>
                <h3 className="text-[9px] md:text-[11px] tracking-widest mb-1 text-[#4A3025] font-medium leading-tight group-hover:text-[#A3523B] transition-colors">
                  {item.name}
                </h3>
                <p className="text-[10px] md:text-[11px] font-bold text-[#A3523B]">{formatPrice(item.price)}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section
        id="waitlist-form"
        className="py-20 md:py-24 px-6 sm:px-12 max-w-[1400px] mx-auto border-t border-[#D1C7BD] grid md:grid-cols-12 gap-12 lg:gap-24 scroll-mt-6"
      >
        <div className="md:col-span-7 lg:col-span-8">
          <h2 className="text-xl md:text-2xl tracking-[0.2em] font-serif uppercase mb-3 text-[#4A3025]">
            Join the Waitlist
          </h2>
          <p className="text-[10px] md:text-[11px] tracking-wider text-[#735A4D] mb-8 leading-relaxed font-medium">
            Be the first to know when the private reserve unlocks.
          </p>

          {submitStatus === 'success' ? (
            <div className="bg-[#EAE2D6] p-10 border border-[#D1C7BD] text-center animate-fade-in">
              <h3 className="text-sm tracking-[0.2em] uppercase font-bold text-[#4A3025] mb-4">
                You're on the list
              </h3>
              <p className="text-[11px] tracking-wider text-[#735A4D] leading-relaxed">
                Thank you for your interest. You will be notified directly when the private reserve unlocks.
              </p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4 md:space-y-5 relative">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 md:gap-5">
                <input
                  type="text"
                  name="firstName"
                  placeholder="First Name *"
                  required
                  value={formData.firstName}
                  onChange={handleChange}
                  className="w-full bg-white/50 border border-[#C6B6A5] px-4 py-3.5 text-base md:text-[11px] uppercase tracking-wider focus:bg-white focus:border-[#4A3025] focus:outline-none transition-all rounded-sm shadow-sm"
                />
                <input
                  type="email"
                  name="email"
                  placeholder="Email Address *"
                  required
                  value={formData.email}
                  onChange={handleChange}
                  className="w-full bg-white/50 border border-[#C6B6A5] px-4 py-3.5 text-base md:text-[11px] uppercase tracking-wider focus:bg-white focus:border-[#4A3025] focus:outline-none transition-all rounded-sm shadow-sm"
                />
              </div>
              <input
                type="tel"
                name="whatsapp"
                placeholder="WhatsApp Number (Optional)"
                value={formData.whatsapp}
                onChange={handleChange}
                className="w-full bg-white/50 border border-[#C6B6A5] px-4 py-3.5 text-base md:text-[11px] uppercase tracking-wider focus:bg-white focus:border-[#4A3025] focus:outline-none transition-all rounded-sm shadow-sm"
              />
              <select
                name="country"
                required
                value={formData.country}
                onChange={handleChange}
                className="w-full bg-white/50 border border-[#C6B6A5] px-4 py-3.5 text-base md:text-[11px] tracking-wider uppercase focus:bg-white focus:border-[#4A3025] focus:outline-none transition-all appearance-none rounded-sm shadow-sm"
              >
                <option value="" disabled>
                  Country of Residence *
                </option>
                {COUNTRIES.map((c) => (
                  <option key={c.code} value={c.name}>
                    {c.name}
                  </option>
                ))}
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
                {cart.length === 0 && (
                  <span className="absolute right-4 top-1/2 -translate-y-1/2 text-[8px] text-[#A3523B] tracking-widest uppercase">
                    Required
                  </span>
                )}
              </div>

              <select
                name="purchaseIntent"
                required
                value={formData.purchaseIntent}
                onChange={handleChange}
                className="w-full bg-white/50 border border-[#C6B6A5] px-4 py-3.5 text-base md:text-[11px] tracking-wider uppercase focus:bg-white focus:border-[#4A3025] focus:outline-none transition-all appearance-none rounded-sm shadow-sm"
              >
                <option value="" disabled>
                  Intent to pre-order? *
                </option>
                <option value="Yes">Yes</option>
                <option value="Maybe">Maybe</option>
              </select>
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full sm:w-auto bg-[#A3523B] text-white px-10 py-4 mt-2 text-[10px] tracking-[0.2em] uppercase font-bold rounded-sm hover:bg-[#8A422D] shadow-md hover:shadow-lg transition-all"
              >
                {isSubmitting ? 'TRANSMITTING...' : 'JOIN WAITLIST →'}
              </button>
            </form>
          )}
        </div>

        <div className="md:col-span-5 lg:col-span-4 flex flex-col justify-center space-y-8 md:space-y-10 md:pl-10 md:border-l border-[#D1C7BD] mt-8 md:mt-0">
          <div className="flex gap-4 md:gap-5 items-start">
            <svg
              className="w-6 h-6 md:w-8 md:h-8 text-[#A3523B] shrink-0"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="1"
                d="M7 11.5V14m0-2.5v-6a1.5 1.5 0 113 0m-3 6a1.5 1.5 0 00-3 0v2a7.5 7.5 0 0015 0v-5a1.5 1.5 0 00-3 0m-6-3V11m0-5.5v-1a1.5 1.5 0 013 0v1m0 0V11m0-5.5a1.5 1.5 0 013 0v3m0 0V11"
              />
            </svg>
            <div>
              <h4 className="text-[11px] md:text-[12px] tracking-[0.1em] font-bold text-[#4A3025] uppercase mb-1">
                Handcrafted
              </h4>
              <p className="text-[10px] md:text-[11px] tracking-wide text-[#735A4D] leading-relaxed">
                Thoughtfully made with attention to detail.
              </p>
            </div>
          </div>
          <div className="flex gap-4 md:gap-5 items-start">
            <svg
              className="w-6 h-6 md:w-8 md:h-8 text-[#A3523B] shrink-0"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="1"
                d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"
              />
            </svg>
            <div>
              <h4 className="text-[11px] md:text-[12px] tracking-[0.1em] font-bold text-[#4A3025] uppercase mb-1">
                Collectible Design
              </h4>
              <p className="text-[10px] md:text-[11px] tracking-wide text-[#735A4D] leading-relaxed">
                A statement piece to wear, keep and pass on.
              </p>
            </div>
          </div>
          <div className="flex gap-4 md:gap-5 items-start">
            <svg
              className="w-6 h-6 md:w-8 md:h-8 text-[#A3523B] shrink-0"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="1"
                d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z"
              />
            </svg>
            <div>
              <h4 className="text-[11px] md:text-[12px] tracking-[0.1em] font-bold text-[#4A3025] uppercase mb-1">
                Limited Production
              </h4>
              <p className="text-[10px] md:text-[11px] tracking-wide text-[#735A4D] leading-relaxed">
                Produced in small batches to ensure quality and craftsmanship.
              </p>
            </div>
          </div>
        </div>
      </section>

      {selectedProduct && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 animate-fade-in">
          <div className="absolute inset-0 bg-[#2A1810]/85 backdrop-blur-sm cursor-pointer" onClick={closeModal}></div>

          <div className="bg-[#F5F0E6] w-full max-w-4xl max-h-[92vh] overflow-y-auto relative z-10 flex flex-col md:flex-row shadow-2xl rounded-sm">
            <button
              onClick={closeModal}
              className="absolute top-4 right-4 z-30 bg-[#F5F0E6]/90 hover:bg-white p-2 text-[#4A3025] shadow-md transition-colors rounded-full"
            >
              ✕
            </button>

            <div className="w-full md:w-1/2 bg-[#ECE3D5] flex flex-col border-b md:border-b-0 md:border-r border-[#D1C7BD]">
              <div className="relative w-full aspect-[4/5] min-h-[340px] md:min-h-[500px] flex items-center justify-center p-4">
                <img
                  src={
                    selectedProduct.images && selectedProduct.images.length > 0
                      ? selectedProduct.images[activeImageIndex]
                      : selectedProduct.image_url
                  }
                  alt={selectedProduct.name}
                  className="w-full h-full object-contain drop-shadow-md"
                />
              </div>
              {selectedProduct.images && selectedProduct.images.length > 1 && (
                <div className="flex gap-2 p-3 bg-[#F5F0E6] overflow-x-auto border-t border-[#D1C7BD]">
                  {selectedProduct.images.map((img, i) => (
                    <button
                      key={i}
                      onClick={() => setActiveImageIndex(i)}
                      className={`w-14 h-16 shrink-0 border-2 bg-white transition-colors ${
                        activeImageIndex === i ? 'border-[#A3523B]' : 'border-transparent opacity-60 hover:opacity-100'
                      }`}
                    >
                      <img src={img} className="w-full h-full object-contain" />
                    </button>
                  ))}
                </div>
              )}
            </div>

            <div className="w-full md:w-1/2 p-6 sm:p-10 flex flex-col justify-between">
              <div>
                {selectedProduct.badge && (
                  <span className="inline-block bg-[#A3523B] text-white text-[7.5px] px-2 py-1 uppercase tracking-widest font-bold mb-4 shadow-sm">
                    {selectedProduct.badge}
                  </span>
                )}
                <h2 className="text-xl md:text-2xl font-serif uppercase text-[#4A3025] mb-2 leading-snug">
                  {selectedProduct.name}
                </h2>
                <p className="text-[13px] font-bold tracking-widest text-[#A3523B] mb-6">
                {formatPrice(selectedProduct.price)}
                 </p>

                <div className="w-12 h-px bg-[#D1C7BD] mb-6"></div>

                <div className="text-[11px] tracking-wide text-[#735A4D] leading-relaxed whitespace-pre-wrap">
                  {selectedProduct.description ||
                    'A collectible expression of craftsmanship and design. Crafted to be worn, made to be kept.'}
                </div>
              </div>

              <button
                onClick={() => handleAddToCart(selectedProduct)}
                className="mt-8 bg-[#4A3025] text-white px-8 py-4 text-[10px] tracking-[0.2em] uppercase font-bold hover:bg-[#34211A] shadow-md hover:shadow-lg transition-all w-full text-center rounded-sm"
              >
                ADD TO RESERVATION →
              </button>
            </div>
          </div>
        </div>
      )}

      {showInterceptModal && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 sm:p-6 animate-fade-in">
          <div
            className="absolute inset-0 bg-[#2A1810]/70 backdrop-blur-sm cursor-pointer"
            onClick={() => setShowInterceptModal(false)}
          ></div>
          <div className="bg-[#F5F0E6] border border-[#D1C7BD] w-full max-w-md p-8 sm:p-12 relative z-10 text-center shadow-2xl rounded-sm">
            <h3 className="text-xl font-serif uppercase text-[#4A3025] mb-2">Item Reserved</h3>
            <p className="text-[11px] tracking-wider text-[#735A4D] mb-8 font-medium">
              "{lastAdded?.name}" has been added to your waitlist folio.
            </p>

            <div className="flex flex-col gap-3">
              <button
                onClick={handleRequestNow}
                className="w-full bg-[#A3523B] text-white py-4 text-[10px] tracking-[0.2em] uppercase font-bold hover:bg-[#8A422D] shadow-md transition-all"
              >
                Complete Request Now
              </button>
              <button
                onClick={() => setShowInterceptModal(false)}
                className="w-full bg-transparent border border-[#C6B6A5] text-[#4A3025] py-4 text-[10px] tracking-[0.2em] uppercase font-bold hover:bg-white transition-all"
              >
                Check More Products
              </button>
            </div>
          </div>
        </div>
      )}

      {cart.length > 0 && !showInterceptModal && (
        <div className="fixed bottom-6 right-6 md:bottom-10 md:right-10 z-40 animate-fade-in">
          <button
            onClick={handleRequestNow}
            className="bg-[#4A3025] text-white px-6 py-4 text-[9px] tracking-[0.2em] uppercase font-bold shadow-2xl hover:bg-[#34211A] transition-all rounded-full flex items-center gap-3 border border-[#735A4D]"
          >
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
