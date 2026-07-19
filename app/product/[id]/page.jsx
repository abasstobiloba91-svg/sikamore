export const dynamic = 'force-dynamic';

import { createClient } from '@supabase/supabase-js';
import ClientView from './ClientView';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

const extractCleanUrls = (payload) => {
  if (!payload) return [];
  try {
    let raw = JSON.stringify(payload);
    raw = raw.replace(/["'\[\]{}\s]/g, '');
    return raw.split(',').filter(u => u.startsWith('http'));
  } catch (e) {
    return [];
  }
};

// Generates the WhatsApp / Social Media Link Previews
export async function generateMetadata(props) {
  const params = await props.params; // Safely unpack the ID promise (Fixes Next.js bugs)
  const supabase = createClient(supabaseUrl, supabaseAnonKey);
  const { data: product } = await supabase.from('products').select('*').eq('id', params.id).single();
  
  if (!product) {
    return { title: 'Piece Not Found | S. SIKAMÒRE' };
  }

  const images = extractCleanUrls(product.image);
  const primaryImage = images.length > 0 ? images[0] : 'https://ssikamore.com/client-logo.jpeg';

  return {
    title: `${product.name} | S. SIKAMÒRE`,
    description: product.description || 'Discover this exclusive piece in the S. Sikamòre Archive.',
    openGraph: {
      title: `${product.name} | S. SIKAMÒRE`,
      description: product.description || 'Discover this exclusive piece in the S. Sikamòre Archive.',
      url: `https://ssikamore.com/product/${params.id}`,
      images: [
        {
          url: primaryImage,
          width: 1080,
          height: 1080,
          alt: product.name,
        },
      ],
      type: 'website',
    },
    twitter: {
      card: 'summary_large_image',
      title: `${product.name} | S. SIKAMÒRE`,
      description: product.description || 'Discover this exclusive piece in the S. Sikamòre Archive.',
      images: [primaryImage],
    },
  };
}

// Renders the actual page content
export default async function ProductPage(props) {
  const params = await props.params; // Safely unpack the ID promise
  const supabase = createClient(supabaseUrl, supabaseAnonKey);
  
  const { data: product } = await supabase
    .from('products')
    .select('*')
    .eq('id', params.id)
    .single();
  
  if (!product) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center text-[10px] tracking-widest uppercase text-black bg-zinc-50 gap-6">
        <p>Piece not found in the archive.</p>
        <a href="/shop" className="border border-black px-8 py-4 hover:bg-black hover:text-white transition-colors">
          Return to Collection
        </a>
      </div>
    );
  }

  return <ClientView product={product} />;
}
