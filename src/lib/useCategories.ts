import { useEffect, useState } from 'react';
import { supabase } from './supabase';

export interface Category {
  id: string;
  name: string;
  slug: string;
}

export interface Subcategory {
  id: string;
  category_id: string;
  name: string;
  slug: string;
}

export function useCategories() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [subcategories, setSubcategories] = useState<Subcategory[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const [{ data: cats }, { data: subs }] = await Promise.all([
        supabase.from('categories').select('*').order('name'),
        supabase.from('subcategories').select('*').order('name'),
      ]);
      setCategories(cats || []);
      setSubcategories(subs || []);
      setLoading(false);
    }
    load();
  }, []);

  return { categories, subcategories, loading };
}