"use client";

import { useCallback, useEffect, useState } from "react";
import { PROFILE, type Channel, type NoticeGroup } from "@mocks/notifications";

// Профиль и настройки уведомлений (A4). Сохраняются сами при изменении —
// кнопка «Сохранить» из вайрфрейма лишняя: на телефоне её легко не дожать.

const KEY = "enl-prototype-profile";

export interface Profile {
  name: string;
  grade: string;
  tz: number;
  telegram: string;
  vk: string;
  parentEmail: string;
  /** В кабинете приходят всегда, здесь — только дубли во внешние каналы. */
  channels: Record<NoticeGroup, Record<Channel, boolean>>;
  marketing: boolean;
}

export const INITIAL_PROFILE: Profile = {
  name: PROFILE.name,
  grade: PROFILE.grade,
  tz: PROFILE.tz,
  telegram: PROFILE.telegram,
  vk: PROFILE.vk,
  parentEmail: PROFILE.parentEmail,
  channels: {
    study: { telegram: true, email: false },
    review: { telegram: true, email: false },
    rewards: { telegram: false, email: false },
    payment: { telegram: true, email: true },
  },
  // Рекламу — только с согласия: по умолчанию выключено.
  marketing: false,
};

export function useProfile() {
  const [profile, setProfile] = useState<Profile>(INITIAL_PROFILE);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    try {
      const stored = window.localStorage.getItem(KEY);
      if (stored) setProfile({ ...INITIAL_PROFILE, ...JSON.parse(stored) });
    } catch {
      // без сохранения
    }
  }, []);

  const update = useCallback((patch: Partial<Profile>) => {
    setProfile((prev) => {
      const next = { ...prev, ...patch };
      try {
        window.localStorage.setItem(KEY, JSON.stringify(next));
      } catch {
        // без сохранения
      }
      return next;
    });
    setSaved(true);
  }, []);

  // «Сохранено» висит пару секунд после последнего изменения.
  useEffect(() => {
    if (!saved) return;
    const t = setTimeout(() => setSaved(false), 1800);
    return () => clearTimeout(t);
  }, [saved, profile]);

  return { profile, update, saved };
}
