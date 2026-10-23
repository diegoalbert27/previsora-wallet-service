import { useEffect, useState } from 'react';
import { useAuth } from '@/providers/auth-provider';
import { getProfile, type Profile } from '@/services/profile';

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

export function useProfile() {
  const { session } = useAuth();
  const userId = session?.user.id ?? null;
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
