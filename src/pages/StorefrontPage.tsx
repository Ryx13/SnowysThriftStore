import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { useCart } from '../lib/CartContext';
import { useCategories } from '../lib/useCategories';
import { ShieldCheck, ShoppingCart, Check, Search, X } from 'lucide-react';

interface ProductImage {
  image_url: string;
  is_primary: boolean;
  display_order: number;
}

interface Product {
  id: string;
  title: string;
  price: number;
  condition: string;
  standard_size: string;
  sa_size: string;
  status: string;
  description: string;
  subcategory_id: string | null;
  product_images: ProductImage[];
}

function getCoverImage(images: ProductImage[]): string | null {
  if (!images || images.length === 0) return null;
  const primary = images.find((img) => img.is_primary);
  return primary ? primary.image_url : images[0].image_url;
}

const TICKER_TEXT = 'ONE-OF-ONE PIECES  •  HAND-CHECKED CONDITION  •  THRIFTED WITH LOVE  •  PAXI DELIVERY NATIONWIDE  •  NEW DROPS WEEKLY  •  ';

export default function StorefrontPage() {
  const navigate = useNavigate();
  const { addItem, isInCart } = useCart();
  const { categories, subcategories } = useCategories();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(null);
  const [selectedSubcategoryId, setSelectedSubcategoryId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    fetchProducts();
  }, []);

  async function fetchProducts() {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('products')
        .select('*, product_images(image_url, is_primary, display_order)')
        .eq('status', 'available')
        .order('created_at', { ascending: false });

      if (error) throw error;
      if (data) setProducts(data as Product[]);
    } catch (err) {
      console.error('Error fetching products:', err);
    } finally {
      setLoading(false);
    }
  }

  function handleAddToCart(e: React.MouseEvent, product: Product) {
    e.stopPropagation();
    addItem({
      productId: product.id,
      title: product.title,
      price: product.price,
      standardSize: product.standard_size,
      saSize: product.sa_size,
      condition: product.condition,
      coverImage: getCoverImage(product.product_images),
    });
  }

  const visibleSubcategories = selectedCategoryId
    ? subcategories.filter((s) => s.category_id === selectedCategoryId)
    : [];

  const query = searchQuery.trim().toLowerCase();

  const filteredProducts = products.filter((p) => {
    if (query && !p.title.toLowerCase().includes(query) && !(p.description || '').toLowerCase().includes(query)) {
      return false;
    }
    if (selectedSubcategoryId) return p.subcategory_id === selectedSubcategoryId;
    if (selectedCategoryId) return visibleSubcategories.some((s) => s.id === p.subcategory_id);
    return true;
  });

  return (
    <>
      {/* Hero Banner */}
      <section className="bg-black text-white pt-14 sm:pt-16 pb-10 px-4 sm:px-6 text-center">
        <p className="text-[11px] sm:text-xs uppercase tracking-[0.2em] text-gray-400 font-semibold mb-3">
          100% Secondhand · 100% South African
        </p>
        <h2 className="text-3xl sm:text-5xl font-black tracking-tight mb-4 leading-tight">
          Someone's Closet.
          <br />
          Your Next Favorite Fit.
        </h2>
        <p className="text-gray-300 text-sm sm:text-base max-w-lg mx-auto">
          Every piece here is pre-loved, hand-checked, and one of one — once it's gone, it's gone for good.
          Snag it, chat with us, we'll get it to your nearest PAXI point.
        </p>
      </section>

      {/* Marquee ticker */}
      <div className="bg-white border-y border-gray-200 py-2 overflow-hidden">
        <div className="flex whitespace-nowrap animate-marquee">
          <span className="text-xs font-bold uppercase tracking-wider text-gray-800 px-2">
            {TICKER_TEXT.repeat(2)}
          </span>
          <span className="text-xs font-bold uppercase tracking-wider text-gray-800 px-2" aria-hidden="true">
            {TICKER_TEXT.repeat(2)}
          </span>
        </div>
      </div>

      {/* Search */}
      <div className="bg-white border-b border-gray-200 px-4 sm:px-6 py-3">
        <div className="max-w-6xl mx-auto relative">
          <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search for hoodies, jeans, sneakers..."
            className="w-full pl-9 pr-9 py-2.5 border border-gray-200 rounded-xl text-sm bg-gray-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-black transition-all"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* Category Filter Bar */}
      <div className="bg-white border-b border-gray-200 px-4 sm:px-6 py-3 sticky top-[57px] sm:top-[73px] z-30">
        <div className="max-w-6xl mx-auto">
          <div className="flex gap-2 overflow-x-auto pb-1">
            <button
              onClick={() => {
                setSelectedCategoryId(null);
                setSelectedSubcategoryId(null);
              }}
              className={`px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-colors ${
                !selectedCategoryId ? 'bg-black text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              All
            </button>
            {categories.map((cat) => (
              <button
                key={cat.id}
                onClick={() => {
                  setSelectedCategoryId(cat.id);
                  setSelectedSubcategoryId(null);
                }}
                className={`px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-colors ${
                  selectedCategoryId === cat.id ? 'bg-black text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {cat.name}
              </button>
            ))}
          </div>

          {visibleSubcategories.length > 0 && (
            <div className="flex gap-2 overflow-x-auto mt-2 pt-2 border-t border-gray-100">
              <button
                onClick={() => setSelectedSubcategoryId(null)}
                className={`px-3 py-1 rounded-full text-[11px] font-medium whitespace-nowrap transition-colors ${
                  !selectedSubcategoryId ? 'bg-gray-800 text-white' : 'bg-gray-50 text-gray-600 hover:bg-gray-100'
                }`}
              >
                All {categories.find((c) => c.id === selectedCategoryId)?.name}
              </button>
              {visibleSubcategories.map((sub) => (
                <button
                  key={sub.id}
                  onClick={() => setSelectedSubcategoryId(sub.id)}
                  className={`px-3 py-1 rounded-full text-[11px] font-medium whitespace-nowrap transition-colors ${
                    selectedSubcategoryId === sub.id ? 'bg-gray-800 text-white' : 'bg-gray-50 text-gray-600 hover:bg-gray-100'
                  }`}
                >
                  {sub.name}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Catalog Grid */}
      <main className="max-w-6xl mx-auto px-4 sm:px-6 py-8 sm:py-10">
        <h3 className="text-lg font-bold mb-6 border-b pb-2">
          {query ? `Results for "${searchQuery}"` : 'Available Drops'}
        </h3>

        {loading ? (
          <p className="text-gray-500 text-center py-12">Loading inventory from Supabase...</p>
        ) : filteredProducts.length === 0 ? (
          <div className="text-center py-16 bg-white rounded-2xl border border-dashed border-gray-300 p-8">
            <ShieldCheck className="w-12 h-12 text-gray-400 mx-auto mb-3" />
            <p className="text-gray-700 font-medium">
              {query ? 'No items match your search.' : 'No items match this filter yet.'}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 gap-3 sm:gap-6">
            {filteredProducts.map((product) => {
              const coverImage = getCoverImage(product.product_images);
              const inCart = isInCart(product.id);
              return (
                <div
                  key={product.id}
                  onClick={() => navigate(`/product/${product.id}`)}
                  className="bg-white rounded-xl sm:rounded-2xl border border-gray-200 overflow-hidden shadow-sm hover:shadow-lg transition-shadow cursor-pointer group relative"
                >
                  <div className="aspect-square bg-gray-100 flex items-center justify-center text-gray-400 text-xs overflow-hidden relative">
                    <span className="absolute top-2 left-2 z-10 bg-black text-white text-[9px] sm:text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded">
                      1 of 1
                    </span>
                    {coverImage ? (
                      <img
                        src={coverImage}
                        alt={product.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                    ) : (
                      '[No Photo Yet]'
                    )}
                  </div>
                  <div className="p-3 sm:p-4">
                    <div className="flex justify-between items-start mb-1 gap-2">
                      <h4 className="font-bold text-xs sm:text-sm truncate">{product.title}</h4>
                      <span className="text-[10px] sm:text-xs bg-gray-100 px-1.5 sm:px-2 py-0.5 rounded font-semibold text-gray-700 whitespace-nowrap">
                        {product.condition}
                      </span>
                    </div>
                    <p className="text-[11px] sm:text-xs text-gray-500 mb-2">
                      Size: {product.standard_size} {product.sa_size !== 'N/A' ? `(SA ${product.sa_size})` : ''}
                    </p>
                    <div className="flex justify-between items-center pt-2 border-t border-gray-100">
                      <span className="font-black text-sm sm:text-base">R{product.price.toFixed(2)}</span>
                      <button
                        onClick={(e) => handleAddToCart(e, product)}
                        disabled={inCart}
                        className={`text-[10px] sm:text-xs px-2 sm:px-3 py-1 sm:py-1.5 rounded-lg font-medium transition-colors flex items-center gap-1 ${
                          inCart ? 'bg-green-100 text-green-700' : 'bg-black text-white hover:bg-gray-800'
                        }`}
                      >
                        {inCart ? (
                          <>
                            <Check className="w-3 h-3" /> <span className="hidden sm:inline">In Cart</span>
                          </>
                        ) : (
                          <>
                            <ShoppingCart className="w-3 h-3" /> <span className="hidden sm:inline">Add</span>
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>
    </>
  );
}