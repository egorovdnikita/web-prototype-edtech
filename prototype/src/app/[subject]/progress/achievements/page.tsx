"use client";

import { Medal, ProgressTabs } from "@/components/progress/progress-ui";
import { useStats } from "@/lib/stats";
import { cn } from "@/lib/utils";
import type { Subject } from "@mocks/course";

// B13 — ачивки. Выдаются сами за учебные действия (история 07.02) — в прототипе
// их можно получить: решить тест на максимум, исправить ошибку, записаться на встречу.
export default function AchievementsPage({ params }: { params: { subject: Subject } }) {
  const { subject } = params;
  const { achievements } = useStats(subject);
  const earned = achievements.filter((a) => a.earned).length;

  return (
    <div className="mx-auto flex max-w-4xl flex-col gap-5">
      <header className="flex flex-col gap-3">
        <h1 className="enl-display text-[28px] leading-tight sm:text-[34px]">ачивки</h1>
        <ProgressTabs subject={subject} />
        <p className="text-sm text-ink-muted">
          Собрано <span className="enl-marker font-bold text-ink">{earned}</span> из {achievements.length}. Выдаются сами — за учебные
          действия, в том числе за то, что не сдались после неудачи.
        </p>
      </header>

      <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
        {achievements.map((a) => (
          <li
            key={a.id}
            className={cn(
              "flex flex-col items-center gap-2 rounded-box-l border p-4 text-center",
              a.earned ? "border-line bg-surface-raised shadow-raised" : "border-dashed border-line bg-surface-subtle",
            )}
          >
            <Medal earned={a.earned} />
            <span className={cn("enl-display text-base leading-tight", !a.earned && "text-ink-muted")}>{a.title}</span>
            <span className="text-[13px] leading-snug text-ink-muted">{a.why}</span>
            <span className={cn("mt-auto text-[11px] font-bold", a.earned ? "text-ink-accent" : "text-ink-subtle")}>
              {a.earned ? `получена ${a.date}` : "ещё не получена"}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}
