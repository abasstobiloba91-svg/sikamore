import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
const supabase = createClient(supabaseUrl, supabaseAnonKey);

const IKEJA_LAT = 6.5920;
const IKEJA_LON = 3.3422;

function calculateDistance(lat1, lon1, lat2, lon2) {
  const R = 6371; 
  const dLat = (lat2 - lat1) * (Math.PI / 180);
  const dLon = (lon2 - lon1) * (Math.PI / 180);
  
  const a = 
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * (Math.PI / 180)) * Math.cos(lat2 * (Math.PI / 180)) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
    
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c; 
}

export async function POST(request) {
  try {
    const { address, countryCode, countryName } = await request.json();

    if (!address || address.trim() === '') {
      return NextResponse.json({ success: false, error: 'Address is required' });
    }

    const isInternational = countryCode && countryCode.toUpperCase() !== 'NG';

    // 1. Fetch live admin rules from database directory
    const { data: settings } = await supabase
      .from('shipping_settings')
      .select('*')
      .eq('id', 1)
      .single();

    // Secure fallback defaults if database query is momentarily delayed
    const mainland = settings ? parseFloat(settings.mainland_fee) : 5000;
    const island = settings ? parseFloat(settings.island_fee) : 8000;
    const interstate = settings ? parseFloat(settings.interstate_fee) : 20000;
    const isInternationalFree = settings ? settings.international_free : true;
    const usdToNgnRate = settings ? parseFloat(settings.usd_to_ngn_rate) : 1500;
    const liveUsdFee = settings && settings.international_fee ? parseFloat(settings.international_fee) : 55;

    let geoUrl = '';
    if (isInternational) {
      // SATELLITE RULE: Restrict search strictly to their geographical country code parameter
      geoUrl = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(address)}&countrycodes=${countryCode.toLowerCase()}&limit=1`;
    } else {
      geoUrl = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(address)}, Nigeria&limit=1`;
    }

    const response = await fetch(geoUrl, {
      headers: {
        'User-Agent': 'Sikamore-Luxury-ECommerce-Platform',
        'Accept-Language': 'en'
      }
    });

    const data = await response.json();

    if (!data || !Array.isArray(data) || data.length === 0 || !data.lat) {
      return NextResponse.json({ 
        success: false, 
        error: isInternational 
          ? `COULD NOT VERIFY LOCATION INSIDE ${countryName?.toUpperCase() || 'YOUR REGION'}. PLEASE CHECK POSTAL CODE.`
          : 'LOCATION NOT RECOGNIZED.' 
      });
    }

    // 2. INTERNATIONAL SHORT-CIRCUIT
    if (isInternational) {
      // Computes international fee in Naira to sync flawlessly with the shop component's frontend currency filters
      const intFeeInNgn = isInternationalFree ? 0 : (liveUsdFee * usdToNgnRate);
      
      return NextResponse.json({
        success: true,
        isInternational: true,
        distanceKm: 0,
        shippingFee: intFeeInNgn,
        matchedAddress: data.display_name // Returns the pristine global address layout
      });
    }

    // 3. DOMESTIC NIGERIAN CALCULATION MATRIX
    const destinationLat = parseFloat(data.lat);
    const destinationLon = parseFloat(data.lon);

    if (isNaN(destinationLat) || isNaN(destinationLon)) {
        return NextResponse.json({ success: false, error: 'Coordinate mapping failed.' });
    }

    const straightLineDistance = calculateDistance(IKEJA_LAT, IKEJA_LON, destinationLat, destinationLon);
    const estimatedDrivingDistance = straightLineDistance * 1.4; 
    
    let shippingFee = 0;
    if (estimatedDrivingDistance <= 30) {
       shippingFee = mainland;
    } else if (estimatedDrivingDistance <= 65) {
       shippingFee = island;
    } else {
       shippingFee = interstate;
    }

    return NextResponse.json({
      success: true,
      isInternational: false,
      distanceKm: Math.round(estimatedDrivingDistance) || 15, 
      shippingFee: shippingFee, 
      matchedAddress: data.display_name
    });

  } catch (error) {
    return NextResponse.json({ success: false, error: 'Internal breakdown.' });
  }
}
