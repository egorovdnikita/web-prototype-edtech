"use client";

import { useCallback, useEffect, useState } from "react";

// Результаты тренировок. В прототипе сохраняем лучший результат: так тренировка из недели
// отмечается сама, а в каталоге видно, что уже пройдено.

const KEY = "proto-trainings";

export interface TrainingResult {
  /** Ошибок в лучшей попытке. */
  errors: number;
  tries: number;
}

export function useTrainingResults() {
  const [results, setResults] = useState<Record<string, TrainingResult>>({});

  useEffect(() => {
    try {
      const saved = window.localStorage.getItem(KEY);
      if (saved) setResults(JSON.parse(saved));
    } catch {
      // без сохранения
    }
  }, []);

  const record = useCallback((id: string, errors: number) => {
    setResults((prev) => {
      const old = prev[id];
      const next = { ...prev, [id]: { errors: old ? Math.min(old.errors, errors) : errors, tries: (old?.tries ?? 0) + 1 } };
      try {
        window.localStorage.setItem(KEY, JSON.stringify(next));
      } catch {
        // без сохранения
      }
      return next;
    });
  }, []);

  return { results, record };
}

/** Перемешивание с зерном: одинаковое на сервере и в браузере, другое на каждой попытке. */
export function shuffle<T>(items: T[], seed: string): T[] {
  let h = 2166136261;
  for (const c of seed) h = Math.imul(h ^ c.charCodeAt(0), 16777619);
  const out = [...items];
  for (let i = out.length - 1; i > 0; i--) {
    h = Math.imul(h ^ (h >>> 15), 2246822507) >>> 0;
    const j = h % (i + 1);
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}
