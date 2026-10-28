"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { TODAY, useWorks } from "@/lib/works";
import { COURSES, type Subject } from "@mocks/course";
import { TRAINER } from "@mocks/trainer";
import { TRAININGS, type Training } from "@mocks/trainings";
import { WORKS, isCorrect, type ChoiceTask, type ShortTask } from "@mocks/works";

// Работа над ошибками: ошибки из всех тестов в одном месте.
// Источник — последняя попытка каждого теста. Задание уходит из списка, когда
// ученик решил его верно здесь или в новой попытке теста. Если в более поздней
// попытке оно снова решено неверно — возвращается.
//
// Ошибки тренировок: единица —
// элемент тренировки, на котором ученик ошибся (пара, карточка, точка на карте).
// Перерешивают их в той же механике, но только эти элементы. Источник, как у тестов, —
// последнее прохождение: прошёл без ошибок — тренировка уходит из списка.

const KEY = "proto-mistakes";

export interface MistakeSource {
  /** id работы или "trainer" — для заданий из тренажёра. */
  workId: string;
  title: string;
  /** У тренажёра урока нет. */
  lessonId?: string;
  lessonNumber?: number;
  lessonTitle?: string;
  date: string;
  /** Номер попытки — по нему понятно, что ошибка «новая». */
  attempt: number;
}

export interface Mistake {
  key: string;
  task: ChoiceTask | ShortTask;
  sources: MistakeSource[];
  given?: string;
  tries: number;
}

export interface TrainingMistake {
  training: Training;
  /** Индексы элементов в данных тренировки, на которых были ошибки. */
  units: number[];
  date: string;
}

interface Store {
  /** key → подпись источников, при которых задание решено верно. */
  resolved: Record<string, string>;
  tries: Record<string, number>;
  solvedToday: number;
  trainings?: Record<string, { units: number[]; date: string }>;
  /** Тренажёр: последний ответ на каждое задание и число попыток. */
  trainer?: Record<string, TrainerResult>;
}

export interface TrainerResult {
  answer: string;
  ok: boolean;
  tries: number;
}

interface MistakesState {
  list: (subject: Subject) => Mistake[];
  check: (mistake: Mistake, answer: string) => boolean;
  solvedToday: number;
  trainings: (subject: Subject) => TrainingMistake[];
  /** Итог прохождения: units пустой — ошибок нет, тренировка уходит из списка.
   *  fixing — это было перерешивание из работы над ошибками. */
  recordTraining: (id: string, units: number[], fixing?: boolean) => void;
  /** Хранилище прочитано из браузера — до этого список ошибок пуст не по-настоящему. */
  ready: boolean;
  trainer: Record<string, TrainerResult>;
  /** Ответ в тренажёре: неверный — задание попадает в работу над ошибками. */
  recordTrainer: (task: ChoiceTask | ShortTask, answer: string) => boolean;
}

const MistakesContext = createContext<MistakesState | null>(null);

/** Одно и то же задание может стоять в нескольких тестах — считаем его одной ошибкой. */
const taskKey = (task: ChoiceTask | ShortTask) => `${task.ege}|${task.prompt}`;
const signature = (m: Pick<Mistake, "sources">) => m.sources.map((s) => `${s.workId}#${s.attempt}`).join(",");

