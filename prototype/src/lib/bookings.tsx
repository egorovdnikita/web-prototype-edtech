"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { EXAM, INITIAL_BOOKINGS } from "@mocks/meetings";

// Записи ученика на встречи (история 19.02) и на зачёт к наставнику (08.04).

const KEY = "enl-prototype-bookings";

interface Store {
  booked: string[];
  /** id окна зачёта из EXAM.slots. */
  exam?: string;
}

interface BookingsState {
  isBooked: (id: string) => boolean;
  book: (id: string) => void;
  cancel: (id: string) => void;
  exam?: (typeof EXAM.slots)[number];
  bookExam: (slotId: string) => void;
  cancelExam: () => void;
}

const BookingsContext = createContext<BookingsState | null>(null);

export function BookingsProvider({ children }: { children: ReactNode }) {
  const [store, setStore] = useState<Store>({ booked: INITIAL_BOOKINGS });

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

  const value = useMemo<BookingsState>(
    () => ({
      isBooked: (id) => store.booked.includes(id),
      book: (id) => save({ ...store, booked: [...store.booked.filter((b) => b !== id), id] }),
      cancel: (id) => save({ ...store, booked: store.booked.filter((b) => b !== id) }),
      exam: EXAM.slots.find((s) => s.id === store.exam),
      bookExam: (slotId) => save({ ...store, exam: slotId }),
      cancelExam: () => save({ ...store, exam: undefined }),
    }),
    [store, save],
  );
  return <BookingsContext.Provider value={value}>{children}</BookingsContext.Provider>;
}

export function useBookings() {
  const context = useContext(BookingsContext);
  if (!context) throw new Error("useBookings вне BookingsProvider");
  return context;
}
