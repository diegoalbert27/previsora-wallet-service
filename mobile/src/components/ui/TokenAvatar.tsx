import { Image } from 'expo-image';
import { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { theme } from '@/theme';

interface TokenAvatarProps {
  symbol: string;
  /** Already resolved image URL (see resolveAssetImageUrl). Null, empty or a failed load shows the initials. */
  iconUrl?: string | null;
  /** Side of the square container; the logo is 60% of it. Defaults to the 40 pt of the design system. */
  size?: number;
}

/** 40×40 surface3 container with the token logo (SVG, PNG or JPG), or the ticker in lime when there is none. */
export function TokenAvatar({ symbol, iconUrl, size = 40 }: TokenAvatarProps) {
  // Remember which URL failed, so a new URL gets another chance without extra effects.
  const [failedUrl, setFailedUrl] = useState<string | null>(null);
  const showImage = !!iconUrl && failedUrl !== iconUrl;

  return (
    <View style={[styles.container, { width: size, height: size, borderRadius: size * 0.3 }]}>
      {showImage ? (
        <Image
          source={{ uri: iconUrl }}
          style={{ width: size * 0.6, height: size * 0.6 }}
          contentFit="contain"
          cachePolicy="memory-disk"
          onError={() => setFailedUrl(iconUrl)}
        />
      ) : (
        <Text style={[styles.initials, size < 36 && styles.initialsSmall]}>{symbol.slice(0, 4).toUpperCase()}</Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: theme.colors.bg.surface3,
    alignItems: 'center',
    justifyContent: 'center',
  },
  initials: { ...theme.typography.microBadge, color: theme.colors.brand.lime },
  initialsSmall: { fontSize: 8, lineHeight: 10, letterSpacing: 0 },
});
