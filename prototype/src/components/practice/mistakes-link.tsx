"use client";

import Link from "next/link";
import { Icon } from "@/components/ui/icon";
import { useMistakes } from "@/lib/mistakes";
import { plural } from "@/lib/utils";
import type { Subject } from "@mocks/course";

/** Карточка «Работа над ошибками» в практике — с живым счётчиком. */
export function MistakesLink({ subject }: { subject: Subject }) {
  const { mistakes, trainings } = useMistakes(subject);
  const count = mistakes.length;
  return (
    <Link
      href={`/${subject}/practice/mistakes`}
      className="flex items-center gap-3 rounded-box-l border border-line bg-surface-raised p-4 no-underline transition-colors hover:border-line-strong"
    >
      <span className="min-w-0 flex-1">
        <span className="block font-bold leading-snug">Работа над ошибками</span>
        <span className="block text-[13px] text-ink-muted">
          {count || trainings.length
            ? `${[
                count && `${count} ${plural(count, ["задание", "задания", "заданий"])} из тестов`,
                trainings.length && `${trainings.length} ${plural(trainings.length, ["тренировка", "тренировки", "тренировок"])}`,
              ]
                .filter(Boolean)
                .join(" и ")} — ждут, когда вы их перерешаете`
            : "Ошибок нет — новые появятся сами после тестов и тренировок"}
        </span>
      </span>
      <Icon name="alt-arrow-right" size="min" className="shrink-0" />
    </Link>
  );
}
