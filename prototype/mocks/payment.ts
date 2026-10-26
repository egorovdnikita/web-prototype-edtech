// Оплата обучения (B20) — по действующему правилу ЕНЛ, а не по модели FANS
// (расхождение №10 в docs/materials-analysis.md, рекомендация — модель ЕНЛ):
//   — календарный месяц, единый день оплаты — 1-е число;
//   — цена фиксируется на весь год по цене покупки;
//   — оплаченные месяцы открыты; пропустил месяц и оплатил следующий — пропущенный закрыт;
//   — просрочка: открытое доступно ещё месяц, новые уроки не открываются (02.06);
//     вернуться — оплатив остаток месяца или следующий месяц целиком (02.07);
//   — не оплатил до конца просроченного месяца — отчисление, возвращение через менеджера.
// Цены — кадр урока по GetCourse (ГК27, обществознание). Скидки — ответы ЕНЛ.

import type { Subject } from "./course";

export interface CourseMonth {
  id: string;
  title: string;
  /** Последний день месяца — до него открыт доступ. */
  last: string;
}

export const MONTHS: CourseMonth[] = [
  { id: "2026-09", title: "сентябрь", last: "30 сентября" },
  { id: "2026-10", title: "октябрь", last: "31 октября" },
  { id: "2026-11", title: "ноябрь", last: "30 ноября" },
  { id: "2026-12", title: "декабрь", last: "31 декабря" },
  { id: "2027-01", title: "январь", last: "31 января" },
  { id: "2027-02", title: "февраль", last: "28 февраля" },
  { id: "2027-03", title: "март", last: "31 марта" },
  { id: "2027-04", title: "апрель", last: "30 апреля" },
  { id: "2027-05", title: "май", last: "31 мая" },
];

/** Цена месяца, зафиксированная при покупке (дальше месяцев — не первый месяц). */
export const MONTH_PRICE: Record<Subject, number> = {
  soc: 4650, // «С инструктором»
  hist: 3400, // «Фристайл»
};

export const DISCOUNTS = {
  /** Два предмета одним платежом — то, что школа называет корзиной. */
  bothSubjects: 10,
  /** Оплата до конца курса разом. */
  wholeCourse: 10,
};

export const INITIAL_PAID: Record<Subject, string[]> = {
  soc: ["2026-09", "2026-10"],
  hist: ["2026-09", "2026-10"],
};

export const HISTORY: { date: string; what: string; sum: number; payer: string }[] = [
  { date: "29.08", what: "Бронь места", sum: 500, payer: "родитель" },
  // Первый месяц: 3950 + 2800, −10% за два предмета = 6075, минус бронь 500.
  { date: "01.09", what: "Сентябрь · общество + история, минус бронь", sum: 5575, payer: "родитель" },
  // 4650 + 3400, −10% за два предмета.
  { date: "30.09", what: "Октябрь · общество + история", sum: 7245, payer: "родитель" },
];

/**
 * Сценарии для показа. В прототипе «сегодня» можно сдвинуть:
 *   ok — 25.10, ноябрь ещё впереди;
 *   overdue — 3.11, ноябрь не оплачен: открытое доступно до 30.11, новое не открывается;
 *   expelled — 1.12, ноябрь так и не оплачен: отчисление.
 */
export type PaymentScenario = "ok" | "overdue" | "expelled";

export const SCENARIOS: Record<PaymentScenario, { label: string; today: string; dayOfMonth: number }> = {
  ok: { label: "сейчас · 25 октября", today: "25.10", dayOfMonth: 25 },
  overdue: { label: "просрочка · 3 ноября", today: "03.11", dayOfMonth: 3 },
  expelled: { label: "отчисление · 1 декабря", today: "01.12", dayOfMonth: 1 },
};

/** Остаток просроченного месяца: по дням, с округлением до сотни. */
export function restOfMonth(price: number, fromDay: number, daysInMonth = 30) {
  const days = daysInMonth - fromDay + 1;
  return Math.round(((price * days) / daysInMonth) / 100) * 100;
}

export const rub = (n: number) => `${n.toLocaleString("ru-RU")} ₽`;
