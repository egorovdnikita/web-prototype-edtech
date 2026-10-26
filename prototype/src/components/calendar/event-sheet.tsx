"use client";

import { useEffect, useState, type ReactNode } from "react";
import { Button, ButtonLink } from "@/components/ui/box";
import { Icon } from "@/components/ui/icon";
import { useBookings } from "@/lib/bookings";
import { cn } from "@/lib/utils";
import { SUBJECTS, type Subject } from "@mocks/course";
import {
  BOOKABLE,
  EXAM,
  MEETING_LABEL,
  dayLabel,
  isPast,
  type CalendarEvent,
  type MeetingKind,
} from "@mocks/meetings";
import { RECORDINGS } from "@mocks/recordings";

// B15 — запись на встречу. Модальное окно из календаря: на телефоне — шторка снизу.

function Sheet({
  title,
  onClose,
  children,
}: {
  title: string;
  onClose: () => void;
  children: ReactNode;
}) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={title}
      className="fixed inset-0 z-30 flex items-end justify-center bg-[var(--surface-base-fill-overlay)] sm:items-center sm:p-6"
      onClick={onClose}
    >
      <div
        className="max-h-[90dvh] w-full max-w-lg overflow-y-auto rounded-t-box-xl bg-surface-raised p-5 pb-[calc(1.25rem+env(safe-area-inset-bottom))] sm:rounded-box-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-3 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            aria-label="Закрыть"
            className="grid size-9 place-items-center rounded-full hover:bg-surface-subtle"
          >
            <Icon name="close-circle" size="2xs" className="text-current" />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}

function when(e: Pick<CalendarEvent, "date" | "time" | "end">) {
  const { weekday, day, month } = dayLabel(e.date);
  return `${weekday}, ${day} ${month}${e.time ? `, ${e.time}${e.end ? `–${e.end}` : ""}` : ""}`;
}

export function EventSheet({
  event,
  onClose,
}: {
  event: CalendarEvent;
  onClose: () => void;
}) {
  const { isBooked, book, cancel, cancelExam } = useBookings();
  const booked = isBooked(event.id) || event.kind === "exam";
  const past = isPast(event);
  const bookable = BOOKABLE.includes(event.kind as MeetingKind);
  const free = (event.capacity ?? 0) - (event.taken ?? 0) - (booked ? 1 : 0);
  const full = bookable && !booked && free <= 0;
  const filled = event.capacity
    ? Math.min(
        100,
        Math.round(
          (((event.taken ?? 0) + (booked ? 1 : 0)) / event.capacity) * 100,
        ),
      )
    : 0;

  return (
    <Sheet title={event.title} onClose={onClose}>
      <p className="text-[13px] font-semibold uppercase tracking-wide text-ink-muted">
        {MEETING_LABEL[event.kind]} ·{" "}
        {event.subject === "all"
          ? "все предметы"
          : SUBJECTS[event.subject].short}
      </p>
      <h2 className="mt-1 text-xl font-extrabold leading-snug">
        {event.title}
      </h2>
      <ul className="mt-3 flex flex-col gap-2 text-sm">
        <li className="flex items-center gap-2">
          <span className="first-letter:uppercase">{when(event)}</span>
        </li>
        {event.host && (
          <li className="flex items-center gap-2">
            ведёт {event.host}
          </li>
        )}
      </ul>

      {bookable && event.capacity && !past && (
        <div className="mt-4">
          <p className="flex justify-between text-sm">
            <span className="font-semibold">
              {full
                ? "Мест нет"
                : `Свободно ${Math.max(0, free)} из ${event.capacity}`}
            </span>
            <span className="text-ink-muted">
              до {event.capacity} участников
            </span>
          </p>
          <div
            className="mt-1.5 h-2 rounded-full bg-surface-subtle"
            aria-hidden
          >
            <div
              className="h-full rounded-full bg-accent"
              style={{ width: `${filled}%` }}
            />
          </div>
        </div>
      )}

      {event.about && (
        <p className="mt-4 rounded-box-m bg-surface-subtle p-3 text-sm leading-relaxed">
          {event.about}
        </p>
      )}

      <div className="mt-5 flex flex-col gap-3">
        {event.kind === "webinar" &&
          (past ? (
            RECORDINGS[event.id] ? (
              <ButtonLink href={`/${event.subject}/recording/${event.id}`} size="l">
                Смотреть запись с чатом и задачником
              </ButtonLink>
            ) : (
              <p className="text-sm text-ink-muted">
                Вебинар прошёл. Запись, чат и задачник — в уроке недели.
              </p>
            )
          ) : (
            <>
              <Button size="l" disabled>
                Войти — за 15 минут до начала
              </Button>
              <p className="text-[13px] text-ink-muted">
                Записываться не нужно: вебинар для всего курса, без ограничения
                мест.
              </p>
            </>
          ))}

        {bookable &&
          (past ? (
            <>
              <p className="text-sm text-ink-muted">
                {booked ? "Вы были на этой встрече." : "Встреча прошла."}
                {event.kind === "coworking" && " Коворкинг не записывается."}
              </p>
              {RECORDINGS[event.id] && (
                <ButtonLink href={`/${event.subject}/recording/${event.id}`} size="l">
                  Смотреть запись с чатом и задачником
                </ButtonLink>
              )}
            </>
          ) : booked ? (
            <>
              <p
                role="status"
                className="flex items-center gap-2 font-bold text-ink-accent"
              >
                <Icon name="check-circle" variant="bold" size="2xs" /> Вы
                записаны
              </p>
              <p className="text-[13px] text-ink-muted">
                Напомним за час. Войти можно из календаря и из задач недели —
                кнопка появится за 15 минут до начала.
              </p>
              <Button
                size="l"
                appearance="outline"
                onClick={() => cancel(event.id)}
              >
                Отменить запись
              </Button>
            </>
          ) : full ? (
            <>
              <Button size="l" disabled>
                Мест нет
              </Button>
              <p className="text-[13px] text-ink-muted">
                Если кто-то отменит запись, место освободится. Ближайшие встречи
                — в календаре.
              </p>
            </>
          ) : (
            <Button size="l" onClick={() => book(event.id)}>
              Записаться
            </Button>
          ))}

        {event.kind === "exam" && (
          <>
            <p className="text-sm">
              Билеты опубликованы заранее. Зачёт идёт один на один, запись видят
              только наставник и ведущий наставник.
            </p>
            <ButtonLink href={`/${EXAM.subject}/exam`} size="l">
              Войти в зачёт
            </ButtonLink>
            <Button
              size="l"
              appearance="outline"
              onClick={() => {
                cancelExam();
                onClose();
              }}
            >
              Отменить запись на зачёт
            </Button>
          </>
        )}
      </div>
    </Sheet>
  );
}

