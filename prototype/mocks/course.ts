// Моки для прототипа «покликать». Люди вымышленные, реальных данных учеников нет.
// Ритм недели — из расписания ГК 26/27: уроки и ДЗ открываются в субботу и вторник,
// дедлайны ДЗ — вторник и пятница в 23:55, «Практика с АМ» — понедельник 17:00.
// Неделя начинается в субботу (модель FANS), сегодня — вс 25.10, неделя 8.

export type Subject = "soc" | "hist";

export const SUBJECTS: Record<Subject, { title: string; short: string }> = {
  soc: { title: "Обществознание", short: "общество" },
  hist: { title: "История", short: "история" },
};

export type ItemKind = "video" | "snack" | "notes" | "test" | "homework" | "training" | "webinar" | "meeting";

/** review — сдано и ждёт проверки куратора. */
export type ItemStatus = "done" | "todo" | "overdue" | "locked" | "review";

export interface PlanItem {
  id: string;
  kind: ItemKind;
  title: string;
  /** Обязательный план («на 90+») или допы «на 100». Допы не входят в прогресс и зачётку. */
  required: boolean;
  status: ItemStatus;
  /** Подпись срока: «до вт 27.10, 23:55» или «откроется вт 27.10». */
  due?: string;
  /** Длительность или объём: «18 мин», «20 вопросов». */
  meta?: string;
  /** Офлайн-пункт: отметку ставит сам ученик. Остальное отмечается автоматически. */
  manual?: boolean;
}

export interface Lesson {
  id: string;
  number: number;
  title: string;
  opens: string;
  minutes: number;
  status: "done" | "open" | "locked";
  important?: string;
  timecodes?: { at: string; title: string }[];
  items: PlanItem[];
}

export interface Week {
  number: number;
  range: string;
  lessons: Lesson[];
  /** Пункты недели вне уроков: вебинары. Встречи по записи берутся из записей ученика (mocks/meetings.ts). */
  events: PlanItem[];
}

export interface Course {
  subject: Subject;
  product: string;
  tariff: string;
  period: string;
  currentWeek: number;
  weeks: Week[];
}

const soc: Course = {
  subject: "soc",
  product: "Годовой курс",
  // ДЗ и пробники проверяет куратор — сценарий B6.
  tariff: "С инструктором",
  period: "1 сентября — 31 мая",
  currentWeek: 8,
  weeks: [
    {
      number: 7,
      range: "17–23 октября",
      lessons: [
        {
          id: "soc-13",
          number: 13,
          title: "Государство и его формы",
          opens: "сб 17.10",
          minutes: 45,
          status: "done",
          items: [
            { id: "soc-13-v", kind: "video", title: "Видеоурок «Формы государства»", required: true, status: "done", meta: "24 мин" },
            { id: "soc-13-n", kind: "notes", title: "Конспект урока", required: true, status: "done", manual: true },
            { id: "soc-13-t", kind: "test", title: "Тест по уроку", required: true, status: "done", meta: "4 из 5" },
            { id: "soc-13-c", kind: "homework", title: "ДЗ №1 «Задание 25: государство»", required: true, status: "done", meta: "проверено · 5 из 6" },
            { id: "soc-13-h", kind: "homework", title: "ДЗ №2 «Формы государства»", required: true, status: "overdue", due: "до пт 23.10, 23:55 · можно сдать до 06.11" },
          ],
        },
      ],
      events: [
        { id: "soc-w7-web", kind: "webinar", title: "Практика с АМ: задание 24", required: true, status: "done", due: "пн 19.10, 17:00" },
      ],
    },
    {
      number: 8,
      range: "24–30 октября",
      lessons: [
        {
          id: "soc-15",
          number: 15,
          title: "Политическая система",
          opens: "сб 24.10",
          minutes: 50,
          status: "open",
          important: "В задании 25 нужны три примера из разных сфер общественной жизни — не из одной.",
          timecodes: [
            { at: "00:00", title: "Введение" },
            { at: "05:12", title: "Элементы политической системы" },
            { at: "14:30", title: "Функции" },
            { at: "18:40", title: "Разбор задания 25" },
          ],
          items: [
            { id: "soc-15-v", kind: "video", title: "Видеоурок «Политическая система»", required: true, status: "done", meta: "22 мин" },
            { id: "soc-15-n", kind: "notes", title: "Заполнить конспект", required: true, status: "todo", manual: true },
            { id: "soc-15-t", kind: "test", title: "Тест по уроку", required: true, status: "todo", meta: "5 вопросов" },
            { id: "soc-15-h", kind: "homework", title: "ДЗ №1 «Задание 25»", required: true, status: "todo", due: "до вт 27.10, 23:55", meta: "2 задания" },
            { id: "soc-15-s", kind: "snack", title: "Урок-снек «Типы политических систем»", required: false, status: "todo", meta: "7 мин" },
            { id: "soc-15-q", kind: "training", title: "Карточки «Политическая система»", required: false, status: "todo", meta: "Quizlet" },
            { id: "soc-15-x", kind: "training", title: "Тренировка «Найди ошибки: власть в РФ»", required: false, status: "todo", meta: "2 мин" },
          ],
        },
        {
          id: "soc-16",
          number: 16,
          title: "Политические режимы",
          opens: "вт 27.10",
          minutes: 40,
          status: "locked",
          items: [
            { id: "soc-16-v", kind: "video", title: "Видеоурок «Политические режимы»", required: true, status: "locked", due: "откроется вт 27.10", meta: "19 мин" },
            { id: "soc-16-t", kind: "test", title: "Тест по уроку", required: true, status: "locked", due: "откроется вт 27.10" },
            { id: "soc-16-h", kind: "homework", title: "ДЗ №2 «Задание 21»", required: true, status: "locked", due: "до пт 30.10, 23:55" },
            { id: "soc-16-x", kind: "training", title: "Тренировка «Найди лишнее: режимы»", required: false, status: "locked", due: "откроется вт 27.10" },
          ],
        },
      ],
      events: [
        { id: "soc-w8-web", kind: "webinar", title: "Практика с АМ: задание 25", required: true, status: "todo", due: "пн 26.10, 17:00" },
      ],
    },
    {
      number: 9,
      range: "31 октября — 6 ноября",
      lessons: [
        {
          id: "soc-17",
          number: 17,
          title: "Выборы и избирательные системы",
          opens: "сб 31.10",
          minutes: 45,
          status: "locked",
          items: [
            { id: "soc-17-v", kind: "video", title: "Видеоурок «Выборы»", required: true, status: "locked", due: "откроется сб 31.10" },
            { id: "soc-17-h", kind: "homework", title: "ДЗ №1 «Задание 23»", required: true, status: "locked", due: "до вт 03.11, 23:55" },
          ],
        },
      ],
      events: [],
    },
  ],
};

