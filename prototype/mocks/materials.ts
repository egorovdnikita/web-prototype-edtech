import type { Subject } from "./course";

// Материалы курса — справочные разделы годового курса. Названия разделов и групп —
// из аудита текущего GetCourse (FANS, 04.10): там это девять папок с вложенностью
// до четырёх уровней. Здесь — один экран: поиск, разделы, группы по темам.
// Тренировки и квизлеты — в «Практике», архив недель — в планере и программе.
//
// Сами файлы и видео в прототипе не открываются. Названия групп и примеров — как в
// GetCourse; содержимое групп, длительности и «к уроку» — условные.

export type MaterialSection = "library" | "notes" | "cheatsheets" | "breakdowns" | "minicourses" | "sessions";

export const SECTIONS: Record<MaterialSection, { title: string; text: string }> = {
  library: { title: "Библиотека", text: "Документы ФИПИ, учебники, сборники" },
  notes: { title: "Конспекты", text: "По неделям и темам" },
  cheatsheets: { title: "Шпаргалки", text: "Даты, термины, схемы для повторения" },
  breakdowns: { title: "Разборы заданий", text: "Как решать каждый номер" },
  minicourses: { title: "Мини-курсы", text: "Лайфхаки, тайм-менеджмент, поступление" },
  sessions: { title: "Сессии", text: "Итоговые тесты, пробники, билеты к зачёту" },
};

export type MaterialKind = "pdf" | "video" | "cards" | "link" | "test";

export interface Material {
  id: string;
  title: string;
  kind: MaterialKind;
  meta?: string;
  /** Ссылка внутри предмета — для материалов, которые живут в самом курсе. */
  href?: string;
  /** Только для тарифов с зачётом. */
  examOnly?: boolean;
  /** Связан с уроком текущей недели — показываем в «Сейчас по программе». */
  now?: boolean;
  /** Ещё не открыт: виден заранее, но нажать нельзя. */
  soon?: string;
}

export interface MaterialGroup {
  section: MaterialSection;
  title: string;
  /** Группы открываются по ходу курса, как в GetCourse. */
  locked?: string;
  items: Material[];
}

const fipi = (s: Subject): MaterialGroup => ({
  section: "library",
  title: "Документы ФИПИ",
  items: [
    { id: `${s}-fipi-demo`, title: "Демоверсия ЕГЭ 2027", kind: "pdf", meta: "PDF" },
    { id: `${s}-fipi-spec`, title: "Спецификация", kind: "pdf", meta: "PDF" },
    { id: `${s}-fipi-cod`, title: "Кодификатор", kind: "pdf", meta: "PDF" },
  ],
});

const minicourses = (s: Subject, extra: MaterialGroup[]): MaterialGroup[] => [
  ...extra,
  {
    section: "minicourses",
    title: "Лайфхаки для ЕГЭ",
    items: [
      { id: `${s}-mc-mistakes`, title: "Как делать работу над ошибками?", kind: "video", meta: "12 мин" },
      { id: `${s}-mc-max`, title: s === "soc" ? "Как затащить общагу на максимум" : "Как затащить историю на максимум", kind: "video", meta: "18 мин" },
    ],
  },
  {
    section: "minicourses",
    title: "Тайм-менеджмент",
    items: [
      { id: `${s}-mc-tm1`, title: "Тайм-менеджмент одиннадцатиклассника", kind: "video", meta: "21 мин" },
      { id: `${s}-mc-tm2`, title: "Организация работы на год: как всё успевать и не выгореть", kind: "video", meta: "25 мин" },
    ],
  },
  {
    section: "minicourses",
    title: "SOS-уроки",
    items: [
      { id: `${s}-mc-sos1`, title: "3 замкнутых круга 11-классника", kind: "video", meta: "15 мин" },
      { id: `${s}-mc-sos2`, title: "Тайм-менеджмент, когда всё вокруг горит", kind: "video", meta: "14 мин" },
      { id: `${s}-mc-sos3`, title: "Что делать, если не хватает концентрации", kind: "video", meta: "11 мин" },
    ],
  },
  {
    section: "minicourses",
    title: "Поступление",
    items: [{ id: `${s}-mc-uni`, title: "Стратегия поступления в начале года", kind: "video", meta: "30 мин" }],
  },
];

