"use client";

import { Icon, type IconName } from "@/components/ui/icon";
import { useProgress } from "@/lib/progress";
import { MENTOR, type Subject } from "@mocks/course";

// «Ещё»: всё, что не входит в учебный цикл. Оплата — здесь, а не в главном меню.
const ROWS: { id: string; title: string; text: string; icon: IconName }[] = [
  { id: "mentor", title: `Наставник — ${MENTOR.name}`, text: "Сообщения и индивидуальный план", icon: "chat-round-dots" },
  { id: "calendar", title: "Календарь", text: "Вебинары, зачёты, запись на продлёнки и коворкинги", icon: "calendar" },
  { id: "payment", title: "Оплата", text: "Ноябрь — оплатить до 1 ноября", icon: "wallet" },
  { id: "notifications", title: "Уведомления", text: "2 новых", icon: "bell" },
  { id: "profile", title: "Профиль", text: "Почта, часовой пояс, класс", icon: "user-circle" },
  { id: "support", title: "Техподдержка", text: "Если что-то не открывается", icon: "info-circle" },
];

export default function MorePage({ params }: { params: { subject: Subject } }) {
  const { reset } = useProgress();
  void params;
  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-5">
      <h1 className="enl-display text-[28px] leading-tight sm:text-[34px]">ещё</h1>
      <ul className="divide-y divide-line-subtle overflow-hidden rounded-box-l border border-line bg-surface-raised shadow-raised">
        {ROWS.map((r) => (
          <li key={r.id} id={r.id}>
            <button type="button" className="flex w-full items-center gap-3 p-4 text-left hover:bg-surface-subtle">
              <span className="grid size-10 shrink-0 place-items-center rounded-box-m bg-surface-subject">
                <Icon name={r.icon} size="2xs" />
              </span>
              <span className="min-w-0 flex-1">
                <span className="block font-semibold">{r.title}</span>
                <span className="block text-[13px] text-ink-muted">{r.text}</span>
              </span>
              <Icon name="alt-arrow-right" size="min" className="text-ink-subtle" />
            </button>
          </li>
        ))}
      </ul>
      <button type="button" onClick={reset} className="self-start text-sm font-semibold text-ink-muted underline">
        Сбросить отметки прототипа
      </button>
    </div>
  );
}
