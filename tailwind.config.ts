import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './index.html',
    './src/**/*.{ts,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          50:  '#f9ffe0',
          100: '#f3fdb5',
          200: '#ebfa80',
          300: '#def645',
          400: '#d4f530',
          500: '#C9F31D',
          600: '#a8cc0a',
          700: '#82a000',
          800: '#5e7500',
          900: '#3d4e00',
        },
        // Editorial neutral palette
        ink: {
          DEFAULT: '#111111',
          muted:   '#555555',
          faint:   '#999999',
          ghost:   '#cccccc',
        },
        surface: {
          DEFAULT: '#ffffff',
          warm:    '#f7f7f5',
          subtle:  '#f2f2f0',
        },
      },
      fontFamily: {
        sans: ['"Plus Jakarta Sans"', 'Inter', 'ui-sans-serif', 'system-ui', 'sans-serif'],
      },
      // Editorial shadow system — very soft, diffuse
      boxShadow: {
        'xs':      '0 1px 3px rgba(0,0,0,0.06)',
        'sm':      '0 2px 8px rgba(0,0,0,0.07)',
        'md':      '0 4px 16px rgba(0,0,0,0.08)',
        'lg':      '0 8px 32px rgba(0,0,0,0.09)',
        'xl':      '0 16px 56px rgba(0,0,0,0.10)',
        '2xl':     '0 24px 80px rgba(0,0,0,0.12)',
        'card':    '0 1px 4px rgba(0,0,0,0.06), 0 1px 2px rgba(0,0,0,0.04)',
        'card-md': '0 4px 20px rgba(0,0,0,0.08)',
        'card-lg': '0 12px 48px rgba(0,0,0,0.10)',
        'glow':    '0 0 0 3px rgba(201,243,29,0.25)',
        'glow-lg': '0 8px 32px rgba(201,243,29,0.4)',
        'inner-sm':'inset 0 1px 2px rgba(0,0,0,0.05)',
        'none':    'none',
      },
      // Generous spacing scale
      spacing: {
        '18': '4.5rem',
        '22': '5.5rem',
        '26': '6.5rem',
        '30': '7.5rem',
      },
      borderRadius: {
        DEFAULT: '0px',
        'sm': '2px',
        'md': '4px',
        'lg': '6px',
        'xl': '8px',
        '2xl': '12px',
        '3xl': '18px',
        'full': '9999px',
      },
      letterSpacing: {
        'tightest': '-0.04em',
        'tighter': '-0.03em',
        'tight': '-0.02em',
        'editorial': '0.12em',
        'widest': '0.2em',
      },
      transitionTimingFunction: {
        'editorial': 'cubic-bezier(0.25, 0.46, 0.45, 0.94)',
        'spring': 'cubic-bezier(0.16, 1, 0.3, 1)',
      },
      transitionDuration: {
        '250': '250ms',
        '350': '350ms',
        '450': '450ms',
        '550': '550ms',
      },
    },
  },
  plugins: [],
}

export default config
