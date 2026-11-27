import type { Config } from 'tailwindcss';
import { codeathonTailwindPreset } from '@codeathon/ui-tokens/preset';

const config: Config = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  presets: [codeathonTailwindPreset as any],
  theme: {
    extend: {
      colors: {
        primary: {
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
        brand: {
          blue: '#3760F8',
          slate: '#475569',
          dark: '#0B0F19',
        },
      },
      fontFamily: {
        sans: ['var(--font-manrope)', 'Manrope', 'system-ui', 'sans-serif'],
        heading: ['var(--font-manrope)', 'Manrope', 'sans-serif'],
      },
    },
  },
  plugins: [],
};

export default config;
