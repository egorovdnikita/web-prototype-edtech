"use client";

import Link from "next/link";
import { useState } from "react";
import { PlanRow } from "@/components/plan/plan-row";
import { ButtonLink } from "@/components/ui/box";
import { Icon } from "@/components/ui/icon";
import { useProgress } from "@/lib/progress";
import { cn } from "@/lib/utils";
import { COURSES, findLesson, type Subject } from "@mocks/course";

export function LessonView({ subject, lessonId }: { subject: Subject; lessonId: string }) {
  const { statusOf, complete } = useProgress();
  const [showExtra, setShowExtra] = useState(false);
  const found = findLesson(subject, lessonId)!;
  const { week, lesson } = found;

  const locked = lesson.status === "locked";
  const video = lesson.items.find((i) => i.kind === "video");
  const videoDone = video ? statusOf(video) === "done" : false;
  const required = lesson.items.filter((i) => i.required && i !== video);
  const extra = lesson.items.filter((i) => !i.required);

  // Линейная навигация внутри курса: назад / к неделе / дальше — как у учеников сейчас.
  const all = COURSES[subject].weeks.flatMap((w) => w.lessons);
  const index = all.findIndex((l) => l.id === lesson.id);
  const prev = all[index - 1];
  const next = all[index + 1];

  return (
    <article className="mx-auto flex max-w-3xl flex-col gap-5">
      <nav aria-label="Где я" className="flex items-center gap-2 text-sm text-ink-muted">
        <Link href={`/${subject}`} className="flex items-center gap-1 font-semibold text-ink-accent no-underline">
          <Icon name="arrow-left" size="min" /> Неделя {week.number}
        </Link>
        <span>/</span>
        <span>Урок {lesson.number}</span>
      </nav>

      <header>
        {/* normal-case: в названиях уроков бывают римские цифры и имена собственные */}
        <h1 className="enl-display text-[28px] normal-case leading-tight sm:text-[36px]">{lesson.title}</h1>
        <p className="mt-1 text-sm text-ink-muted">
          Урок {lesson.number} · {locked ? `откроется ${lesson.opens}` : `открыт ${lesson.opens} · ≈ ${lesson.minutes} мин`}
        </p>
      </header>

      {locked ? (
        <section className="flex flex-col items-center gap-2 rounded-box-l border border-line bg-surface-subtle p-8 text-center">
          <Icon name="lock-keyhole" size="l" />
          <p className="font-bold">Урок откроется {lesson.opens}</p>
          <p className="max-w-sm text-sm text-ink-muted">
            Уроки открываются по расписанию потока — в субботу и во вторник. Пока можно закрыть задачи этой недели.
          </p>
          <ButtonLink href={`/${subject}`} appearance="soft" className="mt-2">
            К задачам недели
          </ButtonLink>
        </section>
      ) : (
        <>
          {video && (
            <section className="overflow-hidden rounded-box-l border border-line bg-surface-raised">
              <div className="relative grid aspect-video place-items-center bg-surface-subject">
                <div className="enl-display absolute left-4 top-3 text-sm opacity-70">егэ налегке</div>
                <button
                  type="button"
                  onClick={() => complete(video.id)}
                  className="flex flex-col items-center gap-2 font-semibold"
                  aria-label={videoDone ? "Пересмотреть видеоурок" : "Смотреть видеоурок"}
                >
                  <span className="grid size-16 place-items-center rounded-full bg-accent text-accent-on sm:size-20">
                    <Icon name="play-circle" variant="bold" size="xl" className="text-current" />
                  </span>
                  <span className="rounded-full bg-surface-raised px-3 py-1 text-sm">
                    {videoDone ? "Просмотрено · пересмотреть" : `Смотреть · ${video.meta ?? ""}`}
                  </span>
                </button>
              </div>
              {lesson.timecodes && (
                <div className="flex gap-2 overflow-x-auto p-3">
                  {lesson.timecodes.map((t) => (
                    <span
                      key={t.at}
                      className="shrink-0 rounded-full border border-line px-3 py-1 text-[13px] text-ink-muted"
                    >
                      <span className="font-bold text-ink">{t.at}</span> {t.title}
                    </span>
                  ))}
                </div>
              )}
              <p className="border-t border-line-subtle px-4 py-2 text-[13px] text-ink-muted">
                В видео встроены вопросы — они работают и на весь экран. Отметка «просмотрено» ставится сама.
              </p>
            </section>
          )}

          {lesson.important && (
            <aside className="enl-note rounded-box-l p-4">
              <p className="enl-display text-ink-accent">важно!</p>
              <p className="mt-1 font-medium">{lesson.important}</p>
            </aside>
          )}

          <section className="rounded-box-l border border-line bg-surface-raised p-2">
            <h2 className="px-3 pb-1 pt-2 font-bold">Материалы и задания</h2>
            <ul>
              {required.map((item) => (
                <PlanRow key={item.id} item={item} />
              ))}
            </ul>
          </section>

          {extra.length > 0 && (
            <section className="rounded-box-l border border-dashed border-line-strong p-2">
              <button
                type="button"
                onClick={() => setShowExtra(!showExtra)}
                aria-expanded={showExtra}
                className="flex w-full items-center gap-2 px-3 py-2 text-left font-bold"
              >
                <span className="shrink-0 whitespace-nowrap rounded-full bg-surface-subtle px-2 py-0.5 text-[11px] text-ink-muted">на 100</span>
                Для тех, кто хочет больше ({extra.length})
                <Icon name={showExtra ? "alt-arrow-up" : "alt-arrow-down"} size="2xs" className="ml-auto" />
              </button>
              {showExtra && (
                <ul>
                  {extra.map((item) => (
                    <PlanRow key={item.id} item={item} />
                  ))}
                </ul>
              )}
              {!showExtra && (
                <p className="px-3 pb-2 text-[13px] text-ink-muted">Не входит в план и зачётку — по желанию.</p>
              )}
            </section>
          )}
        </>
      )}

      <nav aria-label="Уроки" className="mt-2 grid grid-cols-2 gap-3">
        {prev ? (
          <Link
            href={`/${subject}/lesson/${prev.id}`}
            className="rounded-box-l border border-line bg-surface-raised p-3 no-underline hover:border-line-strong"
          >
            <span className="flex items-center gap-1 text-[13px] text-ink-muted">
              <Icon name="alt-arrow-left" size="min" /> назад
            </span>
            <span className="line-clamp-2 text-sm font-semibold">Урок {prev.number}. {prev.title}</span>
          </Link>
        ) : (
          <span />
        )}
        {next && (
          <Link
            href={`/${subject}/lesson/${next.id}`}
            className={cn(
              "rounded-box-l border border-line bg-surface-raised p-3 text-right no-underline hover:border-line-strong",
              next.status === "locked" && "opacity-70",
            )}
          >
            <span className="flex items-center justify-end gap-1 text-[13px] text-ink-muted">
              дальше <Icon name={next.status === "locked" ? "lock-keyhole" : "alt-arrow-right"} size="min" />
            </span>
            <span className="line-clamp-2 text-sm font-semibold">Урок {next.number}. {next.title}</span>
          </Link>
        )}
      </nav>
    </article>
  );
}
