"use client";

import { useBookings } from "@/lib/bookings";
import { useMistakes } from "@/lib/mistakes";
import { useProgress } from "@/lib/progress";
import { useWorks } from "@/lib/works";
import { COURSES, type PlanItem, type Subject } from "@mocks/course";
import {
  ACHIEVEMENTS,
  GRADEBOOK_HISTORY,
  OCTOBER_WEEKS,
  POINTS_PER_TASK,
  STAMP_THRESHOLD,
  type AchievementTrigger,
} from "@mocks/gradebook";
import { BOOKABLE, EVENTS, INITIAL_BOOKINGS, type MeetingKind } from "@mocks/meetings";
import { WORKS, isCorrect } from "@mocks/works";

// Прогресс, зачётка и ачивки считаются из того, что ученик сделал в прототипе:
// отметки, сданные работы, попытки тестов, работа над ошибками, записи на встречи.
// Ничего не опирается на кнопку «я выполнил» — только на факты (разбор, раздел 2).

const isDone = (s: PlanItem["status"]) => s === "done" || s === "review";

export function useStats(subject: Subject) {
  const { statusOf } = useProgress();
  const { get } = useWorks();
  const { mistakes, solvedToday } = useMistakes(subject);
  const { isBooked, exam, examResult } = useBookings();
  const course = COURSES[subject];

  const lessonItems = course.weeks.flatMap((w) => w.lessons.flatMap((l) => l.items));
  const all = [...lessonItems, ...course.weeks.flatMap((w) => w.events)];

  // --- Материалы (B11): обязательное и «на 100» отдельно
  const open = all.filter((i) => statusOf(i) !== "locked");
  const required = open.filter((i) => i.required);
  const extra = open.filter((i) => !i.required);
  const materials = {
    required: { done: required.filter((i) => isDone(statusOf(i))).length, total: required.length },
    extra: { done: extra.filter((i) => isDone(statusOf(i))).length, total: extra.length },
  };

  // --- Недели
  const weeks = course.weeks.map((w) => {
    const items = [...w.lessons.flatMap((l) => l.items), ...w.events].filter((i) => i.required);
    const opened = items.filter((i) => statusOf(i) !== "locked");
    return {
      number: w.number,
      range: w.range,
      done: opened.filter((i) => isDone(statusOf(i))).length,
      open: opened.length,
      total: items.length,
      current: w.number === course.currentWeek,
      future: w.number > course.currentWeek,
    };
  });

  // --- Зачётка (B12): баллы октября
  const history = GRADEBOOK_HISTORY[subject];
  const octoberItems = course.weeks
    .filter((w) => OCTOBER_WEEKS.includes(w.number))
    .flatMap((w) => [...w.lessons.flatMap((l) => l.items), ...w.events])
    .filter((i) => i.required);
  const octDone = history.octoberEarlier.done + octoberItems.filter((i) => isDone(statusOf(i))).length;
  const octTotal = history.octoberEarlier.total + octoberItems.length;
  const points = octDone * POINTS_PER_TASK;
  const max = octTotal * POINTS_PER_TASK;
  const percent = Math.round((points / max) * 100);
  // «Больше 60%» — строго больше.
  const needTasks = Math.max(0, Math.floor((max * STAMP_THRESHOLD) / 100 / POINTS_PER_TASK) + 1 - octDone);
  const drawAllowed = course.tariff !== "Флай";
  const stamps = [
    { month: "сентябрь", percent: history.september, stamp: history.september > STAMP_THRESHOLD, final: true },
    { month: "октябрь", percent, stamp: percent > STAMP_THRESHOLD, final: false },
  ];
  const gradebook = {
    points,
    max,
    percent,
    needTasks,
    stamps,
    stampCount: stamps.filter((s) => s.stamp).length,
    drawAllowed,
  };

  // --- Работы: попытки и решаемость по номерам ЕГЭ
  const tests = lessonItems
    .filter((i) => WORKS[i.id]?.check === "auto")
    .map((i) => ({ item: i, work: WORKS[i.id], attempts: get(i.id).attempts }))
    .filter((t) => t.attempts.length > 0);
  const byEge = new Map<number, { right: number; total: number }>();
  for (const { work, attempts } of tests) {
    const last = attempts[attempts.length - 1];
    for (const task of work.tasks) {
      if (task.type === "long") continue;
      const row = byEge.get(task.ege) ?? { right: 0, total: 0 };
      row.total += 1;
      if (isCorrect(task, last.answers[task.id])) row.right += 1;
      byEge.set(task.ege, row);
    }
  }
  const ege = Array.from(byEge.entries())
    .map(([number, r]) => ({ number, percent: Math.round((r.right / r.total) * 100), total: r.total }))
    .sort((a, b) => a.number - b.number);

  const works = lessonItems
    .filter((i) => WORKS[i.id] && get(i.id).submitted)
    .map((i) => {
      const record = get(i.id);
      const best = record.attempts.reduce((m, a) => Math.max(m, a.score), -1);
      const max = record.attempts[0]?.max;
      return { item: i, attempts: Math.max(record.attempts.length, 1), best: best >= 0 ? `${best} из ${max}` : null };
    });

  const debts = lessonItems.filter((i) => i.required && statusOf(i) === "overdue");

  // --- Ачивки (B13): выдаются сами за учебные действия
  const current = weeks.find((w) => w.current)!;
  const earned: Partial<Record<AchievementTrigger, boolean>> = {
    welcome: true,
    "first-probe": true,
    stamp: gradebook.stampCount > 0,
    "perfect-test": tests.some((t) => t.attempts.some((a) => a.score === a.max)),
    comeback: tests.some((t) => t.attempts.length > 1 && t.attempts[0].score < t.attempts[0].max / 2),
    "fixed-mistake": solvedToday > 0,
    "self-check": lessonItems.some((i) => WORKS[i.id]?.check === "self" && get(i.id).selfScores && !isPastMock(i.id)),
    "booked-meeting": Boolean(exam) || newBookings(isBooked),
    "no-debts": debts.length === 0,
    "week-done": current.open > 0 && current.done === current.open,
    "exam-passed": subject === "soc" && Boolean(examResult?.passed),
  };
  const achievements = ACHIEVEMENTS.map((a) => ({
    ...a,
    earned: Boolean(earned[a.id]),
    // Печать за сентябрь поставлена в конце сентября, а не сегодня.
    date: earned[a.id] ? (a.earnedAt ?? (a.id === "stamp" && stamps[0].stamp ? "30.09" : "сегодня")) : undefined,
  }));

  return { materials, weeks, gradebook, ege, works, debts, achievements, mistakesLeft: mistakes.length };
}

/** Самопроверка, сделанная до прототипа, ачивку не даёт — нужна своя. */
function isPastMock(id: string) {
  return id === "hist-13-h";
}

/** Ачивку даёт своя запись — сверх тех, что были в моках с самого начала. */
function newBookings(isBooked: (id: string) => boolean) {
  return EVENTS.some(
    (e) => BOOKABLE.includes(e.kind as MeetingKind) && !INITIAL_BOOKINGS.includes(e.id) && isBooked(e.id),
  );
}
