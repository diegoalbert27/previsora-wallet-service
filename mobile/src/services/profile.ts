import { supabase } from '@/lib/supabase';
import { requireUserId } from '@/services/auth';

export interface Profile {
  first_name: string | null;
  last_name: string | null;
}

/** The signed-in user's profile row (created by the on_auth_user_created trigger). */
export async function getProfile(): Promise<Profile | null> {
  const userId = await requireUserId();
  const { data, error } = await supabase
    .from('profiles')
    .select('first_name, last_name')
    .eq('id', userId)
    .maybeSingle();

  if (error) throw error;
  return data;
}
