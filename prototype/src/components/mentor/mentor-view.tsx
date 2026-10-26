"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { hasExams } from "@/components/calendar/calendar-view";
import { Button, ButtonLink } from "@/components/ui/box";
import { Icon } from "@/components/ui/icon";
import { useBookings } from "@/lib/bookings";
import { useProgress } from "@/lib/progress";
import { cn } from "@/lib/utils";
import { findItem, SUBJECTS, type Subject } from "@mocks/course";
import { dayLabel } from "@mocks/meetings";
import { INDIVIDUAL_PLAN, MENTORS, PAST_EXAMS, THREADS, TICKETS, type Message } from "@mocks/mentor";
import { WORKS } from "@mocks/works";

// B17 — мой наставник: профиль (08.01), переписка с голосовыми (08.02),
// индивидуальный план (08.15), зачёты и обратная связь (08.04, 08.16, 08.34).

type Tab = "chat" | "plan" | "exams";

const KEY = "enl-prototype-messages";
const NOW = "25.10";

export function MentorView({ subject }: { subject: Subject }) {
  const mentor = MENTORS[subject];
  const [tab, setTab] = useState<Tab>("chat");

  return (
    <div className="mx-auto flex max-w-6xl flex-col gap-5">
      <header className="flex items-center gap-4">
        <span className="grid size-16 shrink-0 place-items-center rounded-full bg-surface-subject text-2xl font-extrabold">
          {mentor.initial}
        </span>
        <div className="min-w-0">
          <p className="text-sm text-ink-muted">ваш наставник · {SUBJECTS[subject].title.toLowerCase()}</p>
          <h1 className="text-[24px] font-extrabold leading-tight sm:text-[28px]">{mentor.name}</h1>
          <p className="text-sm text-ink-muted">
            {mentor.about} {mentor.hours}, {mentor.reply}.
          </p>
          <ul className="mt-2 flex flex-wrap gap-1.5">
            {mentor.tags.map((t) => (
              <li key={t} className="rounded-full bg-surface-subtle px-2.5 py-0.5 text-[12px] font-semibold text-ink-muted">
                {t}
              </li>
            ))}
          </ul>
        </div>
      </header>

      {/* Телефон: вкладки. Десктоп: всё сразу, переписка слева. */}
      <div role="tablist" aria-label="Разделы" className="flex gap-2 lg:hidden">
        {(
          [
            ["chat", "сообщения"],
            ["plan", "план"],
            ["exams", "зачёты"],
          ] as [Tab, string][]
        ).map(([id, label]) => (
          <button
            key={id}
            type="button"
            role="tab"
            aria-selected={tab === id}
            onClick={() => setTab(id)}
            className={cn(
              "rounded-full border px-3.5 py-1.5 text-sm font-semibold",
              tab === id ? "border-ink bg-ink text-surface-page" : "border-line bg-surface-raised text-ink-muted",
            )}
          >
            {label}
          </button>
        ))}
      </div>

      <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_360px]">
        <div className={cn(tab !== "chat" && "hidden lg:block")}>
          <Chat subject={subject} />
        </div>
        <div className="flex flex-col gap-5">
          <div className={cn(tab !== "plan" && "hidden lg:block")}>
            <IndividualPlan subject={subject} />
          </div>
          <div className={cn(tab !== "exams" && "hidden lg:block")}>
            <Exams subject={subject} />
          </div>
        </div>
      </div>
    </div>
  );
}

// --- Переписка ---------------------------------------------------------------

