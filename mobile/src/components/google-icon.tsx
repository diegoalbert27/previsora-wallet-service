import { Image } from 'expo-image';

/** The multicolor Google "G" (assets/Google-Icon.svg). Metro treats .svg as an asset and expo-image renders it. */
export function GoogleIcon({ size = 20 }: { size?: number }) {
  return (
    <Image
      source={require('../../assets/Google-Icon.svg')}
      style={{ width: size, height: size }}
      contentFit="contain"
      accessibilityLabel="Google"
    />
  );
}
