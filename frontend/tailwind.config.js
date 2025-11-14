/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: 'class', // Enable class-based dark mode
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // PRD Light Theme Colors (Default)
        'cream': '#F0F0DC',
        'charcoal': '#36454F',
        'lightblue': '#ADD8E6',
        
        // Dark Theme Colors (Optional)
        'petflix-black': '#141414',
        'petflix-dark': '#181818',
        'petflix-dark-gray': '#2F2F2F',
        'petflix-gray': '#808080',
        'petflix-light-gray': '#B3B3B3',
        'petflix-red': '#E50914',
        'petflix-orange': '#FF6B35',
      },
      fontFamily: {
        'sans': ['Netflix Sans', 'Helvetica Neue', 'Segoe UI', 'Roboto', 'Ubuntu', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
