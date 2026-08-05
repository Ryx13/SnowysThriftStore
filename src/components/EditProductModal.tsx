import { useState } from 'react';
import { supabase } from '../lib/supabase';
import { X, Save, Star, Trash2, AlertCircle, CheckCircle2 } from 'lucide-react';
import { STANDARD_SIZES, SA_SIZES, CONDITIONS } from '../lib/constants';
import { useCategories } from '../lib/useCategories';
import { deleteStorageFiles } from '../lib/storage';

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

export default function EditProductModal({
  product,
  onClose,
  onSaved,
}: {
  product: Product;
  onClose: () => void;
  onSaved: () => void;
}) {
  const { categories, subcategories } = useCategories();

  const initialSub = subcategories.find((s) => s.id === product.subcategory_id);

  const [title, setTitle] = useState(product.title);
  const [description, setDescription] = useState(product.description || '');
  const [price, setPrice] = useState(String(product.price));
  const [condition, setCondition] = useState(product.condition);
  const [standardSize, setStandardSize] = useState(product.standard_size);
  const [saSize, setSaSize] = useState(product.sa_size);
  const [status, setStatus] = useState(product.status);
  const [fabricComposition, setFabricComposition] = useState(product.fabric_composition || '');
  const [careInstructions, setCareInstructions] = useState(product.care_instructions || '');
  const [categoryId, setCategoryId] = useState(initialSub?.category_id || '');
  const [subcategoryId, setSubcategoryId] = useState(product.subcategory_id || '');
  const [images, setImages] = useState<ProductImage[]>(
    [...product.product_images].sort((a, b) => a.display_order - b.display_order)
  );
  const [newFiles, setNewFiles] = useState<File[]>([]);
  const [loading, setLoading] = useState(false);
  const [deletingImageId, setDeletingImageId] = useState<string | null>(null);
  const [message, setMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  const filteredSubcategories = subcategories.filter((s) => s.category_id === categoryId);

  function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
    if (!e.target.files) return;
    setNewFiles((prev) => [...prev, ...Array.from(e.target.files!)].slice(0, 6));
    e.target.value = '';
  }

  async function handleSetPrimary(imageId: string) {
    try {
      await supabase.from('product_images').update({ is_primary: false }).eq('product_id', product.id);
      await supabase.from('product_images').update({ is_primary: true }).eq('id', imageId);
      setImages((prev) => prev.map((img) => ({ ...img, is_primary: img.id === imageId })));
    } catch (err) {
      console.error('Error setting primary image:', err);
    }
  }

  async function handleDeleteImage(image: ProductImage) {
    setDeletingImageId(image.id);
    try {
      // Delete the actual file from Storage first, then the DB row
      await deleteStorageFiles([image.image_url]);
      const { error } = await supabase.from('product_images').delete().eq('id', image.id);
      if (error) throw error;
      setImages((prev) => prev.filter((img) => img.id !== image.id));
    } catch (err) {
      console.error('Error deleting image:', err);
    } finally {
      setDeletingImageId(null);
    }
  }

  async function handleSave() {
    setLoading(true);
    setMessage(null);
    try {
      if (!title || !price) throw new Error('Title and price are required.');

      const { error: updateError } = await supabase
        .from('products')
        .update({
          title,
          description,
          price: parseFloat(price),
          condition,
          standard_size: standardSize,
          sa_size: saSize,
          status,
          fabric_composition: fabricComposition || null,
          care_instructions: careInstructions || null,
          subcategory_id: subcategoryId || null,
        })
        .eq('id', product.id);

      if (updateError) throw updateError;

      const hasExistingImages = images.length > 0;
      for (let i = 0; i < newFiles.length; i++) {
        const file = newFiles[i];
        const fileExt = file.name.split('.').pop();
        const filePath = `${product.id}/${Math.random()}.${fileExt}`;

        const { error: uploadError } = await supabase.storage.from('product-images').upload(filePath, file);
        if (uploadError) throw uploadError;

        const { data: publicUrlData } = supabase.storage.from('product-images').getPublicUrl(filePath);

        await supabase.from('product_images').insert([
          {
            product_id: product.id,
            image_url: publicUrlData.publicUrl,
            is_primary: !hasExistingImages && i === 0,
            display_order: images.length + i,
          },
        ]);
      }

      setMessage({ text: 'Saved successfully!', type: 'success' });
      setNewFiles([]);
      onSaved();
    } catch (err: any) {
      setMessage({ text: err.message || 'Failed to save changes', type: 'error' });
    } finally {
      setLoading(false);
    }
  }

  async function handleDeleteProduct() {
    if (!window.confirm(`Delete "${product.title}" permanently? This cannot be undone.`)) return;
    setLoading(true);
    try {
      // Clean up every photo file in Storage before removing the DB rows
      await deleteStorageFiles(images.map((img) => img.image_url));

      const { error } = await supabase.from('products').delete().eq('id', product.id);
      if (error) throw error;
      onSaved();
      onClose();
    } catch (err: any) {
      setMessage({ text: err.message || 'Failed to delete product', type: 'error' });
      setLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 z-[60] flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl max-w-xl w-full max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-4 border-b sticky top-0 bg-white z-10">
          <h3 className="font-bold text-base">Edit Product</h3>
          <button onClick={onClose}>
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        <div className="p-4 space-y-4">
          {message && (
            <div
              className={`p-3 rounded-lg text-xs flex items-center gap-2 ${
                message.type === 'success'
                  ? 'bg-green-50 text-green-800 border border-green-200'
                  : 'bg-red-50 text-red-800 border border-red-200'
              }`}
            >
              {message.type === 'success' ? <CheckCircle2 className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
              {message.text}
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-gray-600 mb-1">Item Title</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-black"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-gray-600 mb-1">Category</label>
              <select
                value={categoryId}
                onChange={(e) => {
                  setCategoryId(e.target.value);
                  setSubcategoryId('');
                }}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white focus:outline-black"
              >
                <option value="">Select category...</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-gray-600 mb-1">Subcategory</label>
              <select
                value={subcategoryId}
                onChange={(e) => setSubcategoryId(e.target.value)}
                disabled={!categoryId}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white focus:outline-black disabled:bg-gray-50 disabled:text-gray-400"
              >
                <option value="">Select subcategory...</option>
                {filteredSubcategories.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-gray-600 mb-1">Price (R)</label>
              <input
                type="number"
                step="0.01"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-black"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-gray-600 mb-1">Status</label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white focus:outline-black"
              >
                <option value="available">Available</option>
                <option value="reserved">Reserved</option>
                <option value="sold">Sold</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-gray-600 mb-1">Condition</label>
              <select
                value={condition}
                onChange={(e) => setCondition(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white focus:outline-black"
              >
                {CONDITIONS.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-gray-600 mb-1">Std Size</label>
              <select
                value={standardSize}
                onChange={(e) => setStandardSize(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white focus:outline-black"
              >
                {STANDARD_SIZES.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-gray-600 mb-1">SA Size</label>
              <select
                value={saSize}
                onChange={(e) => setSaSize(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white focus:outline-black"
              >
                {SA_SIZES.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-gray-600 mb-1">Description</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={2}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-black"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-gray-600 mb-1">
                Fabric Composition
              </label>
              <input
                type="text"
                value={fabricComposition}
                onChange={(e) => setFabricComposition(e.target.value)}
                placeholder="e.g. 100% Cotton"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-black"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-gray-600 mb-1">
                Care Instructions
              </label>
              <input
                type="text"
                value={careInstructions}
                onChange={(e) => setCareInstructions(e.target.value)}
                placeholder="e.g. Machine wash cold"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-black"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-gray-600 mb-1">Photos</label>
            {images.length > 0 && (
              <div className="grid grid-cols-3 gap-2 mb-2">
                {images.map((img) => (
                  <div key={img.id} className="relative group">
                    <img src={img.image_url} alt="" className="w-full h-20 object-cover rounded-lg border border-gray-200" />
                    {img.is_primary && (
                      <span className="absolute bottom-1 left-1 bg-black text-white text-[10px] px-1.5 py-0.5 rounded">
                        Cover
                      </span>
                    )}
                    <div className="absolute top-1 right-1 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      {!img.is_primary && (
                        <button
                          type="button"
                          onClick={() => handleSetPrimary(img.id)}
                          title="Set as cover"
                          className="bg-white text-gray-700 rounded-full p-1 shadow"
                        >
                          <Star className="w-3 h-3" />
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={() => handleDeleteImage(img)}
                        disabled={deletingImageId === img.id}
                        title="Remove photo"
                        className="bg-red-500 text-white rounded-full p-1 shadow disabled:opacity-50"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            <input
              type="file"
              accept="image/*"
              multiple
              onChange={handleFileSelect}
              className="w-full text-xs text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-black file:text-white hover:file:bg-gray-800"
            />
            {newFiles.length > 0 && (
              <div className="grid grid-cols-3 gap-2 mt-2">
                {newFiles.map((file, index) => (
                  <img
                    key={index}
                    src={URL.createObjectURL(file)}
                    alt=""
                    className="w-full h-20 object-cover rounded-lg border border-dashed border-gray-300"
                  />
                ))}
              </div>
            )}
          </div>

          <div className="flex gap-2 pt-2">
            <button
              onClick={handleSave}
              disabled={loading}
              className="flex-1 bg-black text-white py-2.5 rounded-lg font-medium text-sm hover:bg-gray-800 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
            >
              <Save className="w-4 h-4" />
              {loading ? 'Saving...' : 'Save Changes'}
            </button>
            <button
              onClick={handleDeleteProduct}
              disabled={loading}
              className="px-4 py-2.5 rounded-lg font-medium text-sm bg-red-50 text-red-600 hover:bg-red-100 transition-colors flex items-center gap-2"
            >
              <Trash2 className="w-4 h-4" /> Delete
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}