import type { Config } from "tailwindcss";

// Цвета и радиусы — только через токены Box UI и --enl-*. Теней нет: слои делят обводки.
// В компонентах никаких hex: surface / accent / ink.
const config: Config = {
  content: ["./src/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      colors: {
        surface: {
          page: "var(--surface-base-fill-page)",
          raised: "var(--surface-base-fill-raised)",
          subtle: "var(--surface-base-fill-layer-subtle)",
          subject: "var(--enl-subject-fill)",
          "subject-strong": "var(--enl-subject-fill-strong)",
          marker: "var(--enl-marker)",
          lime: "var(--enl-lime)",
        },
        accent: {
          DEFAULT: "var(--accent-fill-solid)",
          soft: "var(--accent-fill-soft)",
          border: "var(--enl-accent-border, var(--accent-border-default))",
          on: "var(--accent-content-on-solid-default)",
        },
        ink: {
          DEFAULT: "var(--surface-base-content-strong)",
          muted: "var(--surface-base-content-muted)",
          subtle: "var(--surface-base-content-subtle)",
          accent: "var(--accent-content-on-soft-default)",
          olive: "var(--enl-olive-ink)",
        },
        line: {
          DEFAULT: "var(--surface-base-border-default)",
          strong: "var(--surface-base-border-strong)",
          subtle: "var(--surface-base-border-subtle)",
        },
      },
      // Насыщенность через моду гарнитуры: в Inter Tight bold — 600, extrabold — 700.
      fontWeight: {
        bold: "var(--enl-weight-bold, 700)",
        extrabold: "var(--enl-weight-extrabold, 800)",
      },
      borderRadius: {
        // box-*: у Tailwind уже есть rounded-s / rounded-l (логические стороны)
        "box-xs": "var(--rounding-xs)",
        "box-s": "var(--rounding-s)",
        "box-m": "var(--rounding-m)",
        "box-l": "var(--rounding-l)",
        "box-xl": "var(--rounding-xl)",
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
};
export default config;