/**
 * Сессионная неделя раз в месяц: итоговый тест, пробник и зачёт. Зачёт — только
 * на тарифах с инструктором: на «Фристайле» билетов нет.
 */
const sessions = (s: Subject): MaterialGroup[] => [
  {
    section: "sessions",
    title: "Сентябрь",
    items: [
      { id: `${s}-ses-9-test`, title: "Итоговый тест за сентябрь", kind: "test", meta: "пройден" },
      { id: `${s}-ses-9-probe`, title: "Пробник №1", kind: "test", meta: "сдан 02.10" },
      { id: `${s}-ses-9-exam`, title: "Билеты к зачёту за сентябрь", kind: "pdf", meta: "PDF", examOnly: true },
    ],
  },
  {
    section: "sessions",
    title: "Октябрь",
    items: [
      { id: `${s}-ses-10-exam`, title: "Билеты к зачёту за октябрь", kind: "pdf", meta: "PDF · зачёт — по записи", examOnly: true, href: "/exam", now: true },
      { id: `${s}-ses-10-test`, title: "Итоговый тест за октябрь", kind: "test", soon: "откроется 31.10" },
      { id: `${s}-ses-10-probe`, title: "Пробник №2", kind: "test", soon: "откроется 31.10" },
    ],
  },
  { section: "sessions", title: "Ноябрь", locked: "откроется 28.11", items: [] },
  { section: "sessions", title: "Декабрь — май", locked: "по одной сессии в месяц", items: [] },
];

