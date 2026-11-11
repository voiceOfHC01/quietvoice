/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        dark: {
          bg: '#0d0f12',
          surface: '#15181e',
          card: '#1c2027',
          border: 'rgba(255, 255, 255, 0.08)',
          pill: '#1e232b',
        },
        light: {
          bg: '#f4f6f9',
          surface: '#ffffff',
          card: '#ffffff',
          border: 'rgba(0, 0, 0, 0.08)',
          pill: '#e9eef5',
        },
        accent: {
          blue: '#2563eb',
          cyan: '#06b6d4',
          glow: '#00f2fe',
          red: '#ef4444',
          green: '#10b981',
          amber: '#f59e0b',
        }
      },
      boxShadow: {
        'glow-cyan': '0 0 25px rgba(6, 182, 212, 0.45)',
        'glow-red': '0 0 25px rgba(239, 68, 68, 0.45)',
        'tactile-dark': 'inset 0 1px 1px rgba(255,255,255,0.06), 0 8px 24px rgba(0,0,0,0.45)',
        'tactile-light': 'inset 0 1px 1px rgba(255,255,255,0.9), 0 8px 24px rgba(0,0,0,0.06)',
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
        mono: ['JetBrains Mono', 'Menlo', 'monospace'],
      }
    },
  },
  plugins: [],
}
