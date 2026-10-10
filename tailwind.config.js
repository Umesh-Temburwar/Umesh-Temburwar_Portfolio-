/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        background: '#0B0D10',
        surface: '#11151B',
        border: 'rgba(255, 255, 255, 0.08)',
        textMain: '#EDEDED',
        textMuted: '#8A8F98',
        primary: '#F5A524',
        primaryHover: '#F5A524',
      },
      fontFamily: {
        sans: ['Space Grotesk', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace'],
      },
      keyframes: {
        'scroll-line': {
          '0%': { transform: 'scaleX(0)', transformOrigin: 'left' },
          '50%': { transform: 'scaleX(1)', transformOrigin: 'left' },
          '50.1%': { transform: 'scaleX(1)', transformOrigin: 'right' },
          '100%': { transform: 'scaleX(0)', transformOrigin: 'right' },
        }
      },
      animation: {
        'scroll-line': 'scroll-line 2s cubic-bezier(0.86, 0, 0.07, 1) infinite',
      }
    },
  },
  plugins: [],
};
