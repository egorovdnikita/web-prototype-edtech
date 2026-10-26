"use client";

import Link from "next/link";
import { Icon, type IconName } from "@/components/ui/icon";
import { useNotifications } from "@/lib/notifications";
import { useProgress } from "@/lib/progress";
import { plural } from "@/lib/utils";
import type { Subject } from "@mocks/course";

// «Ещё»: всё, что не входит в учебный цикл. Оплата — здесь, а не в главном меню.
const ROWS: { id: string; title: string; text: string; icon: IconName; href?: string }[] = [
  { id: "mentor", title: "Наставник", text: "Сообщения, индивидуальный план, зачёты", icon: "chat-round-dots", href: "/mentor" },
  { id: "calendar", title: "Календарь", text: "Вебинары, зачёты, запись на продлёнки и коворкинги", icon: "calendar", href: "/calendar" },
  { id: "payment", title: "Оплата", text: "Оплаченный период, следующий месяц, история платежей", icon: "wallet", href: "/payment" },
  { id: "notifications", title: "Уведомления", text: "Уроки, дедлайны, проверка, оплата", icon: "bell", href: "/notifications" },
  { id: "profile", title: "Профиль", text: "Имя, часовой пояс, контакты, отчёт родителю, куда присылать уведомления", icon: "user-circle", href: "/profile" },
  // Как в текущем GetCourse: ВКонтакте, 08:00–21:00 по Москве, ответ до 2 часов.
  { id: "support", title: "Техподдержка", text: "08:00–21:00 по Москве, ответим в течение 2 часов", icon: "info-circle" },
];

export default function MorePage({ params }: { params: { subject: Subject } }) {
  const { reset } = useProgress();
  const { unread } = useNotifications();
  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-5">
      <h1 className="enl-display text-[28px] leading-tight sm:text-[34px]">ещё</h1>
      <ul className="divide-y divide-line-subtle overflow-hidden rounded-box-l border border-line bg-surface-raised shadow-raised">
        {ROWS.map((r) => (
          <li key={r.id} id={r.id}>
            <Row
              row={r.id === "notifications" && unread ? { ...r, text: `${unread} ${plural(unread, ["новое", "новых", "новых"])}` } : r}
              subject={params.subject}
            />
          </li>
        ))}
      </ul>
      <button type="button" onClick={reset} className="self-start text-sm font-semibold text-ink-muted underline">
        Сбросить отметки прототипа
      </button>
    </div>
  );
}

function Row({ row, subject }: { row: (typeof ROWS)[number]; subject: Subject }) {
  const body = (
    <>
      <span className="grid size-10 shrink-0 place-items-center rounded-box-m bg-surface-subject">
        <Icon name={row.icon} size="2xs" />
      </span>
      <span className="min-w-0 flex-1">
        <span className="block font-semibold">{row.title}</span>
        <span className="block text-[13px] text-ink-muted">{row.text}</span>
      </span>
      <Icon name="alt-arrow-right" size="min" className="text-ink-subtle" />
    </>
  );
  const className = "flex w-full items-center gap-3 p-4 text-left no-underline hover:bg-surface-subtle";
  return row.href ? (
    <Link href={`/${subject}${row.href}`} className={className}>
      {body}
    </Link>
  ) : (
    <button type="button" className={className}>
      {body}
    </button>
  );
}
