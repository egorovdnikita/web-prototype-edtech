"use client";

import { useState } from "react";
import { PlanRow } from "@/components/plan/plan-row";
import { Icon } from "@/components/ui/icon";
import { ButtonLink } from "@/components/ui/box";
import { useProgress, useWeekProgress } from "@/lib/progress";
import { cn } from "@/lib/utils";
import { COURSES, type Lesson, type PlanItem, type Subject } from "@mocks/course";
import { WORKS } from "@mocks/works";
import Link from "next/link";
import { useCalendarEvents } from "@/components/calendar/calendar-view";
import { useBookings } from "@/lib/bookings";
import { CAL_WEEKS, dayLabel, isPast } from "@mocks/meetings";

type Filter = "all" | "required" | "extra";

const FILTERS: { id: Filter; label: string }[] = [
  { id: "all", label: "всё" },
  { id: "required", label: "обязательное" },
  { id: "extra", label: "на 100" },
];

function matches(item: PlanItem, filter: Filter) {
  return filter === "all" || (filter === "required" ? item.required : !item.required);
}

export function WeekPlanner({ subject }: { subject: Subject }) {
  const course = COURSES[subject];
  const [weekNumber, setWeekNumber] = useState(course.currentWeek);
  const [filter, setFilter] = useState<Filter>("all");
  const { statusOf } = useProgress();

  const weekIndex = course.weeks.findIndex((w) => w.number === weekNumber);
  const week = course.weeks[weekIndex];

  // Встречи недели: вебинары курса + то, на что ученик записан сам (история 19.18).
  const { isBooked } = useBookings();
  const calendar = useCalendarEvents();
  const days = CAL_WEEKS.find((w) => w.number === weekNumber)?.days ?? [];
  const booked: PlanItem[] = calendar
    .filter((e) => days.includes(e.date) && (e.subject === subject || e.subject === "all"))
    .filter((e) => e.kind === "exam" || isBooked(e.id))
    .map((e) => {
      const { weekday, day } = dayLabel(e.date);
      const date = `${weekday} ${String(day).padStart(2, "0")}.${e.date.slice(5, 7)}`;
      return {
        id: e.id,
        kind: "meeting",
        title: e.title,
        required: false,
        status: isPast(e) ? "done" : "todo",
        due: `${date}, ${e.time} · вы записаны`,
      };
    });
  const meetings = [...week.events, ...booked];
  const isCurrent = weekNumber === course.currentWeek;
  const progress = useWeekProgress(subject, weekNumber);

  // Долги: обязательное прошлых недель, что не сдано. Их видно только в текущей неделе.
  const debts = isCurrent
    ? course.weeks
        .filter((w) => w.number < weekNumber)
        .flatMap((w) => w.lessons.flatMap((l) => l.items.map((item) => ({ item, lesson: l }))))
        .filter(({ item }) => item.required && statusOf(item) === "overdue")
    : [];

  // «Прямо сейчас» — первое несделанное обязательное: сначала долги, потом по порядку недели.
  const ordered = [
    ...debts,
    ...week.lessons.flatMap((l) => l.items.map((item) => ({ item, lesson: l as Lesson | null }))),
    ...meetings.map((item) => ({ item, lesson: null })),
  ];
  const now = isCurrent
    ? ordered.find(({ item }) => item.required && ["todo", "overdue"].includes(statusOf(item)))
    : undefined;

  const lessonHref = (lesson: Lesson | null) => (lesson ? `/${subject}/lesson/${lesson.id}` : undefined);
  const percent = progress.open ? Math.round((progress.done / progress.open) * 100) : 0;

  return (
    <div className="flex flex-col gap-5">
      {/* Неделя и навигация по неделям */}
      <div className="flex items-center gap-2">
        <button
          type="button"
          aria-label="Предыдущая неделя"
          disabled={weekIndex === 0}
          onClick={() => setWeekNumber(course.weeks[weekIndex - 1].number)}
          className="grid size-10 place-items-center rounded-full border border-line bg-surface-raised disabled:opacity-40"
        >
          <Icon name="alt-arrow-left" size="2xs" />
        </button>
        <div className="min-w-0 flex-1 text-center sm:text-left">
          <h1 className="enl-display text-[28px] leading-tight sm:text-[34px]">
            {isCurrent ? "задачи на неделю" : `неделя ${week.number}`}
          </h1>
          <p className="text-sm text-ink-muted">
            Неделя {week.number} · {week.range}
            {isCurrent && " · сейчас"}
          </p>
        </div>
        <button
          type="button"
          aria-label="Следующая неделя"
          disabled={weekIndex === course.weeks.length - 1}
          onClick={() => setWeekNumber(course.weeks[weekIndex + 1].number)}
          className="grid size-10 place-items-center rounded-full border border-line bg-surface-raised disabled:opacity-40"
        >
          <Icon name="alt-arrow-right" size="2xs" />
        </button>
      </div>

      {/* Прогресс обязательного плана */}
      <section className="rounded-box-l border border-line bg-surface-raised p-4 shadow-raised">
        <div className="flex items-baseline justify-between gap-3">
          <p className="font-semibold">
            Обязательный план: <span className="enl-marker">{progress.done} из {progress.open}</span>
          </p>
          <span className="text-sm text-ink-muted">{percent}%</span>
        </div>
        <div className="mt-2 h-2.5 rounded-full bg-surface-subtle" aria-hidden>
          <div className="h-full rounded-full bg-accent transition-[width]" style={{ width: `${percent}%` }} />
        </div>
        {progress.total > progress.open && (
          <p className="mt-2 text-[13px] text-ink-muted">
            Ещё {progress.total - progress.open} откроются по расписанию. Допы «на 100» в план не входят.
          </p>
        )}
      </section>

      {/* Прямо сейчас */}
      {now && (
        <section className="rounded-box-l bg-surface-subject p-4">
          <p className="enl-display text-sm">продолжить с</p>
          <p className="mt-1 text-lg font-bold leading-snug">{now.item.title}</p>
          <p className="text-sm text-ink-muted">
            {now.lesson ? `Урок ${now.lesson.number}. ${now.lesson.title}` : "Встреча недели"}
            {now.item.due && ` · ${now.item.due}`}
          </p>
          {now.lesson && (
            <ButtonLink
              href={WORKS[now.item.id] ? `/${subject}/work/${now.item.id}` : lessonHref(now.lesson)!}
              size="l"
              className="mt-3 w-full sm:w-auto"
            >
              {statusOf(now.item) === "overdue" ? "Сдать долг" : "Продолжить"}
              <Icon name="alt-arrow-right" size="min" />
            </ButtonLink>
          )}
        </section>
      )}

      {/* Фильтр */}
      <div role="tablist" aria-label="Что показывать" className="flex gap-2">
        {FILTERS.map((f) => (
          <button
            key={f.id}
            type="button"
            role="tab"
            aria-selected={filter === f.id}
            onClick={() => setFilter(f.id)}
            className={cn(
              "rounded-full border px-3.5 py-1.5 text-sm font-semibold transition-colors",
              filter === f.id ? "border-ink bg-ink text-surface-page" : "border-line bg-surface-raised text-ink-muted",
            )}
          >
            {f.label}
          </button>
        ))}
      </div>

      {debts.length > 0 && filter !== "extra" && (
        <section className="rounded-box-l border border-accent-border bg-surface-raised p-2">
          <h2 className="flex items-center gap-2 px-3 pb-1 pt-2 font-bold">
            <Icon name="hourglass" size="2xs" className="text-ink-accent" />
            Не сдано с прошлых недель
          </h2>
          <ul>
            {debts.map(({ item, lesson }) => (
              <PlanRow key={item.id} item={item} href={lessonHref(lesson)} now={now?.item.id === item.id} />
            ))}
          </ul>
        </section>
      )}

      {week.lessons.map((lesson) => (
        <LessonGroup
          key={lesson.id}
          lesson={lesson}
          filter={filter}
          href={lessonHref(lesson)!}
          nowId={now?.item.id}
        />
      ))}

      {filter !== "extra" || meetings.some((e) => matches(e, filter)) ? (
        <section className="rounded-box-l border border-line bg-surface-raised p-2 shadow-raised">
          <h2 className="flex items-center justify-between px-3 pb-1 pt-2 font-bold">
            Встречи недели
            <Link href={`/${subject}/calendar`} className="text-sm font-semibold text-ink-accent no-underline">
              Календарь
            </Link>
          </h2>
          {meetings.some((e) => matches(e, filter)) ? (
            <ul>
              {meetings
                .filter((e) => matches(e, filter))
                .map((e) => (
                  <PlanRow key={e.id} item={e} href={`/${subject}/calendar?e=${e.id}`} now={now?.item.id === e.id} />
                ))}
            </ul>
          ) : (
            <p className="px-3 pb-3 text-sm text-ink-muted">Записей пока нет — выберите продлёнку или коворкинг в календаре.</p>
          )}
        </section>
      ) : null}
    </div>
  );
}

