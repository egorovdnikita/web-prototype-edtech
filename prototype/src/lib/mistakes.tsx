"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { useWorks } from "@/lib/works";
import { COURSES, type Subject } from "@mocks/course";
import { WORKS, isCorrect, type ChoiceTask, type ShortTask } from "@mocks/works";

// Работа над ошибками (B8, история 04.13): ошибки из всех тестов в одном месте.
// Источник — последняя попытка каждого теста. Задание уходит из списка, когда
// ученик решил его верно здесь или в новой попытке теста. Если в более поздней
// попытке оно снова решено неверно — возвращается.

const KEY = "enl-prototype-mistakes";

export interface MistakeSource {
  workId: string;
  title: string;
  lessonId: string;
  lessonNumber: number;
  lessonTitle: string;
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

interface Store {
  /** key → подпись источников, при которых задание решено верно. */
  resolved: Record<string, string>;
  tries: Record<string, number>;
  solvedToday: number;
}

interface MistakesState {
  list: (subject: Subject) => Mistake[];
  check: (mistake: Mistake, answer: string) => boolean;
  solvedToday: number;
}

const MistakesContext = createContext<MistakesState | null>(null);

/** Одно и то же задание может стоять в нескольких тестах — считаем его одной ошибкой. */
const taskKey = (task: ChoiceTask | ShortTask) => `${task.ege}|${task.prompt}`;
const signature = (m: Pick<Mistake, "sources">) => m.sources.map((s) => `${s.workId}#${s.attempt}`).join(",");

export function MistakesProvider({ children }: { children: ReactNode }) {
  const { get } = useWorks();
  const [store, setStore] = useState<Store>({ resolved: {}, tries: {}, solvedToday: 0 });

  useEffect(() => {
    try {
      const saved = window.localStorage.getItem(KEY);
      if (saved) setStore(JSON.parse(saved));
    } catch {
      // без сохранения
    }
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
      });
      return ok;
    },
    [save, store],
  );

  const value = useMemo(() => ({ list, check, solvedToday: store.solvedToday }), [list, check, store.solvedToday]);
  return <MistakesContext.Provider value={value}>{children}</MistakesContext.Provider>;
}

export function useMistakes(subject: Subject) {
  const context = useContext(MistakesContext);
  if (!context) throw new Error("useMistakes вне MistakesProvider");
  return { mistakes: context.list(subject), check: context.check, solvedToday: context.solvedToday };
}
