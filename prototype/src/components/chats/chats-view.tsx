"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { hasExams } from "@/components/calendar/calendar-view";
import { Button } from "@/components/ui/box";
import { Icon } from "@/components/ui/icon";
import { useDistribution } from "@/lib/distribution";
import { cn } from "@/lib/utils";
import { COURSES, type Subject } from "@mocks/course";
import { CHATS, type Chat, type ChatMessage } from "@mocks/chats";

const KEY = "enl-prototype-chats";

/** На «Флае» наставник только в общем чате — мини-группы нет. */
const hasGroup = (subject: Subject) => COURSES[subject].tariff !== "Флай";

/**
 * B19 — чаты: мини-группа с наставником и общий чат курса с дежурным.
 * Телефон: список → переписка. Десктоп: список слева, переписка справа.
 */
export function ChatsView({ subject }: { subject: Subject }) {
  const { isWaiting } = useDistribution();
  const chats = CHATS[subject].filter((c) => c.kind === "course" || hasGroup(subject));
  const [openId, setOpenId] = useState<string | null>(null);
  const [sent, setSent] = useState<Record<string, ChatMessage[]>>({});

  useEffect(() => {
    try {
      const saved = window.localStorage.getItem(KEY);
      if (saved) setSent(JSON.parse(saved));
    } catch {
      // без сохранения
    }
  }, []);

  const send = (chatId: string, text: string) => {
    const next = {
      ...sent,
      [chatId]: [...(sent[chatId] ?? []), { id: `me-${Date.now()}`, author: "Вы", text, at: "сейчас", mine: true }],
    };
    setSent(next);
    try {
      window.localStorage.setItem(KEY, JSON.stringify(next));
    } catch {
      // без сохранения
    }
  };

  // Мини-группа появляется вместе с наставником.
  const locked = (c: Chat) => c.kind === "group" && isWaiting(subject);
  const open = chats.find((c) => c.id === openId);
  const desktopOpen = open ?? chats.find((c) => !locked(c));

  return (
    <div className="mx-auto flex max-w-5xl flex-col gap-4">
      <header className={cn(open && "hidden lg:block")}>
        <h1 className="enl-display text-[28px] leading-tight sm:text-[34px]">чаты</h1>
        <p className="text-sm text-ink-muted">Вопросы по курсу, поддержка наставника и группы.</p>
      </header>

      <div className="grid gap-4 lg:grid-cols-[300px_minmax(0,1fr)]">
        <ul className={cn("flex min-w-0 flex-col gap-2", open && "hidden lg:flex")}>
          {chats.map((c) => (
            <li key={c.id}>
              <button
                type="button"
                disabled={locked(c)}
                onClick={() => setOpenId(c.id)}
                aria-current={desktopOpen?.id === c.id ? "true" : undefined}
                className={cn(
                  "flex w-full items-center gap-3 rounded-box-l border bg-surface-raised p-3 text-left transition-colors",
                  desktopOpen?.id === c.id ? "lg:border-accent-border" : "border-line",
                  locked(c) ? "opacity-70" : "hover:border-accent-border",
                )}
              >
                <span className="min-w-0 flex-1">
                  <span className="block truncate font-semibold">{c.title}</span>
                  <span className="block truncate text-[13px] text-ink-muted">
                    {locked(c) ? "Появится, когда назначат наставника" : lastLine(c, sent[c.id])}
                  </span>
                </span>
                {locked(c) && <Icon name="lock-keyhole" size="xs" className="shrink-0" />}
              </button>
            </li>
          ))}
          {!hasGroup(subject) && (
            <li className="rounded-box-m bg-surface-subtle p-3 text-[13px] text-ink-muted">
              На тарифе «{COURSES[subject].tariff}» наставник — в общем чате курса, мини-группы нет.
            </li>
          )}
          <li className="mt-2 rounded-box-m border border-dashed border-line p-3 text-[12px] text-ink-muted">
            Прототип: сейчас чаты ЕНЛ в Telegram, переносить ли их в платформу — не решено. Здесь — как это выглядело бы внутри.
          </li>
        </ul>

        {desktopOpen && (
          <div className={cn("min-w-0", !open && "hidden lg:block")}>
            <Conversation
              key={desktopOpen.id}
              subject={subject}
              chat={desktopOpen}
              extra={sent[desktopOpen.id] ?? []}
              onBack={() => setOpenId(null)}
              onSend={(text) => send(desktopOpen.id, text)}
            />
          </div>
        )}
      </div>
    </div>
  );
}

