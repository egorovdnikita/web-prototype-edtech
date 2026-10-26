"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { useDistribution } from "@/lib/distribution";
import { usePayment } from "@/lib/payment";
import { SUBJECTS, type Subject } from "@mocks/course";
import { MENTORS } from "@mocks/mentor";
import { NOTICES, type Notice } from "@mocks/notifications";

// Уведомления (A5): список на весь аккаунт и число непрочитанных у колокольчика.
// Прочитанным уведомление становится само, когда ученик открыл список (US 10.03), —
// отмечать руками не нужно. Оплата — живая: появляется, если в демо-сценарии
// оплаты включена просрочка или отчисление.

const KEY = "enl-prototype-notifications";

interface NotificationsState {
  notices: Notice[];
  isRead: (n: Notice) => boolean;
  unread: number;
  markRead: (ids: string[]) => void;
  /** Прочитанное загружено из браузера. До этого всё выглядит непрочитанным. */
  ready: boolean;
}

const NotificationsContext = createContext<NotificationsState | null>(null);

export function NotificationsProvider({ children }: { children: ReactNode }) {
  const { statusOf } = usePayment();
  const { isWaiting, assignedInDemo } = useDistribution();
  const [read, setRead] = useState<string[]>([]);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    try {
      const saved = window.localStorage.getItem(KEY);
      if (saved) setRead(JSON.parse(saved));
    } catch {
      // без сохранения
    }
    setReady(true);
  }, []);

  const markRead = useCallback((ids: string[]) => {
    setRead((prev) => {
      const next = Array.from(new Set([...prev, ...ids]));
      try {
        window.localStorage.setItem(KEY, JSON.stringify(next));
      } catch {
        // без сохранения
      }
      return next;
    });
  }, []);

  const value = useMemo<NotificationsState>(() => {
    const subjects: Subject[] = ["soc", "hist"];
    const late = subjects.filter((s) => ["overdue", "expelled"].includes(statusOf(s)));
    const payment: Notice[] = late.map((s) =>
      statusOf(s) === "overdue"
        ? {
            id: `pay-overdue-${s}`,
            group: "payment",
            subject: s,
            title: `${SUBJECTS[s].title}: ноябрь не оплачен`,
            text: "Открытое доступно, новые уроки и проверка — после оплаты. До конца месяца, потом отчисление.",
            at: "2026-11-01T09:00",
            href: "/payment",
            action: "Оплатить",
          }
        : {
            id: `pay-expelled-${s}`,
            group: "payment",
            subject: s,
            title: `${SUBJECTS[s].title}: вы отчислены с 1 декабря`,
            text: "Вернуться можно через менеджера — напишите в поддержку.",
            at: "2026-12-01T09:00",
            href: "/payment",
            action: "Подробнее",
          },
    );
    // Распределение: пока подбирают — одно уведомление вместо переписки с наставником;
    // назначили в демо — свежее уведомление со ссылкой на наставника.
    const distribution: Notice[] = subjects.flatMap((s): Notice[] =>
      isWaiting(s)
        ? [
            {
              id: `waiting-${s}`,
              group: "review",
              subject: s,
              title: "Подбираем вам наставника",
              text: "Он напишет первым. Уроки и тесты уже открыты, ДЗ — после распределения.",
              at: "2026-10-25T08:30",
              href: "/mentor",
              action: "Подробнее",
            },
          ]
        : assignedInDemo(s)
          ? [
              {
                id: `assigned-${s}-demo`,
                group: "review",
                subject: s,
                title: `Ваш наставник — ${MENTORS[s].name}`,
                text: "Сдача ДЗ открыта. Наставник уже написал — загляните в сообщения.",
                at: "2026-10-25T12:00",
                href: "/mentor",
                action: "Познакомиться",
              },
            ]
          : [],
    );
    // До распределения переписки с наставником и объявлений группы ещё нет.
    const base = NOTICES.filter((n) => !(isWaiting(n.subject) && /mentor|group/.test(n.id)));
    const notices = [...payment, ...distribution, ...base].sort((a, b) => b.at.localeCompare(a.at));
    const isRead = (n: Notice) => Boolean(n.read) || read.includes(n.id);
    return { notices, isRead, unread: ready ? notices.filter((n) => !isRead(n)).length : 0, markRead, ready };
  }, [statusOf, isWaiting, assignedInDemo, read, markRead, ready]);

  return <NotificationsContext.Provider value={value}>{children}</NotificationsContext.Provider>;
}

export function useNotifications() {
  const context = useContext(NotificationsContext);
  if (!context) throw new Error("useNotifications вне NotificationsProvider");
  return context;
}