function Chat({ subject }: { subject: Subject }) {
  const mentor = MENTORS[subject];
  const [mine, setMine] = useState<Message[]>([]);
  const [text, setText] = useState("");
  const [recording, setRecording] = useState<number | null>(null);
  const [typing, setTyping] = useState(false);
  const listRef = useRef<HTMLOListElement>(null);
  const key = `${KEY}-${subject}`;

  useEffect(() => {
    try {
      setMine(JSON.parse(window.localStorage.getItem(key) ?? "[]"));
    } catch {
      // без сохранения
    }
  }, [key]);

  useEffect(() => {
    if (recording === null) return;
    const tick = window.setInterval(() => setRecording((s) => (s ?? 0) + 1), 1000);
    return () => window.clearInterval(tick);
  }, [recording === null]); // eslint-disable-line react-hooks/exhaustive-deps

  // Прокручиваем только ленту переписки — scrollIntoView двигал бы и всю страницу.
  useEffect(() => {
    const list = listRef.current;
    if (list) list.scrollTop = list.scrollHeight;
  }, [mine.length, typing]);

  const push = (m: Omit<Message, "id" | "at">) => {
    const time = new Date().toTimeString().slice(0, 5);
    const next = [...mine, { ...m, id: `my-${Date.now()}`, at: `${NOW}, ${time}` }];
    // Ответ наставника — имитация, только на первое сообщение в сессии.
    const replied = mine.some((x) => x.from === "mentor");
    setMine(next);
    try {
      window.localStorage.setItem(key, JSON.stringify(next));
    } catch {
      // без сохранения
    }
    if (!replied) {
      setTyping(true);
      window.setTimeout(() => {
        setTyping(false);
        const reply: Message = { id: `re-${Date.now()}`, from: "mentor", text: "Получила, спасибо! Отвечу подробно до вечера.", at: `${NOW}, ${time}` };
        setMine((cur) => {
          const withReply = [...cur, reply];
          try {
            window.localStorage.setItem(key, JSON.stringify(withReply));
          } catch {
            // без сохранения
          }
          return withReply;
        });
      }, 1800);
    }
  };

  const messages = [...THREADS[subject], ...mine];

  return (
    <section className="flex flex-col rounded-box-l border border-line bg-surface-raised">
      <h2 className="border-b border-line-subtle px-4 py-3 font-bold">Переписка</h2>
      <ol ref={listRef} className="flex max-h-[60dvh] min-h-[320px] flex-col gap-3 overflow-y-auto p-4" aria-live="polite">
        {messages.map((m) => (
          <li key={m.id} className={cn("flex max-w-[85%] flex-col gap-1", m.from === "me" ? "self-end items-end" : "self-start")}>
            <div
              className={cn(
                "rounded-box-l px-3.5 py-2.5 text-[15px] leading-relaxed",
                m.from === "me" ? "rounded-br-box-s bg-accent text-accent-on" : "rounded-bl-box-s bg-surface-subtle",
              )}
            >
              {m.voice ? (
                <span className="flex items-center gap-2 font-semibold">
                  <Icon name="play" variant="bold" size="2xs" className="text-current" />
                  <span aria-hidden className="flex h-4 items-end gap-0.5">
                    {[3, 6, 9, 5, 8, 4, 7, 10, 5, 3, 6, 8].map((h, i) => (
                      <span key={i} className="w-0.5 rounded-full bg-current opacity-70" style={{ height: h + 4 }} />
                    ))}
                  </span>
                  голосовое {m.voice}
                </span>
              ) : (
                m.text
              )}
            </div>
            <span className="text-[11px] text-ink-subtle">
              {m.from === "mentor" ? mentor.name : "вы"} · {m.at}
            </span>
          </li>
        ))}
        {typing && (
          <li className="self-start text-sm text-ink-muted" role="status">
            {mentor.name} печатает…
          </li>
        )}
      </ol>

      <form
        className="flex flex-col gap-2 border-t border-line-subtle p-3"
        onSubmit={(e) => {
          e.preventDefault();
          if (!text.trim()) return;
          push({ from: "me", text: text.trim() });
          setText("");
        }}
      >
        {recording !== null ? (
          <div className="flex items-center gap-3 rounded-box-m bg-accent-soft px-3 py-2.5">
            <span className="size-2.5 animate-pulse rounded-full bg-accent" aria-hidden />
            <span className="flex-1 font-semibold tabular-nums" role="timer">
              Запись · 0:{String(recording).padStart(2, "0")}
            </span>
            <Button size="s" appearance="outline" onClick={() => setRecording(null)}>
              Отмена
            </Button>
            <Button
              size="s"
              onClick={() => {
                push({ from: "me", voice: `0:${String(Math.max(1, recording)).padStart(2, "0")}` });
                setRecording(null);
              }}
            >
              Отправить
            </Button>
          </div>
        ) : (
          <div className="flex items-end gap-2">
            <label className="min-w-0 flex-1">
              <span className="sr-only">Сообщение наставнику</span>
              <textarea
                value={text}
                onChange={(e) => setText(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    e.currentTarget.form?.requestSubmit();
                  }
                }}
                rows={1}
                placeholder="Сообщение…"
                className="max-h-32 min-h-11 w-full resize-none rounded-box-m border border-line-strong bg-surface-page px-3 py-2.5 focus:border-accent"
              />
            </label>
            <button type="button" aria-label="Приложить фото" className="grid size-11 shrink-0 place-items-center rounded-full text-ink-muted hover:bg-surface-subtle">
              <Icon name="gallery" size="2xs" className="text-current" />
            </button>
            {text.trim() ? (
              <button type="submit" aria-label="Отправить" className="grid size-11 shrink-0 place-items-center rounded-full bg-accent text-accent-on">
                <Icon name="send-square" variant="bold" size="2xs" className="text-current" />
              </button>
            ) : (
              <button
                type="button"
                aria-label="Записать голосовое"
                onClick={() => setRecording(0)}
                className="grid size-11 shrink-0 place-items-center rounded-full bg-accent text-accent-on"
              >
                <Icon name="microphone-3" variant="bold" size="2xs" className="text-current" />
              </button>
            )}
          </div>
        )}
        <p className="flex items-start gap-1.5 text-[12px] text-ink-muted">
          Вопрос по проверке ДЗ — тоже сюда: наставник передаст проверяющему. Проверяющий анонимен и в личку не пишет.
        </p>
      </form>
    </section>
  );
}

// --- Индивидуальный план -----------------------------------------------------

