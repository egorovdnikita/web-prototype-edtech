"use client";

import Link from "next/link";
import { Icon } from "@/components/ui/icon";
import { useMistakes } from "@/lib/mistakes";
import { plural } from "@/lib/utils";
import type { Subject } from "@mocks/course";

/** Карточка «Работа над ошибками» в практике — с живым счётчиком. */
export function MistakesLink({ subject }: { subject: Subject }) {
  const { mistakes } = useMistakes(subject);
  const count = mistakes.length;
  return (
    <Link
      href={`/${subject}/practice/mistakes`}
      className="flex items-center gap-3 rounded-box-l border border-line bg-surface-raised p-4 no-underline shadow-raised transition-colors hover:border-accent-border"
    >
      <span className="grid size-11 shrink-0 place-items-center rounded-box-m bg-surface-subject">
        <Icon name="danger-circle" size="2xs" />
      </span>
      <span className="min-w-0 flex-1">
        <span className="block font-bold leading-snug">Работа над ошибками</span>
        <span className="block text-[13px] text-ink-muted">
          {count
            ? `${count} ${plural(count, ["задание", "задания", "заданий"])} из тестов ждут, когда вы их перерешаете`
            : "Ошибок нет — новые появятся сами после тестов"}
        </span>
      </span>
      <Icon name="alt-arrow-right" size="min" className="shrink-0 text-ink-subtle" />
    </Link>
  );
}
