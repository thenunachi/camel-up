/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ["Inter", "system-ui", "-apple-system", "sans-serif"],
        serif: ["Lora", "Georgia", "Cambria", "serif"],
      },
      colors: {
        surface: "#16161e",
        "surface-2": "#1a1a26",
      },
      borderOpacity: {
        8: "0.08",
      },
    },
  },
  plugins: [],
};
