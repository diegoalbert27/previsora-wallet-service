import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from 'react';
import { useAuth } from '@/providers/auth-provider';
import { listConnections } from '@/services/connections';
import type { Connection } from '@/types/database';

interface ConnectionsContextValue {
  connections: Connection[];
  loading: boolean;
  refresh: () => Promise<void>;
}

const ConnectionsContext = createContext<ConnectionsContextValue>({
  connections: [],
  loading: true,
  refresh: async () => {},
});

export function ConnectionsProvider({ children }: { children: ReactNode }) {
  const { session } = useAuth();
  const userId = session?.user.id ?? null;
  const [loaded, setLoaded] = useState<{ userId: string; items: Connection[] } | null>(null);

  const refresh = useCallback(async () => {
    if (!userId) return;
    try {
      setLoaded({ userId, items: await listConnections() });
    } catch (e) {
      setLoaded((prev) => prev ?? { userId, items: [] });
      throw e;
    }
  }, [userId]);

  useEffect(() => {
    if (!userId) return;
    let cancelled = false;
    listConnections()
      .then((items) => !cancelled && setLoaded({ userId, items }))
      .catch(() => !cancelled && setLoaded((prev) => prev ?? { userId, items: [] }));
    return () => {
      cancelled = true;
    };
  }, [userId]);

  const current = loaded?.userId === userId ? loaded : null;
  const value = {
    connections: current?.items ?? [],
    loading: userId !== null && current === null,
    refresh,
  };

  return <ConnectionsContext.Provider value={value}>{children}</ConnectionsContext.Provider>;
}

export const useConnections = () => useContext(ConnectionsContext);
