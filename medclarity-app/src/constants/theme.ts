// MedClarity AI Design System Tokens

export const COLORS = {
  // Navigation & Informational UI (Blue, Purple, Teal)
  primaryBlue: '#2563EB',
  primaryBlueDark: '#1E3A8A',
  primaryBlueLight: '#DBEAFE',

  primaryPurple: '#7C3AED',
  primaryPurpleLight: '#F3E8FF',

  primaryTeal: '#0D9488',
  primaryTealLight: '#CCFBF1',
  primaryTealBright: '#2DD4BF',

  // Text & Base Neutral Colors
  textDark: '#0F172A',
  textMuted: '#475569',
  textLight: '#94A3B8',
  white: '#FFFFFF',

  background: '#F8FAFC',
  cardBackground: '#FFFFFF',
  glassBorder: 'rgba(255, 255, 255, 0.6)',
  cardShadow: 'rgba(15, 23, 42, 0.08)',

  // Status & Error
  errorRed: '#DC2626',
  errorBackground: '#FEE2E2',
  successGreen: '#16A34A',

  // STRICT RULE: Warm Accent (Amber/Coral) is RESERVED EXCLUSIVELY for streak, growth, & dose confirmation
  warmAmber: '#F59E0B',
  warmCoral: '#FB923C',
  warmAccentGradient: ['#F59E0B', '#FB923C'] as const,

  // UI Gradients
  bluePurpleGradient: ['#1E3A8A', '#7C3AED'] as const,
  tealGreenGradient: ['#0D9488', '#059669'] as const,
  blueTealGradient: ['#2563EB', '#14B8A6'] as const,
  lightBackgroundGradient: ['#F8FAFC', '#EFF6FF'] as const,
};

// Legacy Theme Compatibility Tokens
export const Colors = {
  light: {
    text: COLORS.textDark,
    textSecondary: COLORS.textMuted,
    background: COLORS.background,
    backgroundElement: '#F1F5F9',
    backgroundSelected: '#DBEAFE',
    tint: COLORS.primaryBlue,
    icon: COLORS.primaryBlue,
    tabIconDefault: COLORS.textLight,
    tabIconSelected: COLORS.primaryBlue,
  },
  dark: {
    text: COLORS.white,
    textSecondary: COLORS.textLight,
    background: COLORS.textDark,
    backgroundElement: '#1E293B',
    backgroundSelected: '#1E3A8A',
    tint: COLORS.primaryTealBright,
    icon: COLORS.primaryTealBright,
    tabIconDefault: COLORS.textLight,
    tabIconSelected: COLORS.primaryTealBright,
  },
};

export const Spacing = {
  half: 2,
  one: 4,
  two: 8,
  three: 12,
  four: 16,
  five: 20,
  six: 24,
};

export const Fonts = {
  regular: 'System',
  bold: 'System',
  mono: 'System',
};

export type ThemeColor = 'text' | 'textSecondary' | 'background' | 'backgroundElement' | 'backgroundSelected' | 'tint';
export const BottomTabInset = 16;
export const MaxContentWidth = 600;

export const TYPOGRAPHY = {
  fontSizeBase: 16,
  fontSizeLarge: 18,
  fontSizeTitle: 22,
  fontSizeHeader: 28,
  fontSizeHero: 34,

  fontWeightNormal: '400' as const,
  fontWeightMedium: '500' as const,
  fontWeightSemiBold: '600' as const,
  fontWeightBold: '700' as const,
};

export const LAYOUT = {
  minTouchTarget: 48, // Accessibility minimum touch target height/width
  buttonPaddingVertical: 14,
  buttonPaddingHorizontal: 24,
  borderRadiusPill: 9999,
  borderRadiusCard: 20,
  borderRadiusInput: 14,
  screenPaddingHorizontal: 20,
};

export const SHADOWS = {
  soft: {
    shadowColor: COLORS.textDark,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06,
    shadowRadius: 12,
    elevation: 3,
  },
  medium: {
    shadowColor: COLORS.textDark,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.12,
    shadowRadius: 16,
    elevation: 6,
  },
};
