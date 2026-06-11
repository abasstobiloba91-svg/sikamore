import './globals.css';
import Navbar from '../components/Navbar';

export const metadata = {
  title: 'S. SIKAMÒRE | Official Store',
  description: 'Premium Fashion Brand',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className="bg-white text-black antialiased">
        {/* The Navbar component is injected here automatically */}
        <Navbar />
        
        {/* The current page's content is injected here */}
        {children}
      </body>
    </html>
  );
}
