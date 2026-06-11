export default function ProductCard({ product }) {
  return (
    <div className="group relative flex flex-col cursor-pointer">
      <div className="relative aspect-[3/4] w-full bg-gray-50 overflow-hidden mb-4">
        <img 
          src={product.image} 
          alt={product.name} 
          className="w-full h-full object-cover object-center transition-transform duration-700 ease-out group-hover:scale-105" 
        />
        
        {/* Sold Out Badge */}
        {product.isSoldOut && (
          <div className="absolute top-4 left-4 bg-black text-white text-[10px] tracking-widest px-3 py-1 font-medium rounded-sm uppercase">
            Sold Out
          </div>
        )}
        
        {/* Hover Action Buttons */}
        <div className="absolute inset-x-0 bottom-0 p-4 translate-y-4 opacity-0 transition-all duration-300 group-hover:translate-y-0 group-hover:opacity-100 bg-gradient-to-t from-black/20 to-transparent flex gap-2">
          <button className="flex-1 bg-black text-white text-xs tracking-widest py-3 uppercase hover:bg-gray-800 transition-colors disabled:opacity-50" disabled={product.isSoldOut}>
            {product.isSoldOut ? 'Unavailable' : 'Quick Add'}
          </button>
        </div>
      </div>
      
      {/* Product Details */}
      <div className="flex flex-col text-center mt-2">
        <h3 className="text-xs tracking-[0.15em] font-medium text-gray-900 mb-1">{product.name}</h3>
        <p className="text-xs text-gray-600 tracking-wider">₦{product.price.toLocaleString()}</p>
      </div>
    </div>
  );
}
