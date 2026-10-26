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
// Стилизованная птица — печать истории.
const BIRD =
  "M3.5 13.5c2.6.2 4.6-.8 6-2.8C11 8.4 12.6 6.5 15.4 6c1.6-.3 2.9.3 3.6 1.2l1.9-.3-1.4 1.6c.2 3.6-2.2 7.2-6.6 8.4-2.6.7-5.4.4-7.9-1 1.3-.1 2.4-.5 3.3-1.2-2-.1-3.6-.4-4.8-1.2z";

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
        state === "pending" && "border-2 border-dashed border-accent-border text-ink-accent",
        state === "missed" && "border-2 border-line text-ink-subtle",
        state === "empty" && "border-2 border-dashed border-line text-ink-subtle opacity-60",
      )}
      style={{ width: size, height: size }}
    >
      {earned && <span className="absolute inset-[4px] rounded-full border border-accent-border" aria-hidden />}
      <svg viewBox="0 0 24 24" width={size * 0.5} height={size * 0.5} aria-hidden>
        <path d={subject === "soc" ? STAR : BIRD} fill={earned ? "currentColor" : "none"} stroke="currentColor" strokeWidth="1.4" strokeLinejoin="round" />
        {subject === "hist" && (
          <>
            {/* крыло и глаз — чтобы силуэт читался птицей, а не листом */}
            <path d="M9.6 10.8c1.4 2 4.1 2.8 6.6 1.6" fill="none" stroke={earned ? "var(--surface-base-fill-raised)" : "currentColor"} strokeWidth="1.3" strokeLinecap="round" />
            <circle cx="17.3" cy="8" r="0.8" fill={earned ? "var(--surface-base-fill-raised)" : "currentColor"} />
          </>
        )}
      </svg>
    </span>
  );
}

/** Медаль ачивки: венок и лента, как на текущей платформе. Закрытая — серый «?». */
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
          earned ? "border-surface-marker bg-surface-subject text-ink-accent shadow-raised" : "border-line bg-surface-subtle text-ink-subtle",
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
          <svg viewBox="0 0 64 64" className="absolute inset-0 h-full w-full text-ink-olive" aria-hidden>
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
