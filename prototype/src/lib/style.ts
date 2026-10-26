import type { Subject } from "@mocks/course";

// Стиль прототипа — набор мод Box UI в одном месте.
// Сейчас: Box UI · Brand Color «monochrome» · Brand Typography «inter-tight» ·
// Brand Icon «bold» · радиусы «medium», без теней.
// Вернуть стиль ЕНЛ: ACCENT → { soc: "soc", hist: "hist" }, FONT → "enl" —
// тёплая тема, цвета предметов и Raleway включатся сами (src/styles/enl.css).

const ACCENT: Record<Subject, string> = { soc: "monochrome", hist: "monochrome" };

export const FONT = "inter-tight";

/** Brand · Icon. «linear» — контурные, заливка только у активного и сделанного; «bold» — все залитые. */
export const ICON: "linear" | "bold" = "bold";

export const RADIUS = "medium";

/** Мода Brand · Color для предмета. */
export const accentOf = (subject: Subject) => ACCENT[subject];
