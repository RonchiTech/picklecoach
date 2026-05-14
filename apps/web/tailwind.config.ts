import type { Config } from 'tailwindcss'

const config: Config = {
  content: ['./src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        base: '#0C0C10',
        surface: '#16161E',
        border: '#22222E',
        muted: '#555566',
        accent: '#C8F135',
        'text-primary': '#FFFFFF',
        'text-secondary': '#CCCCCC',
        error: '#FF6B6B',
      },
      fontFamily: {
        outfit: ['var(--font-outfit)', 'sans-serif'],
        dm: ['var(--font-dm-sans)', 'sans-serif'],
      },
    },
  },
}

export default config
