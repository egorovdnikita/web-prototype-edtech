import type { Subject } from "@mocks/course";

// Стиль прототипа — набор мод Box UI в одном месте.
// Сейчас: Brand · Color «monochrome» · Brand · Typography «inter» ·
// Brand · Icon «bold» · радиусы «medium», без теней.
// Предмету можно дать свою моду Brand · Color — одной строкой в ACCENT.

const ACCENT: Record<Subject, string> = { soc: "monochrome", hist: "monochrome" };

export const FONT = "inter";

/** Brand · Icon. «linear» — контурные, заливка только у активного и сделанного; «bold» — все залитые,
 * кроме стрелок: они всегда контурные (src/components/ui/icon.tsx). */
export const ICON: "linear" | "bold" = "bold";

export const RADIUS = "medium";

/** Мода Brand · Color для предмета. */
export const accentOf = (subject: Subject) => ACCENT[subject];
