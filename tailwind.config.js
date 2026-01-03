/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['"Space Grotesk"', 'Inter', 'system-ui', 'sans-serif'],
        display: ['"Cormorant Garamond"', 'serif'],
        mobile: ['"Manrope"', 'Inter', 'system-ui', 'sans-serif'],
      },
      colors: {
        sand: {
          50: '#fdf9f2',
          100: '#f7f1e6',
          200: '#efe3cd',
          300: '#e3cfad',
          400: '#d6b78a',
        },
        ink: {
          700: '#1f1b16',
          800: '#18140f',
          900: '#120f0b',
        },
        accent: '#1f2937',
      },
      boxShadow: {
        card: '0 24px 80px rgba(0,0,0,0.18)',
      },
    },
  },
  plugins: [],
}