/** Запись на зачёт: окна наставника вместо стороннего календаря. */
export function ExamSheet({
  subject,
  onClose,
}: {
  subject: Subject;
  onClose: () => void;
}) {
  const { exam, bookExam, cancelExam } = useBookings();
  const [slot, setSlot] = useState(exam?.id ?? "");
  const days = Array.from(new Set(EXAM.slots.map((s) => s.date)));

  return (
    <Sheet title={EXAM.title} onClose={onClose}>
      <p className="text-[13px] font-semibold uppercase tracking-wide text-ink-muted">
        зачёт · {SUBJECTS[subject].short}
      </p>
      <h2 className="mt-1 text-xl font-extrabold">{EXAM.title}</h2>
      <p className="mt-1 text-sm text-ink-muted">
        {EXAM.topic} · {EXAM.minutes} минут по видеосвязи · ведёт {EXAM.host}
      </p>
      <p className="mt-3 rounded-box-m bg-surface-subtle p-3 text-[13px] leading-relaxed">
        Зачёт — раз в месяц. Выберите окно наставника; если не получится прийти,
        отмените запись заранее — окно достанется другому.
      </p>

      <fieldset className="mt-4">
        <legend className="mb-2 font-bold">Свободное время</legend>
        <div className="flex flex-col gap-3">
          {days.map((day) => {
            const { weekday, day: d, month } = dayLabel(day);
            return (
              <div key={day}>
                <p className="mb-1.5 text-sm font-semibold text-ink-muted first-letter:uppercase">
                  {`${weekday}, ${d} ${month}`}
                </p>
                <div className="flex flex-wrap gap-2">
                  {EXAM.slots
                    .filter((s) => s.date === day)
                    .map((s) => (
                      <label
                        key={s.id}
                        className={cn(
                          "cursor-pointer rounded-box-m border px-4 py-2 font-bold tabular-nums transition-colors",
                          slot === s.id
                            ? "border-accent bg-accent text-accent-on"
                            : "border-line-strong bg-surface-page hover:border-accent",
                        )}
                      >
                        <input
                          type="radio"
                          name="exam-slot"
                          value={s.id}
                          checked={slot === s.id}
                          onChange={() => setSlot(s.id)}
                          className="sr-only"
                          aria-label={`${weekday}, ${d} ${month}, ${s.time}`}
                        />
                        {s.time}
                      </label>
                    ))}
                </div>
              </div>
            );
          })}
        </div>
      </fieldset>

      <div className="mt-5 flex flex-col gap-3">
        <Button
          size="l"
          disabled={!slot || slot === exam?.id}
          onClick={() => {
            bookExam(slot);
            onClose();
          }}
        >
          {exam ? "Перенести на это время" : "Записаться на зачёт"}
        </Button>
        {exam && (
          <Button
            size="l"
            appearance="outline"
            onClick={() => {
              cancelExam();
              onClose();
            }}
          >
            Отменить запись
          </Button>
        )}
      </div>
    </Sheet>
  );
}