function IndividualPlan({ subject }: { subject: Subject }) {
  const { statusOf } = useProgress();
  const plan = INDIVIDUAL_PLAN[subject];
  const rows = plan.items.map((p) => ({ ...p, found: findItem(subject, p.id)! }));
  const done = rows.filter((r) => ["done", "review"].includes(statusOf(r.found.item))).length;

  return (
    <section className="rounded-box-l border border-line bg-surface-raised p-4">
      <p className="enl-display text-sm text-ink-accent">план от наставника</p>
      <h2 className="font-bold">{plan.note}</h2>
      <p className="mt-1 text-sm text-ink-muted">
        Сделано <span className="enl-marker font-bold text-ink">{done} из {rows.length}</span> · эти пункты есть и в задачах недели
      </p>
      <ol className="mt-3 flex flex-col gap-2">
        {rows.map(({ id, why, due, found }, i) => {
          const status = statusOf(found.item);
          const finished = status === "done" || status === "review";
          const href = WORKS[id] ? `/${subject}/work/${id}${finished ? "/result" : ""}` : `/${subject}/lesson/${found.lesson.id}`;
          return (
            <li key={id}>
              <Link href={href} className="flex items-start gap-3 rounded-box-m border border-line p-3 no-underline hover:border-line-strong">
                <span
                  className={cn(
                    "grid size-7 shrink-0 place-items-center rounded-full text-sm font-extrabold",
                    finished ? "bg-accent text-accent-on" : "bg-surface-subject",
                  )}
                >
                  {finished ? <Icon name="check-circle" variant="bold" size="min" /> : i + 1}
                </span>
                <span className="min-w-0 flex-1">
                  <span className={cn("block font-semibold leading-snug", finished && "enl-marker")}>{found.item.title}</span>
                  <span className="block text-[13px] text-ink-muted">{why}</span>
                  <span className={cn("block text-[12px] font-semibold", status === "overdue" ? "text-ink-accent" : "text-ink-muted")}>
                    {finished ? (status === "review" ? "сдано, на проверке" : "сделано") : due}
                  </span>
                </span>
              </Link>
            </li>
          );
        })}
      </ol>
    </section>
  );
}

// --- Зачёты --------------------------------------------------------------------

function Exams({ subject }: { subject: Subject }) {
  const { exam, cancelExam, examResult } = useBookings();
  if (!hasExams(subject)) {
    return (
      <section className="rounded-box-l border border-line bg-surface-raised p-4">
        <h2 className="font-bold">Зачёты</h2>
        <p className="mt-1 text-sm text-ink-muted">Зачёты с наставником — на тарифах «С инструктором» и VIP. На вашем тарифе их нет.</p>
      </section>
    );
  }
  const when = exam && dayLabel(exam.date);
  const past = [
    ...(examResult ? [{ date: examResult.date, topic: "Политика", ticket: `Билет №${examResult.ticket}`, passed: examResult.passed, feedback: examResult.feedback }] : []),
    ...PAST_EXAMS[subject],
  ];

  return (
    <section className="rounded-box-l border border-line bg-surface-raised p-4">
      <h2 className="font-bold">Зачёты</h2>
      {exam && when ? (
        <div className="mt-3 rounded-box-m bg-surface-subject p-3">
          <p className="font-semibold">
            {when.weekday}, {when.day} {when.month}, {exam.time} · записаны
          </p>
          <p className="text-[13px] text-ink-muted">Тема «Политика», билеты 1–{TICKETS[TICKETS.length - 1].number} · 20 минут</p>
          <div className="mt-3 flex flex-wrap gap-2">
            <ButtonLink href={`/${subject}/exam`} size="s">
              Войти в зачёт
            </ButtonLink>
            <ButtonLink href={`/${subject}/calendar`} appearance="outline" size="s">
              Перенести
            </ButtonLink>
            <Button appearance="outline" size="s" onClick={cancelExam}>
              Отменить
            </Button>
          </div>
        </div>
      ) : !examResult ? (
        <div className="mt-3">
          <p className="text-sm text-ink-muted">Зачёт за октябрь ещё не сдан.</p>
          <ButtonLink href={`/${subject}/calendar`} size="s" className="mt-2">
            Записаться на зачёт
          </ButtonLink>
        </div>
      ) : null}

      <ol className="mt-4 flex flex-col gap-3">
        {past.map((x) => (
          <li key={`${x.date}-${x.ticket}`} className="rounded-box-m border border-line p-3">
            <p className="flex items-center justify-between gap-2 text-sm">
              <span className="font-semibold">
                {x.date} · {x.topic}, {x.ticket.toLowerCase()}
              </span>
              <span className={cn("rounded-full px-2 py-0.5 text-[11px] font-bold", x.passed ? "bg-surface-lime text-ink-olive" : "bg-accent-soft text-ink-accent")}>
                {x.passed ? "зачтено" : "не зачтено"}
              </span>
            </p>
            <p className="enl-grid-paper mt-2 rounded-box-m border border-line p-2.5 text-[13px] leading-relaxed">{x.feedback}</p>
          </li>
        ))}
      </ol>
    </section>
  );
}
