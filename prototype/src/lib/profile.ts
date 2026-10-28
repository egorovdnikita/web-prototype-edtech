"use client";

import { useCallback, useEffect, useState } from "react";
import { PROFILE, type Channel, type NoticeGroup } from "@mocks/notifications";

// Профиль и настройки уведомлений. Сохраняются сами при изменении —
// отдельная кнопка «Сохранить» не нужна: на телефоне её легко не дожать.

const KEY = "proto-profile";

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
    study: { telegram: true, vk: false, email: false },
    review: { telegram: true, vk: false, email: false },
    rewards: { telegram: false, vk: false, email: false },
    payment: { telegram: true, vk: false, email: true },
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
      if (stored) {
        const data = JSON.parse(stored);
        // Старые сохранения — без канала ВК: добираем его из начальных настроек.
        const channels = Object.fromEntries(
          Object.entries(INITIAL_PROFILE.channels).map(([g, ch]) => [g, { ...ch, ...data.channels?.[g] }]),
        ) as Profile["channels"];
        setProfile({ ...INITIAL_PROFILE, ...data, channels });
      }
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
