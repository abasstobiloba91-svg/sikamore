import './globals.css';
import { AppProvider } from './providers';

export const metadata = {
  title: 'S. SIKAMÒRE | Official Store',
  description: 'Finely crafted for audacious women who carry light and purpose.',
  
  // Open Graph (WhatsApp, Instagram, iMessage, Facebook)
  openGraph: {
    title: 'S. SIKAMÒRE | Official Store',
    description: 'Finely crafted for audacious women who carry light and purpose.',
    url: 'https://ssikamore.com',
    siteName: 'S. SIKAMÒRE',
    images: [
      {
        url: '/client-logo.jpeg',
        width: 1200,
        height: 630,
        alt: 'S. SIKAMÒRE Luxury Brand Preview',
      },
    ],
    locale: 'en_US',
    type: 'website',
  },

  // Twitter / X Previews
  twitter: {
    card: 'summary_large_image',
    title: 'S. SIKAMÒRE | Official Store',
    description: 'Finely crafted for audacious women who carry light and purpose.',
    images: ['/client-logo.jpeg'],
  },

  // Browser Icons
  icons: {
    icon: '/favicon.ico',
    apple: '/apple-touch-icon.png', 
  },
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
        <AppProvider>
          {children}
        </AppProvider>
      </body>
    </html>
  );
}
