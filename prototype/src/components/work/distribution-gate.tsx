"use client";

import Link from "next/link";
import type { ReactNode } from "react";
import { hasExams } from "@/components/calendar/calendar-view";
import { ButtonLink } from "@/components/ui/box";
import { Icon } from "@/components/ui/icon";
import { useDistribution } from "@/lib/distribution";
import { useProgress } from "@/lib/progress";
import { findItem, type Subject } from "@mocks/course";

/**
 * ДЗ до распределения: экран объясняет, почему закрыто, и что делать сейчас.
 * В GetCourse на этом месте — пустая панель CloudText с одной фразой.
 */
export function DistributionGate({ subject, id, children }: { subject: Subject; id: string; children: ReactNode }) {
  const { lockedByDistribution } = useDistribution();
  const { statusOf } = useProgress();
  const found = findItem(subject, id)!;
  if (!lockedByDistribution(found.item) || statusOf(found.item) !== "locked") return <>{children}</>;

  // Куратор проверяет ДЗ на тех же тарифах, где есть зачёт.
  const curator = hasExams(subject);
  return (
    <section className="mx-auto flex max-w-xl flex-col gap-4 rounded-box-l border border-line bg-surface-raised p-6">
      <div>
        <h1 className="text-xl font-extrabold leading-tight">ДЗ откроется, когда назначат наставника</h1>
        <p className="mt-2 text-[15px] leading-relaxed">
          {curator
            ? "Ваше ДЗ проверяет куратор — сдать его можно, когда назначат наставника и проверяющего."
            : "Сдача ДЗ откроется вместе с распределением: у каждого ученика есть наставник, а пробники проверяет проверяющий."}{" "}
          Наставника подбирают вручную: по часовому поясу и пожеланиям из вашей анкеты.
        </p>
      </div>
      <ul className="flex flex-col gap-2 text-sm">
        <li className="flex gap-2">
          <Icon name="check-circle" variant="bold" size="min" className="mt-0.5 shrink-0 text-ink-olive" />
          Пока можно смотреть уроки, решать тесты и тренировки — это засчитается в план недели.
        </li>
        <li className="flex gap-2">
          <Icon name="check-circle" variant="bold" size="min" className="mt-0.5 shrink-0 text-ink-olive" />
          Если дедлайн пройдёт раньше — ДЗ можно сдать ещё 2 недели после него.
        </li>
      </ul>
      <div className="flex flex-col gap-2 sm:flex-row">
        <ButtonLink href={`/${subject}/lesson/${found.lesson.id}`}>К уроку {found.lesson.number}</ButtonLink>
        <ButtonLink href={`/${subject}/mentor`} appearance="soft">
          Как идёт распределение
        </ButtonLink>
      </div>
      <Link href={`/${subject}`} className="text-sm font-semibold text-ink-accent">
        К задачам недели
      </Link>
    </section>
  );
}