export function MistakesProvider({ children }: { children: ReactNode }) {
  const { get } = useWorks();
  const [store, setStore] = useState<Store>({ resolved: {}, tries: {}, solvedToday: 0 });
  const [ready, setReady] = useState(false);

  useEffect(() => {
    try {
      const saved = window.localStorage.getItem(KEY);
      if (saved) setStore(JSON.parse(saved));
    } catch {
      // без сохранения
    }
    setReady(true);
  }, []);

  const save = useCallback((next: Store) => {
    setStore(next);
    try {
      window.localStorage.setItem(KEY, JSON.stringify(next));
    } catch {
      // без сохранения
    }
  }, []);

  const list = useCallback(
    (subject: Subject) => {
      const byKey = new Map<string, Mistake>();
      for (const week of COURSES[subject].weeks) {
        for (const lesson of week.lessons) {
          for (const item of lesson.items) {
            const work = WORKS[item.id];
            if (!work || work.check !== "auto") continue;
            const attempts = get(item.id).attempts;
            const last = attempts[attempts.length - 1];
            if (!last) continue;
            for (const task of work.tasks) {
              if (task.type === "long" || isCorrect(task, last.answers[task.id])) continue;
              const key = taskKey(task);
              const source: MistakeSource = {
                workId: item.id,
                title: item.title,
                lessonId: lesson.id,
                lessonNumber: lesson.number,
                lessonTitle: lesson.title,
                date: last.date,
                attempt: attempts.length,
              };
              const existing = byKey.get(key);
              if (existing) existing.sources.push(source);
              else byKey.set(key, { key, task, sources: [source], given: last.answers[task.id], tries: store.tries[key] ?? 0 });
            }
          }
        }
      }
      // Тренажёр: задание с неверным последним ответом.
      for (const task of TRAINER[subject]?.tasks ?? []) {
        const result = store.trainer?.[task.id];
        if (!result || result.ok) continue;
        const key = taskKey(task);
        const source: MistakeSource = { workId: "trainer", title: "Тренажёр", date: TODAY, attempt: result.tries };
        const existing = byKey.get(key);
        if (existing) existing.sources.push(source);
        else byKey.set(key, { key, task, sources: [source], given: result.answer, tries: store.tries[key] ?? 0 });
      }
      return Array.from(byKey.values()).filter((m) => store.resolved[m.key] !== signature(m));
    },
    [get, store],
  );

  const check = useCallback(
    (mistake: Mistake, answer: string) => {
      const ok = isCorrect(mistake.task, answer);
      save({
        resolved: ok ? { ...store.resolved, [mistake.key]: signature(mistake) } : store.resolved,
        tries: { ...store.tries, [mistake.key]: (store.tries[mistake.key] ?? 0) + 1 },
        solvedToday: store.solvedToday + (ok ? 1 : 0),
        trainings: store.trainings,
        trainer: store.trainer,
      });
      return ok;
    },
    [save, store],
  );

  const trainings = useCallback(
    (subject: Subject) =>
      TRAININGS.filter((t) => t.subject === subject && store.trainings?.[t.id]).map((t) => ({
        training: t,
        ...store.trainings![t.id],
      })),
    [store],
  );

  const recordTraining = useCallback(
    (id: string, units: number[], fixing?: boolean) => {
      const rest = { ...store.trainings };
      const had = Boolean(rest[id]);
      if (units.length) {
        // При перерешивании новые промахи — внутри тех же элементов, список не меняем.
        if (!fixing) rest[id] = { units: Array.from(new Set(units)).sort((a, b) => a - b), date: TODAY };
      } else delete rest[id];
      save({ ...store, trainings: rest, solvedToday: store.solvedToday + (had && !units.length ? 1 : 0) });
    },
    [save, store],
  );

  const recordTrainer = useCallback(
    (task: ChoiceTask | ShortTask, answer: string) => {
      const ok = isCorrect(task, answer);
      const old = store.trainer?.[task.id];
      save({ ...store, trainer: { ...store.trainer, [task.id]: { answer, ok, tries: (old?.tries ?? 0) + 1 } } });
      return ok;
    },
    [save, store],
  );

  const value = useMemo(
    () => ({
      list,
      check,
      solvedToday: store.solvedToday,
      trainings,
      recordTraining,
      ready,
      trainer: store.trainer ?? {},
      recordTrainer,
    }),
    [list, check, store.solvedToday, store.trainer, trainings, recordTraining, ready, recordTrainer],
  );
  return <MistakesContext.Provider value={value}>{children}</MistakesContext.Provider>;
}

export function useMistakes(subject: Subject) {
  const context = useContext(MistakesContext);
  if (!context) throw new Error("useMistakes вне MistakesProvider");
  const mistakes = context.list(subject);
  const trainings = context.trainings(subject);
  return {
    mistakes,
    trainings,
    /** Всего в работе над ошибками: задания из тестов + тренировки с ошибками. */
    total: mistakes.length + trainings.length,
    check: context.check,
    recordTraining: context.recordTraining,
    solvedToday: context.solvedToday,
    ready: context.ready,
    trainer: context.trainer,
    recordTrainer: context.recordTrainer,
  };
}
