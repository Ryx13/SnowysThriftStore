import { useState } from 'react';
import { supabase } from '../lib/supabase';
import { useCategories } from '../lib/useCategories';
import { Tags, Plus, Trash2, ChevronDown, ChevronRight } from 'lucide-react';

function slugify(name: string) {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
}

export default function CategoryManager() {
  const { categories, subcategories, loading } = useCategories();
  const [refreshKey, setRefreshKey] = useState(0);
  const [expandedCategoryId, setExpandedCategoryId] = useState<string | null>(null);
  const [newCategoryName, setNewCategoryName] = useState('');
  const [newSubcategoryNames, setNewSubcategoryNames] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  // useCategories only fetches once on mount, so force a fresh read after any change
  const [localCategories, setLocalCategories] = useState(categories);
  const [localSubcategories, setLocalSubcategories] = useState(subcategories);

  useState(() => {
    setLocalCategories(categories);
    setLocalSubcategories(subcategories);
  });

  async function refetch() {
    const [{ data: cats }, { data: subs }] = await Promise.all([
      supabase.from('categories').select('*').order('name'),
      supabase.from('subcategories').select('*').order('name'),
    ]);
    setLocalCategories(cats || []);
    setLocalSubcategories(subs || []);
    setRefreshKey((k) => k + 1);
  }

  async function handleAddCategory() {
    const name = newCategoryName.trim();
    if (!name) return;
    setSaving(true);
    setError('');
    try {
      const { error } = await supabase.from('categories').insert([{ name, slug: slugify(name) }]);
      if (error) throw error;
      setNewCategoryName('');
      await refetch();
    } catch (err: any) {
      setError(err.message || 'Failed to add category');
    } finally {
      setSaving(false);
    }
  }

  async function handleAddSubcategory(categoryId: string) {
    const name = (newSubcategoryNames[categoryId] || '').trim();
    if (!name) return;
    setSaving(true);
    setError('');
    try {
      const { error } = await supabase.from('subcategories').insert([{ category_id: categoryId, name, slug: slugify(name) }]);
      if (error) throw error;
      setNewSubcategoryNames((prev) => ({ ...prev, [categoryId]: '' }));
      await refetch();
    } catch (err: any) {
      setError(err.message || 'Failed to add subcategory');
    } finally {
      setSaving(false);
    }
  }

  async function handleDeleteCategory(categoryId: string, name: string) {
    if (!window.confirm(`Delete "${name}" and all its subcategories? Products using them will keep their data but lose the category link.`)) return;
    try {
      const { error } = await supabase.from('categories').delete().eq('id', categoryId);
      if (error) throw error;
      await refetch();
    } catch (err: any) {
      setError(err.message || 'Failed to delete category');
    }
  }

  async function handleDeleteSubcategory(subcategoryId: string, name: string) {
    if (!window.confirm(`Delete "${name}"? Products using it will keep their data but lose this subcategory link.`)) return;
    try {
      const { error } = await supabase.from('subcategories').delete().eq('id', subcategoryId);
      if (error) throw error;
      await refetch();
    } catch (err: any) {
      setError(err.message || 'Failed to delete subcategory');
    }
  }

  const displayCategories = refreshKey > 0 ? localCategories : categories;
  const displaySubcategories = refreshKey > 0 ? localSubcategories : subcategories;

  if (loading) return <p className="text-gray-500 text-center py-12">Loading categories...</p>;

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-8">
      <h3 className="text-lg font-bold mb-6 border-b pb-2 flex items-center gap-2">
        <Tags className="w-5 h-5" /> Manage Categories
      </h3>

      {error && <div className="p-3 mb-4 bg-red-50 text-red-800 text-xs rounded-lg border border-red-200">{error}</div>}

      {/* Add new top-level category */}
      <div className="bg-white border border-gray-200 rounded-xl p-4 mb-4 flex gap-2">
        <input
          type="text"
          value={newCategoryName}
          onChange={(e) => setNewCategoryName(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleAddCategory()}
          placeholder="New category name, e.g. Kidswear"
          className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-black"
        />
        <button
          onClick={handleAddCategory}
          disabled={saving || !newCategoryName.trim()}
          className="px-4 py-2 bg-black text-white rounded-lg text-sm font-medium hover:bg-gray-800 disabled:opacity-50 flex items-center gap-1.5"
        >
          <Plus className="w-4 h-4" /> Add Category
        </button>
      </div>

      <div className="space-y-3">
        {displayCategories.map((cat) => {
          const subs = displaySubcategories.filter((s) => s.category_id === cat.id);
          const expanded = expandedCategoryId === cat.id;
          return (
            <div key={cat.id} className="bg-white border border-gray-200 rounded-xl overflow-hidden">
              <div className="flex items-center justify-between p-3">
                <button
                  onClick={() => setExpandedCategoryId(expanded ? null : cat.id)}
                  className="flex items-center gap-2 font-semibold text-sm flex-1 text-left"
                >
                  {expanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                  {cat.name}
                  <span className="text-xs text-gray-400 font-normal">({subs.length})</span>
                </button>
                <button
                  onClick={() => handleDeleteCategory(cat.id, cat.name)}
                  className="text-gray-400 hover:text-red-500 p-1"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>

              {expanded && (
                <div className="border-t border-gray-100 p-3 bg-gray-50 space-y-2">
                  {subs.map((sub) => (
                    <div key={sub.id} className="flex items-center justify-between bg-white px-3 py-2 rounded-lg border border-gray-200 text-sm">
                      <span>{sub.name}</span>
                      <button
                        onClick={() => handleDeleteSubcategory(sub.id, sub.name)}
                        className="text-gray-400 hover:text-red-500"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                  <div className="flex gap-2 pt-1">
                    <input
                      type="text"
                      value={newSubcategoryNames[cat.id] || ''}
                      onChange={(e) => setNewSubcategoryNames((prev) => ({ ...prev, [cat.id]: e.target.value }))}
                      onKeyDown={(e) => e.key === 'Enter' && handleAddSubcategory(cat.id)}
                      placeholder={`New subcategory under ${cat.name}`}
                      className="flex-1 px-3 py-1.5 border border-gray-300 rounded-lg text-xs focus:outline-black"
                    />
                    <button
                      onClick={() => handleAddSubcategory(cat.id)}
                      disabled={saving || !(newSubcategoryNames[cat.id] || '').trim()}
                      className="px-3 py-1.5 bg-gray-800 text-white rounded-lg text-xs font-medium hover:bg-black disabled:opacity-50"
                    >
                      Add
                    </button>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}