import { env } from '@/lib/env';
import { supabase } from '@/lib/supabase';

/**
 * Turns `supported_assets.image_url` into something an <Image> can load:
 * - empty / null → null (the avatar shows its initials fallback)
 * - a full URL (http/https) → used as is
 * - a relative path such as `usdt.svg` → the public URL in the asset-images Storage bucket
 */
export function resolveAssetImageUrl(imageUrl: string | null | undefined): string | null {
  const value = imageUrl?.trim();
  if (!value) return null;
  if (/^https?:\/\//i.test(value)) return value;

  const path = value.replace(/^\/+/, '');
  return supabase.storage.from(env.assetImagesBucket).getPublicUrl(path).data.publicUrl;
}
