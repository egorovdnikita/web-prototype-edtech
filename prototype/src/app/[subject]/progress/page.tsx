import { GradebookCard } from "@/components/plan/side-cards";
import { WithRail } from "@/components/shell/app-shell";
import { Icon } from "@/components/ui/icon";
import { COURSES, type Subject } from "@mocks/course";

// B11–B13 в одном разделе: прогресс по неделям, пробники, ачивки.
const WEEKS = [92, 100, 85, 78, 100, 64, 70];
const PROBES = [
  { name: "Пробник №1", score: 61 },
  { name: "Пробник №2", score: 68 },
];
const ACHIEVEMENTS = ["первый пробник", "3 дня подряд", "без долгов", "ночная сова"];

export default function ProgressPage({ params }: { params: { subject: Subject } }) {
  const current = COURSES[params.subject].currentWeek;
  return (
    <WithRail rail={<GradebookCard subject={params.subject} />}>
      <div className="flex flex-col gap-5">
        <header>
          <h1 className="enl-display text-[28px] leading-tight sm:text-[34px]">прогресс</h1>
          <p className="text-sm text-ink-muted">Считается по сданным работам и просмотренным урокам, а не по галочкам.</p>
        </header>

        <section className="rounded-box-l border border-line bg-surface-raised p-4 shadow-raised">
          <h2 className="font-bold">Обязательный план по неделям</h2>
          <div className="mt-4 flex h-40 items-end gap-2" role="img" aria-label="Выполнение плана по неделям 1–7">
            {WEEKS.map((v, i) => (
              <div key={i} className="flex h-full flex-1 flex-col items-center gap-1">
                <span className="text-[11px] text-ink-muted">{v}%</span>
                <div className="flex w-full flex-1 items-end">
                  <div className="w-full rounded-t-box-s bg-accent" style={{ height: `${v}%` }} />
                </div>
                <span className="text-[11px] font-semibold">{i + 1}</span>
              </div>
            ))}
            <div className="flex h-full flex-1 flex-col items-center gap-1">
              <span className="text-[11px] text-ink-muted">идёт</span>
              <div className="flex w-full flex-1 items-end">
                <div className="h-1/3 w-full rounded-t-box-s border-2 border-dashed border-accent-border" />
              </div>
              <span className="text-[11px] font-semibold">{current}</span>
            </div>
          </div>
        </section>

        <section className="rounded-box-l border border-line bg-surface-raised p-4 shadow-raised">
          <h2 className="font-bold">Пробники</h2>
          <ul className="mt-2 divide-y divide-line-subtle">
            {PROBES.map((p) => (
              <li key={p.name} className="flex items-center justify-between py-2">
                <span>{p.name}</span>
                <span className="font-bold">{p.score} баллов</span>
              </li>
            ))}
          </ul>
        </section>

        <section className="rounded-box-l border border-line bg-surface-raised p-4 shadow-raised">
          <h2 className="font-bold">Ачивки</h2>
          <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-4">
            {ACHIEVEMENTS.map((a) => (
              <div key={a} className="flex flex-col items-center gap-2 rounded-box-m bg-surface-subtle p-3 text-center">
                <span className="grid size-14 place-items-center rounded-full border-4 border-surface-marker bg-surface-subject">
                  <Icon name="medal-ribbon" variant="bold" size="s" className="text-ink-accent" />
                </span>
                <span className="text-[13px] font-semibold">{a}</span>
              </div>
            ))}
          </div>
        </section>
      </div>
    </WithRail>
  );
}
