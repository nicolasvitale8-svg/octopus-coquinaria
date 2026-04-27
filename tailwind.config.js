/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        // Display = Sora (headings, hero, claims)
        display: ['Sora', 'Inter', 'system-ui', 'sans-serif'],
        // Sans / UI = Inter (body, labels, botones)
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
        // Mono = IBM Plex Mono (código de doc, KPIs, datos)
        mono: ['"IBM Plex Mono"', '"JetBrains Mono"', 'ui-monospace', 'monospace'],
        // Aliases legacy para no romper componentes existentes hasta que se migren
        space: ['Sora', 'Inter', 'sans-serif'],
      },
      colors: {
        // ---------- Tokens nuevos (rebrand) ----------
        // Backgrounds
        'bg-base':         '#070D14',
        'bg-surface':      '#101826',
        'bg-surface-soft': '#162033',
        'bg-elevated':     '#1B2638',
        // Texto
        'text-primary':    '#F3EFE4',
        'text-secondary':  '#AAB4C3',
        'text-muted':      '#6F7A89',
        'text-on-gold':    '#1A1308',
        // Marca primaria (gold/cream)
        'gold':            '#D4B681',
        'gold-soft':       '#E8D6B0',
        'gold-dark':       '#9F7A43',
        // Acentos técnicos
        'cyan-tech':       '#1FB6D5',
        'blue-tech':       '#3B82F6',
        // Estados
        'state-success':   '#22C55E',
        'state-warning':   '#EAB308',
        'state-danger':    '#EF4444',
        'state-info':      '#8B5CF6',

        // ---------- Aliases legacy (para no romper código existente
        // antes de migrar pantalla por pantalla). Eliminar cuando esté
        // todo migrado. ----------
        'octopus-blue':    '#00344F',
        'deep-blue':       '#021019',
        'warm-sand':       '#F4EBDC',
        'bone-white':      '#F9F7F4',
        'cyan-detail':     '#1FB6D5',
        'ink-gray':        '#2E3238',
        'soft-gray':       '#D5D7DB',
        'status-green':    '#22C55E',
        'status-yellow':   '#EAB308',
        'status-red':      '#EF4444',
        'fin-bg':          '#070D14',
        'fin-card':        '#101826',
        'fin-border':      'rgba(243, 239, 228, 0.08)',
        'fin-text':        '#F3EFE4',
        'fin-muted':       '#AAB4C3',
        'brand':           '#D4B681',
        'brand-hover':     '#E8D6B0',
      },
      borderColor: {
        'subtle':   'rgba(212, 182, 129, 0.16)',
        'strong':   'rgba(212, 182, 129, 0.38)',
        'neutral':  'rgba(243, 239, 228, 0.08)',
        'divider':  'rgba(243, 239, 228, 0.04)',
      },
      boxShadow: {
        'glow-primary': '0 0 24px rgba(212, 182, 129, 0.24)',
        'glow-cyan':    '0 0 24px rgba(31, 182, 213, 0.20)',
        'glow-success': '0 0 24px rgba(34, 197, 94, 0.22)',
        'glow-danger':  '0 0 24px rgba(239, 68, 68, 0.22)',
        'card':         '0 4px 12px rgba(0, 0, 0, 0.4)',
        'elevated':     '0 12px 32px rgba(0, 0, 0, 0.5)',
      },
      borderRadius: {
        'sm': '6px',
        'md': '10px',
        'lg': '14px',
        'xl': '20px',
      },
      fontSize: {
        'display': ['clamp(2.5rem, 6vw, 4.5rem)', { lineHeight: '1.05', letterSpacing: '-0.02em' }],
      },
      animation: {
        'faulty-flicker':  'faulty-flicker 4s infinite linear',
        'shine':           'shine-effect 6s ease-in-out infinite',
        'marquee':         'marquee 60s linear infinite',
        'fade-in':         'fadeIn 0.5s ease-out forwards',
        'fade-in-up':      'fadeInUp 0.5s ease-out forwards',
        'progress':        'progress 1.5s ease-in-out infinite',
        'octopus-pulse':   'octopus-pulse 2.4s ease-in-out infinite',
      },
      keyframes: {
        'progress': {
          '0%':   { transform: 'scaleX(0)' },
          '100%': { transform: 'scaleX(1)' },
        },
        'octopus-pulse': {
          '0%, 100%': { opacity: '0.4', transform: 'scale(0.96)' },
          '50%':      { opacity: '1',   transform: 'scale(1)' },
        },
      },
    },
  },
  plugins: [],
};
