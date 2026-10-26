"use client";

import Link from "next/link";
import { GradebookCard } from "@/components/plan/side-cards";
import { ProgressTabs } from "@/components/progress/progress-ui";
import { WithRail } from "@/components/shell/app-shell";
import { Icon } from "@/components/ui/icon";
import { useStats } from "@/lib/stats";
import { cn } from "@/lib/utils";
import { WORKS } from "@mocks/works";
import type { Subject } from "@mocks/course";

// B11 — прогресс. Только по фактам: сданные работы, досмотренные уроки, попытки.
export default function ProgressPage({ params }: { params: { subject: Subject } }) {
  const { subject } = params;
  const stats = useStats(subject);
  const req = stats.materials.required;
  const ext = stats.materials.extra;
  const pct = (d: number, t: number) => (t ? Math.round((d / t) * 100) : 0);

  return (
    <WithRail rail={<GradebookCard subject={subject} />}>
      <div className="flex flex-col gap-5">
        <header className="flex flex-col gap-3">
          <h1 className="enl-display text-[28px] leading-tight sm:text-[34px]">прогресс</h1>
          <ProgressTabs subject={subject} />
          <p className="text-sm text-ink-muted">Считается по сданным работам и просмотренным урокам, а не по галочкам.</p>
        </header>

        {/* Материалы */}
        <section className="grid gap-3 sm:grid-cols-3">
          <Stat title="Обязательный план" value={`${pct(req.done, req.total)}%`} note={`${req.done} из ${req.total} открытых`} bar={pct(req.done, req.total)} />
          <Stat title="Допы «на 100»" value={`${pct(ext.done, ext.total)}%`} note={`${ext.done} из ${ext.total} · по желанию`} bar={pct(ext.done, ext.total)} soft />
          <Link
            href={`/${subject}/practice/mistakes`}
            className="flex flex-col rounded-box-l border border-line bg-surface-raised p-4 no-underline hover:border-accent-border"
          >
            <span className="text-sm font-semibold text-ink-muted">Работа над ошибками</span>
            <span className="enl-display mt-1 text-[32px] leading-none">{stats.mistakesLeft}</span>
            <span className="mt-auto pt-2 text-[13px] font-semibold text-ink-accent">перерешать →</span>
          </Link>
        </section>

        {stats.debts.length > 0 && (
          <section className="rounded-box-l border border-accent-border bg-surface-raised p-4">
            <h2 className="flex items-center gap-2 font-bold">
              <Icon name="hourglass" size="2xs" className="text-ink-accent" /> Не сдано
            </h2>
            <ul className="mt-2 flex flex-col gap-1">
              {stats.debts.map((d) => (
                <li key={d.id}>
                  <Link
                    href={WORKS[d.id] ? `/${subject}/work/${d.id}` : `/${subject}`}
                    className="flex justify-between gap-3 rounded-box-m px-2 py-2 text-sm no-underline hover:bg-surface-subtle"
                  >
                    <span className="font-semibold">{d.title}</span>
                    <span className="shrink-0 text-ink-accent">сдать</span>
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        )}

        {/* Недели */}
        <section className="rounded-box-l border border-line bg-surface-raised p-4">
          <h2 className="font-bold">Обязательный план по неделям</h2>
          <ul className="mt-3 flex flex-col gap-2">
            {stats.weeks.map((w) => {
              const p = pct(w.done, w.future ? w.total : w.open);
              const status = w.future ? "впереди" : w.current ? "идёт" : p === 100 ? "закрыта" : "есть долги";
              return (
                <li key={w.number} className="grid grid-cols-[72px_1fr_auto] items-center gap-3 text-sm">
                  <span className="font-semibold">Неделя {w.number}</span>
                  <span className="h-2.5 rounded-full bg-surface-subtle" aria-hidden>
                    <span className={cn("block h-full rounded-full", w.future ? "bg-transparent" : "bg-accent")} style={{ width: `${p}%` }} />
                  </span>
                  <span className={cn("w-28 text-right", status === "есть долги" ? "font-semibold text-ink-accent" : "text-ink-muted")}>
                    {w.future ? status : `${w.done}/${w.open} · ${status}`}
                  </span>
                </li>
              );
            })}
          </ul>
        </section>

        {/* Решаемость по номерам ЕГЭ */}
        <section className="rounded-box-l border border-line bg-surface-raised p-4">
          <h2 className="font-bold">Решаемость по номерам ЕГЭ</h2>
          <p className="text-[13px] text-ink-muted">По последней попытке каждого теста.</p>
          {stats.ege.length === 0 ? (
            <p className="mt-2 text-sm text-ink-muted">Решите первый тест — здесь появится статистика.</p>
          ) : (
            <ul className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-4">
              {stats.ege.map((e) => (
                <li key={e.number} className="rounded-box-m bg-surface-subtle p-3">
                  <span className="block text-[13px] font-semibold text-ink-muted">№{e.number}</span>
                  <span className={cn("enl-display text-2xl", e.percent < 60 && "text-ink-accent")}>{e.percent}%</span>
                  <span className="block text-[11px] text-ink-muted">заданий: {e.total}</span>
                </li>
              ))}
            </ul>
          )}
        </section>

        {/* Попытки */}
        <section className="rounded-box-l border border-line bg-surface-raised p-4">
          <h2 className="font-bold">Сданные работы</h2>
          <ul className="mt-2 divide-y divide-line-subtle">
            {stats.works.map(({ item, attempts, best }) => (
              <li key={item.id}>
                <Link href={`/${subject}/work/${item.id}/result`} className="flex items-center justify-between gap-3 py-2.5 text-sm no-underline">
                  <span className="min-w-0">
                    <span className="block font-semibold">{item.title}</span>
                    <span className="block text-[13px] text-ink-muted">
                      {WORKS[item.id].check === "auto" ? `попыток: ${attempts}` : WORKS[item.id].check === "curator" ? "проверяет куратор" : "самопроверка"}
                    </span>
                  </span>
                  <span className="shrink-0 font-bold">{best ?? "→"}</span>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      </div>
    </WithRail>
  );
}

function Stat({ title, value, note, bar, soft }: { title: string; value: string; note: string; bar: number; soft?: boolean }) {
  return (
    <section className="flex flex-col rounded-box-l border border-line bg-surface-raised p-4">
      <span className="text-sm font-semibold text-ink-muted">{title}</span>
      <span className="enl-display mt-1 text-[32px] leading-none">{value}</span>
      <span className="mt-2 h-2 rounded-full bg-surface-subtle" aria-hidden>
        <span className={cn("block h-full rounded-full", soft ? "bg-surface-lime" : "bg-accent")} style={{ width: `${bar}%` }} />
      </span>
      <span className="mt-2 text-[13px] text-ink-muted">{note}</span>
    </section>
  );
}
