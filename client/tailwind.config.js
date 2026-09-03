/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./src/**/*.{js,jsx,ts,tsx}'],
  theme: {
    extend: {
      colors: {
        'page': '#F0F2F5',
        'panel': '#FFFFFF',
        'input-bg': '#F5F5F5',
        'chrome-dark': '#004D40',
        'chrome-section': '#00695C',
        'chrome-section-alt': '#00796B',
        'accent-teal': '#00838F',
        'accent-teal-light': '#4DB6AC',
        'text-dark': '#212121',
        'text-medium': '#616161',
        'text-light': '#9E9E9E',
        'status-hallucinated': '#D32F2F',
        'status-verified': '#388E3C',
        'status-mismatch': '#EF6C00',
        'status-uncertain': '#FBC02D',
        'border-light': '#E0E0E0',
        'border-focus': '#00ACC1',
        'row-hover': '#F5F5F5',
        'row-selected': '#E0F2F1',
        'tooltip-bg': '#263238',
        'tooltip-text': '#ECEFF1',
      },
      fontFamily: {
        sans: ['Inter', 'Roboto', 'system-ui', 'sans-serif'],
        mono: ['Roboto Mono', 'JetBrains Mono', 'monospace'],
      },
    },
  },
  plugins: [],
}; 
