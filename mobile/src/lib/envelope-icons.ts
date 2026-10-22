import {
  Baby,
  Briefcase,
  Car,
  Dumbbell,
  Gamepad2,
  GraduationCap,
  Gift,
  HeartPulse,
  House,
  Landmark,
  Music,
  PawPrint,
  PiggyBank,
  Plane,
  ShieldCheck,
  ShoppingBag,
  Smartphone,
  Umbrella,
  Utensils,
  Wrench,
  type LucideIcon,
} from 'lucide-react-native';

export interface EnvelopeIconOption {
  /** Stored in envelopes.icon. Keep keys stable: renaming one orphans the envelopes that use it. */
  key: string;
  label: string;
  Icon: LucideIcon;
}

export const ENVELOPE_ICONS: EnvelopeIconOption[] = [
  { key: 'piggy-bank', label: 'Savings', Icon: PiggyBank },
  { key: 'shield-check', label: 'Emergency', Icon: ShieldCheck },
  { key: 'house', label: 'Home', Icon: House },
  { key: 'car', label: 'Car', Icon: Car },
  { key: 'plane', label: 'Travel', Icon: Plane },
  { key: 'graduation-cap', label: 'Education', Icon: GraduationCap },
  { key: 'heart-pulse', label: 'Health', Icon: HeartPulse },
  { key: 'gift', label: 'Gifts', Icon: Gift },
  { key: 'shopping-bag', label: 'Shopping', Icon: ShoppingBag },
  { key: 'utensils', label: 'Food', Icon: Utensils },
  { key: 'briefcase', label: 'Business', Icon: Briefcase },
  { key: 'landmark', label: 'Taxes', Icon: Landmark },
  { key: 'umbrella', label: 'Insurance', Icon: Umbrella },
  { key: 'gamepad-2', label: 'Fun', Icon: Gamepad2 },
  { key: 'music', label: 'Music', Icon: Music },
  { key: 'dumbbell', label: 'Fitness', Icon: Dumbbell },
  { key: 'baby', label: 'Family', Icon: Baby },
  { key: 'paw-print', label: 'Pets', Icon: PawPrint },
  { key: 'smartphone', label: 'Tech', Icon: Smartphone },
  { key: 'wrench', label: 'Repairs', Icon: Wrench },
];

export const DEFAULT_ENVELOPE_ICON = 'piggy-bank';

/** Static lookup (key → icon), so components can pick an icon without creating one during render. */
export const ENVELOPE_ICON_BY_KEY: Record<string, LucideIcon> = Object.fromEntries(
  ENVELOPE_ICONS.map(({ key, Icon }) => [key, Icon]),
);
