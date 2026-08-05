import { useState } from 'react';
import { X, ShoppingCart, Check } from 'lucide-react';
import { useCart } from '../lib/CartContext';

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
  product_images: ProductImage[];
}

export default function ProductDetailModal({ product, onClose }: { product: Product; onClose: () => void }) {
  const { addItem, isInCart } = useCart();
  const sortedImages = [...product.product_images].sort((a, b) => a.display_order - b.display_order);
  const [activeImage, setActiveImage] = useState(sortedImages[0]?.image_url || null);
  const inCart = isInCart(product.id);

  function handleAddToCart() {
    addItem({
      productId: product.id,
      title: product.title,
      price: product.price,
      standardSize: product.standard_size,
      saSize: product.sa_size,
      condition: product.condition,
      coverImage: activeImage,
    });
  }

  return (
    <div className="fixed inset-0 bg-black/50 z-[60] flex items-center justify-center p-4">
      <div className="bg-white rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-4 border-b sticky top-0 bg-white z-10">
          <h3 className="font-bold text-base truncate pr-4">{product.title}</h3>
          <button onClick={onClose} className="flex-shrink-0">
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-4">
          <div>
            <div className="h-64 sm:h-80 bg-gray-100 rounded-lg overflow-hidden flex items-center justify-center">
              {activeImage ? (
                <img src={activeImage} alt={product.title} className="w-full h-full object-cover" />
              ) : (
                <span className="text-xs text-gray-400">No photo yet</span>
              )}
            </div>
            {sortedImages.length > 1 && (
              <div className="flex gap-2 mt-2 overflow-x-auto">
                {sortedImages.map((img, i) => (
                  <button
                    key={i}
                    onClick={() => setActiveImage(img.image_url)}
                    className={`w-14 h-14 rounded-lg overflow-hidden flex-shrink-0 border-2 ${
                      activeImage === img.image_url ? 'border-black' : 'border-transparent'
                    }`}
                  >
                    <img src={img.image_url} alt="" className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="flex flex-col">
            <span className="inline-block w-fit text-xs bg-gray-100 px-2 py-0.5 rounded font-semibold text-gray-700 mb-2">
              {product.condition}
            </span>
            <p className="text-sm text-gray-600 mb-1">
              Size: <span className="font-medium text-gray-900">{product.standard_size}</span>
              {product.sa_size !== 'N/A' && <span className="text-gray-500"> (SA {product.sa_size})</span>}
            </p>
            {product.description && <p className="text-sm text-gray-600 mt-2 mb-4 whitespace-pre-line">{product.description}</p>}

            <div className="mt-auto pt-4">
              <p className="font-black text-2xl mb-3">R{product.price.toFixed(2)}</p>
              <button
                onClick={handleAddToCart}
                disabled={inCart}
                className={`w-full py-2.5 rounded-lg font-medium text-sm transition-colors flex items-center justify-center gap-2 ${
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
              <p className="text-[11px] text-gray-400 mt-2 text-center">Delivery fee excluded — confirmed at checkout.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}