"use client";

import Link from "next/link";
import { useState } from "react";
import { Icon } from "@/components/ui/icon";
import { cn } from "@/lib/utils";
import { findLesson, type Subject } from "@mocks/course";
import type { Recording } from "@mocks/recordings";

/** «04:10» или «1:18:00» → секунды. */
function seconds(at: string) {
  return at.split(":").reduce((sum, part) => sum * 60 + Number(part), 0);
}

/**
 * B16 — запись встречи. Видео, таймкоды, чат и задачник в одном месте (US 19.01).
 * Чат идёт вместе с записью: нажал таймкод — видно, что спрашивали в этот момент.
 */
export function RecordingView({ subject, recording: r }: { subject: Subject; recording: Recording }) {
  const [position, setPosition] = useState<string | null>(null);
  const [workbook, setWorkbook] = useState(false);
  const lesson = findLesson(subject, r.lessonId)?.lesson;
  const now = position ? seconds(position) : null;

  return (
    <article className="mx-auto flex max-w-5xl flex-col gap-4">
      <nav aria-label="Где я" className="flex flex-wrap gap-x-4 text-sm">
        <Link href={`/${subject}/calendar?e=${r.eventId}`} className="inline-flex items-center gap-1 font-semibold text-ink-accent no-underline">
          <Icon name="alt-arrow-left" size="min" /> Календарь
        </Link>
        {lesson && (
          <Link href={`/${subject}/lesson/${lesson.id}`} className="font-semibold text-ink-muted no-underline">
            Урок {lesson.number}. {lesson.title}
          </Link>
        )}
      </nav>

      <header>
        <p className="text-[13px] font-semibold text-ink-muted">
          запись от {r.date} · ведёт {r.host} · {r.duration}
        </p>
        <h1 className="text-[22px] font-extrabold leading-tight sm:text-[28px]">{r.title}</h1>
      </header>

      <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_320px]">
        <section className="overflow-hidden rounded-box-l border border-line bg-surface-raised">
          <div className="relative grid aspect-video place-items-center bg-surface-subject">
            <div className="enl-display absolute left-4 top-3 text-sm opacity-70">егэ налегке</div>
            <button
              type="button"
              onClick={() => setPosition(position ?? r.timecodes[0].at)}
              className="flex flex-col items-center gap-2 font-semibold"
              aria-label="Смотреть запись"
            >
              <span className="grid size-16 place-items-center rounded-full bg-accent text-accent-on sm:size-20">
                <Icon name={position ? "pause" : "play"} variant="bold" size="l" />
              </span>
              <span className="rounded-full bg-surface-raised px-3 py-1 text-sm">
                {position ? `Сейчас ${position}` : `Смотреть · ${r.duration}`}
              </span>
            </button>
          </div>
          <div className="flex gap-2 overflow-x-auto p-3 [scrollbar-width:none]" role="group" aria-label="Таймкоды">
            {r.timecodes.map((t) => (
              <button
                key={t.at}
                type="button"
                aria-pressed={position === t.at}
                onClick={() => setPosition(t.at)}
                className={cn(
                  "shrink-0 rounded-full border px-3 py-1.5 text-[13px] transition-colors",
                  position === t.at ? "border-accent bg-accent-soft text-ink" : "border-line text-ink-muted hover:border-accent-border",
                )}
              >
                <span className="font-bold text-ink">{t.at}</span> {t.title}
              </button>
            ))}
          </div>
        </section>

        <aside className="flex flex-col gap-4">
          <section className="flex flex-col rounded-box-l border border-line bg-surface-raised">
            <h2 className="border-b border-line-subtle px-4 py-2.5 font-bold">Чат встречи</h2>
            <ol className="flex max-h-80 flex-col gap-3 overflow-y-auto p-4">
              {r.chat.map((line) => {
                const later = now !== null && seconds(line.at) > now;
                return (
                  <li key={line.at + line.author} className={cn("text-sm transition-opacity", later && "opacity-40")}>
                    <button type="button" onClick={() => setPosition(line.at)} className="mr-1.5 text-[12px] font-bold text-ink-accent">
                      {line.at}
                    </button>
                    <span className={cn("font-bold", line.host && "text-ink-accent")}>{line.author}</span>
                    {line.host && <span className="ml-1 text-[11px] font-semibold text-ink-muted">ведущий</span>}
                    <p className="mt-0.5 leading-snug">{line.text}</p>
                  </li>
                );
              })}
            </ol>
            <p className="border-t border-line-subtle px-4 py-2 text-[12px] text-ink-muted">
              Нажмите на время — запись перемотается к вопросу.
            </p>
          </section>

          <button
            type="button"
            onClick={() => setWorkbook(true)}
            className="flex items-center gap-3 rounded-box-l border border-line bg-surface-raised p-4 text-left hover:border-accent-border"
          >
            <span className="grid size-10 shrink-0 place-items-center rounded-box-m bg-surface-subject">
              <Icon name="document-text" size="2xs" />
            </span>
            <span className="min-w-0 flex-1">
              <span className="block font-semibold">Задачник</span>
              <span className="block text-[13px] text-ink-muted">{workbook ? "Скачан — в прототипе файл не сохраняется" : r.workbook}</span>
            </span>
            <Icon name={workbook ? "check-circle" : "alt-arrow-down"} variant={workbook ? "bold" : "linear"} size="min" className="text-ink-accent" />
          </button>
        </aside>
      </div>
    </article>
  );
}
