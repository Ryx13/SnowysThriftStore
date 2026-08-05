import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { Pencil, Package } from 'lucide-react';
import EditProductModal from './EditProductModal';

interface ProductImage {
  id: string;
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
  status: string;
  fabric_composition: string | null;
  care_instructions: string | null;
  subcategory_id: string | null;
  product_images: ProductImage[];
}

function getCoverImage(images: ProductImage[]): string | null {
  if (!images || images.length === 0) return null;
  const primary = images.find((img) => img.is_primary);
  return primary ? primary.image_url : images[0].image_url;
}

const statusStyles: Record<string, string> = {
  available: 'bg-green-100 text-green-700',
  reserved: 'bg-amber-100 text-amber-700',
  sold: 'bg-gray-200 text-gray-600',
};

export default function AdminInventory() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);

  async function fetchAllProducts() {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('products')
        .select('*, product_images(id, image_url, is_primary, display_order)')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setProducts((data as Product[]) || []);
    } catch (err) {
      console.error('Error fetching inventory:', err);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchAllProducts();
  }, []);

  if (loading) return <p className="text-gray-500 text-center py-12">Loading inventory...</p>;

  return (
    <div className="max-w-5xl mx-auto px-6 py-8">
      <h3 className="text-lg font-bold mb-6 border-b pb-2 flex items-center gap-2">
        <Package className="w-5 h-5" /> Manage Inventory ({products.length})
      </h3>

      {products.length === 0 ? (
        <p className="text-gray-500 text-center py-12">No products yet. Add one from the Admin Uploader.</p>
      ) : (
        <div className="space-y-3">
          {products.map((product) => {
            const cover = getCoverImage(product.product_images);
            return (
              <div
                key={product.id}
                className="bg-white border border-gray-200 rounded-xl p-3 flex items-center gap-4 hover:shadow-sm transition-shadow"
              >
                <div className="w-16 h-16 bg-gray-100 rounded-lg overflow-hidden flex-shrink-0">
                  {cover ? (
                    <img src={cover} alt={product.title} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-[10px] text-gray-400">No photo</div>
                  )}
                </div>

                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-sm truncate">{product.title}</p>
                  <p className="text-xs text-gray-500">
                    {product.standard_size} {product.sa_size !== 'N/A' ? `(SA ${product.sa_size})` : ''} · {product.condition}
                  </p>
                </div>

                <span className="font-bold text-sm whitespace-nowrap">R{product.price.toFixed(2)}</span>

                <span
                  className={`text-xs px-2 py-1 rounded-full font-medium capitalize whitespace-nowrap ${
                    statusStyles[product.status] || 'bg-gray-100 text-gray-600'
                  }`}
                >
                  {product.status}
                </span>

                <button
                  onClick={() => setEditingProduct(product)}
                  className="px-3 py-1.5 rounded-lg text-xs font-medium bg-gray-100 hover:bg-gray-200 flex items-center gap-1.5 flex-shrink-0"
                >
                  <Pencil className="w-3.5 h-3.5" /> Edit
                </button>
              </div>
            );
          })}
        </div>
      )}

      {editingProduct && (
        <EditProductModal
          product={editingProduct}
          onClose={() => setEditingProduct(null)}
          onSaved={() => {
            fetchAllProducts();
            setEditingProduct(null);
          }}
        />
      )}
    </div>
  );
}