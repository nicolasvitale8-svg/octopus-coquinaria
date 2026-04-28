/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        // Display = Exo 2 (headings, hero, claims, HUD titles)
        display: ['"Exo 2"', 'Sora', 'system-ui', 'sans-serif'],
        // Sans / UI = Exo 2 (body, labels, botones)
        sans: ['"Exo 2"', 'Inter', 'system-ui', '-apple-system', 'sans-serif'],
        // Mono = IBM Plex Mono (código de doc, KPIs, datos, terminal)
        mono: ['"IBM Plex Mono"', '"JetBrains Mono"', 'ui-monospace', 'monospace'],
        // Aliases legacy
        space: ['"Exo 2"', 'Sora', 'sans-serif'],
      },
      colors: {
        // ---------- FASE 2 — Phosphor / HUD ----------
        // Backgrounds (abyss black scale)
        'bg-base':         '#050607',
        'bg-surface':      '#0F1416',
        'bg-surface-soft': '#161D22',
        'bg-elevated':     '#1A2025',
        // Texto
        'text-primary':    '#E6E8E5',
        'text-secondary':  '#A8B0B5',
        'text-muted':      '#636A6F',
        'text-on-phosphor':'#050607',
        // Marca primaria (phosphor green)
        'phosphor':        '#00FF9D',
        'phosphor-soft':   '#5DFFC1',
        'phosphor-dark':   '#00B070',
        'terminal-green':  '#00C57D',
        // Acentos técnicos
        'amber-hud':       '#FFB12A',
        'cyan-tech':       '#00FF9D', // alias for backwards compat
        'blue-tech':       '#3B82F6',
        // Estados
        'state-success':   '#00C57D',
        'state-warning':   '#FFB12A',
        'state-danger':    '#FF4D4D',
        'state-info':      '#00FF9D',

        // ---------- Aliases legacy (no romper código aún) ----------
        // Mapean tokens antiguos a la paleta nueva para que páginas
        // todavía no migradas no queden con colores rotos.
        'gold':            '#00FF9D',  // gold ahora es phosphor
        'gold-soft':       '#5DFFC1',
        'gold-dark':       '#00B070',
        'octopus-blue':    '#0F1416',
        'deep-blue':       '#050607',
        'warm-sand':       '#E6E8E5',
        'bone-white':      '#F2F4F1',
        'cyan-detail':     '#00FF9D',
        'ink-gray':        '#1A2025',
        'soft-gray':       '#A8B0B5',
        'status-green':    '#00C57D',
        'status-yellow':   '#FFB12A',
        'status-red':      '#FF4D4D',
        'fin-bg':          '#050607',
        'fin-card':        '#0F1416',
        'fin-border':      'rgba(230, 232, 229, 0.08)',
        'fin-text':        '#E6E8E5',
        'fin-muted':       '#A8B0B5',
        'brand':           '#00FF9D',
        'brand-hover':     '#5DFFC1',
        'text-on-gold':    '#050607',
      },
      borderColor: {
        'subtle':   'rgba(0, 255, 157, 0.14)',
        'strong':   'rgba(0, 255, 157, 0.38)',
        'neutral':  'rgba(230, 232, 229, 0.08)',
        'divider':  'rgba(230, 232, 229, 0.04)',
      },
      boxShadow: {
        'glow-primary':   '0 0 24px rgba(0, 255, 157, 0.30)',
        'glow-secondary': '0 0 18px rgba(0, 197, 125, 0.22)',
        'glow-amber':     '0 0 22px rgba(255, 177, 42, 0.28)',
        'glow-danger':    '0 0 22px rgba(255, 77, 77, 0.24)',
        'glow-cyan':      '0 0 24px rgba(0, 255, 157, 0.30)',
        'glow-success':   '0 0 18px rgba(0, 197, 125, 0.22)',
        'card':           '0 4px 12px rgba(0, 0, 0, 0.6)',
        'elevated':       '0 12px 32px rgba(0, 0, 0, 0.7)',
      },
      borderRadius: {
        'sm': '2px',
        'md': '4px',
        'lg': '6px',
        'xl': '10px',
      },
      fontSize: {
        'display': ['clamp(2.75rem, 6vw, 5rem)', { lineHeight: '1.05', letterSpacing: '-0.02em' }],
      },
      animation: {
        'faulty-flicker':  'faulty-flicker 4s infinite linear',
        'shine':           'shine-effect 6s ease-in-out infinite',
        'marquee':         'marquee 60s linear infinite',
        'fade-in':         'fadeIn 0.5s ease-out forwards',
        'fade-in-up':      'fadeInUp 0.5s ease-out forwards',
        'progress':        'progress 1.5s ease-in-out infinite',
        'octopus-pulse':   'octopus-pulse 2.4s ease-in-out infinite',
        'phosphor-pulse':  'phosphor-pulse 2s ease-in-out infinite',
        'scanline':        'scanline 4s linear infinite',
        'radar-sweep':     'radar-sweep 4s linear infinite',
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
        'phosphor-pulse': {
          '0%, 100%': { opacity: '0.55', filter: 'drop-shadow(0 0 4px rgba(0,255,157,0.3))' },
          '50%':      { opacity: '1',    filter: 'drop-shadow(0 0 12px rgba(0,255,157,0.7))' },
        },
        'scanline': {
          '0%':   { transform: 'translateY(-100%)', opacity: '0' },
          '10%':  { opacity: '0.6' },
          '90%':  { opacity: '0.6' },
          '100%': { transform: 'translateY(100%)',  opacity: '0' },
        },
        'radar-sweep': {
          '0%':   { transform: 'rotate(0deg)' },
          '100%': { transform: 'rotate(360deg)' },
        },
      },
    },
  },
  plugins: [],
};
