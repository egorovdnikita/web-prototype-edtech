"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { Button, ButtonLink } from "@/components/ui/box";
import { Icon } from "@/components/ui/icon";
import { useMistakes } from "@/lib/mistakes";
import { useProgress } from "@/lib/progress";
import { useTrainingResults } from "@/lib/trainings";
import { plural } from "@/lib/utils";
import { findItem, type Subject } from "@mocks/course";
import { FORMATS, focusData, unitLabel, type Training } from "@mocks/trainings";
import { Fragments, MapPlace, Match, Order, Pick, Slots, Sort } from "./mechanics";

/**
 * Оболочка тренировки — одинаковая для всех форматов (обязательные элементы
 * из разбора): фраза-действие, сигнал ошибки без блокировки, блок пояснения.
 * mode="mistakes" — перерешивание из работы над ошибками: только элементы с ошибками.
 */
export function TrainingPlayer({
  subject,
  training,
  mode = "full",
}: {
  subject: Subject;
  training: Training;
  mode?: "full" | "mistakes";
}) {
  const { complete } = useProgress();
  const { results, record } = useTrainingResults();
  const { trainings: withMistakes, recordTraining, ready } = useMistakes(subject);
  const fixing = mode === "mistakes";
  // Элементы для перерешивания фиксируем при входе: после верного решения
  // запись уходит из хранилища, а экран с итогом должен остаться.
  const [focus, setFocus] = useState<number[] | null>(null);
  const units = useRef<number[]>([]);
  const [attempt, setAttempt] = useState(0);
  const [errors, setErrors] = useState(0);
  const [done, setDone] = useState(false);

  const format = FORMATS[training.format];
  const found = training.planItem ? findItem(subject, training.planItem) : null;
  const back = fixing
    ? { href: `/${subject}/practice/mistakes`, label: "Работа над ошибками" }
    : found
      ? { href: `/${subject}/lesson/${found.lesson.id}`, label: found.lesson.title }
      : { href: `/${subject}/practice/trainings`, label: "Все тренировки" };
  const best = results[training.id];
  const resultRef = useRef<HTMLElement>(null);

  // Решил — показываем пояснение, оно ниже механики и на телефоне не видно.
  useEffect(() => {
    if (done) resultRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  }, [done]);

  useEffect(() => {
    if (fixing && ready && focus === null) setFocus(withMistakes.find((m) => m.training.id === training.id)?.units ?? []);
  }, [fixing, ready, focus, withMistakes, training.id]);

  const props = {
    seed: `${training.id}-${attempt}`,
    onMistake: (unit: number) => {
      units.current.push(unit);
      setErrors((e) => e + 1);
    },
    onDone: () => {
      setDone(true);
      recordTraining(training.id, units.current, fixing);
      if (fixing) return;
      record(training.id, errors);
      if (training.planItem) complete(training.planItem);
    },
  };

  if (fixing && focus === null) return null;
  if (fixing && focus?.length === 0)
    return (
      <section className="mx-auto flex max-w-xl flex-col items-center gap-3 rounded-box-l border border-line bg-surface-raised p-8 text-center">
        <Icon name="cup-star" size="xl" className="text-ink-accent" />
        <p className="text-lg font-bold">В этой тренировке ошибок нет</p>
        <ButtonLink href={back.href} appearance="soft">
          {back.label}
        </ButtonLink>
      </section>
    );

  const d = fixing && focus ? focusData(training.data, focus) : training.data;
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
          {!fixing && <span>· {training.minutes} мин</span>}
        </p>
        <h1 className="enl-display text-[26px] normal-case leading-tight sm:text-[32px]">{training.title}</h1>
        <p className="flex items-start gap-2 font-semibold">
          <Icon name="magic-stick-3" size="xs" className="mt-0.5 shrink-0 text-ink-accent" />
          {training.action}
        </p>
        {fixing && focus && (
          <p className="rounded-box-m bg-surface-subtle p-3 text-sm">
            <span className="font-semibold">Работа над ошибками.</span> Только то, где ошиблись в прошлый раз:{" "}
            {Array.from(new Set(focus.map((u) => unitLabel(training, u)))).join(", ")}.
          </p>
        )}
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
            {fixing && errors === 0
              ? "исправлено!"
              : errors === 0
                ? "без единой ошибки!"
                : `готово · ${errors} ${plural(errors, ["ошибка", "ошибки", "ошибок"])}`}
          </p>
          {(fixing || errors > 0) && (
            <p className="text-sm font-semibold">
              {fixing && errors === 0
                ? "Тренировка уходит из работы над ошибками."
                : fixing
                  ? "Тренировка остаётся в работе над ошибками — вернитесь к ней позже."
                  : (
                      <>
                        Где ошиблись — сохранили в{" "}
                        <Link href={`/${subject}/practice/mistakes`} className="text-ink-accent">
                          работу над ошибками
                        </Link>
                        .
                      </>
                    )}
            </p>
          )}
          <div>
            <p className="text-[13px] font-bold uppercase tracking-wide text-ink-muted">на заметку</p>
            <p className="mt-1 text-[15px] leading-relaxed">{training.explanation}</p>
          </div>
          {!fixing && best && best.tries > 1 && (
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
                units.current = [];
                setDone(false);
              }}
            >
              Пройти ещё раз
            </Button>
            <ButtonLink href={back.href}>{fixing ? "К работе над ошибками" : found ? "Вернуться к уроку" : "К тренировкам"}</ButtonLink>
          </div>
        </section>
      )}
    </article>
  );
}