function lastLine(c: Chat, extra?: ChatMessage[]) {
  const last = [...c.messages, ...(extra ?? [])].at(-1);
  return last ? `${last.author}: ${last.text}` : c.about;
}

function Conversation({
  subject,
  chat,
  extra,
  onBack,
  onSend,
}: {
  subject: Subject;
  chat: Chat;
  extra: ChatMessage[];
  onBack: () => void;
  onSend: (text: string) => void;
}) {
  const [text, setText] = useState("");
  const [reported, setReported] = useState<string[]>([]);
  const list = useRef<HTMLOListElement>(null);
  const messages = [...chat.messages, ...extra];

  useEffect(() => {
    list.current?.scrollTo({ top: list.current.scrollHeight });
  }, [messages.length]);

  return (
    <section className="flex h-[calc(100dvh-210px)] min-h-[420px] flex-col overflow-hidden rounded-box-l border border-line bg-surface-raised lg:h-[600px]">
      <header className="flex items-center gap-2 border-b border-line-subtle px-3 py-2.5">
        <button type="button" onClick={onBack} aria-label="К списку чатов" className="grid size-9 place-items-center rounded-full hover:bg-surface-subtle lg:hidden">
          <Icon name="alt-arrow-left" size="xs" className="text-current" />
        </button>
        <span className="min-w-0">
          <span className="block truncate font-bold">{chat.title}</span>
          <span className="block truncate text-[12px] text-ink-muted">{chat.members}</span>
        </span>
      </header>
      {chat.pinned && (
        <p className="flex items-start gap-2 border-b border-line-subtle bg-surface-marker px-4 py-2 text-[13px]">
          <Icon name="paperclip" size="min" className="mt-0.5 shrink-0 text-current" />
          {chat.pinned}
        </p>
      )}
      <ol ref={list} className="flex flex-1 flex-col gap-3 overflow-y-auto p-4">
        {messages.map((m) => (
          <li key={m.id} className={cn("flex max-w-[85%] flex-col", m.mine ? "self-end items-end" : "self-start")}>
            {!m.mine && (
              <span className="mb-0.5 text-[12px] font-bold">
                {m.author}
                {m.role && (
                  <span className="ml-1 rounded-full bg-accent-soft px-1.5 font-semibold text-ink-accent">
                    {m.role === "mentor" ? "наставник" : "дежурный"}
                  </span>
                )}
              </span>
            )}
            <span
              className={cn(
                "rounded-box-l px-3 py-2 text-[15px] leading-snug",
                m.mine ? "rounded-br-box-xs bg-accent text-accent-on" : "rounded-bl-box-xs bg-surface-subtle",
              )}
            >
              {m.text}
            </span>
            <span className="mt-0.5 flex gap-2 text-[11px] text-ink-muted">
              {m.at}
              {!m.mine && !m.role && (
                <button
                  type="button"
                  disabled={reported.includes(m.id)}
                  onClick={() => setReported([...reported, m.id])}
                  className="font-semibold underline-offset-2 hover:underline"
                >
                  {reported.includes(m.id) ? "отправлено дежурному" : "пожаловаться"}
                </button>
              )}
            </span>
          </li>
        ))}
      </ol>
      <form
        className="flex gap-2 border-t border-line-subtle p-2"
        onSubmit={(e) => {
          e.preventDefault();
          if (!text.trim()) return;
          onSend(text.trim());
          setText("");
        }}
      >
        <input
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Сообщение…"
          aria-label="Сообщение"
          className="min-w-0 flex-1 rounded-full border border-line-strong bg-surface-page px-4 py-2.5 text-[15px] focus:border-accent"
        />
        <Button type="submit" disabled={!text.trim()} aria-label="Отправить">
          <Icon name="send-square" size="xs" className="text-current" />
        </Button>
      </form>
      {chat.kind === "course" && (
        <p className="border-t border-line-subtle px-4 py-1.5 text-[11px] text-ink-muted">
          Личное — наставнику:{" "}
          <Link href={`/${subject}/mentor`} className="font-semibold text-ink-accent">
            сообщения
          </Link>
          {hasExams(subject) ? ". Вопросы по проверке ДЗ — тоже через наставника." : "."}
        </p>
      )}
    </section>
  );
}
