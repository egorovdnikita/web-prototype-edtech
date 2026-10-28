// Записи прошедших встреч: видео, таймкоды, чат встречи
// и задачник. Продлёнку ведёт проверяющий — в чате только его ник. Ученики в чате —
// вымышленные имена.

export interface RecordingChatLine {
  at: string;
  author: string;
  /** Ведущий встречи: проверяющий (ник) или преподаватель. */
  host?: boolean;
  text: string;
}

export interface Recording {
  eventId: string;
  title: string;
  date: string;
  duration: string;
  host: string;
  timecodes: { at: string; title: string }[];
  chat: RecordingChatLine[];
  workbook: string;
  /** Урок, к которому относится встреча. */
  lessonId: string;
}

export const RECORDINGS: Record<string, Recording> = {
  "soc-w7-ext": {
    eventId: "soc-w7-ext",
    title: "Продлёнка: ДЗ «Задание 25: государство»",
    date: "22.10",
    duration: "58 мин",
    host: "куратор Сова",
    timecodes: [
      { at: "00:00", title: "Начало" },
      { at: "04:10", title: "Типичные ошибки в обосновании" },
      { at: "12:30", title: "Разбор: функции государства" },
      { at: "31:05", title: "Примеры из разных сфер" },
      { at: "47:40", title: "Вопросы" },
    ],
    chat: [
      { at: "04:20", author: "Лиза", text: "а обоснование можно одним предложением?" },
      { at: "04:55", author: "куратор Сова", host: true, text: "Нет: нужно несколько связанных предложений — так требует критерий К1." },
      { at: "31:40", author: "Варя", text: "а можно пример из экономики?" },
      { at: "32:10", author: "куратор Сова", host: true, text: "Да, если он про функцию государства: например, регулирование цен на лекарства." },
      { at: "48:00", author: "Даша", text: "спасибо, стало понятнее!" },
    ],
    workbook: "Задачник продлёнки, PDF · 4 стр.",
    lessonId: "soc-13",
  },
  "soc-w7-web": {
    eventId: "soc-w7-web",
    title: "Практика с преподавателем: задание 24",
    date: "19.10",
    duration: "1 ч 27 мин",
    host: "Преподаватель",
    timecodes: [
      { at: "00:00", title: "Начало" },
      { at: "06:15", title: "Как читать задание 24" },
      { at: "28:40", title: "План: политические партии" },
      { at: "55:20", title: "План: государство" },
      { at: "1:18:00", title: "Вопросы" },
    ],
    chat: [
      { at: "06:30", author: "Катя", text: "задачник распечатала!" },
      { at: "29:10", author: "Полина", text: "а сколько пунктов в плане минимум?" },
      { at: "29:40", author: "Преподаватель", host: true, text: "Не меньше трёх пунктов по теме, и минимум два из них — с подпунктами." },
    ],
    workbook: "Задачник вебинара, PDF · 6 стр.",
    lessonId: "soc-13",
  },
};
