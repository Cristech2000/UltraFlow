/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,jsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        // 🔥 ULTRA POWER NAVY BLUE
        primary: {
          DEFAULT: '#113264',
          50: '#f0f4fa',
          100: '#e0eaf5',
          200: '#c5d7eb',
          300: '#9bbde0',
          400: '#6c9dcf',
          500: '#4880bd',
          600: '#113264',
          700: '#102b57',
          800: '#0d2448',
          900: '#0a1d3a',
          950: '#061326',
        },
        // 🔥 ULTRA POWER FOREST GREEN
        accent: {
          DEFAULT: '#0b5e20',
          50: '#f0f9f3',
          100: '#dbf2e1',
          200: '#bce4c8',
          300: '#8fceaa',
          400: '#5fb185',
          500: '#3e9466',
          600: '#0b5e20',
          700: '#094d1a',
          800: '#073d15',
          900: '#052d0f',
          950: '#031a08',
        },
      },
    },
  },
  plugins: [],
}