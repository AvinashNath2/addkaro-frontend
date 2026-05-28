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
          500: '#C9F31D',   // acid yellow — primary accent
          600: '#a8cc0a',
          700: '#82a000',
          800: '#5e7500',
          900: '#3d4e00',
        },
      },
      fontFamily: {
        sans: ['"Plus Jakarta Sans"', 'Inter', 'ui-sans-serif', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        'card':    '0 1px 4px 0 rgb(0 0 0 / 0.35), 0 1px 2px -1px rgb(0 0 0 / 0.2)',
        'card-md': '0 4px 20px 0 rgb(0 0 0 / 0.45), 0 2px 6px -2px rgb(0 0 0 / 0.25)',
        'card-lg': '0 12px 40px 0 rgb(0 0 0 / 0.55), 0 4px 10px -4px rgb(0 0 0 / 0.3)',
        'glow':    '0 0 0 3px rgba(201,243,29,0.25)',
      },
      borderRadius: {
        '2xl': '1rem',
        '3xl': '1.25rem',
      },
    },
  },
  plugins: [],
}

export default config
