import type { Subject } from "./course";

// Уведомления (A5) и настройки профиля (A4). Люди и контакты вымышленные.
//
// Уведомления общие для аккаунта: ученик на двух предметах видит всё в одном
// списке, у каждого — метка предмета. Ссылка ведёт в нужный предмет.

/** Группы для настроек каналов: ученик выбирает не каждое событие, а тип. */
export type NoticeGroup = "study" | "review" | "rewards" | "payment";

export const GROUPS: Record<NoticeGroup, { title: string; text: string }> = {
  study: { title: "Учёба", text: "Новые уроки, вебинары и встречи, дедлайны" },
  review: { title: "Проверка и наставник", text: "Проверенные работы, сообщения, объявления группы" },
  rewards: { title: "Награды", text: "Ачивки и печати зачётки" },
  payment: { title: "Оплата", text: "Напоминание за 3 дня и просрочка" },
};

// Как в GetCourse и вайрфрейме A4: Telegram, ВК, почта. Push в приложении — только если
// у платформы будет своё приложение (открытый вопрос, у GetCourse оно есть).
export type Channel = "telegram" | "vk" | "email";

export const CHANNELS: Record<Channel, string> = { telegram: "Telegram", vk: "ВК", email: "Почта" };

export interface Notice {
  id: string;
  group: NoticeGroup;
  subject: Subject;
  title: string;
  text?: string;
  /** ISO, московское время. */
  at: string;
  /** Путь внутри предмета. */
  href?: string;
  action?: string;
  /** Пришло до начала прототипа и уже прочитано. */
  read?: boolean;
}

export const NOTICES: Notice[] = [
  {
    id: "soc-web-w8",
    group: "study",
    subject: "soc",
    title: "Завтра в 17:00 — «Практика с АМ: задание 25»",
    text: "Задачник появится в уроке 15 утром, его можно распечатать.",
    at: "2026-10-25T10:00",
    href: "/calendar?e=soc-w8-web",
    action: "В календарь",
  },
  {
    id: "soc-dl-15h",
    group: "study",
    subject: "soc",
    title: "Во вторник дедлайн: ДЗ №1 «Задание 25»",
    text: "До вт 27.10, 23:55. Вторник — заодно и выход нового ДЗ.",
    at: "2026-10-25T09:00",
    href: "/work/soc-15-h",
    action: "Решать",
  },
  {
    id: "hist-web-w8",
    group: "study",
    subject: "hist",
    title: "В среду в 18:00 — вебинар «Работа с картой»",
    at: "2026-10-25T09:00",
    href: "/calendar?e=hist-w8-web",
    action: "В календарь",
  },
  {
    id: "hist-mentor-m3",
    group: "review",
    subject: "hist",
    title: "Миша Т. ответил",
    text: "«Да: сначала год и событие по карте, потом варианты…»",
    at: "2026-10-24T20:31",
    href: "/mentor",
    action: "Открыть",
  },
  {
    id: "soc-mentor-m4",
    group: "review",
    subject: "soc",
    title: "Аня К. написала",
    text: "«И не забудь записаться на зачёт за октябрь — окна в четверг ещё есть.»",
    at: "2026-10-24T11:05",
    href: "/mentor",
    action: "Открыть",
  },
  {
    id: "soc-lesson-15",
    group: "study",
    subject: "soc",
    title: "Открылся урок 15 «Политическая система»",
    at: "2026-10-24T09:00",
    href: "/lesson/soc-15",
    action: "К уроку",
  },
  {
    id: "hist-lesson-15",
    group: "study",
    subject: "hist",
    title: "Открылся урок 15 «Пётр I»",
    at: "2026-10-24T09:00",
    href: "/lesson/hist-15",
    action: "К уроку",
  },
  {
    id: "soc-overdue-13h",
    group: "study",
    subject: "soc",
    title: "ДЗ №2 «Формы государства» не сдано в срок",
    text: "Ничего страшного: сдать можно до 06.11, проверка займёт до 5 дней.",
    at: "2026-10-24T00:00",
    href: "/work/soc-13-h",
    action: "Решать",
  },
  {
    id: "soc-group-post",
    group: "review",
    subject: "soc",
    title: "Объявление группы «Пятница 18:00»",
    text: "В пятницу разбираем задание 25 — приносите вопросы.",
    at: "2026-10-23T18:30",
  },
  {
    id: "soc-review-13c",
    group: "review",
    subject: "soc",
    title: "Куратор Сова проверил ДЗ №1 «Задание 25: государство» — 5 из 6",
    at: "2026-10-22T15:20",
    href: "/work/soc-13-c/result",
    action: "Смотреть",
    read: true,
  },
  {
    id: "soc-ach-probe",
    group: "rewards",
    subject: "soc",
    title: "Новая ачивка «первый пробник»",
    at: "2026-10-02T19:00",
    href: "/progress/achievements",
    action: "Смотреть",
    read: true,
  },
  {
    id: "soc-group-assigned",
    group: "review",
    subject: "soc",
    title: "Вы в группе «Пятница 18:00», наставник — Аня К.",
    text: "Она напишет первой — загляните в сообщения.",
    at: "2026-09-01T12:00",
    href: "/mentor",
    action: "Познакомиться",
    read: true,
  },
];

/** Профиль ученицы в моках. Данные вымышленные. */
export const PROFILE = {
  name: "Ксюша",
  email: "ksusha@example.com",
  grade: "11",
  /** Часовой пояс как в форме записи ЕНЛ: разница с Москвой, от −2 до +9. */
  tz: 2,
  telegram: "@ksusha_ege",
  vk: "",
  parentEmail: "mama@example.com",
};

export const TZ_OPTIONS = Array.from({ length: 12 }, (_, i) => i - 2);

export const tzLabel = (tz: number) => (tz === 0 ? "МСК" : `МСК${tz > 0 ? "+" : "−"}${Math.abs(tz)}`);