function LessonGroup({
  lesson,
  filter,
  href,
  nowId,
}: {
  lesson: Lesson;
  filter: Filter;
  href: string;
  nowId?: string;
}) {
  const { statusOf } = useProgress();
  const [open, setOpen] = useState(lesson.status === "open");
  const items = lesson.items.filter((i) => matches(i, filter));
  if (items.length === 0) return null;

  const required = lesson.items.filter((i) => i.required);
  const done = required.filter((i) => statusOf(i) === "done").length;
  const locked = lesson.status === "locked";

  return (
    <section className={cn("rounded-box-l border border-line bg-surface-raised shadow-raised", locked && "bg-surface-subtle")}>
      <button
        type="button"
        onClick={() => setOpen(!open)}
        aria-expanded={open}
        className="flex w-full items-center gap-3 p-4 text-left"
      >
        <span
          className={cn(
            "grid size-10 shrink-0 place-items-center rounded-box-m text-sm font-extrabold",
            locked ? "bg-surface-page text-ink-subtle" : "bg-surface-subject text-ink",
          )}
        >
          {locked ? <Icon name="lock-keyhole" size="2xs" /> : lesson.number}
        </span>
        <span className="min-w-0 flex-1">
          <span className="block font-bold leading-snug">
            Урок {lesson.number}. {lesson.title}
          </span>
          <span className="block text-[13px] text-ink-muted">
            {locked ? `откроется ${lesson.opens}` : `≈ ${lesson.minutes} мин · обязательное ${done} из ${required.length}`}
          </span>
        </span>
        <Icon name={open ? "alt-arrow-up" : "alt-arrow-down"} size="2xs" className="text-ink-muted" />
      </button>
      {open && (
        <ul className="border-t border-line-subtle p-2">
          {items.map((item) => (
            <PlanRow key={item.id} item={item} href={href} now={nowId === item.id} />
          ))}
        </ul>
      )}
    </section>
  );
}
