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
        // FinanzaFlow specific palette
        'fin-bg': '#020b14',
        'fin-card': '#050f1a',
        'fin-border': 'rgba(255, 255, 255, 0.05)',
        'fin-text': '#f1f5f9',
        'fin-muted': '#94a3b8',
        'brand': '#1fb6d5',
        'brand-hover': '#1fa7c4',
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