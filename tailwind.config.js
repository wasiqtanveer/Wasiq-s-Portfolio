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
        // Secondary text. Was #565656, which measured ~2.7:1 against the page
        // background — under the 4.5:1 floor, so every label, caption, and
        // metadata line on the site was failing WCAG AA. #8A8A85 keeps the same
        // desaturated warm-gray character at ~5.7:1.
        muted: '#8A8A85',
        // Placeholders and disabled text. Was #2e2e2e at ~1.4:1, effectively
        // invisible. ~4.6:1 — still clearly recessive, now actually readable.
        faint: '#7A7A75',
        surface: 'rgba(24,24,24,0.72)',
        border: 'rgba(255,255,255,0.09)',
        danger: '#ff5c5c',
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
