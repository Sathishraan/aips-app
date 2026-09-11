/**
 * App design tokens — Material 3 inspired, 8dp grid.
 * Mobile & tablet only (no desktop/web layout targets).
 *
 * Student / default brand is navy. Staff headers use peach → magenta.
 */

export const studentColors = {
  primary: '#424e79',
  primarySoft: '#eef0f8',
  primaryBorder: '#c5cae8',
  primaryDark: '#2d3660',
  secondary: '#5a6898',
  background: '#f0f2fa',
  surface: '#ffffff',
  text: '#1a1f3c',
  textSecondary: '#4a5080',
  textMuted: '#8890b8',
  border: '#dde0f0',
  borderLight: '#eef0f8',
  danger: '#EF4444',
  success: '#10B981',
  overlay: 'rgba(42, 48, 96, 0.5)',
} as const;

export const staffColors = {
  primary: '#d13abd',
  primarySoft: '#fdeef8',
  primaryBorder: '#f5c4e8',
  primaryDark: '#a72a97',
  secondary: '#eebd89',
  background: '#fdf6f2',
  surface: '#ffffff',
  text: '#1a1f3c',
  textSecondary: '#8a3d72',
  textMuted: '#c08aa8',
  border: '#f3d4e6',
  borderLight: '#fdeef8',
  danger: '#EF4444',
  success: '#10B981',
  overlay: 'rgba(209, 58, 189, 0.4)',
} as const;

/** Default export stays student navy so existing student screens are unchanged. */
export const colors = studentColors;

export const studentHeaderGradient = ['#5a6898', '#424e79', '#2d3660'] as const;
/** Staff: peach on top, magenta at the bottom */
export const staffHeaderGradient = ['#eebd89', '#d13abd'] as const;

export type BrandColors = typeof studentColors;
export type HeaderGradient = readonly [string, string, ...string[]];

export const getRoleColors = (staff: boolean): BrandColors => (staff ? staffColors : studentColors);
export const getHeaderGradient = (staff: boolean): HeaderGradient =>
  staff ? staffHeaderGradient : studentHeaderGradient;

/** 8dp spacing scale */
export const space = {
  xxs: 2,
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 40,
} as const;

export const radii = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  full: 999,
} as const;

export const shadows = {
  card: {
    shadowColor: '#2d3660',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 2,
  },
  elevated: {
    shadowColor: '#2d3660',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 12,
    elevation: 4,
  },
} as const;

export const touch = {
  min: 48,
} as const;
