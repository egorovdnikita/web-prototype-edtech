"use client";

import { useMistakes } from "@/lib/mistakes";
import { useStats } from "@/lib/stats";
import { shuffle } from "@/lib/trainings";
import type { Subject } from "@mocks/course";
import { SET_SIZE, TRAINER, WEAK_BELOW, type TrainerSet, type TrainerTask } from "@mocks/trainer";

export interface NumberStat {
  number: number;
  right: number;
  total: number;
  /** null — ещё не решали ни в тестах, ни в тренажёре. */
  percent: number | null;
  /** Сколько заданий этого номера есть в банке прототипа. */
  available: number;
}

/**
 * Решаемость по номерам 1 части: тренажёр (последний ответ на задание) плюс
 * последние попытки тестов курса.
 */
export function useTrainerStats(subject: Subject) {
  const { ege } = useStats(subject);
  const { trainer } = useMistakes(subject);
  const bank = TRAINER[subject];
  if (!bank) return null;

  const rows: NumberStat[] = Array.from({ length: bank.part1 }, (_, i) => {
    const number = i + 1;
    const tasks = bank.tasks.filter((t) => t.ege === number);
    const answered = tasks.filter((t) => trainer[t.id]);
    let right = answered.filter((t) => trainer[t.id].ok).length;
    let total = answered.length;
    const fromTests = ege.find((e) => e.number === number);
    if (fromTests) {
      right += Math.round((fromTests.percent * fromTests.total) / 100);
      total += fromTests.total;
    }
    return { number, right, total, percent: total ? Math.round((right / total) * 100) : null, available: tasks.length };
  });

  const weak = rows.filter((r) => r.percent !== null && r.percent < WEAK_BELOW && r.available > 0).map((r) => r.number);
  const solved = bank.tasks.filter((t) => trainer[t.id]).length;
  return { rows, weak, solved, bankTotal: bank.bankTotal, part1: bank.part1 };
}

/** Состав подборки. Перемешивается на каждой попытке. */
export function buildSet(subject: Subject, set: TrainerSet, weak: number[], seed: string): TrainerTask[] {
  const tasks = TRAINER[subject]?.tasks ?? [];
  if (set === "mix") {
    const numbers = Array.from(new Set(tasks.map((t) => t.ege)));
    return shuffle(
      numbers.map((n) => shuffle(tasks.filter((t) => t.ege === n), `${seed}-${n}`)[0]),
      seed,
    ).slice(0, SET_SIZE + 1);
  }
  const numbers = set === "weak" ? weak : [Number(set.slice(1))];
  return shuffle(tasks.filter((t) => numbers.includes(t.ege)), seed).slice(0, SET_SIZE);
}

export function setTitle(set: TrainerSet) {
  if (set === "mix") return "Микс по всем номерам";
  if (set === "weak") return "Слабые номера";
  return `Задание №${set.slice(1)}`;
}
