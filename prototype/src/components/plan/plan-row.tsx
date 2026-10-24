"use client";

import Link from "next/link";
import { Icon, type IconName } from "@/components/ui/icon";
import { useProgress } from "@/lib/progress";
import { cn } from "@/lib/utils";
import type { ItemKind, PlanItem } from "@mocks/course";

export const KIND: Record<ItemKind, { label: string; icon: IconName; action: string }> = {
  video: { label: "видеоурок", icon: "play-circle", action: "Смотреть" },
  snack: { label: "урок-снек", icon: "play-circle", action: "Смотреть" },
  notes: { label: "конспект", icon: "pen-new-square", action: "" },
  test: { label: "тест", icon: "checklist-minimalistic", action: "Решать" },
  homework: { label: "домашнее задание", icon: "document-text", action: "Решать" },
  training: { label: "тренировка", icon: "magic-stick-3", action: "Начать" },
  webinar: { label: "вебинар", icon: "videocamera-record", action: "Войти" },
  meeting: { label: "встреча", icon: "calendar", action: "Войти" },
};

/**
 * Пункт планера. Отметка ставится сама, когда работа сдана или видео
 * досмотрено; руками отмечаются только офлайн-пункты (конспект).
 * Допы «на 100» выглядят как возможность, а не долг: без красного и без срока.
 */
export function PlanRow({ item, href, now }: { item: PlanItem; href?: string; now?: boolean }) {
  const { statusOf, toggle } = useProgress();
  const status = statusOf(item);
  const kind = KIND[item.kind];
  const done = status === "done";
  const locked = status === "locked";
  const overdue = status === "overdue";

  const mark = item.manual ? (
    <button
      type="button"
      onClick={() => toggle(item)}
      aria-pressed={done}
      aria-label={done ? `Снять отметку: ${item.title}` : `Отметить: ${item.title}`}
      className={cn(
        "grid size-7 shrink-0 place-items-center rounded-box-xs border-2 transition-colors",
        done ? "border-accent bg-accent text-accent-on" : "border-line-strong bg-surface-raised hover:border-accent",
      )}
    >
      {done && <Icon name="check-circle" variant="bold" size="min" />}
    </button>
  ) : (
    <span
      className={cn(
        "grid size-7 shrink-0 place-items-center rounded-full",
        done && "text-ink-accent",
        locked && "text-ink-subtle",
        overdue && "text-ink-accent",
        status === "todo" && "text-ink-muted",
      )}
      title={done ? "Сделано — отмечено автоматически" : undefined}
    >
      <Icon
        name={done ? "check-circle" : locked ? "lock-keyhole" : overdue ? "danger-circle" : kind.icon}
        variant={done ? "bold" : "linear"}
        size="2xs"
      />
    </span>
  );

  const body = (
    <span className="min-w-0 flex-1">
      <span className="flex flex-wrap items-center gap-x-2 gap-y-1">
        <span className={cn("font-semibold leading-snug", done && "enl-marker", locked && "text-ink-muted")}>
          {item.title}
        </span>
        {now && (
          <span className="rotate-[-2deg] rounded-box-s bg-surface-marker px-1.5 py-0.5 text-[11px] font-extrabold uppercase tracking-wide text-ink">
            прямо сейчас!
          </span>
        )}
      </span>
      <span className="mt-0.5 flex flex-wrap items-center gap-x-2 text-[13px] text-ink-muted">
        <span>{kind.label}</span>
        {item.meta && <span>· {item.meta}</span>}
        {item.due && <span className={cn(overdue && "font-semibold text-ink-accent")}>· {item.due}</span>}
        {item.manual && !done && <span>· отметьте сами</span>}
      </span>
    </span>
  );

  const extra = !item.required && (
    <span className="shrink-0 whitespace-nowrap rounded-full bg-surface-lime px-2 py-0.5 text-[11px] font-bold text-ink-olive">на 100</span>
  );

  const row = cn(
    "flex items-center gap-3 rounded-box-m px-3 py-3 text-left",
    now && "bg-surface-subject",
    overdue && !now && "bg-accent-soft",
  );

  if (href && !locked && !item.manual) {
    return (
      <li>
        <Link href={href} className={cn(row, "no-underline transition-colors hover:bg-surface-subtle")}>
          {mark}
          {body}
          {extra}
          <Icon name="alt-arrow-right" size="min" className="shrink-0 text-ink-subtle" />
        </Link>
      </li>
    );
  }
  return (
    <li className={row}>
      {mark}
      {body}
      {extra}
    </li>
  );
}
