import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './pages/**/*.{ts,tsx}',
    './components/**/*.{ts,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        'hk-bg': '#1a1a2e',
        'hk-panel': '#1e1e2e',
        'hk-border': 'rgba(255, 255, 255, 0.1)',
        'hk-up': '#f63538',
        'hk-down': '#30cc5a',
        'hk-text': '#ccc',
        'hk-text-dim': '#999',
      },
    },
  },
  plugins: [],
}

export default config
