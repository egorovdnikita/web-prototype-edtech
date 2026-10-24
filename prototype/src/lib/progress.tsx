"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { COURSES, type PlanItem, type Subject } from "@mocks/course";

// Состояние «покликать»: что ученик отметил или прошёл в прототипе.
// Хранится в localStorage, сбрасывается кнопкой в «Ещё».

const KEY = "enl-prototype-progress";

interface ProgressState {
  /** Переопределённые статусы пунктов: id → done | todo. */
  overrides: Record<string, "done" | "todo">;
  statusOf: (item: PlanItem) => PlanItem["status"];
  toggle: (item: PlanItem) => void;
  complete: (id: string) => void;
  reset: () => void;
}

const ProgressContext = createContext<ProgressState | null>(null);

export function ProgressProvider({ children }: { children: ReactNode }) {
  const [overrides, setOverrides] = useState<Record<string, "done" | "todo">>({});

  useEffect(() => {
    try {
      const saved = window.localStorage.getItem(KEY);
      if (saved) setOverrides(JSON.parse(saved));
    } catch {
      // приватный режим или битые данные — начинаем с моков
    }
  }, []);

  const save = useCallback((next: Record<string, "done" | "todo">) => {
    setOverrides(next);
    try {
      window.localStorage.setItem(KEY, JSON.stringify(next));
    } catch {
      // без сохранения прототип всё равно работает
    }
  }, []);

  const statusOf = useCallback(
    (item: PlanItem) => (item.status === "locked" ? "locked" : overrides[item.id] ?? item.status),
    [overrides],
  );

  const toggle = useCallback(
    (item: PlanItem) => {
      const current = statusOf(item);
      if (current === "locked") return;
      save({ ...overrides, [item.id]: current === "done" ? "todo" : "done" });
    },
    [overrides, save, statusOf],
  );

  const complete = useCallback((id: string) => save({ ...overrides, [id]: "done" }), [overrides, save]);
  const reset = useCallback(() => save({}), [save]);

  const value = useMemo(
    () => ({ overrides, statusOf, toggle, complete, reset }),
    [overrides, statusOf, toggle, complete, reset],
  );
  return <ProgressContext.Provider value={value}>{children}</ProgressContext.Provider>;
}

export function useProgress() {
  const context = useContext(ProgressContext);
  if (!context) throw new Error("useProgress вне ProgressProvider");
  return context;
}

/** Прогресс недели: только обязательный план, допы «на 100» не считаются. */
export function useWeekProgress(subject: Subject, weekNumber: number) {
  const { statusOf } = useProgress();
  const week = COURSES[subject].weeks.find((w) => w.number === weekNumber);
  const items = week ? [...week.lessons.flatMap((l) => l.items), ...week.events].filter((i) => i.required) : [];
  const open = items.filter((i) => statusOf(i) !== "locked");
  const done = open.filter((i) => statusOf(i) === "done");
  return { done: done.length, open: open.length, total: items.length };
}
