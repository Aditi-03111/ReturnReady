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
  sand: "#0D0B1A",
  ink: "#E8E0FF",
  terra: "#A855F7",
  ember: "#C084FC",
  muted: "#8B7AA8",
  surface: "#13102A",
  nebula: "#1E1A3A",
  star: "#F3EEFF",
},
    },
  },
  plugins: [],
}

