/**
 * Design System Configuration
 * Based on Scaler Online PGP Design System
 * https://www.scaler.com/online-pgp-in-business-and-ai
 */

// Color Palette
export const colors = {
  // Primary - Scaler Orange (CTAs, highlights)
  primary: {
    50: '#fff7ed',
    100: '#ffedd5',
    200: '#fed7aa',
    300: '#fdba74',
    400: '#fb923c',
    500: '#fc9100', // Main primary
    600: '#fd621b', // Dark primary
    700: '#c2410c',
    800: '#9a3412',
    900: '#7c2d12',
  },

  // Secondary - Scaler Blue (Links, accents)
  secondary: {
    50: '#eff6ff',
    100: '#dbeafe',
    200: '#bfdbfe',
    300: '#93c5fd',
    400: '#148eff',
    500: '#006aff', // Main secondary
    600: '#0041ca', // Dark secondary
    700: '#1d4ed8',
    800: '#1e40af',
    900: '#1e3a8a',
  },

  // Neutrals - Dark theme focused
  neutral: {
    50: '#fafafa',
    100: '#f4f4f5',
    200: '#e4e4e7',
    300: '#d4d4d8',
    400: '#a1a1aa',
    500: '#71717a',
    600: '#52525b',
    700: '#3f3f46',
    800: '#27272a',
    900: '#18181b',
    950: '#121212', // Primary background
    1000: '#101010', // Deepest black
  },

  // Semantic Colors
  success: {
    light: '#4ade80',
    main: '#20a164',
    dark: '#166534',
  },
  warning: {
    light: '#fcd34d',
    main: '#f59e0b',
    dark: '#d97706',
  },
  error: {
    light: '#f87171',
    main: '#ef4444',
    dark: '#dc2626',
  },
  info: {
    light: '#60a5fa',
    main: '#3b82f6',
    dark: '#2563eb',
  },
} as const;

// Typography
export const typography = {
  fontFamily: {
    primary: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
    secondary: "'Plus Jakarta Sans', sans-serif",
    mono: "'JetBrains Mono', 'Fira Code', monospace",
  },
  fontWeight: {
    regular: 400,
    medium: 500,
    semibold: 600,
    bold: 700,
    extrabold: 800,
  },
  fontSize: {
    xs: '0.75rem', // 12px
    sm: '0.875rem', // 14px
    base: '1rem', // 16px
    lg: '1.125rem', // 18px
    xl: '1.25rem', // 20px
    '2xl': '1.5rem', // 24px
    '3xl': '1.875rem', // 30px
    '4xl': '2.25rem', // 36px
    '5xl': '3rem', // 48px
    '6xl': '3.75rem', // 60px
  },
  lineHeight: {
    tight: 1.25,
    normal: 1.5,
    relaxed: 1.75,
  },
} as const;

// Spacing System (based on 4px grid)
export const spacing = {
  0: '0',
  1: '0.25rem', // 4px
  2: '0.5rem', // 8px
  3: '0.75rem', // 12px
  4: '1rem', // 16px
  5: '1.25rem', // 20px
  6: '1.5rem', // 24px
  8: '2rem', // 32px
  10: '2.5rem', // 40px
  12: '3rem', // 48px
  16: '4rem', // 64px
  20: '5rem', // 80px
  24: '6rem', // 96px
  32: '8rem', // 128px
} as const;

// Border Radius
export const borderRadius = {
  none: '0',
  sm: '0.25rem', // 4px
  md: '0.5rem', // 8px
  lg: '0.75rem', // 12px
  xl: '1rem', // 16px
  '2xl': '1.5rem', // 24px
  full: '9999px',
} as const;

// Shadows
export const shadows = {
  sm: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
  md: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -2px rgba(0, 0, 0, 0.1)',
  lg: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -4px rgba(0, 0, 0, 0.1)',
  xl: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1)',
  '2xl': '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
  inner: 'inset 0 2px 4px 0 rgba(0, 0, 0, 0.05)',
  // Scaler-specific glow effects
  primaryGlow: '0 0 20px rgba(253, 98, 27, 0.4)',
  secondaryGlow: '0 0 20px rgba(0, 106, 255, 0.4)',
  successGlow: '0 0 20px rgba(32, 161, 100, 0.4)',
} as const;

// Transitions
export const transitions = {
  fast: '150ms ease',
  normal: '250ms ease',
  slow: '400ms ease',
  spring: '500ms cubic-bezier(0.34, 1.56, 0.64, 1)',
} as const;

// Z-Index Scale
export const zIndex = {
  dropdown: 1000,
  sticky: 1020,
  fixed: 1030,
  modalBackdrop: 1040,
  modal: 1050,
  popover: 1060,
  tooltip: 1070,
  toast: 1080,
} as const;

// Breakpoints
export const breakpoints = {
  sm: '640px',
  md: '768px',
  lg: '1024px',
  xl: '1280px',
  '2xl': '1536px',
} as const;

// Container Widths
export const containers = {
  sm: '640px',
  md: '768px',
  lg: '1024px',
  xl: '1200px',
  '2xl': '1400px',
} as const;

// Gradients
export const gradients = {
  primary: 'linear-gradient(135deg, #fd621b 0%, #fc9100 100%)',
  primaryHover: 'linear-gradient(135deg, #fc9100 0%, #fd621b 100%)',
  secondary: 'linear-gradient(135deg, #0041ca 0%, #006aff 100%)',
  dark: 'linear-gradient(135deg, #121212 0%, #1a1a2e 50%, #0f172a 100%)',
  glass: 'linear-gradient(135deg, rgba(255, 255, 255, 0.1) 0%, rgba(255, 255, 255, 0.05) 100%)',
  success: 'linear-gradient(135deg, #166534 0%, #20a164 100%)',
} as const;

// Export theme object
export const theme = {
  colors,
  typography,
  spacing,
  borderRadius,
  shadows,
  transitions,
  zIndex,
  breakpoints,
  containers,
  gradients,
} as const;

export type Theme = typeof theme;
