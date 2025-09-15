import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        ink: "#f5f5f5",
        bg: "#0b0b0b",
        panel: "#121212",
        muted: "#b7b7b7",
        simonis: "#39a0ff" // tasteful blue accent
      }
    },
  },
  plugins: [],
}
export default config
