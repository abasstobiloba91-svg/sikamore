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
        error: 'Location not recognized. Please try a major Bus Stop or City.' 
      });
    }

    // Extract latitude and longitude of the buyer's destination
    const destinationLat = parseFloat(data.lat);
    const destinationLon = parseFloat(data.lon);

    // Calculate straight-line distance from Ikeja
    const straightLineDistance = calculateDistance(IKEJA_LAT, IKEJA_LON, destinationLat, destinationLon);

    // --- UBER / INDRIVE DYNAMIC PRICING ALGORITHM ---
    
    // Satellites measure straight through buildings. Cars have to navigate roads.
    // We multiply by 1.4 to convert satellite distance into accurate driving distance.
    const estimatedDrivingDistance = straightLineDistance * 1.4; 
    
    const BASE_FARE = 1500;   // The fixed cost to initiate a dispatch rider
    const PRICE_PER_KM = 200; // ₦200 per kilometer driven
    
    let shippingFee = BASE_FARE + (estimatedDrivingDistance * PRICE_PER_KM);

    // FAILSAFE: We cap the distance at 100km for the "Uber" style. 
    // If a customer orders from Abuja or Kano, a per-kilometer rider fee would be ₦150,000! 
    // For interstate orders (over 100km away), we switch to standard interstate waybill flat rates.
    if (estimatedDrivingDistance > 100) {
       if (estimatedDrivingDistance < 300) shippingFee = 5500;      // South West Interstate
       else if (estimatedDrivingDistance < 600) shippingFee = 7500; // East / South South
       else shippingFee = 9500;                                     // Far North
    } else {
       // Ensure there is a minimum delivery fee for extremely close places (e.g. 1km away)
       if (shippingFee < 2500) shippingFee = 2500;
    }

    return NextResponse.json({
      success: true,
      distanceKm: Math.round(estimatedDrivingDistance),
      // We round the final fee to the nearest 100 Naira so it looks clean (e.g., ₦3,400 instead of ₦3,432)
      shippingFee: Math.round(shippingFee / 100) * 100, 
      matchedAddress: data.display_name
    });

  } catch (error) {
    console.error('Shipping calculation error:', error);
    return NextResponse.json({ error: 'Internal calculation breakdown' }, { status: 500 });
  }
}
