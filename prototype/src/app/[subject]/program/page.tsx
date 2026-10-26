"use client";

import Link from "next/link";
import { useState } from "react";
import { WithRail } from "@/components/shell/app-shell";
import { MeetingsCard } from "@/components/plan/side-cards";
import { ProgramTabs } from "@/components/program/program-tabs";
import { Icon } from "@/components/ui/icon";
import { cn } from "@/lib/utils";
import { COURSES, SUBJECTS, type Subject } from "@mocks/course";

// B2 — программа курса: недели и уроки по таймлайну, только материалы своего тарифа.
export default function ProgramPage({ params }: { params: { subject: Subject } }) {
  const course = COURSES[params.subject];
  const [openWeek, setOpenWeek] = useState(course.currentWeek);

  return (
    <WithRail rail={<MeetingsCard subject={params.subject} />}>
      <div className="flex flex-col gap-5">
        <header>
          <h1 className="enl-display text-[28px] leading-tight sm:text-[34px]">программа курса</h1>
          <p className="text-sm text-ink-muted">
            {SUBJECTS[params.subject].title} · {course.product} · тариф «{course.tariff}» · {course.period}
          </p>
        </header>

        <ProgramTabs subject={params.subject} active="weeks" />

        <p className="flex items-start gap-2 rounded-box-m bg-surface-subtle p-3 text-[13px] text-ink-muted">
          <Icon name="info-circle" size="2xs" className="mt-0.5 shrink-0" />
          Здесь только материалы и задания вашего тарифа. Уроки открываются по субботам и вторникам; прошедшие недели до
          вашего старта не открываются — пропущенное будет в повторении.
        </p>

        <ol className="flex flex-col gap-3">
          {course.weeks.map((week) => {
            const current = week.number === course.currentWeek;
            const past = week.number < course.currentWeek;
            const open = openWeek === week.number;
            return (
              <li
                key={week.number}
                className={cn(
                  "rounded-box-l border bg-surface-raised",
                  current ? "border-accent-border" : "border-line",
                )}
              >
                <button
                  type="button"
                  aria-expanded={open}
                  onClick={() => setOpenWeek(open ? 0 : week.number)}
                  className="flex w-full items-center gap-3 p-4 text-left"
                >
                  <span
                    className={cn(
                      "grid size-11 shrink-0 place-items-center rounded-box-m text-sm font-extrabold",
                      current ? "bg-accent text-accent-on" : past ? "bg-surface-subject" : "bg-surface-subtle text-ink-muted",
                    )}
                  >
                    {week.number}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block font-bold">
                      Неделя {week.number} {current && <span className="enl-marker">· сейчас</span>}
                    </span>
                    <span className="block text-[13px] text-ink-muted">
                      {week.range} · {week.lessons.length} {week.lessons.length === 1 ? "урок" : "урока"}
                    </span>
                  </span>
                  <Icon name={open ? "alt-arrow-up" : "alt-arrow-down"} size="2xs" className="text-ink-muted" />
                </button>
                {open && (
                  <ul className="border-t border-line-subtle p-2">
                    {week.lessons.map((lesson) => {
                      const locked = lesson.status === "locked";
                      return (
                        <li key={lesson.id}>
                          <Link
                            href={`/${params.subject}/lesson/${lesson.id}`}
                            className="flex items-center gap-3 rounded-box-m px-3 py-3 no-underline hover:bg-surface-subtle"
                          >
                            <Icon
                              name={lesson.status === "done" ? "check-circle" : locked ? "lock-keyhole" : "play-circle"}
                              variant={lesson.status === "done" ? "bold" : "linear"}
                              size="2xs"
                              className={locked ? "text-ink-subtle" : "text-ink-accent"}
                            />
                            <span className="min-w-0 flex-1">
                              <span className={cn("block font-semibold", locked && "text-ink-muted")}>
                                Урок {lesson.number}. {lesson.title}
                              </span>
                              <span className="block text-[13px] text-ink-muted">
                                {locked ? `откроется ${lesson.opens}` : lesson.status === "done" ? "пройден" : `открыт ${lesson.opens}`}
                              </span>
                            </span>
                            <Icon name="alt-arrow-right" size="min" className="text-ink-subtle" />
                          </Link>
                        </li>
                      );
                    })}
                  </ul>
                )}
              </li>
            );
          })}
        </ol>
      </div>
    </WithRail>
  );
}
