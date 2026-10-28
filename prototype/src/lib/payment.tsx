"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import type { Subject } from "@mocks/course";
import { HISTORY, INITIAL_PAID, MONTHS, SCENARIOS, type PaymentScenario } from "@mocks/payment";

export type Payment = (typeof HISTORY)[number];

// Оплаченные месяцы и сценарий показа (сейчас / просрочка / отчисление).
// Правило оплаты — в mocks/payment.ts.

const KEY = "proto-payment";
/** Месяц, вокруг которого строятся сценарии: его оплата — до 1 ноября. */
export const DUE_MONTH = "2026-11";

interface Store {
  scenario: PaymentScenario;
  paid: Record<Subject, string[]>;
  /** Месяцы, оплаченные остатком — не с первого числа. */
  partial: Record<Subject, string[]>;
  /** Платежи, сделанные в прототипе, — поверх истории из моков. */
  payments?: Payment[];
}

export type PaymentStatus = "ok" | "due" | "overdue" | "expelled";

interface PaymentState {
  scenario: PaymentScenario;
  setScenario: (s: PaymentScenario) => void;
  paid: Record<Subject, string[]>;
  partial: Record<Subject, string[]>;
  pay: (subjects: Subject[], months: string[], partial: boolean | undefined, payment: Payment) => void;
  history: Payment[];
  /** Статус ученика по предмету при текущем сценарии. */
  statusOf: (subject: Subject) => PaymentStatus;
  /** Месяц, который пропущен и останется закрытым (оплатили следующий). */
  skipped: (subject: Subject) => string | undefined;
  paidUntil: (subject: Subject) => string;
}

const PaymentContext = createContext<PaymentState | null>(null);

const initial: Store = { scenario: "ok", paid: INITIAL_PAID, partial: { soc: [], hist: [] } };

export function PaymentProvider({ children }: { children: ReactNode }) {
  const [store, setStore] = useState<Store>(initial);

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

  const value = useMemo<PaymentState>(() => {
    const index = (id: string) => MONTHS.findIndex((m) => m.id === id);
    const statusOf = (subject: Subject): PaymentStatus => {
      const dueOk = store.paid[subject].includes(DUE_MONTH);
      // Оплатили декабрь, пропустив ноябрь, — учатся дальше, ноябрь закрыт.
      const later = store.paid[subject].some((m) => index(m) > index(DUE_MONTH));
      if (dueOk || later) return "ok";
      if (store.scenario === "ok") return "due";
      return store.scenario;
    };
    return {
      scenario: store.scenario,
      setScenario: (scenario) => save({ ...store, scenario }),
      paid: store.paid,
      partial: store.partial,
      history: [...HISTORY, ...(store.payments ?? [])],
      pay: (subjects, months, partial, payment) => {
        const paid = { ...store.paid };
        const part = { ...store.partial };
        for (const s of subjects) {
          paid[s] = Array.from(new Set([...paid[s], ...months]));
          if (partial) part[s] = Array.from(new Set([...part[s], ...months]));
        }
        save({ ...store, paid, partial: part, payments: [...(store.payments ?? []), payment] });
      },
      statusOf,
      skipped: (subject) => {
        const list = store.paid[subject];
        const lastPaid = Math.max(...list.map(index));
        return MONTHS.slice(0, lastPaid).find((m) => !list.includes(m.id) && index(m.id) >= index(DUE_MONTH))?.title;
      },
      paidUntil: (subject) => {
        const lastPaid = Math.max(...store.paid[subject].map(index));
        return MONTHS[lastPaid].last;
      },
    };
  }, [store, save]);

  return <PaymentContext.Provider value={value}>{children}</PaymentContext.Provider>;
}

export function usePayment() {
  const context = useContext(PaymentContext);
  if (!context) throw new Error("usePayment вне PaymentProvider");
  return context;
}

export function scenarioToday(scenario: PaymentScenario) {
  return SCENARIOS[scenario];
}
