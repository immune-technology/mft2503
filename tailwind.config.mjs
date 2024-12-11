/** @type {import('tailwindcss').Config} */
export default {
  content: ["./src/**/*.{astro,html,js,jsx,md,mdx,svelte,ts,tsx,vue}"],
  theme: {
    extend: {
      colors: {
        primary: "theme(colors.red.600)",
        secondary: "theme(colors.red.950)",
      },
      container: {
        center: true,
        padding: "20px",
      },
      letterSpacing: {
        ch: "1ch",
      },
    },
  },
  plugins: [],
};
