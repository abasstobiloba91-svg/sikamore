import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET(request) {
  const country = request.headers.get('x-vercel-ip-country') || '';
  const continent = request.headers.get('x-vercel-ip-continent') || '';

  return NextResponse.json({
    country_code: country,
    continent_code: continent,
  });
}
