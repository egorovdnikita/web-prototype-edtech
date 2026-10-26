"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { Button, ButtonLink } from "@/components/ui/box";
import { Icon } from "@/components/ui/icon";
import { AnswerField } from "@/components/work/work-solve";
import { useMistakes } from "@/lib/mistakes";
import { buildSet, setTitle, useTrainerStats } from "@/lib/trainer";
import { cn, plural } from "@/lib/utils";
import type { Subject } from "@mocks/course";
import type { TrainerSet, TrainerTask } from "@mocks/trainer";

interface Answered {
  task: TrainerTask;
  answer: string;
  ok: boolean;
}

/**
 * Подборка тренажёра: по одному заданию на экран, проверка сразу после ответа —
 * это тренировка, а не контрольная. Неверный ответ показывает ключ и пояснение
 * и уходит в работу над ошибками.
 */
export function TrainerSession({ subject, set }: { subject: Subject; set: TrainerSet }) {
  const { recordTrainer, ready } = useMistakes(subject);
  const stats = useTrainerStats(subject);
  const [attempt, setAttempt] = useState(0);
  // Состав фиксируем на входе: статистика меняется по ходу решения,
  // а «слабые номера» не должны пересобираться посреди подборки.
  const [queue, setQueue] = useState<TrainerTask[] | null>(null);
  const [index, setIndex] = useState(0);
  const [answer, setAnswer] = useState("");
  const [checked, setChecked] = useState<Answered | null>(null);
  const [log, setLog] = useState<Answered[]>([]);
  const top = useRef<HTMLDivElement>(null);
  const weak = stats?.weak ?? [];

  useEffect(() => {
    if (!ready || queue !== null) return;
    setQueue(buildSet(subject, set, weak, `${set}-${attempt}`));
  }, [ready, queue, subject, set, weak, attempt]);

  useEffect(() => {
    top.current?.scrollIntoView({ block: "nearest" });
  }, [index]);

  if (!queue) return null;

  const back = `/${subject}/practice`;
  const done = index >= queue.length;
  const task = queue[index];
  const right = log.filter((a) => a.ok).length;

  const restart = () => {
    setAttempt(attempt + 1);
    setQueue(null);
    setIndex(0);
    setAnswer("");
    setChecked(null);
    setLog([]);
  };

  if (queue.length === 0)
    return (
      <section className="mx-auto flex max-w-xl flex-col items-center gap-3 rounded-box-l border border-line bg-surface-raised p-8 text-center">
        <Icon name="cup-star" size="xl" className="text-ink-accent" />
        <p className="text-lg font-bold">{set === "weak" ? "Слабых номеров нет" : "В этой подборке пока нет заданий"}</p>
        <p className="text-sm text-ink-muted">
          {set === "weak" ? "Ни один номер не ниже 60% — решайте любой номер, статистика обновится." : "В прототипе задания есть для №1–6."}
        </p>
        <ButtonLink href={back} appearance="soft">
          К номерам
        </ButtonLink>
      </section>
    );

  return (
    <article ref={top} className="mx-auto flex max-w-2xl scroll-mt-20 flex-col gap-4">
      <nav aria-label="Где я" className="text-sm">
        <Link href={back} className="inline-flex items-center gap-1 font-semibold text-ink-accent no-underline">
          <Icon name="alt-arrow-left" size="min" /> Тренажёр
        </Link>
      </nav>

      <header className="flex flex-col gap-2">
        <h1 className="enl-display text-[26px] normal-case leading-tight sm:text-[32px]">{setTitle(set)}</h1>
        <div className="flex items-center gap-3 text-sm">
          <span className="shrink-0 font-semibold">{done ? "Итоги" : `${index + 1} из ${queue.length}`}</span>
          <span className="flex h-2 flex-1 overflow-hidden rounded-full bg-surface-subtle" aria-hidden>
            <span className="h-full rounded-full bg-accent transition-all" style={{ width: `${(Math.min(index, queue.length) / queue.length) * 100}%` }} />
          </span>
          <span className="shrink-0 text-ink-muted">верно {right}</span>
        </div>
      </header>

      {!done ? (
        <section className="rounded-box-l border border-line bg-surface-raised p-4 sm:p-5">
          <p className="flex items-center gap-2 text-[13px] font-semibold text-ink-muted">
            <span className="rounded-full bg-surface-subject px-2 py-0.5 font-extrabold text-ink">№{task.ege}</span>
            {task.topic}
          </p>
          <p className="mt-2 font-semibold leading-relaxed">{task.prompt}</p>
          {checked ? (
            <Feedback item={checked} />
          ) : (
            <AnswerField key={task.id} task={task} value={answer} onChange={setAnswer} />
          )}

          {/* На телефоне кнопки прилипают к низу: пояснение длинное, «Дальше» не должна уезжать. */}
          <div className="sticky bottom-[calc(57px+env(safe-area-inset-bottom))] -mx-4 mt-4 flex gap-3 border-t border-line-subtle bg-surface-raised px-4 py-3 sm:static sm:mx-0 sm:border-0 sm:p-0 lg:bottom-0">
            {checked ? (
              <Button
                size="l"
                className="flex-1 sm:flex-none"
                endIcon={<Icon name="alt-arrow-right" size="min" />}
                onClick={() => {
                  setIndex(index + 1);
                  setAnswer("");
                  setChecked(null);
                }}
              >
                {index + 1 === queue.length ? "Итоги" : "Дальше"}
              </Button>
            ) : (
              <>
                <Button
                  appearance="outline"
                  size="l"
                  onClick={() => {
                    setIndex(index + 1);
                    setAnswer("");
                  }}
                >
                  Пропустить
                </Button>
                <Button
                  size="l"
                  className="flex-1 sm:flex-none"
                  disabled={!answer.trim()}
                  onClick={() => {
                    const ok = recordTrainer(task, answer);
                    const item = { task, answer, ok };
                    setChecked(item);
                    setLog([...log, item]);
                  }}
                >
                  Проверить
                </Button>
              </>
            )}
          </div>
        </section>
      ) : (
        <Summary log={log} total={queue.length} subject={subject} onRestart={restart} back={back} />
      )}
    </article>
  );
}

