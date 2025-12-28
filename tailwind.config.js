/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}"
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
        space: ['Space Grotesk', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace'],
      },
      colors: {
        'octopus-blue': '#00344F',
        'deep-blue': '#021019',
        'warm-sand': '#F4EBDC',
        'bone-white': '#F9F7F4',
        'cyan-detail': '#1FB6D5',
        'ink-gray': '#2E3238',
        'soft-gray': '#D5D7DB',
        'status-green': '#1FA77A',
        'status-yellow': '#F2B350',
        'status-red': '#D64747',
      },
      animation: {
        'faulty-flicker': 'faulty-flicker 4s infinite linear',
        'shine': 'shine-effect 6s ease-in-out infinite',
        'marquee': 'marquee 60s linear infinite',
        'fade-in': 'fadeIn 0.5s ease-out forwards',
        'fade-in-up': 'fadeInUp 0.5s ease-out forwards',
      },
    },
  },
  plugins: [],
}