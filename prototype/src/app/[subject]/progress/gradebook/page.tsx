"use client";

import { ProgressTabs, Stamp } from "@/components/progress/progress-ui";
import { ButtonLink } from "@/components/ui/box";
import { Icon } from "@/components/ui/icon";
import { useStats } from "@/lib/stats";
import { plural } from "@/lib/utils";
import { SUBJECTS, type Subject } from "@mocks/course";
import { DRAW, POINTS_PER_TASK, SEASON, STAMP, STAMP_THRESHOLD } from "@mocks/gradebook";

// B12 — счастливая зачётка. Механика — по ответу ЕНЛ №23 (см. mocks/gradebook.ts).
export default function GradebookPage({ params }: { params: { subject: Subject } }) {
  const { subject } = params;
  const soc = useStats("soc");
  const hist = useStats("hist");
  const own = subject === "soc" ? soc : hist;
  const g = own.gradebook;
  const tickets = soc.gradebook.stampCount + hist.gradebook.stampCount;

  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-5">
      <header className="flex flex-col gap-3">
        <h1 className="enl-display text-[28px] leading-tight sm:text-[34px]">счастливая зачётка</h1>
        <ProgressTabs subject={subject} />
      </header>

      {/* Текущий месяц */}
      <section className="rounded-box-l bg-surface-subject p-5">
        <div className="flex items-center gap-4">
          <Stamp subject={subject} state={g.stamps[1].stamp ? "earned" : "pending"} size={72} label={`Печать за октябрь: ${STAMP[subject].name}`} />
          <div className="min-w-0">
            <p className="text-sm font-semibold">Октябрь · {SUBJECTS[subject].title.toLowerCase()}</p>
            <p className="enl-display text-[32px] leading-tight">
              <span className="enl-marker">{g.points}</span> из {g.max}
            </p>
            <p className="text-sm text-ink-muted">баллов обязательного плана · {g.percent}%</p>
          </div>
        </div>
        <div className="relative mt-4 h-3 rounded-full bg-surface-raised" aria-hidden>
          <div className="h-full rounded-full bg-accent transition-[width]" style={{ width: `${g.percent}%` }} />
          <div className="absolute -top-1 h-5 w-0.5 rounded-full bg-ink" style={{ left: `${STAMP_THRESHOLD}%` }} />
        </div>
        <p className="mt-3 font-semibold">
          {g.stamps[1].stamp
            ? "Больше 60% набрано — печать за октябрь ваша. Всё, что сверху, — для себя и для экзамена."
            : `До печати — ещё ${g.needTasks} ${plural(g.needTasks, ["задание", "задания", "заданий"])} обязательного плана.`}
        </p>
        <p className="mt-1 text-[13px] text-ink-muted">
          Каждое обязательное задание — {POINTS_PER_TASK} баллов. Печать — если за месяц набрано больше {STAMP_THRESHOLD}%. Допы «на 100» не
          считаются.
        </p>
        {!g.stamps[1].stamp && (
          <ButtonLink href={`/${subject}`} size="m" className="mt-3">
            К задачам недели
          </ButtonLink>
        )}
      </section>

      {/* Сезон: печати по месяцам, оба предмета */}
      <section className="rounded-box-l border border-line bg-surface-raised p-4 shadow-raised">
        <h2 className="font-bold">Печати сезона</h2>
        {(["soc", "hist"] as Subject[]).map((s) => {
          const stats = s === "soc" ? soc : hist;
          return (
            <div key={s} className="mt-3">
              <p className="mb-2 text-sm font-semibold text-ink-muted">
                {SUBJECTS[s].title} · печать «{STAMP[s].name}»
              </p>
              <ol className="flex gap-3 overflow-x-auto pb-1">
                {SEASON.map((month, i) => {
                  const known = stats.gradebook.stamps[i];
                  const state = !known ? "empty" : known.stamp ? "earned" : known.final ? "missed" : "pending";
                  return (
                    <li key={month} className="flex shrink-0 flex-col items-center gap-1">
                      <Stamp subject={s} state={state} size={48} label={`${month}: ${state === "earned" ? "печать" : state === "pending" ? "идёт" : "нет печати"}`} />
                      <span className="text-[11px] text-ink-muted">{month.slice(0, 3)}</span>
                    </li>
                  );
                })}
              </ol>
            </div>
          );
        })}
      </section>

      {/* Розыгрыш */}
      <section className="rounded-box-l border border-line bg-surface-raised p-4 shadow-raised">
        <h2 className="flex items-center gap-2 font-bold">
          <Icon name="cup-star" size="2xs" className="text-ink-accent" /> Розыгрыш
        </h2>
        {own.gradebook.drawAllowed ? (
          <>
            <p className="mt-2 text-sm">
              Каждая печать — билет. Сейчас у вас{" "}
              <span className="enl-marker font-bold">
                {tickets} {plural(tickets, ["билет", "билета", "билетов"])}
              </span>{" "}
              за оба предмета. Следующий розыгрыш — {DRAW.next}.
            </p>
            <p className="mt-1 text-[13px] text-ink-muted">Призы: {DRAW.prizes.join(", ")}.</p>
            <div className="enl-grid-paper mt-4 rounded-box-m border border-accent-border p-4">
              <p className="enl-display text-ink-accent">итоги · {DRAW.last.month}</p>
              <p className="mt-1 font-bold">Вы выиграли: {DRAW.last.prize}</p>
              <p className="mt-1 text-sm text-ink-muted">{DRAW.last.how}</p>
            </div>
          </>
        ) : (
          <p className="mt-2 text-sm text-ink-muted">На тарифе «Флай» розыгрыша нет — печати копятся для себя.</p>
        )}
      </section>
    </div>
  );
}
