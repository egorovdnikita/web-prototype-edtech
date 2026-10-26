"use client";

import Link from "next/link";
import { Icon } from "@/components/ui/icon";
import { useTrainingResults } from "@/lib/trainings";
import { plural } from "@/lib/utils";
import type { Subject } from "@mocks/course";
import { FORMATS, TRAININGS } from "@mocks/trainings";

/** Каталог тренировок по темам — доступен вне недели (требование ЕНЛ). */
export function TrainingList({ subject }: { subject: Subject }) {
  const { results } = useTrainingResults();
  const list = TRAININGS.filter((t) => t.subject === subject);
  const topics = Array.from(new Set(list.map((t) => t.topic)));

  return (
    <div className="flex flex-col gap-5">
      {topics.map((topic) => (
        <section key={topic} className="flex flex-col gap-2">
          <h2 className="font-bold">{topic}</h2>
          <ul className="grid gap-2 sm:grid-cols-2">
            {list
              .filter((t) => t.topic === topic)
              .map((t) => {
                const r = results[t.id];
                return (
                  <li key={t.id}>
                    <Link
                      href={`/${subject}/training/${t.id}`}
                      className="flex h-full items-center gap-3 rounded-box-l border border-line bg-surface-raised p-4 no-underline shadow-raised transition-colors hover:border-accent-border"
                    >
                      <span className="grid size-10 shrink-0 place-items-center rounded-box-m bg-surface-subject">
                        <Icon name={r ? "check-circle" : "magic-stick-3"} variant={r ? "bold" : "linear"} size="2xs" />
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="block font-semibold leading-snug">{t.title}</span>
                        <span className="block text-[13px] text-ink-muted">
                          {FORMATS[t.format].title} · {t.minutes} мин
                          {r &&
                            ` · ${r.errors === 0 ? "без ошибок" : `лучший — ${r.errors} ${plural(r.errors, ["ошибка", "ошибки", "ошибок"])}`}`}
                        </span>
                      </span>
                      <Icon name="alt-arrow-right" size="min" className="shrink-0 text-ink-subtle" />
                    </Link>
                  </li>
                );
              })}
          </ul>
        </section>
      ))}
    </div>
  );
}
