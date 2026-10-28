"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { useDistribution } from "@/lib/distribution";
import { COURSES, type PlanItem, type Subject } from "@mocks/course";

// Состояние «покликать»: что ученик отметил или прошёл в прототипе.
// Хранится в localStorage, сбрасывается кнопкой в «Ещё».

const KEY = "proto-progress";

type Override = "done" | "todo" | "review";

interface ProgressState {
  /** Переопределённые статусы пунктов: id → done | todo | review. */
  overrides: Record<string, Override>;
  statusOf: (item: PlanItem) => PlanItem["status"];
  toggle: (item: PlanItem) => void;
  complete: (id: string) => void;
  setStatus: (id: string, status: Override) => void;
  reset: () => void;
}

const ProgressContext = createContext<ProgressState | null>(null);

export function ProgressProvider({ children }: { children: ReactNode }) {
  const [overrides, setOverrides] = useState<Record<string, Override>>({});
  const { lockedByDistribution } = useDistribution();

  useEffect(() => {
    try {
      const saved = window.localStorage.getItem(KEY);
      if (saved) setOverrides(JSON.parse(saved));
    } catch {
      // приватный режим или битые данные — начинаем с моков
    }
  }, []);

  const save = useCallback((next: Record<string, Override>) => {
    setOverrides(next);
    try {
      window.localStorage.setItem(KEY, JSON.stringify(next));
    } catch {
      // без сохранения прототип всё равно работает
    }
  }, []);

  const statusOf = useCallback(
    (item: PlanItem) => {
      if (item.status === "locked") return "locked";
      const status = overrides[item.id] ?? item.status;
      // До распределения ДЗ закрыто; уже сданное остаётся как есть.
      if (lockedByDistribution(item) && !["done", "review"].includes(status)) return "locked";
      return status;
    },
    [overrides, lockedByDistribution],
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
  const setStatus = useCallback((id: string, status: Override) => save({ ...overrides, [id]: status }), [overrides, save]);
  const reset = useCallback(() => {
    save({});
    try {
      window.localStorage.removeItem("proto-works");
      window.localStorage.removeItem("proto-mistakes");
      window.localStorage.removeItem("proto-bookings");
      window.localStorage.removeItem("proto-achievements-seen-soc");
      window.localStorage.removeItem("proto-achievements-seen-hist");
      window.localStorage.removeItem("proto-messages-soc");
      window.localStorage.removeItem("proto-messages-hist");
      window.localStorage.removeItem("proto-payment");
      window.localStorage.removeItem("proto-trainings");
      window.localStorage.removeItem("proto-notifications");
      window.localStorage.removeItem("proto-profile");
      window.localStorage.removeItem("proto-materials");
      window.localStorage.removeItem("proto-distribution");
      window.localStorage.removeItem("proto-chats");
      window.localStorage.removeItem("proto-surveys");
      window.localStorage.removeItem("proto-recheck");
      window.localStorage.removeItem("proto-support");
      window.location.reload();
    } catch {
      // нечего сбрасывать
    }
  }, [save]);

  const value = useMemo(
    () => ({ overrides, statusOf, toggle, complete, setStatus, reset }),
    [overrides, statusOf, toggle, complete, setStatus, reset],
  );
  return <ProgressContext.Provider value={value}>{children}</ProgressContext.Provider>;
}

export function useProgress() {
  const context = useContext(ProgressContext);
  if (!context) throw new Error("useProgress вне ProgressProvider");
  return context;
}

/** Прогресс недели: только обязательный план, допы «на 100» не считаются.
 *  Сданное на проверку уже считается сделанным — ученик свою часть выполнил. */
export function useWeekProgress(subject: Subject, weekNumber: number) {
  const { statusOf } = useProgress();
  const { lockedByDistribution } = useDistribution();
  const week = COURSES[subject].weeks.find((w) => w.number === weekNumber);
  const items = week ? [...week.lessons.flatMap((l) => l.items), ...week.events].filter((i) => i.required) : [];
  const open = items.filter((i) => statusOf(i) !== "locked");
  const done = open.filter((i) => ["done", "review"].includes(statusOf(i)));
  // Закрытое до распределения — не «по расписанию», показываем отдельно.
  const waiting = items.filter((i) => statusOf(i) === "locked" && lockedByDistribution(i)).length;
  return { done: done.length, open: open.length, total: items.length, waiting };
}
