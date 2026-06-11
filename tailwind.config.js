/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        bg: '#0e0e0e',
        green: '#39FF14',
        text: '#EAEAE6',
        muted: '#565656',
        surface: 'rgba(24,24,24,0.72)',
        border: 'rgba(255,255,255,0.09)',
      },
      fontFamily: {
        hero: ['Unbounded', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace'],
        body: ['DM Sans', 'sans-serif'],
      },
      boxShadow: {
        'card': '0 24px 80px rgba(0,0,0,0.65), 0 8px 24px rgba(0,0,0,0.4), inset 0 0 0 1px rgba(255,255,255,0.04)',
      }
    },
  },
  plugins: [],
}
