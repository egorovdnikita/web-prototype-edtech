"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { PAST, WORKS, isCorrect, maxScore, type Work } from "@mocks/works";

// Ответы, попытки и самооценка по работам. Ответы сохраняются на каждом вводе —
// К работе можно вернуться.

const KEY = "proto-works";
/** «Сегодня» в прототипе — совпадает с текущей неделей в моках. */
export const TODAY = "25.10";

export interface Attempt {
  date: string;
  score: number;
  max: number;
  answers: Record<string, string>;
}

export interface WorkRecord {
  answers: Record<string, string>;
  timerStartedAt?: number;
  submitted?: { date: string; answers: Record<string, string> };
  attempts: Attempt[];
  selfScores?: Record<string, Record<string, number>>;
}

interface WorksState {
  get: (id: string) => WorkRecord;
  setAnswer: (id: string, taskId: string, value: string) => void;
  startTimer: (id: string) => void;
  submit: (id: string) => WorkRecord;
  retry: (id: string) => void;
  saveSelfScores: (id: string, scores: Record<string, Record<string, number>>) => void;
}

const WorksContext = createContext<WorksState | null>(null);

/** Балл теста по ключу. ДЗ так не считается — его оценивает куратор или сам ученик. */
export function scoreTest(work: Work, answers: Record<string, string>) {
  let score = 0;
  let max = 0;
  for (const task of work.tasks) {
    max += maxScore(task);
    if (task.type !== "long" && isCorrect(task, answers[task.id])) score += 1;
  }
  return { score, max };
}

function initial(id: string): WorkRecord {
  const past = PAST[id];
  const work = WORKS[id];
  if (!past || !work) return { answers: {}, attempts: [] };
  return {
    answers: {},
    submitted: { date: past.date, answers: past.answers },
    attempts: work.check === "auto" ? [{ date: past.date, answers: past.answers, ...scoreTest(work, past.answers) }] : [],
    selfScores: past.selfScores,
  };
}

export function WorksProvider({ children }: { children: ReactNode }) {
  const [records, setRecords] = useState<Record<string, WorkRecord>>({});

  useEffect(() => {
    try {
      const saved = window.localStorage.getItem(KEY);
      if (saved) setRecords(JSON.parse(saved));
    } catch {
      // приватный режим — работаем без сохранения
    }
  }, []);

  const get = useCallback((id: string) => records[id] ?? initial(id), [records]);

  const update = useCallback(
    (id: string, change: (r: WorkRecord) => WorkRecord) => {
      let next: WorkRecord = get(id);
      setRecords((prev) => {
        next = change(prev[id] ?? initial(id));
        const all = { ...prev, [id]: next };
        try {
          window.localStorage.setItem(KEY, JSON.stringify(all));
        } catch {
          // без сохранения
        }
        return all;
      });
      return next;
    },
    [get],
  );

  const setAnswer = useCallback(
    (id: string, taskId: string, value: string) =>
      void update(id, (r) => ({ ...r, answers: { ...r.answers, [taskId]: value } })),
    [update],
  );

  const startTimer = useCallback(
    (id: string) => void update(id, (r) => ({ ...r, timerStartedAt: Date.now() })),
    [update],
  );

  const submit = useCallback(
    (id: string) => {
      const work = WORKS[id];
      const r = get(id);
      const submitted = { date: TODAY, answers: r.answers };
      const attempt = work.check === "auto" ? [{ date: TODAY, answers: r.answers, ...scoreTest(work, r.answers) }] : [];
      const next: WorkRecord = {
        ...r,
        submitted,
        timerStartedAt: undefined,
        attempts: [...r.attempts, ...attempt],
        selfScores: undefined,
      };
      update(id, () => next);
      return next;
    },
    [get, update],
  );

  const retry = useCallback(
    (id: string) => void update(id, (r) => ({ ...r, answers: {}, timerStartedAt: undefined })),
    [update],
  );

  const saveSelfScores = useCallback(
    (id: string, scores: Record<string, Record<string, number>>) =>
      void update(id, (r) => ({ ...r, selfScores: scores })),
    [update],
  );

  const value = useMemo(
    () => ({ get, setAnswer, startTimer, submit, retry, saveSelfScores }),
    [get, setAnswer, startTimer, submit, retry, saveSelfScores],
  );
  return <WorksContext.Provider value={value}>{children}</WorksContext.Provider>;
}

export function useWorks() {
  const context = useContext(WorksContext);
  if (!context) throw new Error("useWorks вне WorksProvider");
  return context;
}
