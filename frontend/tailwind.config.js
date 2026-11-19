/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        midnight: {
          950: '#050811',
          900: '#080D19',
          850: '#0D1527',
          800: '#131E35',
          750: '#192642',
          700: '#203052',
          600: '#2E416E',
        },
        charcoal: {
          900: '#0A0F18',
          800: '#111827',
          700: '#1A2333',
          600: '#243044',
        },
        cyan: {
          300: '#67E8F9',
          400: '#22D3EE',
          500: '#06B6D4',
          glow: '#00F0FF',
        },
        teal: {
          300: '#5EEAD4',
          400: '#2DD4BF',
          500: '#14B8A6',
          accent: '#00B4D8',
        },
        status: {
          normal: '#10B981',
          elevated: '#06B6D4',
          warning: '#F59E0B',
          critical: '#EF4444',
        }
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
        mono: ['JetBrains Mono', 'Fira Code', 'monospace'],
      },
      boxShadow: {
        'glow-cyan': '0 0 24px -2px rgba(0, 240, 255, 0.32)',
        'glow-cyan-sm': '0 0 12px -2px rgba(0, 240, 255, 0.25)',
        'glow-teal': '0 0 24px -2px rgba(0, 180, 216, 0.30)',
        'glow-amber': '0 0 20px -3px rgba(245, 158, 11, 0.25)',
        'glow-red': '0 0 20px -3px rgba(239, 68, 68, 0.28)',
        'glass': '0 8px 32px 0 rgba(0, 0, 0, 0.45)',
        'glass-highlight': 'inset 0 1px 0 0 rgba(255, 255, 255, 0.08)',
        'card-surface': '0 4px 20px -2px rgba(0, 0, 0, 0.5), inset 0 1px 0 0 rgba(255, 255, 255, 0.05)',
      },
      backdropBlur: {
        xs: '2px',
        xl: '16px',
        '2xl': '24px',
      }
    },
  },
  plugins: [],
}
