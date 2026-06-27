import { NextResponse } from 'next/server';

// Coordinates for Ikeja, Lagos (Your Business Base Hub)
const IKEJA_LAT = 6.5920;
const IKEJA_LON = 3.3422;

// Haversine Formula: Calculates absolute distance across the Earth's curve in KM
function calculateDistance(lat1, lon1, lat2, lon2) {
  const R = 6371; // Earth's radius in kilometers
  const dLat = (lat2 - lat1) * (Math.PI / 180);
  const dLon = (lon2 - lon1) * (Math.PI / 180);
  
  const a = 
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * (Math.PI / 180)) * Math.cos(lat2 * (Math.PI / 180)) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
    
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c; // Returns distance in Kilometers
}

export async function POST(request) {
  try {
    const { address } = await request.json();

    if (!address || address.trim() === '') {
      return NextResponse.json({ error: 'Address is required' }, { status: 400 });
    }

    // Append "Nigeria" to ensure the satellite searches only within the country
    const searchQuery = `${address}, Nigeria`;
    const geoUrl = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(searchQuery)}&limit=1`;

    // Because this runs on the server, we can legally pass the User-Agent header without browser blocks!
    const response = await fetch(geoUrl, {
      headers: {
        'User-Agent': 'Sikamore-Luxury-ECommerce-Platform',
        'Accept-Language': 'en'
      }
    });

    const data = await response.json();

    if (!data || data.length === 0) {
      return NextResponse.json({ 
        success: false, 
        error: 'Location not recognized. Please check the spelling or add a nearby landmark.' 
      });
    }

    // Extract latitude and longitude of the buyer's destination
    const destinationLat = parseFloat(data.lat);
    const destinationLon = parseFloat(data.lon);

    // Calculate distance from Ikeja
    const distanceInKm = calculateDistance(IKEJA_LAT, IKEJA_LON, destinationLat, destinationLon);

    // --- NIGERIAN SHIPPING PRICING TIERS ---
    let shippingFee = 0;
    
    if (distanceInKm <= 25) {
      // Mainland Local (Close to Ikeja)
      shippingFee = 2500; 
    } else if (distanceInKm <= 60) {
      // Island / Lagos Fringes (Lekki, Ajah, Badagry)
      shippingFee = 4000;
    } else if (distanceInKm <= 250) {
      // South-West Regional (Ogun, Ibadan, Oyo, Osun)
      shippingFee = 5500;
    } else if (distanceInKm <= 600) {
      // Mid-Distance / East / South-South (Edo, Enugu, Port Harcourt)
      shippingFee = 7000;
    } else {
      // Long Distance / Northern Regions (Abuja, Kaduna, Kano, Maiduguri)
      shippingFee = 8500;
    }

    return NextResponse.json({
      success: true,
      distanceKm: Math.round(distanceInKm),
      shippingFee: shippingFee,
      matchedAddress: data.display_name
    });

  } catch (error) {
    console.error('Shipping calculation error:', error);
    return NextResponse.json({ error: 'Internal calculation breakdown' }, { status: 500 });
  }
}
