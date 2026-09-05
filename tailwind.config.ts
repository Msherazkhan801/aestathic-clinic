import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        clinic: {
          50: "#FAF7F5",
          100: "#F4EEEB",
          200: "#E9DDD8",
          300: "#D7C2BA",
          400: "#C0A195",
          500: "#AA8273", // Rose-Gold / Blush Bronze tone
          600: "#946B5C",
          700: "#7A5447",
          800: "#64463B",
          900: "#533B32",
          950: "#2C1D18",
        },
        gold: {
          50: "#FDFBF4",
          100: "#FAF6E5",
          200: "#F4ECC9",
          300: "#EBDE9F",
          400: "#DEC86E",
          500: "#CCA938",
          600: "#B8902A",
          700: "#966F23",
          800: "#7B5822",
          900: "#674921",
        },
        dark: {
          bg: "#0B0F17",
          surface: "#111827",
          card: "#182234",
          border: "#26354D",
          muted: "#94A3B8",
        }
      },
      fontFamily: {
        sans: ["var(--font-sans)", "system-ui", "sans-serif"],
        display: ["var(--font-display)", "Georgia", "serif"],
      },
      boxShadow: {
        glass: "0 8px 32px 0 rgba(0, 0, 0, 0.08)",
        "glass-dark": "0 8px 32px 0 rgba(0, 0, 0, 0.37)",
        glow: "0 0 25px -5px rgba(170, 130, 115, 0.3)",
        "glow-gold": "0 0 25px -5px rgba(204, 169, 56, 0.3)",
      },
      backdropBlur: {
        xs: "2px",
      }
    },
  },
  plugins: [],
};

export default config;
