// Календарь и встречи по записи. Ученик учится на двух предметах —
// Календарь общий для всех его курсов.
//
// Форматы встреч:
//   вебинар — для всего курса, без записи и лимита, ведёт преподаватель;
//   продлёнка — разбор ДЗ, до 30 учеников, ведёт проверяющий (под ником — он анонимен);
//   воркшоп — тема второй части, до 100, ведёт ведущий проверяющих;
//   коворкинг — свободная тема, до 30, ведёт наставник, без видеозаписи;
//   зачёт — один на один с наставником, по билетам, на «Стандарт» и «Премиум», не чаще раза в месяц.

import type { Subject } from "./course";

export type MeetingKind = "webinar" | "extension" | "workshop" | "coworking" | "exam";
export type EventKind = "lesson" | "deadline" | MeetingKind;

export interface CalendarEvent {
  id: string;
  kind: EventKind;
  /** all — встреча для всей школы, видна в обоих предметах. */
  subject: Subject | "all";
  title: string;
  /** ISO-дата, 2026. */
  date: string;
  time?: string;
  end?: string;
  host?: string;
  capacity?: number;
  /** Сколько мест уже занято без учёта самого ученика. */
  taken?: number;
  about?: string;
  /** Куда ведёт: урок или работа. */
  href?: string;
}

export const MEETING_LABEL: Record<EventKind, string> = {
  lesson: "урок",
  deadline: "дедлайн",
  webinar: "вебинар",
  extension: "продлёнка",
  workshop: "воркшоп",
  coworking: "коворкинг",
  exam: "зачёт",
};

/** Недели потока: начинаются в субботу. */
export const CAL_WEEKS = [
  { number: 7, days: ["2026-10-17", "2026-10-18", "2026-10-19", "2026-10-20", "2026-10-21", "2026-10-22", "2026-10-23"] },
  { number: 8, days: ["2026-10-24", "2026-10-25", "2026-10-26", "2026-10-27", "2026-10-28", "2026-10-29", "2026-10-30"] },
  { number: 9, days: ["2026-10-31", "2026-11-01", "2026-11-02", "2026-11-03", "2026-11-04", "2026-11-05", "2026-11-06"] },
];

export const TODAY_ISO = "2026-10-25";
/** Встречи дальше этой минуты — ещё впереди. Сегодня вс 25.10, 12:00. */
export const NOW = "2026-10-25T12:00";

