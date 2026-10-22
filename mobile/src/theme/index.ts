import { colors as designColors, gradients } from './colors';
import { radius as designRadius } from './radius';
import { space } from './spacing';
import { typography } from './typography';

export const theme = {
  colors: designColors,
  gradients,
  typography,
  space,
  radius: designRadius,
} as const;

export { colors, radius, spacing } from './legacy';
