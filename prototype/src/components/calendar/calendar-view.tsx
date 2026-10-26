"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import { EventSheet, ExamSheet } from "@/components/calendar/event-sheet";
import { Button } from "@/components/ui/box";
import { Icon, type IconName } from "@/components/ui/icon";
import { useBookings } from "@/lib/bookings";
import { accentOf } from "@/lib/style";
import { useDistribution } from "@/lib/distribution";
import { cn } from "@/lib/utils";
import { COURSES, SUBJECTS, type Subject } from "@mocks/course";
import {
  BOOKABLE,
  CAL_WEEKS,
  EVENTS,
  EXAM,
  MEETING_LABEL,
  TODAY_ISO,
  dayLabel,
  isPast,
  type CalendarEvent,
  type EventKind,
  type MeetingKind,
} from "@mocks/meetings";

// B14 — календарь всех курсов ученика: таймлайн уроков, дедлайны, вебинары,
// встречи по записи и зачёт. Неделя — как у потока, с субботы.

export const KIND_ICON: Record<EventKind, IconName> = {
  lesson: "play-circle",
  deadline: "hourglass",
  webinar: "videocamera-record",
  extension: "document-text",
  workshop: "square-academic-cap",
  coworking: "user-circle",
  exam: "checklist-minimalistic",
};

type Filter = "all" | Subject;

/** Есть ли зачёты на тарифе — «С инструктором» и VIP. */
export function hasExams(subject: Subject) {
  return ["С инструктором", "VIP"].includes(COURSES[subject].tariff);
}

export function useCalendarEvents() {
  const { exam } = useBookings();
  const examEvent: CalendarEvent[] = exam
    ? [
        {
          id: "exam",
          kind: "exam",
          subject: EXAM.subject,
          title: EXAM.title,
          date: exam.date,
          time: exam.time,
          host: EXAM.host,
          about: EXAM.topic,
        },
      ]
    : [];
  return [...EVENTS, ...examEvent].sort((a, b) =>
    `${a.date}${a.time ?? "00:00"}`.localeCompare(
      `${b.date}${b.time ?? "00:00"}`,
    ),
  );
}

