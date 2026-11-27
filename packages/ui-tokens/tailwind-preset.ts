import { tokens } from './tokens';

export interface TailwindConfigPreset {
  theme: {
    screens: typeof tokens.screens;
    extend: {
      colors: typeof tokens.colors;
      borderRadius: typeof tokens.borderRadius;
      boxShadow: typeof tokens.boxShadow;
      fontFamily: {
        display: string[];
        sans: string[];
        mono: string[];
      };
      minHeight: {
        tap: string;
      };
      minWidth: {
        tap: string;
      };
    };
  };
}

export const codeathonTailwindPreset: TailwindConfigPreset = {
  theme: {
    screens: tokens.screens,
    extend: {
      colors: tokens.colors,
      borderRadius: tokens.borderRadius,
      boxShadow: tokens.boxShadow,
      fontFamily: {
        display: ['var(--font-manrope)', 'Manrope', 'system-ui', 'sans-serif'],
        sans: ['var(--font-manrope)', 'Manrope', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'Fira Code', 'Menlo', 'monospace'],
      },
      minHeight: {
        tap: tokens.minTapTarget,
      },
      minWidth: {
        tap: tokens.minTapTarget,
      },
    },
  },
};

export default codeathonTailwindPreset;