function Feedback({ item }: { item: Answered }) {
  const { task, answer, ok } = item;
  return (
    <div role="status" className={cn("mt-4 rounded-box-m p-3 text-sm leading-relaxed", ok ? "bg-surface-lime" : "bg-accent-soft")}>
      <p className={cn("flex items-center gap-2 font-bold", ok ? "text-ink-olive" : "text-ink-accent")}>
        <Icon name={ok ? "check-circle" : "close-circle"} variant="bold" size="2xs" />
        {ok ? "Верно" : "Неверно"}
      </p>
      {!ok && (
        <p className="mt-1">
          Ваш ответ: <span className="font-bold line-through decoration-2">{answer}</span> · верно:{" "}
          <span className="enl-marker font-bold">{task.answer}</span>
        </p>
      )}
      {task.type === "choice" && (
        <ol className="mt-2 flex flex-col gap-1">
          {task.options.map((o, i) => (
            <li key={i} className={cn(task.answer.includes(String(i + 1)) ? "font-semibold" : "text-ink-muted")}>
              {i + 1}) {o}
            </li>
          ))}
        </ol>
      )}
      <p className="mt-2">{task.explanation}</p>
      {!ok && <p className="mt-2 text-ink-muted">Задание добавлено в работу над ошибками.</p>}
    </div>
  );
}

function Summary({
  log,
  total,
  subject,
  onRestart,
  back,
}: {
  log: Answered[];
  total: number;
  subject: Subject;
  onRestart: () => void;
  back: string;
}) {
  const right = log.filter((a) => a.ok).length;
  const wrong = log.length - right;
  const skipped = total - log.length;
  return (
    <section className="flex flex-col gap-4">
      <div className="rounded-box-l bg-surface-subject p-5">
        <p className="flex items-baseline gap-2">
          <span className="enl-display text-[44px] leading-none">
            <span className="enl-marker">{right}</span>
          </span>
          <span className="text-lg font-bold">из {total}</span>
        </p>
        <p className="mt-1 text-sm">
          {wrong > 0
            ? `${wrong} ${plural(wrong, ["ошибка ушла", "ошибки ушли", "ошибок ушли"])} в работу над ошибками.`
            : "Без ошибок."}
          {skipped > 0 && ` Пропущено: ${skipped}.`} Статистика по номерам обновилась.
        </p>
      </div>
      <ul className="flex flex-col gap-2">
        {log.map(({ task, ok }) => (
          <li key={task.id} className="flex items-start gap-3 rounded-box-m border border-line bg-surface-raised p-3 text-sm">
            <Icon
              name={ok ? "check-circle" : "close-circle"}
              variant="bold"
              size="2xs"
              className={cn("mt-0.5 shrink-0", ok ? "text-ink-olive" : "text-ink-accent")}
            />
            <span>
              <span className="font-bold">№{task.ege}</span> · {task.prompt}
            </span>
          </li>
        ))}
      </ul>
      <div className="flex flex-col gap-2 sm:flex-row">
        <Button onClick={onRestart}>Ещё подборка</Button>
        {wrong > 0 && (
          <ButtonLink href={`/${subject}/practice/mistakes`} appearance="soft">
            Работа над ошибками
          </ButtonLink>
        )}
        <ButtonLink href={back} appearance="outline">
          К номерам
        </ButtonLink>
      </div>
    </section>
  );
}
