import { supabase } from '@/lib/supabase';

export async function requireUserId(): Promise<string> {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) throw new Error('You must be signed in.');
  return session.user.id;
}
