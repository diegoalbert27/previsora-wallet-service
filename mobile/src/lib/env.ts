function required(name: string, value: string | undefined): string {
  if (!value) throw new Error(`Missing environment variable ${name}. Copy .env.example to .env.local.`);
  return value;
}

function httpsUrl(name: string, value: string | undefined): string {
  const url = required(name, value).trim();
  if (!/^https:\/\/[^\s/<>]+\.[^\s/<>]+\/?$/.test(url)) {
    // The URL is public, so it is safe to echo; this exposes stale values or placeholders from .env.example.
    throw new Error(`${name} must look like https://<ref>.supabase.co, got "${url.slice(0, 60)}". Restart Metro with --clear after editing .env.`);
  }
  return url.replace(/\/$/, '');
}

// Expo only inlines EXPO_PUBLIC_* vars when accessed statically as process.env.NAME.
export const env = {
  supabaseUrl: httpsUrl('EXPO_PUBLIC_SUPABASE_URL', process.env.EXPO_PUBLIC_SUPABASE_URL),
  supabaseKey: required('EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY', process.env.EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY),
  functionsRegion: process.env.EXPO_PUBLIC_FUNCTIONS_REGION ?? 'eu-central-1',
};
