import Link from "next/link";
import { TrainerStats } from "@/components/practice/trainer-grid";
import { Icon } from "@/components/ui/icon";
import type { Subject } from "@mocks/course";

// Статистика тренажёра: решаемость по номерам.
export default function TrainerStatsPage({ params }: { params: { subject: Subject } }) {
  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-5">
      <nav aria-label="Где я" className="text-sm">
        <Link href={`/${params.subject}/practice`} className="inline-flex items-center gap-1 font-semibold text-ink-accent no-underline">
          <Icon name="alt-arrow-left" size="min" /> Практика
        </Link>
      </nav>
      <header>
        <h1 className="app-display text-[28px] leading-tight sm:text-[34px]">статистика тренажёра</h1>
        <p className="text-sm text-ink-muted">Какие номера 1 части получаются, а какие стоит подтянуть.</p>
      </header>
      <TrainerStats subject={params.subject} />
    </div>
  );
}
