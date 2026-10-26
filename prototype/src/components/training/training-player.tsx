"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { Button, ButtonLink } from "@/components/ui/box";
import { Icon } from "@/components/ui/icon";
import { useProgress } from "@/lib/progress";
import { useTrainingResults } from "@/lib/trainings";
import { plural } from "@/lib/utils";
import { findItem, type Subject } from "@mocks/course";
import { FORMATS, type Training } from "@mocks/trainings";
import { Fragments, MapPlace, Match, Order, Pick, Slots, Sort } from "./mechanics";

/**
 * Оболочка тренировки — одинаковая для всех форматов (обязательные элементы
 * из разбора): фраза-действие, сигнал ошибки без блокировки, блок пояснения.
 */
export function TrainingPlayer({ subject, training }: { subject: Subject; training: Training }) {
  const { complete } = useProgress();
  const { results, record } = useTrainingResults();
  const [attempt, setAttempt] = useState(0);
  const [errors, setErrors] = useState(0);
  const [done, setDone] = useState(false);

  const format = FORMATS[training.format];
  const found = training.planItem ? findItem(subject, training.planItem) : null;
  const back = found
    ? { href: `/${subject}/lesson/${found.lesson.id}`, label: found.lesson.title }
    : { href: `/${subject}/practice/trainings`, label: "Все тренировки" };
  const best = results[training.id];
  const resultRef = useRef<HTMLElement>(null);

  // Решил — показываем пояснение, оно ниже механики и на телефоне не видно.
  useEffect(() => {
    if (done) resultRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  }, [done]);

  const props = {
    seed: `${training.id}-${attempt}`,
    onMistake: () => setErrors((e) => e + 1),
    onDone: () => {
      setDone(true);
      record(training.id, errors);
      if (training.planItem) complete(training.planItem);
    },
  };
  const d = training.data;
  const mechanic =
    d.mechanic === "pick" ? (
      <Pick data={d} {...props} />
    ) : d.mechanic === "match" ? (
      <Match data={d} {...props} />
    ) : d.mechanic === "slots" ? (
      <Slots data={d} {...props} />
    ) : d.mechanic === "order" ? (
      <Order data={d} {...props} />
    ) : d.mechanic === "sort" ? (
      <Sort data={d} {...props} />
    ) : d.mechanic === "fragments" ? (
      <Fragments data={d} {...props} />
    ) : (
      <MapPlace data={d} {...props} />
    );

  return (
    <article className="mx-auto flex max-w-4xl flex-col gap-5">
      <nav aria-label="Где я" className="text-sm">
        <Link href={back.href} className="inline-flex items-center gap-1 font-semibold text-ink-accent no-underline">
          <Icon name="alt-arrow-left" size="min" /> {back.label}
        </Link>
      </nav>

      <header className="flex flex-col gap-2">
        <p className="flex flex-wrap items-center gap-x-2 text-[13px] font-semibold text-ink-muted">
          <span className="rounded-full bg-surface-subject px-2 py-0.5 text-ink">{format.title}</span>
          <span>{training.topic}</span>
          <span>· {training.minutes} мин</span>
        </p>
        <h1 className="enl-display text-[26px] normal-case leading-tight sm:text-[32px]">{training.title}</h1>
        <p className="flex items-start gap-2 font-semibold">
          <Icon name="magic-stick-3" size="xs" className="mt-0.5 shrink-0 text-ink-accent" />
          {training.action}
        </p>
      </header>

      <div className="flex items-center justify-between gap-3 text-sm" aria-live="polite">
        <span className="text-ink-muted">Ошибка не страшна — пробуйте, пока не получится.</span>
        <span className="shrink-0 font-semibold">
          {errors} {plural(errors, ["ошибка", "ошибки", "ошибок"])}
        </span>
      </div>

      <div key={attempt}>{mechanic}</div>

      {done && (
        <section ref={resultRef} className="flex scroll-mt-20 flex-col gap-3 rounded-box-l bg-surface-marker p-5" aria-live="polite">
          <p className="enl-display text-xl">
            {errors === 0 ? "без единой ошибки!" : `готово · ${errors} ${plural(errors, ["ошибка", "ошибки", "ошибок"])}`}
          </p>
          <div>
            <p className="text-[13px] font-bold uppercase tracking-wide text-ink-muted">на заметку</p>
            <p className="mt-1 text-[15px] leading-relaxed">{training.explanation}</p>
          </div>
          {best && best.tries > 1 && (
            <p className="text-sm text-ink-muted">
              Лучший результат: {best.errors === 0 ? "без ошибок" : `${best.errors} ${plural(best.errors, ["ошибка", "ошибки", "ошибок"])}`} ·
              попыток: {best.tries}
            </p>
          )}
          <div className="flex flex-col gap-2 sm:flex-row">
            <Button
              appearance="outline"
              onClick={() => {
                setAttempt(attempt + 1);
                setErrors(0);
                setDone(false);
              }}
            >
              Пройти ещё раз
            </Button>
            <ButtonLink href={back.href}>{found ? "Вернуться к уроку" : "К тренировкам"}</ButtonLink>
          </div>
        </section>
      )}
    </article>
  );
}
