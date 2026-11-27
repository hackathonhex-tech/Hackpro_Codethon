/**
 * Codeathon Design Tokens
 * Clean enterprise UI with Primary #3760F8 (Cobalt / Enterprise Blue)
 * and Secondary #475569 (Slate / Charcoal)
 */

export const DEFAULT_PRIMARY_COLOR = '#3760F8';
export const DEFAULT_SECONDARY_COLOR = '#475569';

export const tokens = {
  colors: {
    // Brand Primary (Electric Cobalt Blue #3760F8)
    primary: {
      50: '#EEF2FF',
      100: '#E0E7FF',
      200: '#C7D2FE',
      300: '#A5B4FC',
      400: '#6366F1',
      500: '#4F46E5',
      DEFAULT: '#3760F8',
      600: '#254EDB',
      700: '#1D40B8',
      800: '#173394',
      900: '#0F1E5C',
    },
    // Brand Secondary (Clean Slate #475569)
    secondary: {
      50: '#F8FAFC',
      100: '#F1F5F9',
      200: '#E2E8F0',
      DEFAULT: '#475569',
      hover: '#334155',
      dark: '#1E293B',
      800: '#1E293B',
      900: '#0F172A',
    },
    // Base palette
    base: {
      50: '#EEF2FF',
      100: '#E0E7FF',
      200: '#C7D2FE',
      300: '#A5B4FC',
      400: '#6366F1',
      500: '#3760F8',
      DEFAULT: '#3760F8',
      600: '#254EDB',
      700: '#1D40B8',
      800: '#173394',
      900: '#0F1E5C',
    },
    // Ink (Typography)
    ink: {
      primary: '#0B0F19',
      secondary: '#1E293B',
      muted: '#64748B',
      disabled: '#94A3B8',
      inverse: '#FFFFFF',
    },
    // Paper (Surfaces & Backgrounds)
    paper: {
      DEFAULT: '#FFFFFF',
      subtle: '#F8FAFC',
      muted: '#F1F5F9',
      elevated: '#FFFFFF',
    },
    // Line (Borders & Dividers)
    line: {
      subtle: '#F1F5F9',
      DEFAULT: '#E2E8F0',
      strong: '#CBD5E1',
      focus: '#3760F8',
    },
    // Semantics
    success: {
      50: '#ECFDF5',
      100: '#D1FAE5',
      500: '#10B981',
      DEFAULT: '#059669',
      600: '#047857',
      700: '#065F46',
    },
    warning: {
      50: '#FFFBEB',
      100: '#FEF3C7',
      500: '#F59E0B',
      DEFAULT: '#D97706',
      600: '#B45309',
      700: '#92400E',
    },
    danger: {
      50: '#FEF2F2',
      100: '#FEE2E2',
      500: '#EF4444',
      DEFAULT: '#DC2626',
      600: '#B91C1C',
      700: '#991B1B',
    },
    info: {
      50: '#F0F9FF',
      100: '#E0F2FE',
      500: '#0EA5E9',
      DEFAULT: '#0284C7',
      600: '#0369A1',
      700: '#075985',
    },
  },
  borderRadius: {
    none: '0',
    sm: '6px',
    DEFAULT: '10px',
    md: '10px',
    lg: '14px',
    xl: '18px',
    '2xl': '24px',
    full: '9999px',
  },
  boxShadow: {
    subtle: '0 1px 3px 0 rgba(11, 15, 25, 0.04)',
    card: '0 2px 8px -2px rgba(11, 15, 25, 0.06), 0 1px 4px -1px rgba(11, 15, 25, 0.04)',
    raised: '0 8px 20px -4px rgba(11, 15, 25, 0.08), 0 4px 8px -3px rgba(11, 15, 25, 0.04)',
    modal: '0 20px 35px -5px rgba(11, 15, 25, 0.14), 0 10px 15px -5px rgba(11, 15, 25, 0.08)',
    glow: '0 0 20px -3px rgba(55, 96, 248, 0.35)',
    neon: '0 0 15px -2px rgba(211, 254, 79, 0.45)',
  },
  screens: {
    xs: '360px',
    sm: '640px',
    md: '768px',
    lg: '1024px',
    xl: '1280px',
    '2xl': '1440px',
  },
  minTapTarget: '44px',
} as const;

export const cssRootVariables = `
:root {
  --font-manrope: 'Manrope', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  --color-primary: #3760F8;
  --color-primary-hover: #254EDB;
  --color-secondary: #475569;
  --color-secondary-hover: #334155;
  --color-ink-primary: #0B0F19;
  --color-ink-secondary: #1E293B;
  --color-ink-muted: #64748B;
}
`;