const hist: Course = {
  subject: "hist",
  product: "Годовой курс",
  // ДЗ ученик оценивает сам по критериям — сценарий B7.
  tariff: "Фристайл",
  period: "1 сентября — 31 мая",
  currentWeek: 8,
  weeks: [
    {
      number: 7,
      range: "17–23 октября",
      lessons: [
        {
          id: "hist-13",
          number: 13,
          title: "Первые Романовы",
          opens: "сб 17.10",
          minutes: 55,
          status: "done",
          items: [
            { id: "hist-13-v", kind: "video", title: "Видеоурок «Первые Романовы»", required: true, status: "done", meta: "31 мин" },
            { id: "hist-13-t", kind: "test", title: "Тест по датам", required: true, status: "done", meta: "3 из 5" },
            { id: "hist-13-h", kind: "homework", title: "ДЗ №1 «Первые Романовы»", required: true, status: "done", meta: "самопроверка · 3 из 4" },
          ],
        },
      ],
      events: [],
    },
    {
      number: 8,
      range: "24–30 октября",
      lessons: [
        {
          id: "hist-15",
          number: 15,
          title: "Пётр I",
          opens: "сб 24.10",
          minutes: 60,
          status: "open",
          important: "В задании 19 сначала найдите на карте год и событие — только потом читайте варианты ответа.",
          timecodes: [
            { at: "00:00", title: "Регентство Софьи" },
            { at: "09:20", title: "Северная война" },
            { at: "26:05", title: "Реформы" },
            { at: "41:30", title: "Культура петровской эпохи" },
          ],
          items: [
            { id: "hist-15-v", kind: "video", title: "Видеоурок «Пётр I, часть 1»", required: true, status: "done", meta: "28 мин" },
            { id: "hist-15-v2", kind: "video", title: "Видеоурок «Пётр I, часть 2»", required: true, status: "todo", meta: "26 мин" },
            { id: "hist-15-n", kind: "notes", title: "Заполнить рабочую тетрадь", required: true, status: "todo", manual: true },
            { id: "hist-15-t1", kind: "test", title: "Тест по датам", required: true, status: "todo", meta: "5 вопросов" },
            { id: "hist-15-t2", kind: "test", title: "Тест по личностям", required: true, status: "todo", meta: "5 вопросов" },
            { id: "hist-15-h", kind: "homework", title: "ДЗ №1 «Регентство Софьи и начало правления Петра I»", required: true, status: "todo", due: "до вт 27.10, 23:55", meta: "2 задания" },
            { id: "hist-15-s", kind: "snack", title: "Урок-снек «Северная война»", required: false, status: "todo", meta: "8 мин" },
            { id: "hist-15-q", kind: "training", title: "Тренировка «Северная война на карте»", required: false, status: "todo", meta: "3 мин" },
          ],
        },
        {
          id: "hist-16",
          number: 16,
          title: "Эпоха дворцовых переворотов",
          opens: "вт 27.10",
          minutes: 45,
          status: "locked",
          items: [
            { id: "hist-16-v", kind: "video", title: "Видеоурок «Дворцовые перевороты»", required: true, status: "locked", due: "откроется вт 27.10" },
            { id: "hist-16-h", kind: "homework", title: "ДЗ №2 «Пётр I»", required: true, status: "locked", due: "до пт 30.10, 23:55" },
          ],
        },
      ],
      events: [
        { id: "hist-w8-web", kind: "webinar", title: "Вебинар: работа с картой", required: true, status: "todo", due: "ср 28.10, 18:00" },
      ],
    },
    {
      number: 9,
      range: "31 октября — 6 ноября",
      lessons: [
        {
          id: "hist-17",
          number: 17,
          title: "Екатерина II",
          opens: "сб 31.10",
          minutes: 50,
          status: "locked",
          items: [
            { id: "hist-17-v", kind: "video", title: "Видеоурок «Екатерина II»", required: true, status: "locked", due: "откроется сб 31.10" },
          ],
        },
      ],
      events: [],
    },
  ],
};

export const COURSES: Record<Subject, Course> = { soc, hist };


export function isSubject(value: string): value is Subject {
  return value === "soc" || value === "hist";
}

export function findItem(subject: Subject, id: string) {
  for (const week of COURSES[subject].weeks) {
    for (const lesson of week.lessons) {
      const item = lesson.items.find((i) => i.id === id);
      if (item) return { week, lesson, item };
    }
  }
  return null;
}

export function findLesson(subject: Subject, id: string) {
  for (const week of COURSES[subject].weeks) {
    const index = week.lessons.findIndex((l) => l.id === id);
    if (index >= 0) return { week, lesson: week.lessons[index], index };
  }
  return null;
}
