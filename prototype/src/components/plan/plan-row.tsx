"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Icon, type IconName } from "@/components/ui/icon";
import { useDistribution } from "@/lib/distribution";
import { useProgress } from "@/lib/progress";
import { useWorks } from "@/lib/works";
import { cn } from "@/lib/utils";
import type { ItemKind, PlanItem } from "@mocks/course";
import { trainingByPlanItem } from "@mocks/trainings";
import { WORKS } from "@mocks/works";

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
export function PlanRow({ item, href: lessonHref, now }: { item: PlanItem; href?: string; now?: boolean }) {
  const { statusOf, toggle } = useProgress();
  const { lockedByDistribution } = useDistribution();
  const { get } = useWorks();
  const subject = usePathname().split("/")[1];
  const status = statusOf(item);
  const kind = KIND[item.kind];
  const done = status === "done";
  const locked = status === "locked";
  const overdue = status === "overdue";
  const review = status === "review";
  const waiting = locked && lockedByDistribution(item);
  // Тест и ДЗ ведут прямо в работу: несданное — решать, сданное — к результату.
  const attempts = WORKS[item.id] ? get(item.id).attempts : [];
  const last = attempts[attempts.length - 1];
  const lastScore = done && last ? `${last.score} из ${last.max}` : undefined;
  const training = trainingByPlanItem(item.id);
  const href = WORKS[item.id]
    ? `/${subject}/work/${item.id}${done || review ? "/result" : ""}`
    : training
      ? `/${subject}/training/${training.id}`
      : lessonHref;

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
      data-status={overdue ? "warning" : done ? "positive" : undefined}
      className="grid size-7 shrink-0 place-items-center rounded-full"
      title={done ? "Сделано — отмечено автоматически" : undefined}
    >
      {done || locked || overdue || review ? (
        <Icon
          name={done ? "check-circle" : locked ? "lock-keyhole" : overdue ? "danger-circle" : "hourglass"}
          variant={done ? "bold" : "linear"}
          size="2xs"
          className={done || overdue ? "text-status-ink" : undefined}
        />
      ) : (
        <span className="size-4 rounded-full border-2 border-line-strong" aria-hidden />
      )}
    </span>
  );

  const body = (
    <span className="min-w-0 flex-1">
      <span className="flex flex-wrap items-center gap-x-2 gap-y-1">
        <span className={cn("font-semibold leading-snug", locked && "text-ink-muted")}>
          {item.title}
        </span>
        {now && (
          <span className="rounded-full bg-accent-soft px-2 py-0.5 text-[11px] font-semibold text-ink">
            прямо сейчас!
          </span>
        )}
      </span>
      <span className="mt-0.5 flex flex-wrap items-center gap-x-2 text-[13px] text-ink-muted">
        <span>{kind.label}</span>
        {review ? (
          <span className="font-semibold text-ink-accent">· на проверке у куратора</span>
        ) : (
          (lastScore ?? item.meta) && <span>· {lastScore ?? item.meta}</span>
        )}
        {waiting ? (
          <span className="font-semibold text-ink-accent">· откроется, когда назначат наставника</span>
        ) : (
          item.due && !done && !review && <span data-status={overdue ? "warning" : undefined} className={cn(overdue && "font-semibold text-status-ink")}>· {item.due}</span>
        )}
        {item.manual && !done && <span>· отметьте сами</span>}
      </span>
    </span>
  );

  // «на 100» — про допы к урокам. Встречи по записи и так по желанию.
  const extra = !item.required && item.kind !== "meeting" && (
    <span className="shrink-0 whitespace-nowrap rounded-full bg-surface-subtle px-2 py-0.5 text-[11px] font-semibold text-ink-muted">на 100</span>
  );

  const row = cn(
    "flex items-center gap-3 rounded-box-m px-3 py-3 text-left",
    now && "bg-surface-subtle",
  );

  if (href && !locked && !item.manual) {
    return (
      <li>
        <Link href={href} className={cn(row, "no-underline transition-colors hover:bg-surface-subtle")}>
          {mark}
          {body}
          {extra}
          <Icon name="alt-arrow-right" size="min" className="shrink-0" />
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
