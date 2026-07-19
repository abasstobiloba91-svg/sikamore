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

// THIS IS THE MAGIC THAT CREATES THE WHATSAPP PREVIEW FOR EACH PRODUCT
export async function generateMetadata({ params }) {
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
          url: primaryImage, // Automatically uses the exact product image!
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

export default async function ProductPage({ params }) {
  const supabase = createClient(supabaseUrl, supabaseAnonKey);
  const { data: product } = await supabase.from('products').select('*').eq('id', params.id).single();
  
  if (!product) {
    return <div className="min-h-screen flex items-center justify-center text-[10px] tracking-widest uppercase text-black bg-zinc-50">Piece not found in the archive.</div>;
  }

  return <ClientView product={product} />;
}
