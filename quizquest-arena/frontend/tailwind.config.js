/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        background: '#0B0C10',
        paper: '#1F2833',
        primary: '#66FCF1',
        secondary: '#45A29E',
        accent: '#C5C6C7',
        danger: '#FF4136',
        success: '#2ECC40',
        warning: '#FF851B',
      },
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
        display: ['Outfit', 'sans-serif'],
        mono: ['Fira Code', 'monospace'],
      },
      animation: {
        'glow': 'glow 2s ease-in-out infinite alternate',
      },
      keyframes: {
        glow: {
          '0%': { boxShadow: '0 0 5px #66FCF1, 0 0 10px #66FCF1' },
          '100%': { boxShadow: '0 0 20px #66FCF1, 0 0 40px #66FCF1' },
        }
      }
    },
  },
  plugins: [],
}
