"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { hasExams } from "@/components/calendar/calendar-view";
import { Icon, type IconName } from "@/components/ui/icon";
import { cn } from "@/lib/utils";
import { COURSES, type Subject } from "@mocks/course";
import {
  KIND_LABEL,
  MATERIALS,
  SECTIONS,
  type Material,
  type MaterialGroup,
  type MaterialKind,
  type MaterialSection,
} from "@mocks/materials";

const KEY = "enl-prototype-materials";

const KIND_ICON: Record<MaterialKind, IconName> = {
  pdf: "document-text",
  video: "play-circle",
  cards: "notebook-minimalistic",
  link: "paperclip",
  test: "checklist-minimalistic",
};

/** Просмотренное — как статус «просмотрено» в B9; хранится в браузере. */
function useViewed() {
  const [viewed, setViewed] = useState<string[]>([]);
  useEffect(() => {
    try {
      const saved = window.localStorage.getItem(KEY);
      if (saved) setViewed(JSON.parse(saved));
    } catch {
      // без сохранения
    }
  }, []);
  const mark = (id: string) =>
    setViewed((prev) => {
      if (prev.includes(id)) return prev;
      const next = [...prev, id];
      try {
        window.localStorage.setItem(KEY, JSON.stringify(next));
      } catch {
        // без сохранения
      }
      return next;
    });
  return { viewed, mark };
}

/**
 * Материалы курса. В GetCourse это девять папок с вложенностью до четырёх уровней
 * (курс → библиотека → учебники → группа → файл). Здесь — один экран: поиск по всему,
 * разделы фильтром, группы по темам; закрытые группы видны со сроком открытия.
 */
export function MaterialsView({ subject }: { subject: Subject }) {
  const [section, setSection] = useState<MaterialSection | "all">("all");
  const [query, setQuery] = useState("");
  const { viewed, mark } = useViewed();
  const exams = hasExams(subject);

  // Билеты к зачёту — только на тарифах с зачётом.
  const groups: MaterialGroup[] = MATERIALS[subject]
    .map((g) => ({ ...g, items: g.items.filter((i) => exams || !i.examOnly) }))
    .filter((g) => g.locked || g.items.length > 0);
  const q = query.trim().toLowerCase();
  const found = q
    ? groups.flatMap((g) =>
        g.items.filter((i) => `${i.title} ${g.title}`.toLowerCase().includes(q)).map((item) => ({ item, group: g })),
      )
    : [];
  // Не больше четырёх: блок — подсказка, а не второй каталог.
  const now = groups.flatMap((g) => g.items.filter((i) => i.now).map((item) => ({ item, group: g }))).slice(0, 4);
  const sections = (Object.keys(SECTIONS) as MaterialSection[]).filter((s) => groups.some((g) => g.section === s));

  const row = (item: Material, hint?: string) => (
    <MaterialRow key={item.id} subject={subject} item={item} hint={hint} viewed={viewed.includes(item.id)} onOpen={() => mark(item.id)} />
  );

  return (
    <div className="flex flex-col gap-5">
      <label className="relative block">
        <span className="sr-only">Поиск по материалам</span>
        <input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={subject === "soc" ? "Поиск: демоверсия, Боголюбов, задание 25…" : "Поиск: демоверсия, Артасов, карты…"}
          className="w-full rounded-full border border-line-strong bg-surface-raised px-4 py-2.5 text-[15px] focus:border-accent"
        />
      </label>

      {q ? (
        <section className="flex flex-col gap-2">
          <h2 className="text-sm font-semibold text-ink-muted">
            {found.length ? `Нашлось: ${found.length}` : "Ничего не нашлось — попробуйте другое слово."}
          </h2>
          {found.length > 0 && (
            <ul className="divide-y divide-line-subtle overflow-hidden rounded-box-l border border-line bg-surface-raised">
              {found.map(({ item, group }) => row(item, `${SECTIONS[group.section].title} · ${group.title}`))}
            </ul>
          )}
        </section>
      ) : (
        <>
          <div role="group" aria-label="Разделы" className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-1 [scrollbar-width:none] sm:mx-0 sm:flex-wrap sm:px-0">
            {(["all", ...sections] as const).map((s) => (
              <button
                key={s}
                type="button"
                aria-pressed={section === s}
                onClick={() => setSection(s)}
                className={cn(
                  "shrink-0 rounded-full border px-3.5 py-1.5 text-sm font-semibold transition-colors",
                  section === s ? "border-ink bg-ink text-surface-page" : "border-line bg-surface-raised text-ink-muted",
                )}
              >
                {s === "all" ? "все разделы" : SECTIONS[s].title.toLowerCase()}
              </button>
            ))}
          </div>

          {section === "all" && now.length > 0 && (
            <section className="rounded-box-l bg-surface-subject p-4">
              <h2 className="enl-display text-lg">сейчас по программе</h2>
              <p className="text-[13px]">К урокам этой недели и ближайшей сессии.</p>
              <ul className="mt-3 divide-y divide-line-subtle overflow-hidden rounded-box-m bg-surface-raised">
                {now.map(({ item, group }) => row(item, `${SECTIONS[group.section].title} · ${group.title}`))}
              </ul>
            </section>
          )}

          {(section === "all" ? sections : [section]).map((s) => (
            <section key={s} className="flex flex-col gap-3">
              <div>
                <h2 className="text-lg font-bold">{SECTIONS[s].title}</h2>
                <p className="text-[13px] text-ink-muted">
                  {SECTIONS[s].text}
                  {s === "sessions" && !exams && ` · на тарифе «${COURSES[subject].tariff}» зачёта нет — только тест и пробник`}
                </p>
              </div>
              {groups
                .filter((g) => g.section === s)
                .map((g) =>
                  g.locked ? (
                    <p
                      key={g.title}
                      className="flex items-center gap-3 rounded-box-l border border-dashed border-line p-4 text-sm text-ink-muted"
                    >
                      <Icon name="lock-keyhole" size="2xs" className="shrink-0" />
                      <span>
                        <span className="font-semibold text-ink">{g.title}</span> — {g.locked}
                      </span>
                    </p>
                  ) : (
                    <div key={g.title} className="overflow-hidden rounded-box-l border border-line bg-surface-raised">
                      <h3 className="border-b border-line-subtle px-4 py-2.5 text-[13px] font-bold uppercase tracking-wide text-ink-muted">
                        {g.title}
                      </h3>
                      <ul className="divide-y divide-line-subtle">{g.items.map((i) => row(i))}</ul>
                    </div>
                  ),
                )}
            </section>
          ))}

          <Link
            href={`/${subject}/practice`}
            className="flex items-center gap-3 rounded-box-l border border-line bg-surface-raised p-4 text-sm no-underline hover:border-accent-border"
          >
            <Icon name="dumbbell-large" size="2xs" className="shrink-0 text-ink-accent" />
            <span className="flex-1 text-ink">
              Тренировки, квизлеты и тренажёр — в <span className="font-semibold">Практике</span>
            </span>
            <Icon name="alt-arrow-right" size="min" className="text-ink-subtle" />
          </Link>
        </>
      )}
    </div>
  );
}

