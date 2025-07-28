/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // NVIDIA Green palette
        nvidia: {
          50: '#f0fdf4',
          100: '#dcfce7',
          200: '#bbf7d0',
          300: '#86efac',
          400: '#4ade80',
          500: '#76B900', // NVIDIA Green
          600: '#5A8C00',
          700: '#15803d',
          800: '#166534',
          900: '#14532d',
        },
        // Premium gray palette
        gray: {
          50: '#F5F6FA',
          100: '#E8E9F0',
          200: '#C4C6D0',
          300: '#9194A1',
          400: '#6B6D7C',
          500: '#404252',
          600: '#2A2B35',
          700: '#1E1F26',
          800: '#141519',
          900: '#0A0B0D',
        }
      },
      backdropBlur: {
        xs: '2px',
      },
      animation: {
        'fade-in': 'fadeIn 0.5s ease-in-out',
        'slide-up': 'slideUp 0.3s ease-out',
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { transform: 'translateY(10px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
      },
    },
  },
  plugins: [],
}