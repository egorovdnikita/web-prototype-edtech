import type { Config } from "tailwindcss";

// Цвета и радиусы — только семантические токены Box UI. Теней нет: слои делят обводки.
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
        },
        accent: {
          DEFAULT: "var(--accent-fill-solid)",
          soft: "var(--accent-fill-soft)",
          on: "var(--accent-content-on-solid-default)",
        },
        ink: {
          DEFAULT: "var(--surface-base-content-strong)",
          muted: "var(--surface-base-content-muted)",
          subtle: "var(--surface-base-content-subtle)",
          accent: "var(--accent-content-on-soft-default)",
          disabled: "var(--interaction-disabled-content)",
        },
        // System · Status: тон задаёт data-status на самом элементе (positive / warning / negative).
        status: {
          DEFAULT: "var(--status-fill-solid)",
          soft: "var(--status-fill-soft)",
          ink: "var(--status-content-on-surface-default)",
          border: "var(--status-border-default)",
        },
        line: {
          DEFAULT: "var(--surface-base-border-default)",
          strong: "var(--surface-base-border-strong)",
          subtle: "var(--surface-base-border-subtle)",
        },
      },
      // Inter на полступени легче: bold — 600, extrabold — 700.
      fontWeight: {
        bold: "600",
        extrabold: "700",
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
