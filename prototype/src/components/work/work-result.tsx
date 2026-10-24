"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button, ButtonLink } from "@/components/ui/box";
import { Icon } from "@/components/ui/icon";
import { useProgress } from "@/lib/progress";
import { useWorks, type WorkRecord } from "@/lib/works";
import { cn } from "@/lib/utils";
import { findItem, type Subject } from "@mocks/course";
import { PAST, WORKS, isCorrect, maxScore, type LongTask, type Work } from "@mocks/works";

export function WorkResult({ subject, id }: { subject: Subject; id: string }) {
  const { get } = useWorks();
  const found = findItem(subject, id)!;
  const work = WORKS[id];
  const record = get(id);

  return (
    <article className="mx-auto flex max-w-3xl flex-col gap-4">
      <nav aria-label="Где я" className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm">
        <Link href={`/${subject}`} className="flex items-center gap-1 font-semibold text-ink-accent no-underline">
          <Icon name="arrow-left" size="min" /> Задачи на неделю
        </Link>
        <Link href={`/${subject}/lesson/${found.lesson.id}`} className="font-semibold text-ink-muted no-underline">
          Урок {found.lesson.number}
        </Link>
      </nav>

      {!record.submitted ? (
        <section className="rounded-box-l border border-line bg-surface-raised p-6 text-center shadow-raised">
          <p className="font-bold">Работа ещё не сдана</p>
          <ButtonLink href={`/${subject}/work/${id}`} className="mt-3">
            Решать
          </ButtonLink>
        </section>
      ) : work.check === "auto" ? (
        <TestResult subject={subject} id={id} title={found.item.title} work={work} record={record} />
      ) : work.check === "curator" ? (
        <CuratorResult id={id} subject={subject} title={found.item.title} work={work} record={record} />
      ) : (
        <SelfCheck id={id} title={found.item.title} work={work} record={record} />
      )}
    </article>
  );
}

function ScoreHeader({ title, score, max, label }: { title: string; score: number | null; max: number; label: string }) {
  return (
    <header className="rounded-box-l bg-surface-subject p-5">
      <p className="text-sm font-semibold">{title}</p>
      <p className="mt-1 flex items-baseline gap-2">
        <span className="enl-display text-[44px] leading-none">
          {score === null ? "—" : <span className="enl-marker">{score}</span>}
        </span>
        <span className="text-lg font-bold">из {max}</span>
      </p>
      <p className="mt-1 text-sm text-ink-muted">{label}</p>
    </header>
  );
}

// --- B5: тест ---------------------------------------------------------------

function TestResult({ subject, id, title, work, record }: { subject: Subject; id: string; title: string; work: Work; record: WorkRecord }) {
  const router = useRouter();
  const { retry } = useWorks();
  const last = record.attempts[record.attempts.length - 1];
  const wrong = work.tasks.filter((t) => t.type !== "long" && !isCorrect(t, last.answers[t.id])).length;

  return (
    <>
      <ScoreHeader
        title={title}
        score={last.score}
        max={last.max}
        label={wrong ? `Ошибок: ${wrong} — они уже в «Работе над ошибками»` : "Без ошибок — так держать"}
      />

      <ol className="flex flex-col gap-3">
        {work.tasks.map((task, i) => {
          if (task.type === "long") return null;
          const given = last.answers[task.id];
          const ok = isCorrect(task, given);
          const shown = task.type === "choice" && task.answer.length === 1 && given ? task.options[Number(given) - 1] : given;
          const right = task.type === "choice" && task.answer.length === 1 ? task.options[Number(task.answer) - 1] : task.answer;
          return (
            <li key={task.id} className={cn("rounded-box-l border bg-surface-raised p-4 shadow-raised", ok ? "border-line" : "border-accent-border")}>
              <p className="flex items-center gap-2 text-sm font-bold">
                <Icon
                  name={ok ? "check-circle" : "close-circle"}
                  variant="bold"
                  size="2xs"
                  className={ok ? "text-ink-olive" : "text-ink-accent"}
                />
                Задание {i + 1} · {ok ? "верно" : "неверно"}
              </p>
              <p className="mt-1 text-[15px] leading-relaxed">{task.prompt}</p>
              <p className="mt-2 text-sm">
                Ваш ответ: <span className={cn("font-bold", !ok && "line-through decoration-2")}>{shown || "нет ответа"}</span>
                {!ok && (
                  <>
                    {" · "}верно: <span className="enl-marker font-bold">{right}</span>
                  </>
                )}
              </p>
              <Explanation text={task.explanation} open={!ok} />
            </li>
          );
        })}
      </ol>

      <section className="rounded-box-l border border-line bg-surface-raised p-4 shadow-raised">
        <h2 className="font-bold">Мои попытки</h2>
        <ul className="mt-2 divide-y divide-line-subtle text-sm">
          {record.attempts.map((a, i) => (
            <li key={i} className="flex justify-between py-2">
              <span>
                Попытка {i + 1} · {a.date}
              </span>
              <span className="font-bold">
                {a.score} из {a.max}
              </span>
            </li>
          ))}
        </ul>
      </section>

      <div className="flex flex-col gap-3 sm:flex-row">
        <Button
          appearance="outline"
          size="l"
          onClick={() => {
            retry(id);
            router.push(`/${subject}/work/${id}`);
          }}
        >
          Перерешать
        </Button>
        <ButtonLink href={`/${subject}`} size="l">
          К задачам недели
        </ButtonLink>
      </div>
    </>
  );
}

