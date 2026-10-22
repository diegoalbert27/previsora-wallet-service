import * as Linking from 'expo-linking';
import * as WebBrowser from 'expo-web-browser';
import { supabase } from '@/lib/supabase';

// Lets the in-app browser close itself when the redirect lands back in the app.
WebBrowser.maybeCompleteAuthSession();

function parseParams(raw: string): Record<string, string> {
  const params: Record<string, string> = {};
  for (const pair of raw.split('&')) {
    if (!pair) continue;
    const [key, value = ''] = pair.split('=');
    params[decodeURIComponent(key)] = decodeURIComponent(value.replace(/\+/g, ' '));
  }
  return params;
}

/**
 * Turns the URL Supabase redirects back to into a session. Handles both the token (fragment) and code (query) forms.
 * Used for Google sign-in and for the link in the email-confirmation message.
 */
export async function createSessionFromUrl(url: string): Promise<void> {
  const [withoutFragment, fragment = ''] = url.split('#');
  const params = { ...parseParams(withoutFragment.split('?')[1] ?? ''), ...parseParams(fragment) };

  if (params.error || params.error_description) {
    throw new Error(params.error_description ?? params.error);
  }

  if (params.code) {
    const { error } = await supabase.auth.exchangeCodeForSession(params.code);
    if (error) throw error;
    return;
  }

  if (params.access_token && params.refresh_token) {
    const { error } = await supabase.auth.setSession({
      access_token: params.access_token,
      refresh_token: params.refresh_token,
    });
    if (error) throw error;
    return;
  }

  throw new Error('Google sign-in did not return a session.');
}

/**
 * Google sign-in through Supabase in the system browser. Resolves when the user finishes or cancels;
 * on success the auth listener in AuthProvider picks up the new session and navigation follows.
 */
export async function signInWithGoogle(): Promise<void> {
  // exp://<ip>/--/auth/callback in Expo Go, previsora://auth/callback in a build. Both must be allowed in Supabase.
  const redirectTo = Linking.createURL('auth/callback');

  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: { redirectTo, skipBrowserRedirect: true, queryParams: { prompt: 'select_account' } },
  });
  if (error) throw error;
  if (!data.url) throw new Error('Could not start Google sign-in.');

  const result = await WebBrowser.openAuthSessionAsync(data.url, redirectTo);
  if (result.type !== 'success') return; // dismissed or cancelled

  await createSessionFromUrl(result.url);
}
