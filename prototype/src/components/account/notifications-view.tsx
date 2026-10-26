"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Icon } from "@/components/ui/icon";
import { useNotifications } from "@/lib/notifications";
import { cn } from "@/lib/utils";
import { SUBJECTS, type Subject } from "@mocks/course";
import { TODAY_ISO } from "@mocks/meetings";
import type { Notice } from "@mocks/notifications";

const YESTERDAY_ISO = "2026-10-24";

function dayOf(at: string) {
  const day = at.slice(0, 10);
  if (day === TODAY_ISO) return "сегодня";
  if (day === YESTERDAY_ISO) return "вчера";
  return day > TODAY_ISO ? "по демо-сценарию оплаты" : "раньше";
}

function timeOf(at: string) {
  const [, m, d] = at.slice(0, 10).split("-");
  const time = at.slice(11, 16);
  const day = at.slice(0, 10);
  return day === TODAY_ISO || day === YESTERDAY_ISO ? time : `${d}.${m}`;
}

/**
 * A5 — уведомления. Новые выделены, пока ученик на экране; прочитанными они
 * становятся сразу при открытии (US 10.03), поэтому счётчик у колокольчика гаснет.
 */
export function NotificationsView({ subject }: { subject: Subject }) {
  const { notices, isRead, markRead, ready } = useNotifications();
  // Что было новым на момент входа — держим выделенным до ухода с экрана.
  const [fresh, setFresh] = useState<string[] | null>(null);
  const [onlyNew, setOnlyNew] = useState(false);
  const [mine, setMine] = useState(false);

  useEffect(() => {
    if (!ready || fresh !== null) return;
    const unread = notices.filter((n) => !isRead(n)).map((n) => n.id);
    setFresh(unread);
    markRead(unread);
  }, [ready, fresh, notices, isRead, markRead]);

  // Уведомление, пришедшее, пока экран открыт (например, просрочка из демо), тоже новое.
  useEffect(() => {
    if (fresh === null) return;
    const late = notices.filter((n) => !isRead(n) && !fresh.includes(n.id)).map((n) => n.id);
    if (!late.length) return;
    setFresh([...fresh, ...late]);
    markRead(late);
  }, [fresh, notices, isRead, markRead]);

  const isFresh = (n: Notice) => fresh?.includes(n.id) ?? false;
  const shown = notices.filter((n) => (!onlyNew || isFresh(n)) && (!mine || n.subject === subject));
  const days = Array.from(new Set(shown.map((n) => dayOf(n.at))));
  const newCount = fresh?.length ?? 0;

  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-5">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="enl-display text-[28px] leading-tight sm:text-[34px]">уведомления</h1>
          <p className="text-sm text-ink-muted">
            {newCount ? `Новых: ${newCount}. ` : "Новых нет. "}
            Открыли список — они прочитаны, отмечать не нужно.
          </p>
        </div>
        <Link href={`/${subject}/profile#notifications`} className="text-sm font-semibold text-ink-accent">
          Куда присылать
        </Link>
      </header>

      <div role="group" aria-label="Фильтр" className="flex flex-wrap gap-2">
        {[
          { label: "только новые", on: onlyNew, set: setOnlyNew },
          { label: `только ${SUBJECTS[subject].title.toLowerCase()}`, on: mine, set: setMine },
        ].map((f) => (
          <button
            key={f.label}
            type="button"
            aria-pressed={f.on}
            onClick={() => f.set(!f.on)}
            className={cn(
              "rounded-full border px-3.5 py-1.5 text-sm font-semibold transition-colors",
              f.on ? "border-ink bg-ink text-surface-page" : "border-line bg-surface-raised text-ink-muted",
            )}
          >
            {f.label}
          </button>
        ))}
      </div>

      {shown.length === 0 ? (
        <p className="rounded-box-m bg-surface-subtle p-4 text-sm text-ink-muted">
          {onlyNew ? "Новых уведомлений нет — всё прочитано." : "Здесь пока пусто."}
        </p>
      ) : (
        days.map((day) => (
          <section key={day} className="flex flex-col gap-2">
            <h2 className="text-[13px] font-bold uppercase tracking-wide text-ink-muted">{day}</h2>
            <ul className="divide-y divide-line-subtle overflow-hidden rounded-box-l border border-line bg-surface-raised">
              {shown
                .filter((n) => dayOf(n.at) === day)
                .map((n) => (
                  <NoticeRow key={n.id} notice={n} fresh={isFresh(n)} />
                ))}
            </ul>
          </section>
        ))
      )}
    </div>
  );
}

function NoticeRow({ notice: n, fresh }: { notice: Notice; fresh: boolean }) {
  const body = (
    <>
      <span className="min-w-0 flex-1">
        <span className="flex items-center gap-2 text-[12px] text-ink-muted">
          <span>{SUBJECTS[n.subject].title.toLowerCase()}</span>
          <span>· {timeOf(n.at)}</span>
          {fresh && <span className="rounded-full bg-surface-marker px-1.5 font-bold text-ink">новое</span>}
        </span>
        <span className={cn("mt-0.5 block leading-snug", fresh ? "font-bold" : "font-semibold")}>{n.title}</span>
        {n.text && <span className="mt-0.5 block text-sm text-ink-muted">{n.text}</span>}
        {n.action && <span className="mt-1.5 inline-block text-sm font-semibold text-ink-accent">{n.action}</span>}
      </span>
      {n.href && <Icon name="alt-arrow-right" size="min" className="mt-3 shrink-0" />}
    </>
  );
  const row = "flex items-start gap-3 p-4";
  return (
    <li>
      {n.href ? (
        <Link href={`/${n.subject}${n.href}`} className={cn(row, "text-ink no-underline transition-colors hover:bg-surface-subtle")}>
          {body}
        </Link>
      ) : (
        <div className={row}>{body}</div>
      )}
    </li>
  );
}
