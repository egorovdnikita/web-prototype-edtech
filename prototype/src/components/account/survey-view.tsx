"use client";

import { useEffect, useState } from "react";
import { Button, ButtonLink } from "@/components/ui/box";
import { Icon } from "@/components/ui/icon";
import { cn } from "@/lib/utils";
import type { Subject } from "@mocks/course";

const KEY = "enl-prototype-surveys";

const LEVELS = ["легко", "нормально", "сложно"] as const;
const HARD = ["не хватило времени", "задания 1 части", "задания 2 части", "оформление ответа", "теория", "ничего"];

interface Answer {
  level: (typeof LEVELS)[number];
  hard: string[];
  wish: string;
}

/**
 * B21 — анкета после пробника (US 03.31). Сейчас это Google Forms, результаты
 * которых никто не смотрит. Здесь — две минуты нажатий, текст по желанию.
 */
export function SurveyView({ subject, probe }: { subject: Subject; probe: { id: string; title: string } }) {
  const [answer, setAnswer] = useState<Answer>({ level: "нормально", hard: [], wish: "" });
  const [picked, setPicked] = useState(false);
  const [done, setDone] = useState(false);

  useEffect(() => {
    try {
      const saved = JSON.parse(window.localStorage.getItem(KEY) ?? "{}");
      if (saved[`${subject}-${probe.id}`]) setDone(true);
    } catch {
      // без сохранения
    }
  }, [subject, probe.id]);

  const submit = () => {
    try {
      const saved = JSON.parse(window.localStorage.getItem(KEY) ?? "{}");
      window.localStorage.setItem(KEY, JSON.stringify({ ...saved, [`${subject}-${probe.id}`]: answer }));
    } catch {
      // без сохранения
    }
    setDone(true);
  };

  if (done)
    return (
      <section className="mx-auto flex max-w-xl flex-col items-center gap-3 rounded-box-l border border-line bg-surface-raised p-8 text-center shadow-raised">
        <Icon name="check-circle" variant="bold" size="xl" className="text-ink-olive" />
        <h1 className="text-xl font-extrabold">Спасибо, анкета отправлена</h1>
        <p className="text-sm text-ink-muted">Школа читает ответы и по ним меняет курс и проверку.</p>
        <ButtonLink href={`/${subject}`} appearance="soft">
          К задачам недели
        </ButtonLink>
      </section>
    );

  const chip = (on: boolean) =>
    cn(
      "min-h-11 rounded-full border-2 px-4 text-[15px] font-semibold transition-colors",
      on ? "border-accent bg-accent-soft" : "border-line bg-surface-page",
    );

  return (
    <div className="mx-auto flex max-w-xl flex-col gap-5">
      <header>
        <p className="text-[13px] font-semibold text-ink-muted">2 минуты · текст — по желанию</p>
        <h1 className="enl-display text-[26px] normal-case leading-tight sm:text-[32px]">Как прошёл {probe.title.toLowerCase()}?</h1>
      </header>

      <fieldset className="flex flex-col gap-2">
        <legend className="mb-2 font-bold">Насколько сложным был пробник?</legend>
        <div className="grid grid-cols-3 gap-2">
          {LEVELS.map((l) => (
            <button
              key={l}
              type="button"
              aria-pressed={picked && answer.level === l}
              onClick={() => {
                setAnswer({ ...answer, level: l });
                setPicked(true);
              }}
              className={chip(picked && answer.level === l)}
            >
              {l}
            </button>
          ))}
        </div>
      </fieldset>

      <fieldset className="flex flex-col gap-2">
        <legend className="mb-2 font-bold">Что было сложнее всего?</legend>
        <div className="flex flex-wrap gap-2">
          {HARD.map((h) => {
            const on = answer.hard.includes(h);
            return (
              <button
                key={h}
                type="button"
                aria-pressed={on}
                onClick={() =>
                  setAnswer({
                    ...answer,
                    // «ничего» исключает остальное.
                    hard: h === "ничего" ? (on ? [] : ["ничего"]) : on ? answer.hard.filter((x) => x !== h) : [...answer.hard.filter((x) => x !== "ничего"), h],
                  })
                }
                className={chip(on)}
              >
                {h}
              </button>
            );
          })}
        </div>
      </fieldset>

      <label className="flex flex-col gap-2">
        <span className="font-bold">
          Пожелания к курсу и проверке <span className="font-normal text-ink-muted">— по желанию</span>
        </span>
        <textarea
          value={answer.wish}
          onChange={(e) => setAnswer({ ...answer, wish: e.target.value })}
          rows={4}
          className="w-full rounded-box-m border border-line-strong bg-surface-page p-3 leading-relaxed focus:border-accent"
          placeholder="Что добавить, что убрать, что непонятно в комментариях проверяющего"
        />
      </label>

      <Button size="l" disabled={!picked} onClick={submit}>
        Отправить
      </Button>
    </div>
  );
}
