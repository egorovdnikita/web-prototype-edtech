"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/box";
import { Icon } from "@/components/ui/icon";
import { useProgress } from "@/lib/progress";
import { useWorks } from "@/lib/works";
import { cn, plural } from "@/lib/utils";
import { findItem, type Subject } from "@mocks/course";
import { WORKS, type Task } from "@mocks/works";

export const CHECK_LABEL = {
  auto: { title: "Автопроверка", text: "Результат и пояснения — сразу после сдачи." },
  curator: { title: "Проверяет куратор", text: "Результат — в течение 3 дней после сдачи." },
  self: { title: "Самопроверка", text: "После сдачи откроются ключ и критерии — оцените себя сами." },
} as const;

// B4 — решение работы. Одно задание на экране, навигатор номеров, автосохранение,
// таймер по желанию: запускает сам ученик, по истечении работа сдаётся сама.
export function WorkSolve({ subject, id }: { subject: Subject; id: string }) {
  const router = useRouter();
  const { statusOf, setStatus } = useProgress();
  const { get, setAnswer, startTimer, submit } = useWorks();
  const found = findItem(subject, id)!;
  const work = WORKS[id];
  const record = get(id);
  const [index, setIndex] = useState(0);
  const [confirming, setConfirming] = useState(false);
  const [now, setNow] = useState(() => Date.now());

  const task = work.tasks[index];
  const answered = work.tasks.filter((t) => record.answers[t.id]?.trim()).length;
  const status = statusOf(found.item);
  const timerLeft =
    work.timer && record.timerStartedAt ? Math.max(0, record.timerStartedAt + work.timer * 60_000 - now) : null;

  const finish = () => {
    submit(id);
    setStatus(id, work.check === "curator" ? "review" : "done");
    router.push(`/${subject}/work/${id}/result`);
  };

  useEffect(() => {
    if (!record.timerStartedAt) return;
    const tick = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(tick);
  }, [record.timerStartedAt]);

  useEffect(() => {
    if (timerLeft === 0) finish();
    // finish пересоздаётся каждый рендер; сдаём один раз, когда время вышло
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [timerLeft]);

  const mmss = (ms: number) => {
    const s = Math.ceil(ms / 1000);
    return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;
  };

  return (
    <article className="mx-auto flex max-w-3xl flex-col gap-4">
      <nav aria-label="Где я" className="flex items-center gap-2 text-sm text-ink-muted">
        <Link
          href={`/${subject}/lesson/${found.lesson.id}`}
          className="flex items-center gap-1 font-semibold text-ink-accent no-underline"
        >
          <Icon name="arrow-left" size="min" /> Урок {found.lesson.number}
        </Link>
      </nav>

      <header className="flex flex-col gap-1">
        <h1 className="text-[24px] font-extrabold leading-tight sm:text-[30px]">{found.item.title}</h1>
        <p className="text-sm text-ink-muted">
          {work.tasks.length} {plural(work.tasks.length, ["задание", "задания", "заданий"])}
          {found.item.due && ` · ${found.item.due}`}
        </p>
      </header>

      {status === "overdue" && (
        <p data-status="warning" className="flex items-start gap-2 rounded-box-m bg-status-soft p-3 text-sm">
          Дедлайн прошёл, но сдать ещё можно — работа уйдёт на проверку как обычно, с увеличенным сроком.
        </p>
      )}

      <div className="flex flex-wrap items-center gap-3 rounded-box-l border border-line bg-surface-raised p-3">
        <span className="min-w-[200px] flex-1 text-sm">
          <span className="block font-bold">{CHECK_LABEL[work.check].title}</span>
          <span className="block text-ink-muted">{CHECK_LABEL[work.check].text}</span>
        </span>
        {work.timer &&
          (timerLeft === null ? (
            <Button appearance="outline" size="s" onClick={() => startTimer(id)}>
              Таймер {work.timer} мин
            </Button>
          ) : (
            <span
              role="timer"
              aria-live="off"
              className={cn(
                "flex items-center gap-1.5 rounded-full px-3 py-1.5 font-bold tabular-nums",
                timerLeft < 60_000 ? "bg-accent text-accent-on" : "bg-surface-marker",
              )}
            >
{mmss(timerLeft)}
            </span>
          ))}
      </div>
      {timerLeft !== null && (
        <p className="-mt-2 text-[13px] text-ink-muted">Когда время выйдет, работа сдастся сама с теми ответами, что есть.</p>
      )}

      {/* Навигатор номеров */}
      <ol aria-label="Задания" className="flex flex-wrap gap-2">
        {work.tasks.map((t, i) => {
          const has = Boolean(record.answers[t.id]?.trim());
          return (
            <li key={t.id}>
              <button
                type="button"
                onClick={() => setIndex(i)}
                aria-current={i === index ? "step" : undefined}
                aria-label={`Задание ${i + 1}${has ? ", есть ответ" : ""}`}
                className={cn(
                  "grid size-10 place-items-center rounded-box-m border text-sm font-bold transition-colors",
                  i === index ? "border-accent bg-accent text-accent-on" : has ? "border-accent-border bg-accent-soft" : "border-line bg-surface-raised",
                )}
              >
                {i + 1}
              </button>
            </li>
          );
        })}
      </ol>

      <TaskCard
        key={task.id}
        task={task}
        number={index + 1}
        value={record.answers[task.id] ?? ""}
        onChange={(v) => setAnswer(id, task.id, v)}
      />

      <p className="flex items-center gap-1.5 text-[13px] text-ink-muted">
Ответы сохраняются сами — можно закрыть и вернуться.
      </p>

      <div className="flex gap-3">
        <Button appearance="outline" size="l" disabled={index === 0} onClick={() => setIndex(index - 1)} className="flex-1 sm:flex-none">
          Назад
        </Button>
        {index < work.tasks.length - 1 ? (
          <Button size="l" onClick={() => setIndex(index + 1)} className="flex-1 sm:flex-none" endIcon={<Icon name="alt-arrow-right" size="min" />}>
            Дальше
          </Button>
        ) : (
          <Button size="l" onClick={() => setConfirming(true)} className="flex-1 sm:flex-none">
            Сдать работу
          </Button>
        )}
      </div>

      {confirming && (
        <div role="dialog" aria-modal="true" aria-labelledby="confirm-title" className="fixed inset-0 z-30 flex items-end justify-center bg-[var(--surface-base-fill-overlay)] sm:items-center">
          <div className="w-full max-w-md rounded-t-box-xl bg-surface-raised p-5 sm:rounded-box-xl">
            <h2 id="confirm-title" className="text-lg font-extrabold">Сдать работу?</h2>
            <p className="mt-1 text-sm text-ink-muted">
              Отвечено {answered} из {work.tasks.length}.
              {answered < work.tasks.length && " Задания без ответа засчитаются как невыполненные."}
              {work.check === "curator" && " После сдачи ответы уйдут куратору — изменить их будет нельзя."}
            </p>
            <div className="mt-4 flex gap-3">
              <Button appearance="outline" size="l" className="flex-1" onClick={() => setConfirming(false)}>
                Вернуться
              </Button>
              <Button size="l" className="flex-1" onClick={finish}>
                Сдать
              </Button>
            </div>
          </div>
        </div>
      )}
    </article>
  );
}

function TaskCard({ task, number, value, onChange }: { task: Task; number: number; value: string; onChange: (v: string) => void }) {
  return (
    <section className="rounded-box-l border border-line bg-surface-raised p-4 sm:p-5">
      <p className="text-[13px] font-semibold text-ink-muted">
        Задание {number} · №{task.ege} ЕГЭ{task.type === "long" && " · развёрнутый ответ"}
      </p>
      <p className="mt-2 font-semibold leading-relaxed">{task.prompt}</p>
      <AnswerField task={task} value={value} onChange={onChange} />
    </section>
  );
}

/** Поле ответа под тип задания. Общее для решения работы и работы над ошибками. */
export function AnswerField({ task, value, onChange }: { task: Task; value: string; onChange: (v: string) => void }) {
  return (
    <>
      {task.type === "choice" && (
        <fieldset className="mt-4">
          <legend className="sr-only">Варианты ответа</legend>
          <p className="mb-2 text-[13px] text-ink-muted">
            {task.answer.length > 1 ? "Отметьте все верные варианты." : "Отметьте один вариант."}
          </p>
          <ul className="flex flex-col gap-2">
            {task.options.map((option, i) => {
              const digit = String(i + 1);
              const checked = value.includes(digit);
              const multiple = task.answer.length > 1;
              return (
                <li key={digit}>
                  <label
                    className={cn(
                      "flex cursor-pointer items-start gap-3 rounded-box-m border p-3 transition-colors",
                      checked ? "border-accent bg-surface-raised" : "border-line hover:border-line-strong",
                    )}
                  >
                    <input
                      type={multiple ? "checkbox" : "radio"}
                      name={task.id}
                      checked={checked}
                      onChange={() => {
                        if (!multiple) return onChange(digit);
                        const next = checked ? value.replace(digit, "") : value + digit;
                        onChange(next.split("").sort().join(""));
                      }}
                      className="mt-1 size-4 accent-[var(--accent-fill-solid)]"
                    />
                    <span>
                      <span className="mr-1 font-bold">{digit})</span>
                      {option}
                    </span>
                  </label>
                </li>
              );
            })}
          </ul>
          {task.answer.length > 1 && (
            <p className="mt-2 text-[13px] text-ink-muted">
              В бланк: <span className="font-bold text-ink">{value || "—"}</span>
            </p>
          )}
        </fieldset>
      )}

      {task.type === "short" && (
        <label className="mt-4 block">
          <span className="mb-1 block text-[13px] font-semibold text-ink-muted">Ответ</span>
          <input
            value={value}
            onChange={(e) => onChange(e.target.value)}
            inputMode={/^\d+$/.test(task.answer) ? "numeric" : "text"}
            autoComplete="off"
            className="w-full rounded-box-m border border-line-strong bg-surface-page px-4 py-3 text-lg font-semibold focus:border-accent"
            placeholder={/^\d+$/.test(task.answer) ? "Например, 1700" : "Слово или словосочетание"}
          />
        </label>
      )}

      {task.type === "long" && (
        <div className="mt-4 flex flex-col gap-2">
          <label className="block">
            <span className="mb-1 block text-[13px] font-semibold text-ink-muted">Ваш ответ</span>
            <textarea
              value={value}
              onChange={(e) => onChange(e.target.value)}
              rows={7}
              className="w-full rounded-box-m border border-line-strong bg-surface-page p-3 leading-relaxed focus:border-accent"
              placeholder="Пишите по пунктам: 1) … 2) … 3) …"
            />
          </label>
          <button type="button" className="flex items-center gap-2 self-start text-sm font-semibold text-ink-accent">
            <Icon name="paperclip" size="min" /> Приложить фото бланка
          </button>
        </div>
      )}
    </>
  );
}
