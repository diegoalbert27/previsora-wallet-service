import { useEffect, useState } from 'react';
import { useAuth } from '@/providers/auth-provider';
import { getProfile, type Profile } from '@/services/profile';

// Every tab shows the header, so the profile is read once per user and shared instead of once per tab.
let cache: { userId: string; profile: Profile | null } | null = null;
let inFlight: { userId: string; promise: Promise<Profile | null> } | null = null;

function loadProfile(userId: string): Promise<Profile | null> {
  if (inFlight?.userId !== userId) {
    const promise = getProfile().catch(() => null);
    inFlight = { userId, promise };
    promise.then((profile) => {
      cache = { userId, profile };
    });
  }
  return inFlight.promise;
}

/** Profile of the signed-in user. Stays null while loading or if it cannot be read: the name is decoration. */
export function useProfile() {
  const { session } = useAuth();
  const userId = session?.user.id ?? null;
  // Tagged with the user it belongs to, so switching accounts never shows the previous name.
  const [loaded, setLoaded] = useState<{ userId: string; profile: Profile | null } | null>(cache);

  useEffect(() => {
    if (!userId) return;
    let cancelled = false;
    loadProfile(userId).then((profile) => !cancelled && setLoaded({ userId, profile }));
    return () => {
      cancelled = true;
    };
  }, [userId]);

  return loaded?.userId === userId ? loaded.profile : null;
}
