// src/utils/theme.js — aligned with web premium marketplace tokens
export const COLORS = {
  primary: '#2f7ff0',
  primaryDark: '#1e4fd6',
  primaryDeep: '#1a3fbf',
  primarySoft: '#e8f1ff',
  primaryLight: '#5b6fa0',
  accent: '#4a6fa5',
  accentBright: '#3b82f6',
  accentLight: '#9ec0f5',
  background: '#eef2f7',
  backgroundGlow: '#dce9fb',
  backgroundTop: '#f7f9fc',
  white: '#ffffff',
  card: 'rgba(255, 255, 255, 0.94)',
  cardSolid: '#ffffff',
  border: '#e2e8f0',
  borderStrong: '#d4dde8',
  text: '#0f172a',
  textMuted: '#64748b',
  error: '#ef4444',
  success: '#059669',
  badge: 'linear-gradient(to right, #9333ea, #2563eb)',
  badgeBg: '#ff8a8a',
  tagBg: '#ffe0e6',
  navBg: '#243554',
  brandAccentL: '#ff5c6a',
  splashBg: '#2f7ff0',
};

export const BRAND = {
  wordmarkFont: 'Sora_800ExtraBold',
  displayFont: 'Sora_700Bold',
  bodyFont: 'PlusJakartaSans_400Regular',
  bodyMedium: 'PlusJakartaSans_500Medium',
  bodySemiBold: 'PlusJakartaSans_600SemiBold',
  bodyBold: 'PlusJakartaSans_700Bold',
  bodyExtraBold: 'PlusJakartaSans_800ExtraBold',
  accentL: '#ff5c6a',
};

export const FONTS = {
  regular: 'PlusJakartaSans_400Regular',
  medium: 'PlusJakartaSans_500Medium',
  semibold: 'PlusJakartaSans_600SemiBold',
  bold: 'PlusJakartaSans_700Bold',
  extrabold: 'PlusJakartaSans_800ExtraBold',
  display: 'Sora_700Bold',
  displayBlack: 'Sora_800ExtraBold',
};

export const RADIUS = {
  sm: 8,
  md: 12,
  lg: 18,
  xl: 26,
  full: 999,
};

export const SHADOW = {
  small: {
    shadowColor: '#0f172a',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 2,
    elevation: 1,
  },
  medium: {
    shadowColor: '#0f172a',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.08,
    shadowRadius: 16,
    elevation: 4,
  },
  lift: {
    shadowColor: '#1e4fd6',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.12,
    shadowRadius: 20,
    elevation: 6,
  },
  header: {
    shadowColor: '#1e4fd6',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.22,
    shadowRadius: 16,
    elevation: 8,
  },
};

/** Shared premium chrome styles used across screens */
export const SURFACE = {
  page: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  card: {
    backgroundColor: COLORS.cardSolid,
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    borderColor: 'rgba(226, 232, 240, 0.95)',
    ...SHADOW.small,
  },
  headerGradient: [COLORS.primaryDeep, COLORS.primaryDark, COLORS.primary],
};
