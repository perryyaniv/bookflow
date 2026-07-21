/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: '#1F6F5C',
          dark: '#17564A',
          light: '#2E8A73',
        },
        accent: {
          DEFAULT: '#D97706',
          dark: '#B45309',
          light: '#F0A94E',
        },
        bg: '#F2F7F5',
        surface: '#FFFFFF',
        dark: '#272727',
        status: {
          created: '#9CA3AF',
          ordered: '#3B82F6',
          partial: '#F59E0B',
          arrived: '#16A34A',
          notified: '#8B5CF6',
          collected: '#0EA5E9',
          cancelled: '#EF4444',
        },
      },
      fontFamily: {
        sans: ['Assistant', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        card: '0 1px 3px 0 rgba(0,0,0,0.07)',
        nav: '0 2px 8px 0 rgba(31,111,92,0.15)',
      },
      keyframes: {
        breathe: {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0.25' },
        },
      },
      animation: {
        breathe: 'breathe 1.6s ease-in-out infinite',
      },
    },
  },
  plugins: [],
};
