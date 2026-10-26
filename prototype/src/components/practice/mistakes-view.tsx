"use client";

import Link from "next/link";
import { useMemo, useRef, useState } from "react";
import { Button, ButtonLink } from "@/components/ui/box";
import { Icon } from "@/components/ui/icon";
import { AnswerField } from "@/components/work/work-solve";
import { useMistakes, type Mistake, type TrainingMistake } from "@/lib/mistakes";
import { cn, plural } from "@/lib/utils";
import type { Subject } from "@mocks/course";
import { FORMATS, unitLabel } from "@mocks/trainings";

// B8 — работа над ошибками. Все ошибки тестов в одном месте, фильтр по номеру
// ЕГЭ и по теме, перерешивание прямо в карточке. Верно — задание уходит из списка.
// Ошибки тренировок — отдельным блоком: их перерешивают в той же механике,
// только на элементах с ошибками.

/** После скольких неверных попыток показываем правильный ответ. */
const REVEAL_AFTER = 2;

export function MistakesView({ subject }: { subject: Subject }) {
  const { mistakes, trainings, check, solvedToday } = useMistakes(subject);
  const [ege, setEge] = useState<number | "all">("all");
  const [lesson, setLesson] = useState<string>("all");
  const [openKey, setOpenKey] = useState<string | null>(null);
  // Решённые карточки держим на месте, пока ученик не нажмёт «Дальше»,
  // иначе «Верно!» исчезло бы вместе с карточкой.
  const [justSolved, setJustSolved] = useState<Record<string, Mistake>>({});
  const order = useRef<string[]>([]);

  const all = useMemo(() => {
    const merged = [
      ...mistakes,
      ...Object.values(justSolved).filter(
        (s) => !mistakes.some((m) => m.key === s.key),
      ),
    ];
    for (const m of merged)
      if (!order.current.includes(m.key)) order.current.push(m.key);
    return merged.sort(
      (a, b) => order.current.indexOf(a.key) - order.current.indexOf(b.key),
    );
  }, [mistakes, justSolved]);

  const numbers = Array.from(new Set(all.map((m) => m.task.ege))).sort(
    (a, b) => a - b,
  );
  const lessons = Array.from(
    new Map(
      all.flatMap((m) =>
        m.sources.map(
          (s) =>
            (s.lessonId
              ? [s.lessonId, `Урок ${s.lessonNumber}. ${s.lessonTitle}`]
              : [s.workId, s.title]) as readonly [string, string],
        ),
      ),
    ),
  );
  const shown = all.filter(
    (m) =>
      (ege === "all" || m.task.ege === ege) &&
      (lesson === "all" ||
        m.sources.some((s) => (s.lessonId ?? s.workId) === lesson)),
  );
  const left = mistakes.length;

  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-5">
      <nav aria-label="Где я" className="text-sm">
        <Link
          href={`/${subject}/practice`}
          className="flex items-center gap-1 font-semibold text-ink-accent no-underline"
        >
          <Icon name="arrow-left" size="min" /> Практика
        </Link>
      </nav>

      <header>
        <h1 className="enl-display text-[28px] leading-tight sm:text-[34px]">
          работа над ошибками
        </h1>
        <p className="text-sm text-ink-muted">
          {left || trainings.length ? (
            <>
              Осталось{" "}
              {left > 0 && (
                <>
                  <span className="enl-marker font-bold text-ink">{left}</span>{" "}
                  {plural(left, ["задание", "задания", "заданий"])} из тестов и тренажёра
                </>
              )}
              {left > 0 && trainings.length > 0 && " и "}
              {trainings.length > 0 && (
                <>
                  <span className="enl-marker font-bold text-ink">
                    {trainings.length}
                  </span>{" "}
                  {plural(trainings.length, [
                    "тренировка",
                    "тренировки",
                    "тренировок",
                  ])}
                </>
              )}
              .
            </>
          ) : (
            "Ошибок нет."
          )}
          {solvedToday > 0 && ` Исправлено сегодня: ${solvedToday}.`} Решили
          верно — задание уходит из списка.
        </p>
      </header>

      {trainings.length > 0 && (
        <section className="flex flex-col gap-2">
          <h2 className="font-bold">Тренировки</h2>
          <ul className="flex flex-col gap-3">
            {trainings.map((t) => (
              <TrainingMistakeCard
                key={t.training.id}
                subject={subject}
                mistake={t}
              />
            ))}
          </ul>
        </section>
      )}

      {all.length > 0 && trainings.length > 0 && (
        <h2 className="-mb-2 font-bold">Задания из тестов и тренажёра</h2>
      )}

      {all.length > 0 && (
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <div
            role="group"
            aria-label="Номер ЕГЭ"
            className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-1 sm:mx-0 sm:px-0"
          >
            {(["all", ...numbers] as const).map((n) => (
              <button
                key={n}
                type="button"
                aria-pressed={ege === n}
                onClick={() => setEge(n)}
                className={cn(
                  "shrink-0 rounded-full border px-3.5 py-1.5 text-sm font-semibold transition-colors",
                  ege === n
                    ? "border-ink bg-ink text-surface-page"
                    : "border-line bg-surface-raised text-ink-muted",
                )}
              >
                {n === "all" ? "все номера" : `№${n}`}
              </button>
            ))}
          </div>
          <label className="sm:ml-auto">
            <span className="sr-only">Тема</span>
            <select
              value={lesson}
              onChange={(e) => setLesson(e.target.value)}
              className="w-full rounded-full border border-line bg-surface-raised px-3.5 py-2 text-sm font-semibold sm:w-auto"
            >
              <option value="all">все темы</option>
              {lessons.map(([id, title]) => (
                <option key={id} value={id}>
                  {title}
                </option>
              ))}
            </select>
          </label>
        </div>
      )}

      {all.length === 0 && trainings.length > 0 ? null : all.length === 0 ? (
        <section className="flex flex-col items-center gap-2 rounded-box-l border border-line bg-surface-raised p-8 text-center">
          <p className="text-lg font-bold">Все ошибки исправлены</p>
          <p className="max-w-sm text-sm text-ink-muted">
            Новые появятся здесь сами, если ошибётесь в тесте или тренировке. А
            пока — тренажёр по номерам.
          </p>
          <ButtonLink
            href={`/${subject}/practice`}
            appearance="soft"
            className="mt-2"
          >
            В тренажёр
          </ButtonLink>
        </section>
      ) : shown.length === 0 ? (
        <p className="rounded-box-m bg-surface-subtle p-4 text-sm text-ink-muted">
          По этому фильтру ошибок нет.
        </p>
      ) : (
        <ul className="flex flex-col gap-3">
          {shown.map((m) => (
            <MistakeCard
              key={m.key}
              mistake={m}
              open={openKey === m.key}
              solved={Boolean(justSolved[m.key])}
              onOpen={() => setOpenKey(openKey === m.key ? null : m.key)}
              onCheck={(answer) => {
                const ok = check(m, answer);
                if (ok) setJustSolved((s) => ({ ...s, [m.key]: m }));
                return ok;
              }}
              onNext={() => {
                setJustSolved((s) => {
                  const rest = { ...s };
                  delete rest[m.key];
                  return rest;
                });
                const next = shown.find(
                  (x) => x.key !== m.key && !justSolved[x.key],
                );
                setOpenKey(next?.key ?? null);
              }}
            />
          ))}
        </ul>
      )}
    </div>
  );
}

