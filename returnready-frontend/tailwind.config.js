/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      fontFamily: {
        display: ["'DM Serif Display'", "serif"],
        body: ["'DM Sans'", "sans-serif"],
      },
      colors: {
  sand: "#F8F5F2",
  ink: "#1C1917",
  terra: "#C2410C",
  ember: "#FDBA74",
  muted: "#78716C",
  surface: "#F0EBE5",
},
    },
  },
  plugins: [],
}