export function CalendarView({ subject }: { subject: Subject }) {
  const router = useRouter();
  const params = useSearchParams();
  const { isBooked, exam } = useBookings();
  const events = useCalendarEvents();
  const [weekIndex, setWeekIndex] = useState(1);
  const [filter, setFilter] = useState<Filter>("all");
  const [examOpen, setExamOpen] = useState(false);

  const openId = params.get("e");
  const open = events.find((e) => e.id === openId);
  const setOpen = (id: string | null) =>
    router.replace(
      id ? `/${subject}/calendar?e=${id}` : `/${subject}/calendar`,
      { scroll: false },
    );

  const week = CAL_WEEKS[weekIndex];
  const visible = events.filter(
    (e) => filter === "all" || e.subject === "all" || e.subject === filter,
  );
  const first = dayLabel(week.days[0]);
  const last = dayLabel(week.days[6]);
  const range =
    first.month === last.month
      ? `${first.day}–${last.day} ${last.month}`
      : `${first.day} ${first.month} — ${last.day} ${last.month}`;

  return (
    <div className="mx-auto flex max-w-6xl flex-col gap-5">
      <header>
        <h1 className="enl-display text-[28px] leading-tight sm:text-[34px]">
          календарь
        </h1>
        <p className="text-sm text-ink-muted">
          Уроки, дедлайны и встречи всех ваших курсов. На продлёнки, воркшопы и
          коворкинги — по записи.
        </p>
      </header>

      <ExamBanner
        subject={subject}
        onOpen={() => setExamOpen(true)}
        booked={Boolean(exam)}
      />

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="flex items-center gap-2">
          <button
            type="button"
            aria-label="Предыдущая неделя"
            disabled={weekIndex === 0}
            onClick={() => setWeekIndex(weekIndex - 1)}
            className="grid size-10 place-items-center rounded-full border border-line bg-surface-raised disabled:text-ink-disabled"
          >
            <Icon name="alt-arrow-left" size="2xs" className="text-current" />
          </button>
          <p className="min-w-[200px] text-center font-bold">
            Неделя {week.number} · {range}
          </p>
          <button
            type="button"
            aria-label="Следующая неделя"
            disabled={weekIndex === CAL_WEEKS.length - 1}
            onClick={() => setWeekIndex(weekIndex + 1)}
            className="grid size-10 place-items-center rounded-full border border-line bg-surface-raised disabled:text-ink-disabled"
          >
            <Icon name="alt-arrow-right" size="2xs" className="text-current" />
          </button>
        </div>
        <div
          role="group"
          aria-label="Предмет"
          className="flex gap-2 sm:ml-auto"
        >
          {(["all", "soc", "hist"] as Filter[]).map((f) => (
            <button
              key={f}
              type="button"
              aria-pressed={filter === f}
              onClick={() => setFilter(f)}
              className={cn(
                "rounded-full border px-3.5 py-1.5 text-sm font-semibold transition-colors",
                filter === f
                  ? "border-ink bg-ink text-surface-page"
                  : "border-line bg-surface-raised text-ink-muted",
              )}
            >
              {f === "all" ? "все предметы" : SUBJECTS[f].short}
            </button>
          ))}
        </div>
      </div>

      {/* Телефон и планшет: список по дням */}
      <ol className="flex flex-col gap-4 lg:hidden">
        {week.days.map((day) => {
          const list = visible.filter((e) => e.date === day);
          const { weekday, day: d, month } = dayLabel(day);
          const today = day === TODAY_ISO;
          return (
            <li key={day}>
              <h2
                className={cn(
                  "mb-2 flex items-baseline gap-2 font-bold",
                  today && "text-ink-accent",
                )}
              >
                <span>{`${weekday[0].toUpperCase()}${weekday.slice(1)}, ${d} ${month}`}</span>
                {today && (
                  <span className="enl-marker text-sm text-ink">сегодня</span>
                )}
              </h2>
              {list.length === 0 ? (
                <p className="text-[13px] text-ink-subtle">
                  Ничего не запланировано
                </p>
              ) : (
                <ul className="flex flex-col gap-2">
                  {list.map((e) => (
                    <EventRow
                      key={e.id}
                      event={e}
                      booked={isBooked(e.id) || e.kind === "exam"}
                      onOpen={() => setOpen(e.id)}
                    />
                  ))}
                </ul>
              )}
            </li>
          );
        })}
      </ol>

      {/* Десктоп: неделя колонками */}
      <div className="hidden overflow-hidden rounded-box-l border border-line bg-surface-raised lg:grid lg:grid-cols-7">
        {week.days.map((day) => {
          const list = visible.filter((e) => e.date === day);
          const { weekday, day: d } = dayLabel(day);
          const today = day === TODAY_ISO;
          return (
            <section
              key={day}
              className={cn(
                "min-h-[420px] border-r border-line-subtle p-2 last:border-r-0",
                today && "bg-surface-subtle",
              )}
            >
              <h2 className="mb-2 flex items-baseline justify-between px-1">
                <span className="text-sm font-semibold capitalize text-ink-muted">
                  {weekday}
                </span>
                <span
                  className={cn(
                    "grid size-8 place-items-center rounded-full text-lg font-extrabold",
                    today && "bg-accent text-accent-on",
                  )}
                >
                  {d}
                </span>
              </h2>
              <ul className="flex flex-col gap-1.5">
                {list.map((e) => (
                  <EventRow
                    key={e.id}
                    event={e}
                    booked={isBooked(e.id) || e.kind === "exam"}
                    onOpen={() => setOpen(e.id)}
                    compact
                  />
                ))}
              </ul>
            </section>
          );
        })}
      </div>

      {open && <EventSheet event={open} onClose={() => setOpen(null)} />}
      {examOpen && (
        <ExamSheet subject={subject} onClose={() => setExamOpen(false)} />
      )}
    </div>
  );
}

function ExamBanner({
  subject,
  onOpen,
  booked,
}: {
  subject: Subject;
  onOpen: () => void;
  booked: boolean;
}) {
  const { exam, examResult } = useBookings();
  const { isWaiting } = useDistribution();
  if (hasExams(subject) && isWaiting(subject)) {
    return (
      <p className="flex items-start gap-2 rounded-box-m bg-surface-subtle p-3 text-[13px] text-ink-muted">
        Запись на зачёт откроется, когда назначат наставника: зачёт идёт по его свободным окнам.
      </p>
    );
  }
  if (!hasExams(subject)) {
    return (
      <p className="flex items-start gap-2 rounded-box-m bg-surface-subtle p-3 text-[13px] text-ink-muted">
        Зачёты с наставником — на тарифах «С инструктором» и VIP. На вашем
        тарифе по {SUBJECTS[subject].title.toLowerCase()} их нет.
      </p>
    );
  }
  if (examResult) {
    return (
      <p className="flex items-center gap-2 rounded-box-m bg-surface-subtle p-3 text-sm">
        <Icon name="check-circle" variant="bold" size="2xs" className="shrink-0 text-ink-olive" />
        {EXAM.title} {examResult.passed ? "сдан" : "не сдан"}, билет №{examResult.ticket}.
        <Link href={`/${subject}/mentor`} className="font-semibold text-ink-accent">
          Обратная связь
        </Link>
      </p>
    );
  }
  const when = exam && dayLabel(exam.date);
  return (
    <section className="flex flex-col gap-3 rounded-box-l bg-surface-subject p-4 sm:flex-row sm:items-center">
      <div className="min-w-0 flex-1">
        <p className="font-bold">{EXAM.title}</p>
        <p className="text-sm text-ink-muted">
          {booked && when
            ? `Вы записаны: ${when.weekday}, ${when.day} ${when.month}, ${exam.time} · ${EXAM.host}`
            : `${EXAM.topic} · ${EXAM.minutes} минут по видеосвязи с наставником`}
        </p>
      </div>
      <Button
        size="m"
        appearance={booked ? "outline" : "solid"}
        onClick={onOpen}
        className="w-full sm:w-auto"
      >
        {booked ? "Изменить время" : "Выбрать время"}
      </Button>
    </section>
  );
}

