import type { Config } from "tailwindcss";

export default {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/utils/**/*.{js,ts,jsx,tsx,mdx}", // Added utils directory
  ],
  theme: {
    extend: {
      colors: {
        background: "var(--background)",
        foreground: "var(--foreground)",
        gaBlue: "#1A73E8",
        primary: {
          start: '#00c7df',
          end: '#ced661',
        },
      },
      boxShadow: {
        'primary': '0 4px 6px -1px rgba(0, 199, 223, 0.3)',
      },
    },
  },
  plugins: [],
} satisfies Config;