export const MATERIALS: Record<Subject, MaterialGroup[]> = {
  soc: [
    fipi("soc"),
    {
      section: "library",
      title: "Учебники и сборники",
      items: [
        { id: "soc-lib-bog10", title: "Учебник Л. Н. Боголюбова, 10 класс", kind: "pdf", meta: "PDF" },
        { id: "soc-lib-bog11", title: "Учебник Л. Н. Боголюбова, 11 класс", kind: "pdf", meta: "PDF" },
        { id: "soc-lib-kl", title: "Сборник О. А. Котовой и Т. Е. Лисковой 2026", kind: "pdf", meta: "PDF · варианты — в «Практике»" },
      ],
    },
    {
      section: "library",
      title: "Дополнительные файлы",
      items: [
        { id: "soc-lib-planner", title: "Планеры ЕНЛ", kind: "pdf", meta: "PDF для печати" },
        { id: "soc-lib-check", title: "Чек-лист для изучения блока", kind: "pdf", meta: "PDF" },
      ],
    },
    { section: "library", title: "Законы для ЕГЭ", locked: "откроется с блоком «Право»", items: [] },

    {
      section: "notes",
      title: "Человек в обществе",
      items: [
        { id: "soc-n-w1", title: "Конспекты 1 недели", kind: "pdf", meta: "PDF" },
        { id: "soc-n-w2", title: "Конспекты 2 недели", kind: "pdf", meta: "PDF" },
        { id: "soc-n-w3", title: "Конспекты 3 недели", kind: "pdf", meta: "PDF" },
        { id: "soc-n-w45", title: "Конспекты 4 и 5 недели", kind: "pdf", meta: "PDF" },
      ],
    },
    {
      section: "notes",
      title: "Политика",
      items: [
        { id: "soc-n-13", title: "Урок 13. Государство и его формы", kind: "pdf", meta: "конспект урока", href: "/lesson/soc-13" },
        { id: "soc-n-15", title: "Урок 15. Политическая система", kind: "pdf", meta: "конспект урока", href: "/lesson/soc-15", now: true },
      ],
    },
    { section: "notes", title: "Экономика, социальные отношения, право", locked: "откроются по программе", items: [] },

    {
      section: "cheatsheets",
      title: "Человек в обществе",
      items: [
        { id: "soc-c-man-terms", title: "Термины блока", kind: "cards", meta: "карточки" },
        { id: "soc-c-man-needs", title: "Схема: потребности человека", kind: "pdf", meta: "PDF" },
      ],
    },
    {
      section: "cheatsheets",
      title: "Политика",
      items: [
        { id: "soc-c-pol-terms", title: "Термины блока", kind: "cards", meta: "карточки", now: true },
        { id: "soc-c-pol-forms", title: "Схема: форма государства", kind: "pdf", meta: "PDF", now: true },
      ],
    },
    { section: "cheatsheets", title: "Экономика, социальные отношения, право", locked: "откроются по программе", items: [] },

    {
      section: "breakdowns",
      title: "Обзор экзамена",
      items: [
        { id: "soc-b-demo", title: "Разбор демоверсии 2027", kind: "video", meta: "1 ч 10 мин" },
        { id: "soc-b-self", title: "Урок по самопроверке", kind: "video", meta: "16 мин" },
      ],
    },
    {
      section: "breakdowns",
      title: "Учимся решать задания 2 части",
      items: [
        { id: "soc-b-17", title: "Задание 17", kind: "video", meta: "14 мин" },
        { id: "soc-b-18", title: "Задание 18", kind: "video", meta: "12 мин" },
        { id: "soc-b-25", title: "Задание 25", kind: "video", meta: "22 мин", now: true },
      ],
    },
    {
      section: "breakdowns",
      title: "Сложные теоретические моменты",
      items: [{ id: "soc-b-theory-pol", title: "Политическая система и политический режим: в чём разница", kind: "video", meta: "9 мин", now: true }],
    },
    { section: "breakdowns", title: "Разборы заданий из учебников", locked: "откроется в ноябре", items: [] },

    ...minicourses("soc", [
      {
        section: "minicourses",
        title: "Олимпиадный блок",
        items: [
          { id: "soc-mc-olymp-guide", title: "Гайд по работе с олимпиадным блоком", kind: "pdf", meta: "PDF" },
          { id: "soc-mc-olymp-nav", title: "Олимпиадный навигатор", kind: "link", meta: "внешний сайт" },
        ],
      },
    ]),
    ...sessions("soc"),
  ],

  hist: [
    fipi("hist"),
    {
      section: "library",
      title: "Учебники и сборники",
      items: [
        { id: "hist-lib-art30", title: "Сборник Артасова «30 вариантов ЕГЭ 2026»", kind: "pdf", meta: "PDF · варианты — в «Практике»" },
        { id: "hist-lib-artmaps", title: "Артасов. «Трудные задания. Работа с картами»", kind: "pdf", meta: "PDF" },
        { id: "hist-lib-artcult", title: "Артасов. Учебная тетрадь «Культура России»", kind: "pdf", meta: "PDF" },
      ],
    },
    {
      section: "library",
      title: "Атласы и контурные карты",
      items: [
        { id: "hist-lib-atlas", title: "Атлас, 6–11 классы", kind: "pdf", meta: "PDF" },
        { id: "hist-lib-contour", title: "Контурные карты", kind: "pdf", meta: "PDF для печати" },
      ],
    },
    {
      section: "library",
      title: "Фильмы и подкасты",
      items: [
        { id: "hist-lib-films", title: "Подборка фильмов и мультфильмов", kind: "link", meta: "подборка" },
        { id: "hist-lib-pods", title: "Подкасты и аудиокниги", kind: "link", meta: "подборка" },
      ],
    },

    {
      section: "notes",
      title: "Древняя Русь — Московское государство",
      items: [
        { id: "hist-n-w1", title: "Конспекты 1 недели", kind: "pdf", meta: "PDF" },
        { id: "hist-n-w2", title: "Конспекты 2 недели", kind: "pdf", meta: "PDF" },
        { id: "hist-n-w3", title: "Конспекты 3 недели", kind: "pdf", meta: "PDF" },
        { id: "hist-n-w4", title: "Конспекты 4 недели", kind: "pdf", meta: "PDF" },
      ],
    },
    {
      section: "notes",
      title: "Имперский период",
      items: [
        { id: "hist-n-13", title: "Урок 13. Первые Романовы", kind: "pdf", meta: "рабочая тетрадь", href: "/lesson/hist-13" },
        { id: "hist-n-15", title: "Урок 15. Пётр I", kind: "pdf", meta: "рабочая тетрадь", href: "/lesson/hist-15", now: true },
      ],
    },
    { section: "notes", title: "СССР, современная Россия", locked: "откроются по программе", items: [] },

    {
      section: "cheatsheets",
      title: "Древняя Русь",
      items: [
        { id: "hist-c-dr-dates", title: "Даты", kind: "cards", meta: "карточки" },
        { id: "hist-c-dr-people", title: "Личности", kind: "cards", meta: "карточки" },
        { id: "hist-c-dr-terms", title: "Термины", kind: "cards", meta: "карточки" },
      ],
    },
    {
      section: "cheatsheets",
      title: "Имперский период",
      items: [
        { id: "hist-c-imp-dates", title: "Даты", kind: "cards", meta: "карточки", now: true },
        { id: "hist-c-imp-people", title: "Личности", kind: "cards", meta: "карточки", now: true },
        { id: "hist-c-imp-terms", title: "Термины", kind: "cards", meta: "карточки" },
      ],
    },
    { section: "cheatsheets", title: "СССР, современная Россия", locked: "откроются по программе", items: [] },

    {
      section: "breakdowns",
      title: "Обзор экзамена",
      items: [
        { id: "hist-b-demo", title: "Разбор демоверсии 2027", kind: "video", meta: "1 ч 05 мин" },
        { id: "hist-b-self", title: "Урок по самопроверке", kind: "video", meta: "16 мин" },
      ],
    },
    {
      section: "breakdowns",
      title: "Работа с картами",
      items: [{ id: "hist-b-maps", title: "Учимся работать с картами", kind: "video", meta: "24 мин", now: true }],
    },
    {
      section: "breakdowns",
      title: "Работа с терминами и текстом",
      items: [
        { id: "hist-b-lang", title: "Учимся языку истории", kind: "video", meta: "18 мин" },
        { id: "hist-b-text", title: "Работа с историческим источником", kind: "video", meta: "20 мин" },
      ],
    },
    { section: "breakdowns", title: "Разборы заданий из сборника Артасова", locked: "откроется в ноябре", items: [] },

    ...minicourses("hist", [
      {
        section: "minicourses",
        title: "Обзоры истории России",
        items: [
          { id: "hist-mc-ov1", title: "Экспресс-обзор: Древняя Русь", kind: "video", meta: "40 мин" },
          { id: "hist-mc-ov2", title: "Экспресс-обзор: имперский период", kind: "video", meta: "45 мин", now: true },
        ],
      },
      {
        section: "minicourses",
        title: "Всемирка",
        items: [
          { id: "hist-mc-w1", title: "Периодизация всемирной истории. Древний Восток", kind: "video", meta: "28 мин" },
          { id: "hist-mc-w2", title: "Древняя Греция", kind: "video", meta: "26 мин" },
        ],
      },
    ]),
    ...sessions("hist"),
  ],
};

export const KIND_LABEL: Record<MaterialKind, string> = {
  pdf: "Открыть",
  video: "Смотреть",
  cards: "Повторить",
  link: "Перейти",
  test: "Открыть",
};
