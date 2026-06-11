import './globals.css';

export const metadata = {
  title: 'S. SIKAMÒRE | Official Store',
  description: 'Official Collection',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className="antialiased bg-white text-black">
        {children}
      </body>
    </html>
  );
}
