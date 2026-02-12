import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx}",
    "./components/**/*.{js,ts,jsx,tsx}"
  ],
  theme: {
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

