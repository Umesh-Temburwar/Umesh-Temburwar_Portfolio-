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
    },
  },
  plugins: [],
};
