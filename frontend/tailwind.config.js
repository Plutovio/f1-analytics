/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace'],
      },
      keyframes: {
        draw: {
          to: { strokeDashoffset: '0' }
        },
        grow: {
          from: { transform: 'scaleY(0)' },
          to: { transform: 'scaleY(1)' }
        }
      },
      animation: {
        draw: 'draw 2s ease-out forwards',
        grow: 'grow 1s ease-out forwards'
      }
    },
  },
  plugins: [],
}
