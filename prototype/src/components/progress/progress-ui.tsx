"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Icon } from "@/components/ui/icon";
import { cn } from "@/lib/utils";
import { accentOf } from "@/lib/style";
import type { Subject } from "@mocks/course";

// Фирменные элементы, которые ученики знают по текущей платформе:
// штампы-печати зачётки и медали ачивок с венком.

const TABS = [
  { href: "/progress", label: "прогресс" },
  { href: "/progress/gradebook", label: "зачётка" },
  { href: "/progress/achievements", label: "ачивки" },
];

export function ProgressTabs({ subject }: { subject: Subject }) {
  const pathname = usePathname();
  const active = TABS.slice()
    .reverse()
    .find((t) => pathname.startsWith(`/${subject}${t.href}`))?.href;
  return (
    <nav aria-label="Разделы прогресса" className="flex gap-2">
      {TABS.map((t) => (
        <Link
          key={t.href}
          href={`/${subject}${t.href}`}
          aria-current={active === t.href ? "page" : undefined}
          className={cn(
            "rounded-full border px-3.5 py-1.5 text-sm font-semibold no-underline transition-colors",
            active === t.href ? "border-ink bg-ink text-surface-page" : "border-line bg-surface-raised text-ink-muted",
          )}
        >
          {t.label}
        </Link>
      ))}
    </nav>
  );
}

const STAR = "M12 3.2l2.6 5.6 6.1.7-4.5 4.2 1.2 6-5.4-3-5.4 3 1.2-6-4.5-4.2 6.1-.7z";
const DIAMOND = "M12 3.5l8.5 8.5-8.5 8.5-8.5-8.5z";

/**
 * Печать зачётки. earned — стоит, pending — месяц идёт, empty — впереди.
 * Цвет — акцент предмета: печать ставит data-accent.
 */
export function Stamp({
  subject,
  state,
  size = 64,
  label,
}: {
  subject: Subject;
  state: "earned" | "pending" | "missed" | "empty";
  size?: number;
  label?: string;
}) {
  const earned = state === "earned";
  return (
    <span
      data-accent={accentOf(subject)}
      data-theme="light"
      role="img"
      aria-label={label}
      className={cn(
        "relative grid shrink-0 place-items-center rounded-full",
        earned && "-rotate-6 border-[3px] border-accent text-ink-accent",
        state === "pending" && "border-2 border-dashed border-line-strong text-ink-accent",
        state === "missed" && "border-2 border-line text-ink-subtle",
        state === "empty" && "border-2 border-dashed border-line text-ink-subtle opacity-60",
      )}
      style={{ width: size, height: size }}
    >
      {earned && <span className="absolute inset-[4px] rounded-full border border-line-strong" aria-hidden />}
      <svg viewBox="0 0 24 24" width={size * 0.5} height={size * 0.5} aria-hidden>
        <path d={subject === "soc" ? STAR : DIAMOND} fill={earned ? "currentColor" : "none"} stroke="currentColor" strokeWidth="1.4" strokeLinejoin="round" />
      </svg>
    </span>
  );
}

/** Медаль ачивки: венок и лента. Закрытая — серый «?». */
export function Medal({ earned, size = 72 }: { earned: boolean; size?: number }) {
  return (
    <span className="relative inline-grid place-items-center" style={{ width: size, height: size + 14 }} aria-hidden>
      {/* лента */}
      <span
        className={cn("absolute bottom-0 h-6 w-9", earned ? "bg-accent" : "bg-surface-subtle")}
        style={{ clipPath: "polygon(0 0,100% 0,100% 100%,50% 70%,0 100%)" }}
      />
      <span
        className={cn(
          "relative grid place-items-center rounded-full border-4",
          earned ? "border-accent-soft bg-surface-subtle text-ink-accent" : "border-line bg-surface-subtle text-ink-subtle",
        )}
        style={{ width: size, height: size }}
      >
        {earned ? (
          <Icon name="medal-ribbon" variant="bold" size="l" />
        ) : (
          <span className="text-2xl font-extrabold">?</span>
        )}
        {/* венок */}
        {earned && (
          <svg viewBox="0 0 64 64" className="absolute inset-0 h-full w-full text-status-ink" aria-hidden>
            <path d="M14 46c-5-6-6-15-2-22M50 46c5-6 6-15 2-22" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
            {[0, 1, 2, 3].map((i) => (
              <g key={i}>
                <ellipse cx={11 - i * 0.4} cy={42 - i * 6} rx="3.2" ry="1.6" fill="currentColor" transform={`rotate(${-50 + i * 12} ${11 - i * 0.4} ${42 - i * 6})`} />
                <ellipse cx={53 + i * 0.4} cy={42 - i * 6} rx="3.2" ry="1.6" fill="currentColor" transform={`rotate(${50 - i * 12} ${53 + i * 0.4} ${42 - i * 6})`} />
              </g>
            ))}
          </svg>
        )}
      </span>
    </span>
  );
}
