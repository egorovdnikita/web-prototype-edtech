import Link from "next/link";
import { MistakesLink } from "@/components/practice/mistakes-link";
import { Icon, type IconName } from "@/components/ui/icon";
import type { Subject } from "@mocks/course";
import { TRAININGS } from "@mocks/trainings";

// Практика: свободная тренировка вне недели. Строится от действующего тренажёра
// (рекомендация разбора), работа над ошибками — фильтр «мои ошибки».
const TASKS = Array.from({ length: 25 }, (_, i) => i + 1);

const BLOCKS: { title: string; text: string; icon: IconName; meta: (s: Subject) => string; href?: string }[] = [
  {
    title: "Интерактивные тренировки",
    text: "Найди лишнее, соответствия, карта, собери цепочку",
    icon: "magic-stick-3",
    meta: (s) => `${TRAININGS.filter((t) => t.subject === s).length} по темам курса`,
    href: "/practice/trainings",
  },
  { title: "Карточки", text: "Даты, личности, термины — по темам курса", icon: "notebook-minimalistic", meta: () => "Quizlet" },
];

export default function PracticePage({ params }: { params: { subject: Subject } }) {
  const total = params.subject === "soc" ? 25 : 21;
  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-5">
      <header>
        <h1 className="enl-display text-[28px] leading-tight sm:text-[34px]">практика</h1>
        <p className="text-sm text-ink-muted">Тренируйтесь сколько хотите — в план недели и зачётку это не входит.</p>
      </header>

      <MistakesLink subject={params.subject} />

      <section className="rounded-box-l border border-line bg-surface-raised p-4 shadow-raised">
        <h2 className="font-bold">Тренажёр по номерам ЕГЭ</h2>
        <p className="text-[13px] text-ink-muted">Выберите номер задания — тренажёр подберёт задания из базы.</p>
        <div className="mt-3 grid grid-cols-5 gap-2 sm:grid-cols-9">
          {TASKS.slice(0, total).map((n) => (
            <button
              key={n}
              type="button"
              className="aspect-square rounded-box-m border border-line bg-surface-page text-sm font-bold transition-colors hover:border-accent hover:bg-accent-soft"
            >
              {n}
            </button>
          ))}
        </div>
      </section>

      <div className="grid gap-3 sm:grid-cols-2">
        {BLOCKS.map((b) => {
          const body = (
            <>
              <span className="grid size-10 place-items-center rounded-box-m bg-surface-subject">
                <Icon name={b.icon} size="2xs" />
              </span>
              <h2 className="font-bold leading-snug">{b.title}</h2>
              <p className="text-[13px] text-ink-muted">{b.text}</p>
              <p className="mt-auto text-[13px] font-semibold text-ink-accent">{b.meta(params.subject)}</p>
            </>
          );
          const box = "flex flex-col gap-2 rounded-box-l border border-line bg-surface-raised p-4 shadow-raised";
          return b.href ? (
            <Link key={b.title} href={`/${params.subject}${b.href}`} className={`${box} text-ink no-underline transition-colors hover:border-accent-border`}>
              {body}
            </Link>
          ) : (
            <section key={b.title} className={box}>
              {body}
            </section>
          );
        })}
      </div>
    </div>
  );
}
