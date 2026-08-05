import { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { useCart } from '../lib/CartContext';
import {
  ChevronRight,
  ShoppingCart,
  Check,
  ArrowLeft,
  Shirt,
  Sparkles,
  Truck,
  RotateCcw,
  Ruler,
} from 'lucide-react';

interface ProductImage {
  image_url: string;
  is_primary: boolean;
  display_order: number;
}

interface Product {
  id: string;
  title: string;
  description: string;
  price: number;
  condition: string;
  standard_size: string;
  sa_size: string;
  fabric_composition: string | null;
  care_instructions: string | null;
  subcategory_id: string | null;
  product_images: ProductImage[];
  subcategories: { id: string; name: string; categories: { id: string; name: string } | null } | null;
}

interface RelatedProduct {
  id: string;
  title: string;
  price: number;
  product_images: ProductImage[];
}

function getCoverImage(images: ProductImage[]): string | null {
  if (!images || images.length === 0) return null;
  const primary = images.find((img) => img.is_primary);
  return primary ? primary.image_url : images[0].image_url;
}

export default function ProductPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { addItem, isInCart } = useCart();
  const [product, setProduct] = useState<Product | null>(null);
  const [related, setRelated] = useState<RelatedProduct[]>([]);
  const [activeImage, setActiveImage] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    async function fetchProduct() {
      setLoading(true);
      setNotFound(false);
      try {
        const { data, error } = await supabase
          .from('products')
          .select(
            '*, product_images(image_url, is_primary, display_order), subcategories(id, name, categories(id, name))'
          )
          .eq('id', id)
          .single();

        if (error || !data) {
          setNotFound(true);
          return;
        }

        setProduct(data as unknown as Product);
        const sorted = [...(data.product_images as ProductImage[])].sort((a, b) => a.display_order - b.display_order);
        setActiveImage(sorted[0]?.image_url || null);

        // Fetch related products from the same subcategory
        if (data.subcategory_id) {
          const { data: relatedData } = await supabase
            .from('products')
            .select('id, title, price, product_images(image_url, is_primary, display_order)')
            .eq('subcategory_id', data.subcategory_id)
            .eq('status', 'available')
            .neq('id', data.id)
            .limit(4);

          setRelated((relatedData as RelatedProduct[]) || []);
        } else {
          setRelated([]);
        }
      } catch (err) {
        console.error('Error fetching product:', err);
        setNotFound(true);
      } finally {
        setLoading(false);
      }
    }

    if (id) fetchProduct();
    window.scrollTo(0, 0);
  }, [id]);

  if (loading) {
    return <div className="max-w-6xl mx-auto px-6 py-16 text-center text-gray-500">Loading item...</div>;
  }

  if (notFound || !product) {
    return (
      <div className="max-w-6xl mx-auto px-6 py-16 text-center">
        <p className="text-gray-700 font-medium mb-4">This item couldn't be found — it may have already sold.</p>
        <button onClick={() => navigate('/')} className="px-4 py-2 bg-black text-white text-xs font-semibold rounded-lg">
          Back to Storefront
        </button>
      </div>
    );
  }

  const sortedImages = [...product.product_images].sort((a, b) => a.display_order - b.display_order);
  const inCart = isInCart(product.id);
  const categoryName = product.subcategories?.categories?.name;
  const subcategoryName = product.subcategories?.name;

  function handleAddToCart() {
    addItem({
      productId: product!.id,
      title: product!.title,
      price: product!.price,
      standardSize: product!.standard_size,
      saSize: product!.sa_size,
      condition: product!.condition,
      coverImage: activeImage,
    });
  }

  return (
    <main className="max-w-6xl mx-auto px-6 py-8">
      {/* Breadcrumb */}
      <div className="flex items-center gap-1.5 text-xs text-gray-500 mb-6 flex-wrap">
        <Link to="/" className="hover:underline flex items-center gap-1">
          <ArrowLeft className="w-3 h-3" /> Storefront
        </Link>
        {categoryName && (
          <>
            <ChevronRight className="w-3 h-3" />
            <span>{categoryName}</span>
          </>
        )}
        {subcategoryName && (
          <>
            <ChevronRight className="w-3 h-3" />
            <span>{subcategoryName}</span>
          </>
        )}
        <ChevronRight className="w-3 h-3" />
        <span className="text-gray-900 font-medium truncate">{product.title}</span>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
        {/* Gallery */}
        <div>
          <div className="aspect-square bg-gray-100 rounded-xl overflow-hidden flex items-center justify-center">
            {activeImage ? (
              <img src={activeImage} alt={product.title} className="w-full h-full object-cover" />
            ) : (
              <span className="text-sm text-gray-400">No photo yet</span>
            )}
          </div>
          {sortedImages.length > 1 && (
            <div className="flex gap-2 mt-3 overflow-x-auto">
              {sortedImages.map((img, i) => (
                <button
                  key={i}
                  onClick={() => setActiveImage(img.image_url)}
                  className={`w-16 h-16 rounded-lg overflow-hidden flex-shrink-0 border-2 ${
                    activeImage === img.image_url ? 'border-black' : 'border-transparent'
                  }`}
                >
                  <img src={img.image_url} alt="" className="w-full h-full object-cover" />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Info */}
        <div>
          <span className="inline-block text-xs bg-gray-100 px-2 py-0.5 rounded font-semibold text-gray-700 mb-3">
            {product.condition}
          </span>
          <h1 className="text-2xl font-black tracking-tight mb-2">{product.title}</h1>
          <p className="font-black text-3xl mb-4">R{product.price.toFixed(2)}</p>

          <div className="border-t border-gray-200 pt-4 mb-4">
            <p className="text-sm text-gray-700">
              <span className="font-semibold">Size:</span> {product.standard_size}
              {product.sa_size !== 'N/A' && <span className="text-gray-500"> (SA {product.sa_size})</span>}
            </p>
          </div>

          {product.description && (
            <div className="mb-4">
              <h3 className="text-xs font-bold uppercase tracking-wider text-gray-500 mb-1">Description</h3>
              <p className="text-sm text-gray-700 whitespace-pre-line">{product.description}</p>
            </div>
          )}

          {(product.fabric_composition || product.care_instructions) && (
            <div className="mb-6 bg-gray-50 border border-gray-200 rounded-lg p-4 space-y-2">
              <h3 className="text-xs font-bold uppercase tracking-wider text-gray-500 mb-2 flex items-center gap-1.5">
                <Shirt className="w-3.5 h-3.5" /> Material & Care
              </h3>
              {product.fabric_composition && (
                <p className="text-sm text-gray-700">
                  <span className="font-semibold">Fabric:</span> {product.fabric_composition}
                </p>
              )}
              {product.care_instructions && (
                <p className="text-sm text-gray-700 flex items-start gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 mt-0.5 flex-shrink-0 text-gray-400" />
                  {product.care_instructions}
                </p>
              )}
            </div>
          )}

          <button
            onClick={handleAddToCart}
            disabled={inCart}
            className={`w-full py-3 rounded-lg font-semibold text-sm transition-colors flex items-center justify-center gap-2 ${
              inCart ? 'bg-green-100 text-green-700' : 'bg-black text-white hover:bg-gray-800'
            }`}
          >
            {inCart ? (
              <>
                <Check className="w-4 h-4" /> In Cart
              </>
            ) : (
              <>
                <ShoppingCart className="w-4 h-4" /> Add to Cart
              </>
            )}
          </button>
          <p className="text-[11px] text-gray-400 mt-2 text-center">
            Delivery fee excluded — confirmed with the seller via WhatsApp/chat at checkout.
          </p>
        </div>
      </div>

      {/* Delivery, Returns & Sizing */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-12 pt-8 border-t border-gray-200">
        <div className="bg-white border border-gray-200 rounded-xl p-4">
          <div className="flex items-center gap-2 mb-1.5">
            <Truck className="w-4 h-4 text-gray-700" />
            <h4 className="text-sm font-bold">Shipping</h4>
          </div>
          <p className="text-xs text-gray-600">
            Delivered via PEP PAXI. Orders are dispatched within 48 hours of full payment (items + delivery fee) clearing.
          </p>
        </div>
        <div className="bg-white border border-gray-200 rounded-xl p-4">
          <div className="flex items-center gap-2 mb-1.5">
            <RotateCcw className="w-4 h-4 text-gray-700" />
            <h4 className="text-sm font-bold">Returns</h4>
          </div>
          <p className="text-xs text-gray-600">
            All sales are final. Returns are only accepted if the item received is significantly different from its
            description or photos.
          </p>
        </div>
        <div className="bg-white border border-gray-200 rounded-xl p-4">
          <div className="flex items-center gap-2 mb-1.5">
            <Ruler className="w-4 h-4 text-gray-700" />
            <h4 className="text-sm font-bold">Sizing</h4>
          </div>
          <p className="text-xs text-gray-600">
            Standard sizes are paired with SA numeric sizing where relevant. Message us on chat if you need exact
            measurements before buying.
          </p>
        </div>
      </div>

      {/* You Might Also Like */}
      {related.length > 0 && (
        <div className="mt-12 pt-8 border-t border-gray-200">
          <h3 className="text-lg font-bold mb-4">You Might Also Like</h3>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {related.map((item) => {
              const cover = getCoverImage(item.product_images);
              return (
                <div
                  key={item.id}
                  onClick={() => navigate(`/product/${item.id}`)}
                  className="bg-white rounded-lg border border-gray-200 overflow-hidden shadow-xs hover:shadow-md transition-shadow cursor-pointer"
                >
                  <div className="h-32 bg-gray-100 flex items-center justify-center text-gray-400 text-[10px] overflow-hidden">
                    {cover ? <img src={cover} alt={item.title} className="w-full h-full object-cover" /> : 'No Photo'}
                  </div>
                  <div className="p-2.5">
                    <p className="text-xs font-semibold truncate">{item.title}</p>
                    <p className="text-sm font-bold mt-0.5">R{item.price.toFixed(2)}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </main>
  );
}