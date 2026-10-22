import { colors as design } from './colors';

export const colors = {
  background: design.bg.app,
  surface: design.bg.surface1,
  border: design.border.default,
  text: design.text.primary,
  textMuted: design.text.secondary,
  primary: design.brand.lime,
  primaryText: design.text.onAccent,
  danger: design.status.error,
} as const;

export const spacing = { xs: 4, sm: 8, md: 16, lg: 24, xl: 32 } as const;

export const radius = { sm: 8, md: 12 } as const;
