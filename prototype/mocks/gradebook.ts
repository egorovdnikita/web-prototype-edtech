// Зачётка и ачивки.
//
// Механика зачётки:
//   — каждое задание обязательного плана = 10 баллов, допы «на 100» не считаются;
//   — печать за месяц, если набрано больше 60% баллов;
//   — каждая печать — билет в ежемесячном розыгрыше; на «Лайте» розыгрыша нет.
// Месяц — недели, которые в нём начинаются.

import type { Subject } from "./course";

export const POINTS_PER_TASK = 10;
export const STAMP_THRESHOLD = 60;

export const SEASON = ["сентябрь", "октябрь", "ноябрь", "декабрь", "январь", "февраль", "март", "апрель", "май"];

/** Октябрь: недели 5–9. Недели 5–6 в моках не расписаны — их итог задан числом. */
export const OCTOBER_WEEKS = [5, 6, 7, 8, 9];

export const GRADEBOOK_HISTORY: Record<Subject, { september: number; octoberEarlier: { done: number; total: number } }> = {
  soc: { september: 78, octoberEarlier: { done: 11, total: 16 } },
  hist: { september: 91, octoberEarlier: { done: 12, total: 15 } },
};

/** Печать предмета: звезда — общество, ромб — история. */
export const STAMP: Record<Subject, { name: string }> = {
  soc: { name: "звезда" },
  hist: { name: "ромб" },
};

export const DRAW = {
  last: { month: "сентябрь", tickets: 2, prize: "стикерпак и блокнот школы", how: "Напишите наставнику — пришлём почтой вместе с ноябрьским мерчем." },
  next: "в начале ноября, после итогов октября",
  prizes: ["мерч", "подарочные боксы", "канцелярия", "наушники и колонки"],
};

export type AchievementTrigger =
  | "welcome"
  | "first-probe"
  | "stamp"
  | "no-debts"
  | "week-done"
  | "perfect-test"
  | "comeback"
  | "fixed-mistake"
  | "self-check"
  | "booked-meeting"
  | "night-owl"
  | "exam-passed";

export interface AchievementDef {
  id: AchievementTrigger;
  title: string;
  /** «За что» — текст для ученика. */
  why: string;
  /** Дата для выданных раньше прототипа. */
  earnedAt?: string;
}

// Сюжеты медалей — без узнаваемых реальных людей (риск по правам на изображение).
export const ACHIEVEMENTS: AchievementDef[] = [
  { id: "welcome", title: "добро пожаловать", why: "Начать учиться в школе. Её получают все.", earnedAt: "01.09" },
  { id: "first-probe", title: "первый пробник", why: "Сдать первый пробник — неважно на сколько.", earnedAt: "02.10" },
  { id: "stamp", title: "печать в зачётке", why: "Получить печать: больше 60% обязательного плана за месяц." },
  { id: "perfect-test", title: "без единой ошибки", why: "Решить тест на максимум." },
  { id: "comeback", title: "упал, но встал", why: "Написать тест меньше чем на половину — и перерешать." },
  { id: "fixed-mistake", title: "разобрался", why: "Исправить ошибку в работе над ошибками." },
  { id: "self-check", title: "сам себе куратор", why: "Честно оценить своё ДЗ по критериям." },
  { id: "booked-meeting", title: "на связи", why: "Записаться на продлёнку, воркшоп или коворкинг." },
  { id: "no-debts", title: "без долгов", why: "Сдать всё обязательное с прошлых недель." },
  { id: "week-done", title: "неделя закрыта", why: "Сделать весь открытый обязательный план недели." },
  { id: "night-owl", title: "ночная сова", why: "Секрет. Подсказка: про дедлайн в 23:55." },
  { id: "exam-passed", title: "зачёт!", why: "Сдать зачёт наставнику." },
];
