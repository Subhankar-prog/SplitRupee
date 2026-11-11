import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: "class",
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  theme: {
    extend: {
      screens: {
        xs: "400px",
      },
      fontFamily: {
        sans: ["var(--font-inter)", "system-ui", "-apple-system", "sans-serif"],
        display: ["var(--font-manrope)", "var(--font-inter)", "system-ui", "sans-serif"],
      },
      colors: {
        canvas: "var(--bg-canvas)",
        surface: "var(--bg-surface)",
        "surface-alt": "var(--bg-surface-secondary)",
        ink: "var(--text-primary)",
        "ink-muted": "var(--text-secondary)",
        edge: "var(--border-subtle)",
        sage: {
          DEFAULT: "var(--brand-primary)",
          dark: "var(--brand-dark)",
        },
        sand: "var(--accent-sand)",
        positive: "var(--status-positive)",
        negative: "var(--status-negative)",
        warning: "var(--status-warning)",
      },
      borderRadius: {
        card: "16px",
        control: "12px",
      },
      boxShadow: {
        card: "var(--shadow-card)",
        popover: "var(--shadow-popover)",
      },
    },
  },
  plugins: [],
};
export default config;
