"use client";

import Link from "next/link";
import { ButtonLink } from "@/components/ui/box";
import { Icon } from "@/components/ui/icon";
import { useTrainerStats, type NumberStat } from "@/lib/trainer";
import { cn } from "@/lib/utils";
import type { Subject } from "@mocks/course";
import { WEAK_BELOW } from "@mocks/trainer";

/** Цвет решаемости: не по светофору, а по шкале предмета — слабое заметнее. */
function tone(r: NumberStat) {
  if (r.percent === null) return "border-line bg-surface-page";
  if (r.percent < WEAK_BELOW) return "border-accent bg-accent-soft";
  return "border-transparent bg-surface-lime";
}

/**
 * Тренажёр в «Практике»: номера 1 части с решаемостью — выбрал номер и решаешь.
 * Это раздел «практика» действующего test-soc; «статистика» — отдельным экраном.
 */
export function TrainerGrid({ subject }: { subject: Subject }) {
  const stats = useTrainerStats(subject);

  if (!stats)
    return (
      <section className="rounded-box-l border border-line bg-surface-raised p-4">
        <h2 className="font-bold">Тренажёр по номерам ЕГЭ</h2>
        <p className="mt-1 text-sm text-ink-muted">
          В прототипе тренажёр только по обществознанию — как действующий test-soc. Есть ли аналог по истории, уточняем у
          школы. Пока — тесты уроков и тренировки, ошибки соберутся в работе над ошибками.
        </p>
      </section>
    );

  return (
    <section className="flex flex-col gap-3 rounded-box-l border border-line bg-surface-raised p-4">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <div>
          <h2 className="font-bold">Тренажёр по номерам ЕГЭ</h2>
          <p className="text-[13px] text-ink-muted">
            1 часть, проверка сразу. В прототипе — задания для №1–6, в действующем тренажёре — {stats.bankTotal}.
          </p>
        </div>
        <Link href={`/${subject}/practice/trainer`} className="text-sm font-semibold text-ink-accent">
          Статистика
        </Link>
      </div>

      <ul className="grid grid-cols-6 gap-1.5 sm:grid-cols-8 sm:gap-2">
        {stats.rows.map((r) => {
          const body = (
            <>
              <span className="text-base font-extrabold">{r.number}</span>
              <span className="text-[11px] font-semibold text-ink-muted">
                {r.available === 0 ? "нет" : r.percent === null ? "—" : `${r.percent}%`}
              </span>
            </>
          );
          const cell = cn(
            "flex aspect-square flex-col items-center justify-center rounded-box-m border-2 no-underline transition-colors",
            r.available ? tone(r) : "border-dashed border-line bg-surface-page opacity-60",
          );
          return (
            <li key={r.number}>
              {r.available ? (
                <Link
                  href={`/${subject}/practice/trainer/n${r.number}`}
                  aria-label={`Задание ${r.number}${r.percent === null ? ", ещё не решали" : `, решено ${r.percent}%`}`}
                  className={cn(cell, "text-ink hover:border-accent")}
                >
                  {body}
                </Link>
              ) : (
                <span className={cell} aria-label={`Задание ${r.number}: в прототипе нет заданий`}>
                  {body}
                </span>
              )}
            </li>
          );
        })}
      </ul>

      <div className="flex flex-col gap-2 sm:flex-row">
        <ButtonLink
          href={`/${subject}/practice/trainer/weak`}
          appearance={stats.weak.length ? "solid" : "soft"}
          className="sm:flex-1"
        >
          <Icon name="fire" size="min" />
          {stats.weak.length ? `Слабые номера: ${stats.weak.map((n) => `№${n}`).join(", ")}` : "Слабые номера"}
        </ButtonLink>
        <ButtonLink href={`/${subject}/practice/trainer/mix`} appearance="outline" className="sm:flex-1">
          Микс по всем номерам
        </ButtonLink>
      </div>
      <p className="text-[12px] text-ink-muted">
        Процент — по тренажёру и тестам уроков. Ниже {WEAK_BELOW}% — номер в «слабых».
      </p>
    </section>
  );
}

/** «Статистика» test-soc: решаемость по номерам, сильные и слабые. */
export function TrainerStats({ subject }: { subject: Subject }) {
  const stats = useTrainerStats(subject);
  if (!stats) return <p className="text-sm text-ink-muted">В прототипе тренажёр только по обществознанию.</p>;
  const tried = stats.rows.filter((r) => r.percent !== null);

  return (
    <div className="flex flex-col gap-4">
      <div className="grid grid-cols-3 gap-2">
        {[
          { label: "решено в тренажёре", value: stats.solved },
          { label: "номеров начато", value: `${tried.length} из ${stats.part1}` },
          { label: "слабых номеров", value: stats.weak.length },
        ].map((s) => (
          <div key={s.label} className="rounded-box-l border border-line bg-surface-raised p-3">
            <p className="enl-display text-2xl">{s.value}</p>
            <p className="text-[12px] leading-tight text-ink-muted">{s.label}</p>
          </div>
        ))}
      </div>

      <section className="rounded-box-l border border-line bg-surface-raised p-4">
        <h2 className="font-bold">Решаемость по номерам</h2>
        <ul className="mt-3 flex flex-col gap-2">
          {stats.rows.map((r) => (
            <li key={r.number} className="grid grid-cols-[40px_minmax(0,1fr)_72px] items-center gap-3 text-sm">
              <span className="font-extrabold">№{r.number}</span>
              <span className="relative h-3 rounded-full bg-surface-subtle" aria-hidden>
                {r.percent !== null && (
                  <span
                    className={cn("absolute inset-y-0 left-0 rounded-full", r.percent < WEAK_BELOW ? "bg-accent" : "bg-ink-olive")}
                    style={{ width: `${Math.max(r.percent, 4)}%` }}
                  />
                )}
                <span className="absolute inset-y-[-3px] w-0.5 rounded-full bg-ink" style={{ left: `${WEAK_BELOW}%` }} />
              </span>
              <span className="text-right text-ink-muted">
                {r.percent === null ? (r.available ? "не решали" : "—") : `${r.percent}% · ${r.right}/${r.total}`}
              </span>
            </li>
          ))}
        </ul>
        <p className="mt-3 text-[12px] text-ink-muted">Черта — {WEAK_BELOW}%: ниже неё номер попадает в «слабые».</p>
      </section>

      {stats.weak.length > 0 && (
        <ButtonLink href={`/${subject}/practice/trainer/weak`}>Решать слабые номера</ButtonLink>
      )}
    </div>
  );
}