/** Подпись состояния встречи: записан, мест, без записи, запись в уроке. */
export function eventStatus(e: CalendarEvent, booked: boolean) {
  const past = isPast(e);
  if (e.kind === "lesson") return null;
  if (e.kind === "deadline")
    return { text: `до ${e.time}`, tone: "muted" as const };
  if (e.kind === "exam")
    return { text: "вы записаны", tone: "accent" as const };
  if (e.kind === "webinar")
    return {
      text: past ? "запись в уроке" : "без записи",
      tone: "muted" as const,
    };
  if (BOOKABLE.includes(e.kind as MeetingKind)) {
    if (past)
      return {
        text: booked
          ? e.kind === "coworking"
            ? "вы были"
            : "вы были · запись в уроке"
          : "прошла",
        tone: "muted" as const,
      };
    if (booked) return { text: "вы записаны", tone: "accent" as const };
    const free = (e.capacity ?? 0) - (e.taken ?? 0);
    return free > 0
      ? { text: `свободно ${free}`, tone: "muted" as const }
      : { text: "мест нет", tone: "muted" as const };
  }
  return null;
}

function EventRow({
  event,
  booked,
  onOpen,
  compact,
}: {
  event: CalendarEvent;
  booked: boolean;
  onOpen: () => void;
  compact?: boolean;
}) {
  const status = eventStatus(event, booked);
  const past = isPast(event);
  const subjectTag =
    event.subject === "all" ? "все предметы" : SUBJECTS[event.subject].short;
  const content = (
    <>
      <span className="min-w-0 flex-1">
        <span
          className={cn(
            "block font-semibold leading-snug",
            compact && "text-[13px]",
            past && "text-ink-muted",
          )}
        >
          {event.title}
        </span>
        <span
          className={cn(
            "block text-ink-muted",
            compact ? "text-[11px]" : "text-[13px]",
          )}
        >
          {[
            event.time && event.kind !== "deadline" ? event.time : null,
            MEETING_LABEL[event.kind],
            // Предмет подписан и в узкой колонке: в монохроме полоса слева его не различает.
            compact ? (event.subject === "all" ? null : SUBJECTS[event.subject].short) : subjectTag,
          ]
            .filter(Boolean)
            .join(" · ")}
        </span>
        {status && (
          <span
            className={cn(
              "mt-1 inline-block rounded-full px-2 py-0.5 font-bold",
              compact ? "text-[10px]" : "text-[11px]",
              status.tone === "accent"
                ? "bg-accent text-accent-on"
                : "bg-surface-subtle text-ink-muted",
            )}
          >
            {status.text}
          </span>
        )}
      </span>
      {!compact && (
        <Icon
          name="alt-arrow-right"
          size="min"
          className="shrink-0"
        />
      )}
    </>
  );
  const className = cn(
    "flex w-full items-start gap-3 rounded-box-m border text-left transition-colors hover:border-line-strong",
    // На десктопе предмет — полоса слева: иконка съедала ширину узкой колонки.
    compact ? "gap-2 border-l-4 p-2" : "bg-surface-raised p-3",
    booked && !past ? "border-accent-border" : "border-line",
    // Последним: twMerge иначе перекроет цвет полосы общим цветом рамки.
    compact && (event.subject === "all" ? "border-l-surface-lime" : "border-l-surface-subject-strong"),
  );
  const label = [
    event.title,
    event.time,
    MEETING_LABEL[event.kind],
    subjectTag,
    status?.text,
  ]
    .filter(Boolean)
    .join(", ");
  const accent = event.subject === "all" ? undefined : accentOf(event.subject);
  if (event.kind === "lesson" || event.kind === "deadline") {
    return (
      <li>
        <Link
          href={event.href ?? "#"}
          aria-label={label}
          data-accent={compact ? accent : undefined}
          className={cn(className, "no-underline")}
        >
          {content}
        </Link>
      </li>
    );
  }
  return (
    <li>
      <button
        type="button"
        onClick={onOpen}
        aria-label={label}
        data-accent={compact ? accent : undefined}
        className={className}
      >
        {content}
      </button>
    </li>
  );
}
