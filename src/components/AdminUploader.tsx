import { useState } from 'react';
import { supabase } from '../lib/supabase';
import { Upload, PlusCircle, CheckCircle2, AlertCircle, X } from 'lucide-react';
import { STANDARD_SIZES, SA_SIZES, CONDITIONS } from '../lib/constants';
import { useCategories } from '../lib/useCategories';
import ImageCropModal from './ImageCropModal';

export default function AdminUploader({ onProductAdded }: { onProductAdded: () => void }) {
  const { categories, subcategories } = useCategories();

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [price, setPrice] = useState('');
  const [condition, setCondition] = useState('Excellent');
  const [standardSize, setStandardSize] = useState('M');
  const [saSize, setSaSize] = useState('32');
  const [fabricComposition, setFabricComposition] = useState('');
  const [careInstructions, setCareInstructions] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [subcategoryId, setSubcategoryId] = useState('');
  const [imageFiles, setImageFiles] = useState<File[]>([]);
  const [cropQueue, setCropQueue] = useState<File[]>([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  const filteredSubcategories = subcategories.filter((s) => s.category_id === categoryId);

  function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
    if (!e.target.files) return;
    const remainingSlots = Math.max(0, 6 - imageFiles.length - cropQueue.length);
    const newFiles = Array.from(e.target.files).slice(0, remainingSlots);
    setCropQueue((prev) => [...prev, ...newFiles]);
    e.target.value = '';
  }

  function removeImage(index: number) {
    setImageFiles((prev) => prev.filter((_, i) => i !== index));
  }

  async function handleCreateProduct(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setMessage(null);

    try {
      if (!title || !price) {
        throw new Error('Please fill in at least the title and price.');
      }

      const { data: productData, error: insertError } = await supabase
        .from('products')
        .insert([
          {
            title,
            description,
            price: parseFloat(price),
            condition,
            standard_size: standardSize,
            sa_size: saSize,
            fabric_composition: fabricComposition || null,
            care_instructions: careInstructions || null,
            subcategory_id: subcategoryId || null,
            status: 'available',
          },
        ])
        .select()
        .single();

      if (insertError) throw insertError;
      const productId = productData.id;

      for (let i = 0; i < imageFiles.length; i++) {
        const file = imageFiles[i];
        const fileExt = file.name.split('.').pop();
        const filePath = `${productId}/${Math.random()}.${fileExt}`;

        const { error: uploadError } = await supabase.storage.from('product-images').upload(filePath, file);
        if (uploadError) throw uploadError;

        const { data: publicUrlData } = supabase.storage.from('product-images').getPublicUrl(filePath);

        const { error: imageInsertError } = await supabase.from('product_images').insert([
          {
            product_id: productId,
            image_url: publicUrlData.publicUrl,
            is_primary: i === 0,
            display_order: i,
          },
        ]);

        if (imageInsertError) throw imageInsertError;
      }

      setMessage({ text: 'Product added successfully!', type: 'success' });
      setTitle('');
      setDescription('');
      setPrice('');
      setFabricComposition('');
      setCareInstructions('');
      setCategoryId('');
      setSubcategoryId('');
      setImageFiles([]);
      onProductAdded();
    } catch (err: any) {
      setMessage({ text: err.message || 'Failed to add product', type: 'error' });
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm max-w-xl mx-auto my-8">
      <div className="flex items-center gap-2 mb-4 border-b pb-3">
        <PlusCircle className="w-5 h-5 text-black" />
        <h3 className="font-bold text-base">Add New Drop (Admin Panel)</h3>
      </div>

      {message && (
        <div
          className={`p-3 mb-4 rounded-lg text-xs flex items-center gap-2 ${
            message.type === 'success'
              ? 'bg-green-50 text-green-800 border border-green-200'
              : 'bg-red-50 text-red-800 border border-red-200'
          }`}
        >
          {message.type === 'success' ? <CheckCircle2 className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
          {message.text}
        </div>
      )}

      <form onSubmit={handleCreateProduct} className="space-y-4">
        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider text-gray-600 mb-1">Item Title</label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="e.g. Heavyweight Oversized Hoodie"
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-black"
            required
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
              placeholder="350.00"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-black"
              required
            />
          </div>
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-gray-600 mb-1">Condition</label>
            <select
              value={condition}
              onChange={(e) => setCondition(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white focus:outline-black"
            >
              {CONDITIONS.map((c) => (
                <option key={c} value={c}>
                  {c === 'NWT' ? 'New With Tags (NWT)' : c}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-gray-600 mb-1">Standard Size</label>
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
            <label className="block text-xs font-semibold uppercase tracking-wider text-gray-600 mb-1">SA Numeric Size</label>
            <select
              value={saSize}
              onChange={(e) => setSaSize(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white focus:outline-black"
            >
              {SA_SIZES.map((s) => (
                <option key={s} value={s}>
                  {s === 'N/A' ? 'N/A (Tops/Hoodies)' : `Size ${s}`}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider text-gray-600 mb-1">
            Description / Measurements
          </label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Pit-to-pit: 54cm, Length: 71cm."
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
          <label className="block text-xs font-semibold uppercase tracking-wider text-gray-600 mb-1">
            Product Photos (up to 6, first photo = cover image)
          </label>
          <input
            type="file"
            accept="image/*"
            multiple
            onChange={handleFileSelect}
            className="w-full text-xs text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-black file:text-white hover:file:bg-gray-800"
          />
          <p className="text-[11px] text-gray-400 mt-1">Each photo opens a crop step so you can see exactly how it'll look before it's added.</p>

          {imageFiles.length > 0 && (
            <div className="grid grid-cols-3 gap-2 mt-3">
              {imageFiles.map((file, index) => (
                <div key={index} className="relative group">
                  <img
                    src={URL.createObjectURL(file)}
                    alt={`preview-${index}`}
                    className="w-full aspect-square object-cover rounded-lg border border-gray-200"
                  />
                  {index === 0 && (
                    <span className="absolute bottom-1 left-1 bg-black text-white text-[10px] px-1.5 py-0.5 rounded">
                      Cover
                    </span>
                  )}
                  <button
                    type="button"
                    onClick={() => removeImage(index)}
                    className="absolute -top-1.5 -right-1.5 bg-red-500 text-white rounded-full p-0.5 opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-black text-white py-2.5 rounded-lg font-medium text-sm hover:bg-gray-800 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
        >
          <Upload className="w-4 h-4" />
          {loading ? 'Publishing Drop...' : 'Publish to Snowy\'s Thrift Store'}
        </button>
      </form>

      {cropQueue.length > 0 && (
        <ImageCropModal
          file={cropQueue[0]}
          onCancel={() => setCropQueue((prev) => prev.slice(1))}
          onCropped={(blob) => {
            const original = cropQueue[0];
            const croppedFile = new File([blob], original.name.replace(/\.[^.]+$/, '') + '.jpg', {
              type: 'image/jpeg',
            });
            setImageFiles((prev) => [...prev, croppedFile].slice(0, 6));
            setCropQueue((prev) => prev.slice(1));
          }}
        />
      )}
    </div>
  );
}