import './globals.css';
import { AppProvider } from './providers';

export const metadata = {
  title: 'S. SIKAMÒRE | Official Store',
  description: 'High-Fashion Textiles and Ready-To-Wear Luxury Archive',
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
