import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/app/**/*.{ts,tsx}",
    "./src/components/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          50: "#f2f6ff",
          100: "#e2ebff",
          500: "#3b5bfd",
          600: "#2f47d6",
          700: "#2637a8",
        },
      },
    },
  },
  plugins: [],
};
export default config;
