export default function Navbar() {
  return (
    <nav className="bg-black text-white px-8 py-5 flex justify-between items-center sticky top-0 z-50">
      <div className="flex gap-6 text-xs tracking-[0.2em] font-light text-gray-300 hidden md:flex">
        <a href="/shop" className="hover:text-white transition-colors">SHOP ALL</a>
        <a href="#" className="hover:text-white transition-colors">COLLECTIONS</a>
      </div>

      <div className="absolute left-1/2 transform -translate-x-1/2">
        <a href="/">
          <img src="/logo.jpg" alt="S. SIKAMÒRE Logo" className="h-10 w-auto object-contain" />
          <span className="sr-only">S. SIKAMÒRE</span>
        </a>
      </div>

      <div className="flex items-center gap-6 text-xs tracking-[0.2em] font-light text-gray-300">
        <a href="/admin" className="hover:text-black hover:bg-white text-[10px] border border-gray-600 px-3 py-1 transition-all">DASHBOARD</a>
        <span className="hover:text-white cursor-pointer transition-colors">CART (0)</span>
      </div>
    </nav>
  );
}
