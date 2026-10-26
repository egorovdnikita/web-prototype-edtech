import Link from "next/link";
import { cn } from "@/lib/utils";
import type { Subject } from "@mocks/course";

/** «Программа» — две вкладки: таймлайн курса и справочные материалы. */
export function ProgramTabs({ subject, active }: { subject: Subject; active: "weeks" | "materials" }) {
  const tabs = [
    { id: "weeks", label: "По неделям", href: `/${subject}/program` },
    { id: "materials", label: "Материалы курса", href: `/${subject}/program/materials` },
  ] as const;
  return (
    <nav aria-label="Программа" className="flex gap-1 self-start rounded-full border border-line bg-surface-raised p-1">
      {tabs.map((t) => (
        <Link
          key={t.id}
          href={t.href}
          aria-current={active === t.id ? "page" : undefined}
          className={cn(
            "rounded-full px-4 py-1.5 text-sm font-semibold no-underline transition-colors",
            active === t.id ? "bg-accent text-accent-on" : "text-ink-muted hover:text-ink",
          )}
        >
          {t.label}
        </Link>
      ))}
    </nav>
  );
}
