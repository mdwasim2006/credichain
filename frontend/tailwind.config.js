/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx,ts,tsx}'],
  theme: {
    extend: {
      colors: {
        ink: {
          950: '#03111f',
          900: '#082033',
          800: '#0f2940'
        },
        slateui: {
          50: '#f8fafc',
          100: '#f1f5f9',
          200: '#e2e8f0',
          300: '#cbd5e1',
          400: '#94a3b8',
          500: '#64748b',
          600: '#475569',
          700: '#334155',
          800: '#1e293b',
          900: '#0f172a'
        },
        ocean: '#0ea5e9',
        mint: '#22c55e',
        amber: '#f59e0b',
        rose: '#ef4444'
      },
      fontFamily: {
        sans: ['Inter', 'ui-sans-serif', 'system-ui']
      },
      boxShadow: {
        glow: '0 12px 36px rgba(15, 23, 42, 0.08), 0 2px 10px rgba(15, 23, 42, 0.04)'
      }
    }
  },
  plugins: []
};