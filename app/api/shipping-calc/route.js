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
    const { address } = await request.json();

    if (!address || address.trim() === '') {
      return NextResponse.json({ success: false, error: 'Address is required' });
    }

    // 1. Fetch live admin rules from database directory
    const { data: settings } = await supabase
      .from('shipping_settings')
      .select('*')
      .order('id', { ascending: true })
      .limit(1)
      .single();

    // Secure fallback defaults if database query fails
    const mainland = settings ? parseFloat(settings.mainland_fee) : 5000;
    const island = settings ? parseFloat(settings.island_fee) : 8000;
    const interstate = settings ? parseFloat(settings.interstate_fee) : 20000;

    const searchQuery = `${address}, Nigeria`;
    const geoUrl = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(searchQuery)}&limit=1`;

    const response = await fetch(geoUrl, {
      headers: {
        'User-Agent': 'Sikamore-Luxury-ECommerce-Platform',
        'Accept-Language': 'en'
      }
    });

    const data = await response.json();

    if (!data || !Array.isArray(data) || data.length === 0 || !data.lat) {
      return NextResponse.json({ success: false, error: 'Location not recognized.' });
    }

    const destinationLat = parseFloat(data.lat);
    const destinationLon = parseFloat(data.lon);

    if (isNaN(destinationLat) || isNaN(destinationLon)) {
        return NextResponse.json({ success: false, error: 'Coordinate mapping failed.' });
    }

    const straightLineDistance = calculateDistance(IKEJA_LAT, IKEJA_LON, destinationLat, destinationLon);
    const estimatedDrivingDistance = straightLineDistance * 1.4; 
    
    // 2. Compute dynamic fees based on admin's live parameters
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
      distanceKm: Math.round(estimatedDrivingDistance) || 15, 
      shippingFee: shippingFee, 
      matchedAddress: data.display_name
    });

  } catch (error) {
    return NextResponse.json({ success: false, error: 'Internal breakdown.' });
  }
}
