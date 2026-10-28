import Link from "next/link";
import { Icon } from "@/components/ui/icon";
import { TrainingList } from "@/components/training/training-list";
import type { Subject } from "@mocks/course";

// Интерактивные тренировки по темам.
export default function TrainingsPage({ params }: { params: { subject: Subject } }) {
  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-5">
      <nav aria-label="Где я" className="text-sm">
        <Link href={`/${params.subject}/practice`} className="inline-flex items-center gap-1 font-semibold text-ink-accent no-underline">
          <Icon name="alt-arrow-left" size="min" /> Практика
        </Link>
      </nav>
      <header>
        <h1 className="app-display text-[28px] leading-tight sm:text-[34px]">тренировки</h1>
        <p className="text-sm text-ink-muted">Две-три минуты на тему. Всё нажатием — удобно и с телефона.</p>
      </header>
      <TrainingList subject={params.subject} />
    </div>
  );
}