function Explanation({ text, open: initial }: { text: string; open: boolean }) {
  const [open, setOpen] = useState(initial);
  return (
    <div className="mt-2">
      <button type="button" onClick={() => setOpen(!open)} aria-expanded={open} className="text-sm font-semibold text-ink-accent">
        {open ? "Скрыть пояснение" : "Пояснение"}
      </button>
      {open && <p className="mt-1 rounded-box-m bg-surface-subtle p-3 text-sm leading-relaxed">{text}</p>}
    </div>
  );
}

// --- B6: проверяет куратор --------------------------------------------------

function CuratorResult({ id, subject, title, work, record }: { id: string; subject: Subject; title: string; work: Work; record: WorkRecord }) {
  const { statusOf } = useProgress();
  const found = findItem(subject, id)!;
  const review = statusOf(found.item) === "review" ? undefined : PAST[id]?.review;
  const tasks = work.tasks as LongTask[];
  const max = tasks.reduce((s, t) => s + maxScore(t), 0);

  if (!review) {
    return (
      <>
        {/* Никаких баллов до проверки: сейчас GetCourse ставит максимум заранее, и ученик видит завышенный результат. */}
        <ScoreHeader title={title} score={null} max={max} label={`Сдано ${record.submitted!.date} · на проверке у куратора`} />
        <section className="flex items-start gap-3 rounded-box-l border border-line bg-surface-raised p-4 shadow-raised">
          <Icon name="hourglass" size="s" className="shrink-0 text-ink-accent" />
          <div className="text-sm">
            <p className="font-bold">Куратор проверит до {checkDue(record.submitted!.date)}</p>
            <p className="mt-1 text-ink-muted">
              Пришлём уведомление, когда будут баллы и комментарии. В план недели работа уже засчитана как сданная.
            </p>
          </div>
        </section>
        <Answers tasks={tasks} answers={record.submitted!.answers} />
        <p className="text-sm text-ink-muted">
          Как выглядит проверенная работа:{" "}
          <Link href="/soc/work/soc-13-c/result" className="font-semibold text-ink-accent">
            ДЗ прошлой недели
          </Link>
        </p>
      </>
    );
  }

  const total = Object.values(review.scores).reduce((s, byCode) => s + Object.values(byCode).reduce((a, b) => a + b, 0), 0);
  return (
    <>
      <ScoreHeader title={title} score={total} max={max} label={`Проверил ${review.reviewer} · ${review.checkedAt}`} />
      <ol className="flex flex-col gap-3">
        {tasks.map((task, i) => {
          const scores = review.scores[task.id] ?? {};
          const got = Object.values(scores).reduce((a, b) => a + b, 0);
          return (
            <li key={task.id} className="rounded-box-l border border-line bg-surface-raised p-4 shadow-raised">
              <p className="flex justify-between gap-2 font-bold">
                <span>
                  Задание {i + 1} · №{task.ege}
                </span>
                <span>
                  {got} из {maxScore(task)}
                </span>
              </p>
              <p className="mt-2 rounded-box-m bg-surface-subtle p-3 text-sm leading-relaxed">{record.submitted!.answers[task.id]}</p>
              <ul className="mt-3 flex flex-wrap gap-2">
                {task.criteria.map((c) => (
                  <li key={c.code} className="rounded-full border border-line px-3 py-1 text-[13px]">
                    <span className="font-bold">{c.code}</span> {c.title}: {scores[c.code] ?? 0}/{c.max}
                  </li>
                ))}
              </ul>
              {review.comments[task.id] && (
                <div className="enl-grid-paper mt-3 rounded-box-m border border-accent-border p-3 text-sm leading-relaxed">
                  <p className="enl-display text-ink-accent">комментарий куратора</p>
                  {review.comments[task.id]}
                </div>
              )}
            </li>
          );
        })}
      </ol>
      <div className="flex flex-col gap-3 sm:flex-row">
        <Button appearance="outline" size="l">
          Подать на перепроверку
        </Button>
        <ButtonLink href={`/${subject}`} size="l">
          К задачам недели
        </ButtonLink>
      </div>
    </>
  );
}

/** Срок проверки обычной работы — 3 дня (гайд проверяющих). */
function checkDue(date: string) {
  const [d, m] = date.split(".").map(Number);
  const due = new Date(2026, m - 1, d + 3);
  return `${String(due.getDate()).padStart(2, "0")}.${String(due.getMonth() + 1).padStart(2, "0")}`;
}

