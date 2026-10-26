"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/box";
import { Icon } from "@/components/ui/icon";
import { cn } from "@/lib/utils";
import type { Subject } from "@mocks/course";

const KEY = "enl-prototype-support";

// Темы — из того, с чем сейчас приходят в поддержку ЕНЛ: доступ, оплата, смена
// тарифа, переводы, возвраты, восстановления (Basecamp, аудит GetCourse).
const TOPICS = ["не открывается урок или видео", "доступ и оплата", "сменить тариф", "перевод или возврат", "другое"];

const FAQ: { q: string; a: string; href?: { label: string; to: string } }[] = [
  {
    q: "Не открывается видео",
    a: "Обновите страницу и проверьте интернет. Не помогло — напишите нам ниже и приложите скриншот: так быстрее.",
  },
  {
    q: "Не пришло письмо",
    a: "Проверьте папку «Спам» и почту в профиле — письма уходят на неё.",
    href: { label: "Профиль", to: "/profile" },
  },
  {
    q: "Как сменить тариф",
    a: "Напишите нам с темой «сменить тариф» — подскажем, что изменится и сколько это стоит.",
  },
  {
    q: "Перевод на другой курс или возврат",
    a: "Только через поддержку: выберите тему «перевод или возврат» и опишите ситуацию.",
  },
  {
    q: "Вопрос по заданию или проверке",
    a: "Это к наставнику: он ответит сам или передаст вопрос проверяющему.",
    href: { label: "Наставник", to: "/mentor" },
  },
  {
    q: "Оплата следующего месяца",
    a: "Всё на странице оплаты: период, сумма, ссылка для родителя.",
    href: { label: "Оплата", to: "/payment" },
  },
];

interface Ticket {
  id: string;
  topic: string;
  text: string;
  file?: string;
  at: string;
}

/**
 * B23 — техподдержка (US 10.04). Сначала частые вопросы, если ответа нет — короткая
 * форма с темой и скриншотом. Срок ответа виден заранее.
 */
export function SupportView({ subject }: { subject: Subject }) {
  const [open, setOpen] = useState<number | null>(null);
  const [topic, setTopic] = useState<string | null>(null);
  const [text, setText] = useState("");
  const [file, setFile] = useState<string | null>(null);
  const [tickets, setTickets] = useState<Ticket[]>([]);

  useEffect(() => {
    try {
      const saved = window.localStorage.getItem(KEY);
      if (saved) setTickets(JSON.parse(saved));
    } catch {
      // без сохранения
    }
  }, []);

  const submit = () => {
    const next = [{ id: `t${Date.now()}`, topic: topic!, text: text.trim(), file: file ?? undefined, at: "сегодня" }, ...tickets];
    setTickets(next);
    setTopic(null);
    setText("");
    setFile(null);
    try {
      window.localStorage.setItem(KEY, JSON.stringify(next));
    } catch {
      // без сохранения
    }
  };

  return (
    <div className="mx-auto flex max-w-2xl flex-col gap-5">
      <header>
        <h1 className="enl-display text-[28px] leading-tight sm:text-[34px]">техподдержка</h1>
        <p className="text-sm text-ink-muted">08:00–21:00 по Москве · отвечаем в течение 2 часов</p>
      </header>

      {tickets.length > 0 && (
        <section className="flex flex-col gap-2">
          <h2 className="font-bold">Мои обращения</h2>
          <ul className="flex flex-col gap-2">
            {tickets.map((t) => (
              <li key={t.id} className="rounded-box-l border border-line bg-surface-raised p-3">
                <p className="flex items-center gap-2 text-[13px] font-semibold text-ink-accent">
                  <Icon name="hourglass" size="min" /> ждёт ответа · {t.topic}
                </p>
                <p className="mt-1 text-sm">{t.text}</p>
                {t.file && <p className="mt-1 text-[12px] text-ink-muted">Скриншот: {t.file}</p>}
                <p className="mt-1 text-[12px] text-ink-muted">Ответ придёт уведомлением и сюда — в течение 2 часов в рабочее время.</p>
              </li>
            ))}
          </ul>
        </section>
      )}

      <section className="flex flex-col gap-2">
        <h2 className="font-bold">Частые вопросы</h2>
        <ul className="divide-y divide-line-subtle overflow-hidden rounded-box-l border border-line bg-surface-raised">
          {FAQ.map((f, i) => (
            <li key={f.q}>
              <button
                type="button"
                aria-expanded={open === i}
                onClick={() => setOpen(open === i ? null : i)}
                className="flex w-full items-center gap-3 px-4 py-3 text-left font-semibold hover:bg-surface-subtle"
              >
                <span className="flex-1">{f.q}</span>
                <Icon name={open === i ? "alt-arrow-up" : "alt-arrow-down"} size="min" className="text-ink-subtle" />
              </button>
              {open === i && (
                <p className="px-4 pb-3 text-sm leading-relaxed text-ink-muted">
                  {f.a}
                  {f.href && (
                    <>
                      {" "}
                      <Link href={`/${subject}${f.href.to}`} className="font-semibold text-ink-accent">
                        {f.href.label}
                      </Link>
                    </>
                  )}
                </p>
              )}
            </li>
          ))}
        </ul>
      </section>

      <section className="flex flex-col gap-3 rounded-box-l border border-line bg-surface-raised p-4">
        <h2 className="font-bold">Не нашли ответ — напишите</h2>
        <div role="radiogroup" aria-label="Тема" className="flex flex-wrap gap-2">
          {TOPICS.map((t) => (
            <button
              key={t}
              type="button"
              role="radio"
              aria-checked={topic === t}
              onClick={() => setTopic(t)}
              className={cn(
                "rounded-full border-2 px-3.5 py-1.5 text-sm font-semibold transition-colors",
                topic === t ? "border-accent bg-accent-soft" : "border-line bg-surface-page",
              )}
            >
              {t}
            </button>
          ))}
        </div>
        <label className="block">
          <span className="sr-only">Опишите проблему</span>
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            rows={4}
            placeholder="Что случилось и где: урок, страница, что нажимали"
            className="w-full rounded-box-m border border-line-strong bg-surface-page p-3 leading-relaxed focus:border-accent"
          />
        </label>
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
          <label className="flex cursor-pointer items-center gap-2 text-sm font-semibold text-ink-accent">
            <Icon name={file ? "check-circle" : "gallery"} variant={file ? "bold" : "linear"} size="xs" />
            {file ?? "Приложить скриншот"}
            <input
              type="file"
              accept="image/*"
              className="sr-only"
              onChange={(e) => setFile(e.target.files?.[0]?.name ?? null)}
            />
          </label>
          <Button size="l" className="sm:ml-auto" disabled={!topic || !text.trim()} onClick={submit}>
            Отправить
          </Button>
        </div>
      </section>
    </div>
  );
}
