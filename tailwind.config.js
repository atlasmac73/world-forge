/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './lib/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        // ATLAS Design System — Gold on Black
        'atlas': {
          'dark':    '#05080f',   // Page background
          'surface': '#0a0e1a',   // Sidebar / nav
          'panel':   '#0f1525',   // Cards / panels
          'border':  'rgba(99,179,237,0.15)',
          'border-active': 'rgba(99,179,237,0.4)',
          'text':    '#e2e8f0',   // Primary text
          'muted':   '#718096',   // Secondary text
          'accent':  '#63b3ed',   // Primary blue/cyan
          'gold':    '#f6ad55',   // Gold accent
          'green':   '#68d391',   // Success / active
          'purple':  '#b794f4',   // Purple accent
          'coral':   '#fc8181',   // Danger / hot
          'teal':    '#4fd1c5',   // Teal accent
          'pink':    '#f687b3',   // Pink accent
        }
      },
      fontFamily: {
        'mono': ['var(--font-mono)', 'Fira Code', 'Cascadia Code', 'monospace'],
      },
      animation: {
        'fade-in':       'fadeIn 0.2s ease-out',
        'slide-in':      'slideIn 0.25s ease-out',
        'glow-pulse':    'glowPulse 2s ease-in-out infinite',
        'agent-pulse':   'agentPulse 1.5s ease-in-out infinite',
        'ticker':        'ticker 30s linear infinite',
        'spin-slow':     'spin 3s linear infinite',
      },
      keyframes: {
        fadeIn:     { from: { opacity: '0', transform: 'translateY(4px)' }, to: { opacity: '1', transform: 'translateY(0)' } },
        slideIn:    { from: { opacity: '0', transform: 'translateX(-8px)' }, to: { opacity: '1', transform: 'translateX(0)' } },
        glowPulse:  { '0%,100%': { boxShadow: '0 0 8px rgba(99,179,237,0.3)' }, '50%': { boxShadow: '0 0 20px rgba(99,179,237,0.6)' } },
        agentPulse: { '0%,100%': { opacity: '1' }, '50%': { opacity: '0.4' } },
        ticker:     { '0%': { transform: 'translateX(100vw)' }, '100%': { transform: 'translateX(-100%)' } },
      },
      backgroundImage: {
        'atlas-grid': `linear-gradient(rgba(99,179,237,0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(99,179,237,0.03) 1px, transparent 1px)`,
      },
      backgroundSize: {
        'grid': '32px 32px',
      },
    },
  },
  plugins: [],
}
