"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { Medal } from "@/components/progress/progress-ui";
import { Icon } from "@/components/ui/icon";
import { useStats } from "@/lib/stats";
import type { Subject } from "@mocks/course";

// «Новая ачивка!» — всплывает поверх любого экрана (история 07.06).
// На телефоне — сверху: снизу шторки и кнопки действий.

/** Свой набор на предмет: ачивки и их условия у предметов разные. */
const KEY = "enl-prototype-achievements-seen";
/** Состояние из localStorage подгружается после первого рендера — до этого не сравниваем. */
const SETTLE_MS = 800;

export function AchievementToast({ subject }: { subject: Subject }) {
  const { achievements } = useStats(subject);
  const earnedIds = achievements.filter((a) => a.earned).map((a) => a.id);
  const seen = useRef<Set<string> | null>(null);
  const [shown, setShown] = useState<(typeof achievements)[number] | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const timer = window.setTimeout(() => setReady(true), SETTLE_MS);
    return () => window.clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (!ready) return;
    if (!seen.current) {
      let stored: string[] = [];
      try {
        stored = JSON.parse(window.localStorage.getItem(`${KEY}-${subject}`) ?? "[]");
      } catch {
        // без сохранения
      }
      // Первый заход: всё уже выданное считаем увиденным.
      seen.current = new Set(stored.length ? stored : earnedIds);
    }
    const fresh = earnedIds.find((id) => !seen.current!.has(id));
    if (fresh) {
      seen.current.add(fresh);
      setShown(achievements.find((a) => a.id === fresh) ?? null);
    }
    try {
      window.localStorage.setItem(`${KEY}-${subject}`, JSON.stringify(Array.from(seen.current)));
    } catch {
      // без сохранения
    }
    // earnedIds пересоздаётся каждый рендер — сравниваем по составу
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ready, earnedIds.join(",")]);

  useEffect(() => {
    if (!shown) return;
    const timer = window.setTimeout(() => setShown(null), 6000);
    return () => window.clearTimeout(timer);
  }, [shown]);

  if (!shown) return null;
  return (
    <div
      role="status"
      aria-live="polite"
      className="fixed inset-x-4 top-[72px] z-40 mx-auto flex max-w-sm animate-in fade-in slide-in-from-top-4 items-center gap-3 rounded-box-l border border-line bg-surface-raised p-3 shadow-raised lg:bottom-6 lg:left-auto lg:right-6 lg:top-auto lg:mx-0 lg:slide-in-from-bottom-4"
    >
      <Medal earned size={48} />
      <Link href={`/${subject}/progress/achievements`} className="min-w-0 flex-1 no-underline" onClick={() => setShown(null)}>
        <span className="enl-display block text-sm text-ink-accent">новая ачивка!</span>
        <span className="block font-bold leading-snug">«{shown.title}»</span>
        <span className="block text-[13px] text-ink-muted">{shown.why}</span>
      </Link>
      <button type="button" onClick={() => setShown(null)} aria-label="Закрыть" className="grid size-8 shrink-0 place-items-center rounded-full hover:bg-surface-subtle">
        <Icon name="close-circle" size="min" />
      </button>
    </div>
  );
}