function Answers({ tasks, answers }: { tasks: LongTask[]; answers: Record<string, string> }) {
  return (
    <section className="rounded-box-l border border-line bg-surface-raised p-4 shadow-raised">
      <h2 className="font-bold">Мои ответы</h2>
      <ol className="mt-2 flex flex-col gap-3">
        {tasks.map((t, i) => (
          <li key={t.id} className="text-sm">
            <p className="font-semibold text-ink-muted">Задание {i + 1} · №{t.ege}</p>
            <p className="mt-1 whitespace-pre-line leading-relaxed">{answers[t.id] || "нет ответа"}</p>
          </li>
        ))}
      </ol>
    </section>
  );
}

// --- B7: самопроверка -------------------------------------------------------

function SelfCheck({ id, title, work, record }: { id: string; title: string; work: Work; record: WorkRecord }) {
  const { saveSelfScores } = useWorks();
  const tasks = work.tasks as LongTask[];
  const max = tasks.reduce((s, t) => s + maxScore(t), 0);
  const [editing, setEditing] = useState(!record.selfScores);
  const [draft, setDraft] = useState<Record<string, Record<string, number>>>(record.selfScores ?? {});

  const complete = tasks.every((t) => t.criteria.every((c) => draft[t.id]?.[c.code] !== undefined));
  const total = Object.values(record.selfScores ?? {}).reduce(
    (s, byCode) => s + Object.values(byCode).reduce((a, b) => a + b, 0),
    0,
  );

  return (
    <>
      <ScoreHeader
        title={title}
        score={record.selfScores && !editing ? total : null}
        max={max}
        label={record.selfScores && !editing ? "Самопроверка — ваша оценка по критериям" : `Сдано ${record.submitted!.date} · осталось оценить себя`}
      />

      {/* Явно разводим самопроверку и проверку куратором — сейчас ученики их путают. */}
      <p className="flex items-start gap-2 rounded-box-m bg-surface-subtle p-3 text-sm">
        <Icon name="info-circle" size="2xs" className="mt-0.5 shrink-0" />
        На тарифе «Фристайл» ДЗ не проверяет куратор. Сравните свой ответ с ключом и поставьте баллы по критериям — так
        вы увидите, где теряете баллы на экзамене.
      </p>

      <ol className="flex flex-col gap-3">
        {tasks.map((task, i) => (
          <li key={task.id} className="rounded-box-l border border-line bg-surface-raised p-4 shadow-raised">
            <p className="font-bold">
              Задание {i + 1} · №{task.ege}
            </p>
            <p className="mt-1 text-sm text-ink-muted">{task.prompt}</p>
            <div className="mt-3 grid gap-3 sm:grid-cols-2">
              <div>
                <p className="text-[13px] font-semibold text-ink-muted">Мой ответ</p>
                <p className="mt-1 whitespace-pre-line rounded-box-m bg-surface-subtle p-3 text-sm leading-relaxed">
                  {record.submitted!.answers[task.id] || "нет ответа"}
                </p>
              </div>
              <div>
                <p className="text-[13px] font-semibold text-ink-muted">Ключ</p>
                <p className="enl-grid-paper mt-1 rounded-box-m border border-line p-3 text-sm leading-relaxed">{task.reference}</p>
              </div>
            </div>
            {task.criteria.map((c) => (
              <fieldset key={c.code} className="mt-3" disabled={!editing}>
                <legend className="text-sm font-bold">
                  {c.code} · {c.title}
                </legend>
                <p className="text-[13px] text-ink-muted">{c.hint}</p>
                <div className="mt-2 flex gap-2">
                  {Array.from({ length: c.max + 1 }, (_, v) => {
                    const selected = (editing ? draft : record.selfScores)?.[task.id]?.[c.code] === v;
                    return (
                      <label
                        key={v}
                        className={cn(
                          "grid size-11 cursor-pointer place-items-center rounded-box-m border text-sm font-bold transition-colors",
                          selected ? "border-accent bg-accent text-accent-on" : "border-line-strong bg-surface-page",
                          !editing && "cursor-default",
                        )}
                      >
                        <input
                          type="radio"
                          name={`${task.id}-${c.code}`}
                          className="sr-only"
                          checked={selected}
                          aria-label={`${c.code}: ${v} из ${c.max}`}
                          onChange={() => setDraft({ ...draft, [task.id]: { ...draft[task.id], [c.code]: v } })}
                        />
                        {v}
                      </label>
                    );
                  })}
                </div>
              </fieldset>
            ))}
          </li>
        ))}
      </ol>

      {editing ? (
        <Button
          size="l"
          disabled={!complete}
          onClick={() => {
            saveSelfScores(id, draft);
            setEditing(false);
          }}
        >
          Сохранить баллы
        </Button>
      ) : (
        <Button appearance="outline" size="l" onClick={() => setEditing(true)}>
          Изменить оценку
        </Button>
      )}
      {editing && !complete && <p className="-mt-2 text-[13px] text-ink-muted">Поставьте балл по каждому критерию.</p>}
    </>
  );
}
