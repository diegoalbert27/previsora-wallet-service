import { supabase } from '@/lib/supabase';

/** Id of the signed-in user. Tables with RLS on `user_id` and no column default need it on insert. */
export async function requireUserId(): Promise<string> {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) throw new Error('You must be signed in.');
  return session.user.id;
}