function MaterialRow({
  subject,
  item,
  hint,
  viewed,
  onOpen,
}: {
  subject: Subject;
  item: Material;
  hint?: string;
  viewed: boolean;
  onOpen: () => void;
}) {
  const body = (
    <>
      <span className="grid size-9 shrink-0 place-items-center rounded-box-m bg-surface-subtle">
        <Icon name={KIND_ICON[item.kind]} size="2xs" />
      </span>
      <span className="min-w-0 flex-1">
        {hint && <span className="block text-[12px] text-ink-muted">{hint}</span>}
        <span className="block font-semibold leading-snug">{item.title}</span>
        {(item.soon ?? item.meta) && <span className="block text-[13px] text-ink-muted">{item.soon ?? item.meta}</span>}
      </span>
      {item.soon ? (
        <Icon name="lock-keyhole" size="xs" className="shrink-0 text-ink-subtle" />
      ) : viewed ? (
        <span className="flex shrink-0 items-center gap-1 text-[13px] font-semibold text-ink-olive">
          <Icon name="check-circle" variant="bold" size="min" />
          <span className="hidden sm:inline">просмотрено</span>
        </span>
      ) : (
        <span className="shrink-0 text-sm font-semibold text-ink-accent">{KIND_LABEL[item.kind]}</span>
      )}
    </>
  );
  const className = "flex w-full items-center gap-3 px-4 py-3 text-left text-ink no-underline transition-colors hover:bg-surface-subtle";
  return (
    <li>
      {item.soon ? (
        <div className={cn(className, "text-ink-muted hover:bg-transparent")}>{body}</div>
      ) : item.href ? (
        <Link href={`/${subject}${item.href}`} onClick={onOpen} className={className}>
          {body}
        </Link>
      ) : (
        // Файлы и видео в прототипе не открываются — нажатие только отмечает «просмотрено».
        <button type="button" onClick={onOpen} className={className}>
          {body}
        </button>
      )}
    </li>
  );
}
