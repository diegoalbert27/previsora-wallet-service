import { Image } from 'expo-image';
import { Landmark, Wallet } from 'lucide-react-native';
import { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { providerIcon } from '@/lib/provider-icon';
import { theme } from '@/theme';
import type { ConnectionType } from '@/types/database';

interface ProviderIconProps {
  connection: { connection_type: ConnectionType; provider: string };
  size?: number;
}

/** Square surface3 tile with the provider's logo; a plain icon is shown if the logo cannot be loaded. */
export function ProviderIcon({ connection, size = 48 }: ProviderIconProps) {
  const { url, tintColor } = providerIcon(connection);
  const [failedUrl, setFailedUrl] = useState<string | null>(null);
  const FallbackIcon = connection.connection_type === 'CEX' ? Landmark : Wallet;

  return (
    <View style={[styles.tile, { width: size, height: size, borderRadius: size * 0.3 }]}>
      {failedUrl === url ? (
        <FallbackIcon size={size * 0.5} color={theme.colors.text.primary} strokeWidth={1.75} />
      ) : (
        <Image
          source={{ uri: url }}
          style={{ width: size * 0.58, height: size * 0.58 }}
          contentFit="contain"
          tintColor={tintColor}
          cachePolicy="memory-disk"
          onError={() => setFailedUrl(url)}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  tile: { backgroundColor: theme.colors.bg.surface3, alignItems: 'center', justifyContent: 'center' },
});