function TrainingMistakeCard({
  subject,
  mistake,
}: {
  subject: Subject;
  mistake: TrainingMistake;
}) {
  const { training, units, date } = mistake;
  const labels = Array.from(new Set(units.map((u) => unitLabel(training, u))));
  return (
    <li className="flex flex-wrap items-start gap-3 rounded-box-l border border-line bg-surface-raised p-4 sm:flex-nowrap">
      <div className="min-w-0 flex-1 basis-[calc(100%-52px)] sm:basis-auto">
        <p className="text-[13px] text-ink-muted">
          {FORMATS[training.format].title} · {training.topic} · {date}
        </p>
        <p className="mt-1 font-semibold leading-snug">{training.title}</p>
        <p className="mt-1 text-[13px] text-ink-muted">
          Ошиблись: <span className="text-ink">{labels.join(", ")}</span>
        </p>
      </div>
      <ButtonLink
        href={`/${subject}/training/${training.id}/mistakes`}
        appearance="soft"
        className="w-full shrink-0 sm:w-auto"
      >
        Перерешать
      </ButtonLink>
    </li>
  );
}

function MistakeCard({
  mistake,
  open,
  solved,
  onOpen,
  onCheck,
  onNext,
}: {
  mistake: Mistake;
  open: boolean;
  solved: boolean;
  onOpen: () => void;
  onCheck: (answer: string) => boolean;
  onNext: () => void;
}) {
  const { task, sources, given } = mistake;
  const [answer, setAnswer] = useState("");
  const [wrong, setWrong] = useState(false);
  // Попытки в этом заходе: ответ показываем после второй, а при следующем
  // заходе задание снова решается с чистого листа.
  const [tries, setTries] = useState(0);
  const revealed = !solved && tries >= REVEAL_AFTER;
  const source = sources[0];
  const right =
    task.type === "choice" && task.answer.length === 1
      ? task.options[Number(task.answer) - 1]
      : task.answer;
  const givenText =
    task.type === "choice" && task.answer.length === 1 && given
      ? task.options[Number(given) - 1]
      : given;

  return (
    <li
      className={cn(
        "rounded-box-l border bg-surface-raised transition-colors",
        solved
          ? "border-ink-olive"
          : open
            ? "border-accent-border"
            : "border-line",
      )}
    >
      <div className="flex flex-wrap items-start gap-3 p-4 sm:flex-nowrap">
        <span className="grid size-10 shrink-0 place-items-center rounded-box-m bg-surface-subject text-sm font-extrabold">
          №{task.ege}
        </span>
        <div className="min-w-0 flex-1 basis-[calc(100%-52px)] sm:basis-auto">
          <p className="text-[13px] text-ink-muted">
            {source.title}
            {source.lessonNumber && ` · урок ${source.lessonNumber}`}
            {sources.length > 1 && ` и ещё ${sources.length - 1}`} ·{" "}
            {source.date}
          </p>
          <p
            className={cn(
              "mt-1 font-semibold leading-snug",
              !open && "line-clamp-2",
            )}
          >
            {task.prompt}
          </p>
          {!open && (
            <p className="mt-1 text-[13px] text-ink-muted">
              В тесте:{" "}
              <span className="line-through decoration-2">
                {givenText || "нет ответа"}
              </span>
              {mistake.tries > 0 && ` · попыток здесь: ${mistake.tries}`}
            </p>
          )}
        </div>
        {!open && !solved && (
          <Button
            appearance="soft"
            size="m"
            onClick={onOpen}
            className="w-full shrink-0 sm:w-auto"
          >
            Перерешать
          </Button>
        )}
      </div>

      {open && !solved && (
        <div className="border-t border-line-subtle p-4 pt-1">
          <AnswerField
            task={task}
            value={answer}
            onChange={(v) => {
              setAnswer(v);
              setWrong(false);
            }}
          />

          {wrong && !revealed && (
            <p
              role="status"
              data-status="negative"
              className="mt-3 flex items-start gap-2 rounded-box-m bg-status-soft p-3 text-sm"
            >
              <Icon
                name="close-circle"
                variant="bold"
                size="2xs"
                className="mt-0.5 shrink-0 text-ink-accent"
              />
              Пока неверно. Попробуйте ещё раз — после второй попытки покажем
              правильный ответ.
            </p>
          )}
          {revealed && (
            <div
              role="status"
              className="mt-3 rounded-box-m bg-surface-subtle p-3 text-sm leading-relaxed"
            >
              <p>
                Правильный ответ:{" "}
                <span className="enl-marker font-bold">{right}</span>
              </p>
              <p className="mt-1">{task.explanation}</p>
              <p className="mt-2 text-ink-muted">
                Задание остаётся в списке — вернитесь к нему позже и решите
                сами.
              </p>
            </div>
          )}

          <div className="mt-4 flex gap-3">
            <Button
              appearance={revealed ? "solid" : "outline"}
              size="m"
              onClick={onOpen}
            >
              {revealed ? "Понятно, вернусь позже" : "Позже"}
            </Button>
            {!revealed && (
              <Button
                size="m"
                disabled={!answer.trim()}
                onClick={() => {
                  const ok = onCheck(answer);
                  setTries(tries + 1);
                  setWrong(!ok);
                }}
              >
                Проверить
              </Button>
            )}
          </div>
        </div>
      )}

      {solved && (
        <div role="status" className="border-t border-line-subtle p-4 pt-3">
          <p className="flex items-center gap-2 font-bold text-ink-olive">
            <Icon name="check-circle" variant="bold" size="2xs" /> Верно!
            Задание уходит из списка
          </p>
          <p className="mt-1 text-sm text-ink-muted">{task.explanation}</p>
          <Button
            size="m"
            className="mt-3"
            onClick={onNext}
            endIcon={<Icon name="alt-arrow-right" size="min" />}
          >
            Дальше
          </Button>
        </div>
      )}
    </li>
  );
}
