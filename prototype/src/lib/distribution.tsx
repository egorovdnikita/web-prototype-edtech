"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import type { PlanItem, Subject } from "@mocks/course";

// Распределение к наставнику. После покупки ученика вручную распределяют:
// часовой пояс (разница до 2 часов) → вуз и опыт наставника → «вайб» и пожелания
// из анкеты. Пока наставник и проверяющий не назначены, в GetCourse закрыта сдача ДЗ
// (CloudText: «Дождись, пока тебе назначат наставника и проверяющего»).
//
// В прототипе это демо-состояние предмета: включается в «Ещё», а «назначить»
// можно со страницы наставника — так видно и ожидание, и момент распределения.

const KEY = "enl-prototype-distribution";

interface Store {
  /** Предметы, по которым ученик ещё ждёт распределения. */
  waiting: Subject[];
  /** Распределены прямо в демо — для свежего уведомления. */
  assignedInDemo: Subject[];
}

interface DistributionState {
  isWaiting: (subject: Subject) => boolean;
  assignedInDemo: (subject: Subject) => boolean;
  setWaiting: (subject: Subject, waiting: boolean) => void;
  assign: (subject: Subject) => void;
  /** ДЗ закрыто до распределения — тесты и видео доступны сразу. */
  lockedByDistribution: (item: Pick<PlanItem, "id" | "kind">) => boolean;
}

const DistributionContext = createContext<DistributionState | null>(null);

const subjectOf = (id: string): Subject => (id.startsWith("hist-") ? "hist" : "soc");

export function DistributionProvider({ children }: { children: ReactNode }) {
  const [store, setStore] = useState<Store>({ waiting: [], assignedInDemo: [] });

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

  const value = useMemo<DistributionState>(() => {
    const isWaiting = (s: Subject) => store.waiting.includes(s);
    return {
      isWaiting,
      assignedInDemo: (s) => store.assignedInDemo.includes(s),
      setWaiting: (s, waiting) =>
        save({
          waiting: waiting ? Array.from(new Set([...store.waiting, s])) : store.waiting.filter((x) => x !== s),
          assignedInDemo: store.assignedInDemo.filter((x) => x !== s),
        }),
      assign: (s) =>
        save({ waiting: store.waiting.filter((x) => x !== s), assignedInDemo: Array.from(new Set([...store.assignedInDemo, s])) }),
      lockedByDistribution: (item) => item.kind === "homework" && isWaiting(subjectOf(item.id)),
    };
  }, [store, save]);

  return <DistributionContext.Provider value={value}>{children}</DistributionContext.Provider>;
}

export function useDistribution() {
  const context = useContext(DistributionContext);
  if (!context) throw new Error("useDistribution вне DistributionProvider");
  return context;
}
