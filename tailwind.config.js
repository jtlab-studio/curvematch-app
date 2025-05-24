/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Brand Colors
        primary: '#252525',
        secondary: '#ff9800',
        tertiary: '#ff5722',
        
        // Accent Colors
        'accent-1': '#2196f3',
        'accent-2': '#00bcd4',
        'accent-3': '#26a69a',
        
        // Semantic Colors
        success: '#249689',
        error: '#dc143c',
        warning: '#fce62f',
        info: '#ffffff',
      },
      fontFamily: {
        sans: ['Quicksand', 'system-ui', 'sans-serif'],
      },
      backdropBlur: {
        xs: '2px',
      },
    },
  },
  plugins: [],
}
