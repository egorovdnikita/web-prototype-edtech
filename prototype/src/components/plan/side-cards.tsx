"use client";

import Link from "next/link";
import { Icon } from "@/components/ui/icon";
import { useWeekProgress } from "@/lib/progress";
import { COURSES, GRADEBOOK, MENTOR, type Subject } from "@mocks/course";

// Карточки правой колонки: «дополнительная область» из принципов Figma клиента.

function SideCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="rounded-box-l border border-line bg-surface-raised p-4 shadow-raised">
      <h2 className="enl-display mb-3 text-lg">{title}</h2>
      {children}
    </section>
  );
}

export function MeetingsCard({ subject }: { subject: Subject }) {
  const course = COURSES[subject];
  const week = course.weeks.find((w) => w.number === course.currentWeek);
  const events = week?.events ?? [];
  return (
    <SideCard title="встречи недели">
      {events.length === 0 ? (
        <p className="text-sm text-ink-muted">На этой неделе встреч нет.</p>
      ) : (
        <ul className="flex flex-col gap-3">
          {events.map((e) => (
            <li key={e.id} className="flex items-start gap-3">
              <span className="grid size-9 shrink-0 place-items-center rounded-box-m bg-surface-subject text-ink">
                <Icon name={e.kind === "webinar" ? "videocamera-record" : "calendar"} size="2xs" />
              </span>
              <span className="min-w-0">
                <span className="block text-sm font-semibold">{e.title}</span>
                <span className="block text-[13px] text-ink-muted">{e.due}</span>
              </span>
            </li>
          ))}
        </ul>
      )}
      <Link href={`/${subject}/more#calendar`} className="mt-3 inline-block text-sm font-semibold text-ink-accent">
        Календарь и запись на встречи
      </Link>
    </SideCard>
  );
}

/** Счастливая зачётка: печать за месяц, если обязательный план выполнен больше чем на 60%. */
export function GradebookCard({ subject }: { subject: Subject }) {
  const { percent, threshold, stamps, month } = GRADEBOOK;
  const week = useWeekProgress(subject, COURSES[subject].currentWeek);
  return (
    <SideCard title="счастливая зачётка">
      <p className="text-sm text-ink-muted">
        {month}: <span className="font-bold text-ink">{percent}%</span> обязательного плана. Печать — от {threshold}%.
      </p>
      <div className="relative mt-3 h-3 rounded-full bg-surface-subtle" aria-hidden>
        <div className="h-full rounded-full bg-accent" style={{ width: `${percent}%` }} />
        <div className="absolute inset-y-[-4px] w-0.5 rounded-full bg-ink" style={{ left: `${threshold}%` }} />
      </div>
      <p className="mt-3 text-sm">
        Ещё {week.open - week.done} {week.open - week.done === 1 ? "пункт" : "пункта"} этой недели — и вы ближе к печати.
      </p>
      <p className="mt-2 flex items-center gap-2 text-[13px] text-ink-muted">
        <Icon name="star" variant="bold" size="min" className="text-ink-accent" />
        печатей за сезон: {stamps} · каждая — шанс в розыгрыше
      </p>
    </SideCard>
  );
}

export function MentorCard({ subject }: { subject: Subject }) {
  return (
    <SideCard title="наставник">
      <div className="flex items-center gap-3">
        <span className="grid size-11 place-items-center rounded-full bg-surface-subject text-lg font-bold">А</span>
        <span>
          <span className="block font-semibold">{MENTOR.name}</span>
          <span className="block text-[13px] text-ink-muted">{MENTOR.reply}</span>
        </span>
      </div>
      <Link
        href={`/${subject}/more#mentor`}
        className="mt-3 flex items-center gap-2 text-sm font-semibold text-ink-accent no-underline"
      >
        <Icon name="chat-round-dots" size="min" /> Написать
      </Link>
    </SideCard>
  );
}
