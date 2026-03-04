import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx}",
    "./components/**/*.{js,ts,jsx,tsx}"
  ],
  theme: {
    fontSize: {
      xs: ["0.9375rem", { lineHeight: "1rem" }],
      sm: ["1.0625rem", { lineHeight: "1.25rem" }],
      base: ["1.1875rem", { lineHeight: "1.5rem" }],
      lg: ["1.3125rem", { lineHeight: "1.75rem" }],
      xl: ["1.4375rem", { lineHeight: "1.75rem" }],
      "2xl": ["1.6875rem", { lineHeight: "2rem" }],
      "3xl": ["2.0625rem", { lineHeight: "2.25rem" }],
      "4xl": ["2.4375rem", { lineHeight: "2.5rem" }],
      "5xl": ["3.1875rem", { lineHeight: "1" }],
      "6xl": ["3.9375rem", { lineHeight: "1" }],
      "7xl": ["4.6875rem", { lineHeight: "1" }],
      "8xl": ["6.1875rem", { lineHeight: "1" }],
      "9xl": ["8.1875rem", { lineHeight: "1" }]
    },
    extend: {
      colors: {
        sidebar: "var(--sidebar-bg)",
        "sidebar-text": "var(--sidebar-text)",
        "sidebar-hover": "var(--sidebar-hover)",
        "sidebar-active": "var(--sidebar-active)",
        primary: "var(--primary-color)",
        "primary-hover": "var(--primary-hover-color)",
        "primary-light": "var(--primary-light-color)",
        "primary-text": "var(--primary-text)",
      }
    }
  },
  plugins: []
};

export default config;
