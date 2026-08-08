/** Tailwind config: Code à Cuisine palette + fonts from the Figma design. */
/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./src/**/*.{html,ts}"],
  theme: {
    extend: {
      fontFamily: {
        ubuntu: ["Ubuntu", "ui-sans-serif", "system-ui", "sans-serif"],
        quicksand: ["Quicksand", "ui-sans-serif", "system-ui", "sans-serif"],
      },
      colors: {
        forest: "#396039",
        creme: "#faf0e6",
        peach: "#ffd9b3",
        sage: "#c4d0c4",
        beige: "#f5f5dc",
        leaf: "#008000",
        "forest-dark": "#2c452c",
        "mid-green": "#1e5515",
        "deep-green": "#10310b",
      },
    },
  },
  plugins: [],
};