export const EVENTS: CalendarEvent[] = [
  // --- неделя 7 (прошла)
  { id: "soc-l13", kind: "lesson", subject: "soc", title: "Урок 13 открыт", date: "2026-10-17", href: "/soc/lesson/soc-13" },
  { id: "hist-l13", kind: "lesson", subject: "hist", title: "Урок 13 открыт", date: "2026-10-17", href: "/hist/lesson/hist-13" },
  { id: "soc-w7-web", kind: "webinar", subject: "soc", title: "Практика с преподавателем: задание 24", date: "2026-10-19", time: "17:00", end: "18:30", host: "Преподаватель", about: "Запись и задачник — в уроке 13." },
  { id: "soc-w7-ext", kind: "extension", subject: "soc", title: "Продлёнка: ДЗ «Задание 25: государство»", date: "2026-10-22", time: "18:00", end: "19:00", host: "куратор Сова", capacity: 30, taken: 24, about: "Запись разбора — в уроке 13.", href: "/soc/lesson/soc-13" },

  // --- неделя 8 (текущая)
  { id: "soc-l15", kind: "lesson", subject: "soc", title: "Урок 15 открыт", date: "2026-10-24", href: "/soc/lesson/soc-15" },
  { id: "hist-l15", kind: "lesson", subject: "hist", title: "Урок 15 открыт", date: "2026-10-24", href: "/hist/lesson/hist-15" },
  { id: "soc-w8-web", kind: "webinar", subject: "soc", title: "Практика с преподавателем: задание 25", date: "2026-10-26", time: "17:00", end: "18:30", host: "Преподаватель", about: "Задачник можно распечатать заранее — он появится в уроке 15 утром." },
  { id: "soc-l16", kind: "lesson", subject: "soc", title: "Урок 16 откроется", date: "2026-10-27", href: "/soc/lesson/soc-16" },
  { id: "hist-l16", kind: "lesson", subject: "hist", title: "Урок 16 откроется", date: "2026-10-27", href: "/hist/lesson/hist-16" },
  { id: "soc-d1", kind: "deadline", subject: "soc", title: "ДЗ №1 «Задание 25»", date: "2026-10-27", time: "23:55", href: "/soc/work/soc-15-h" },
  { id: "hist-d1", kind: "deadline", subject: "hist", title: "ДЗ №1 «Регентство Софьи»", date: "2026-10-27", time: "23:55", href: "/hist/work/hist-15-h" },
  { id: "soc-w8-ext", kind: "extension", subject: "soc", title: "Продлёнка: ДЗ №1 «Задание 25»", date: "2026-10-27", time: "18:00", end: "19:00", host: "куратор Сова", capacity: 30, taken: 27, about: "Разберём типичные ошибки в примерах. Приходите со своим черновиком — ДЗ можно сдать после встречи." },
  { id: "hist-w8-web", kind: "webinar", subject: "hist", title: "Вебинар: работа с картой", date: "2026-10-28", time: "18:00", end: "19:30", host: "преподаватель истории" },
  { id: "all-w8-cow", kind: "coworking", subject: "all", title: "Коворкинг «тихий час»", date: "2026-10-28", time: "19:00", end: "20:30", host: "наставник Аня К.", capacity: 30, taken: 12, about: "Делаем свои задания вместе с камерой. Можно любой предмет." },
  { id: "soc-w8-cow", kind: "coworking", subject: "soc", title: "Коворкинг с наставником", date: "2026-10-29", time: "19:00", end: "20:30", host: "наставник Аня К.", capacity: 30, taken: 17, about: "Доделываем ДЗ №2 и отвечаем на вопросы по уроку 16." },
  { id: "hist-w8-ext", kind: "extension", subject: "hist", title: "Продлёнка: ДЗ №1 «Регентство Софьи»", date: "2026-10-30", time: "17:00", end: "18:00", host: "куратор Ворон", capacity: 30, taken: 30 },
  { id: "soc-d2", kind: "deadline", subject: "soc", title: "ДЗ №2 «Задание 21»", date: "2026-10-30", time: "23:55", href: "/soc/lesson/soc-16" },
  { id: "hist-d2", kind: "deadline", subject: "hist", title: "ДЗ №2 «Пётр I»", date: "2026-10-30", time: "23:55", href: "/hist/lesson/hist-16" },

  // --- неделя 9
  { id: "soc-l17", kind: "lesson", subject: "soc", title: "Урок 17 откроется", date: "2026-10-31", href: "/soc/lesson/soc-17" },
  { id: "hist-l17", kind: "lesson", subject: "hist", title: "Урок 17 откроется", date: "2026-10-31", href: "/hist/lesson/hist-17" },
  { id: "soc-w9-ws", kind: "workshop", subject: "soc", title: "Воркшоп: примеры из разных сфер в задании 25", date: "2026-10-31", time: "12:00", end: "14:00", host: "ведущий куратор Филин", capacity: 100, taken: 64, about: "Запись появится в базе заданий и материалов." },
  { id: "hist-w9-ws", kind: "workshop", subject: "hist", title: "Воркшоп: задание 21 — причины и следствия", date: "2026-11-01", time: "12:00", end: "14:00", host: "ведущий куратор Филин", capacity: 100, taken: 41 },
  { id: "soc-w9-web", kind: "webinar", subject: "soc", title: "Практика с преподавателем: задание 23", date: "2026-11-02", time: "17:00", end: "18:30", host: "Преподаватель" },
  { id: "soc-w9-ext", kind: "extension", subject: "soc", title: "Продлёнка: ДЗ №1 «Задание 23»", date: "2026-11-03", time: "18:00", end: "19:00", host: "куратор Сова", capacity: 30, taken: 9 },
];

/** Встречи, на которые ученик записан с самого начала. */
export const INITIAL_BOOKINGS = ["soc-w8-cow", "soc-w7-ext"];

/** Зачёт: свободные окна наставника вместо стороннего календаря. Только обществознание — там тариф «Стандарт». */
export const EXAM = {
  subject: "soc" as Subject,
  title: "Зачёт за октябрь",
  topic: "Политика: билеты 1–12",
  host: "наставник Аня К.",
  minutes: 20,
  slots: [
    { id: "x1", date: "2026-10-29", time: "16:00" },
    { id: "x2", date: "2026-10-29", time: "16:30" },
    { id: "x3", date: "2026-10-30", time: "15:00" },
    { id: "x4", date: "2026-10-31", time: "11:00" },
    { id: "x5", date: "2026-10-31", time: "11:30" },
  ],
};

export const BOOKABLE: MeetingKind[] = ["extension", "workshop", "coworking"];

const WEEKDAYS = ["вс", "пн", "вт", "ср", "чт", "пт", "сб"];
const MONTHS = ["января", "февраля", "марта", "апреля", "мая", "июня", "июля", "августа", "сентября", "октября", "ноября", "декабря"];

export function dayLabel(iso: string) {
  const d = new Date(`${iso}T12:00`);
  return { weekday: WEEKDAYS[d.getDay()], day: d.getDate(), month: MONTHS[d.getMonth()] };
}

export function isPast(e: Pick<CalendarEvent, "date" | "time" | "end">) {
  return `${e.date}T${e.end ?? e.time ?? "23:59"}` < NOW;
}
