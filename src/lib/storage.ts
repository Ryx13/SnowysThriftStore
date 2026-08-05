import { supabase } from './supabase';

const BUCKET = 'product-images';

export function getStoragePathFromUrl(url: string): string | null {
  const marker = `/${BUCKET}/`;
  const idx = url.indexOf(marker);
  if (idx === -1) return null;
  return url.substring(idx + marker.length);
}

export async function deleteStorageFiles(urls: string[]): Promise<void> {
  const paths = urls.map(getStoragePathFromUrl).filter((p): p is string => !!p);
  if (paths.length === 0) return;

  const { error } = await supabase.storage.from(BUCKET).remove(paths);
  if (error) {
    // Don't block the DB deletion on a storage cleanup failure — just log it
    console.error('Error deleting storage files:', error);
  }
}