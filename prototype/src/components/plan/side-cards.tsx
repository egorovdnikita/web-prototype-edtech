"use client";

import Link from "next/link";
import { useCalendarEvents } from "@/components/calendar/calendar-view";
import { useBookings } from "@/lib/bookings";
import { useDistribution } from "@/lib/distribution";
import { usePayment } from "@/lib/payment";
import { Stamp } from "@/components/progress/progress-ui";
import { useStats } from "@/lib/stats";
import { plural } from "@/lib/utils";
import { COURSES, type Subject } from "@mocks/course";
import { MENTORS } from "@mocks/mentor";
import { STAMP_THRESHOLD } from "@mocks/gradebook";
import { CAL_WEEKS, dayLabel, isPast } from "@mocks/meetings";

// Карточки правой колонки — дополнительная область рядом с рабочей.

function SideCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="rounded-box-l border border-line bg-surface-raised p-4">
      <h2 className="app-display mb-3 text-lg">{title}</h2>
      {children}
    </section>
  );
}

export function MeetingsCard({ subject }: { subject: Subject }) {
  const { isBooked } = useBookings();
  const days = CAL_WEEKS.find((w) => w.number === COURSES[subject].currentWeek)?.days ?? [];
  // Вебинары курса и встречи, на которые ученик записан, — ближайшие этой недели.
  const events = useCalendarEvents().filter(
    (e) =>
      days.includes(e.date) &&
      !isPast(e) &&
      (e.subject === subject || e.subject === "all") &&
      (e.kind === "webinar" || e.kind === "exam" || isBooked(e.id)),
  );
  return (
    <SideCard title="встречи недели">
      {events.length === 0 ? (
        <p className="text-sm text-ink-muted">На этой неделе встреч нет.</p>
      ) : (
        <ul className="flex flex-col gap-3">
          {events.map((e) => {
            const { weekday, day } = dayLabel(e.date);
            return (
              <li key={e.id}>
                <Link href={`/${subject}/calendar?e=${e.id}`} className="flex items-start gap-3 no-underline">
                  <span className="min-w-0">
                    <span className="block text-sm font-semibold">{e.title}</span>
                    <span className="block text-[13px] text-ink-muted">
                      {weekday} {day}, {e.time} · {e.kind === "webinar" ? "без записи" : "вы записаны"}
                    </span>
                  </span>
                </Link>
              </li>
            );
          })}
        </ul>
      )}
      <Link href={`/${subject}/calendar`} className="mt-3 inline-block text-sm font-semibold text-ink-accent">
        Календарь и запись на встречи
      </Link>
    </SideCard>
  );
}

/** Зачётка: печать за месяц, если обязательный план выполнен больше чем на 60%. */
export function GradebookCard({ subject }: { subject: Subject }) {
  const { gradebook: g } = useStats(subject);
  const october = g.stamps[1];
  return (
    <SideCard title="зачётка">
      <div className="flex items-center gap-3">
        <Stamp subject={subject} state={october.stamp ? "earned" : "pending"} size={48} label="Печать за октябрь" />
        <p className="text-sm text-ink-muted">
          октябрь: <span className="font-bold text-ink">{g.percent}%</span> обязательного плана. Печать — больше {STAMP_THRESHOLD}%.
        </p>
      </div>
      <div className="relative mt-3 h-3 rounded-full bg-surface-subtle" aria-hidden>
        <div className="h-full rounded-full bg-accent" style={{ width: `${g.percent}%` }} />
        <div className="absolute inset-y-[-4px] w-0.5 rounded-full bg-ink" style={{ left: `${STAMP_THRESHOLD}%` }} />
      </div>
      <p className="mt-3 text-sm">
        {october.stamp
          ? "Печать за октябрь ваша — это билет в розыгрыш."
          : `До печати — ${g.needTasks} ${plural(g.needTasks, ["задание", "задания", "заданий"])} обязательного плана.`}
      </p>
      <Link href={`/${subject}/progress/gradebook`} className="mt-2 inline-block text-sm font-semibold text-ink-accent">
        Зачётка и розыгрыш
      </Link>
    </SideCard>
  );
}

export function MentorCard({ subject }: { subject: Subject }) {
  const mentor = MENTORS[subject];
  const { isWaiting } = useDistribution();
  if (isWaiting(subject))
    return (
      <SideCard title="наставник">
        <p className="text-sm">Подбираем наставника. Он напишет первым — придёт уведомление.</p>
        <Link href={`/${subject}/mentor`} className="mt-2 inline-block text-sm font-semibold text-ink-accent">
          Как идёт распределение
        </Link>
      </SideCard>
    );
  return (
    <SideCard title="наставник">
      <div className="flex items-center gap-3">
        <span className="grid size-11 place-items-center rounded-full bg-surface-subtle text-lg font-bold">{mentor.initial}</span>
        <span>
          <span className="block font-semibold">{mentor.name}</span>
          <span className="block text-[13px] text-ink-muted">{mentor.reply}</span>
        </span>
      </div>
      <Link
        href={`/${subject}/mentor`}
        className="mt-3 flex items-center gap-2 text-sm font-semibold text-ink-accent no-underline"
      >
Написать
      </Link>
    </SideCard>
  );
}

/** Оплаченный период и кнопка следующего месяца — видно с начала курса. */
export function PaymentCard({ subject }: { subject: Subject }) {
  const { statusOf, paidUntil } = usePayment();
  const status = statusOf(subject);
  return (
    <SideCard title="оплата">
      <p className="text-sm">
        {status === "ok" && `Оплачено до ${paidUntil(subject)}.`}
        {status === "due" && (
          <>
            Оплачено до {paidUntil(subject)}. Ноябрь — <span className="font-semibold">до 1 ноября</span>.
          </>
        )}
        {status === "overdue" && <span className="font-semibold text-ink-accent">Ноябрь не оплачен — новые уроки не открываются.</span>}
        {status === "expelled" && <span className="font-semibold text-ink-accent">Отчисление с 1 декабря.</span>}
      </p>
      <Link href={`/${subject}/payment`} className="mt-2 inline-block text-sm font-semibold text-ink-accent">
        {status === "ok" ? "Оплата и история" : "Оплатить"}
      </Link>
    </SideCard>
  );
}
