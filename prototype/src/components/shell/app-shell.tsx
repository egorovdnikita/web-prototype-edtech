"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";
import { AchievementToast } from "@/components/progress/achievement-toast";
import { Icon, type IconName } from "@/components/ui/icon";
import { useMistakes } from "@/lib/mistakes";
import { cn } from "@/lib/utils";
import { MENTOR, SUBJECTS, type Subject } from "@mocks/course";

// Каркас кабинета ученика. Рабочая область отделена от боковых (принцип из Figma
// клиента): на десктопе — меню слева, на телефоне — 5 вкладок снизу.

const NAV: { href: string; label: string; icon: IconName }[] = [
  { href: "", label: "Неделя", icon: "home-smile" },
  { href: "/program", label: "Программа", icon: "notebook-minimalistic" },
  { href: "/practice", label: "Практика", icon: "dumbbell-large" },
  { href: "/progress", label: "Прогресс", icon: "chart-2" },
  { href: "/more", label: "Ещё", icon: "hamburger-menu" },
];

function sectionOf(pathname: string, subject: Subject) {
  const rest = pathname.slice(`/${subject}`.length);
  if (rest.startsWith("/lesson")) return "";
  return NAV.find((n) => n.href && rest.startsWith(n.href))?.href ?? "";
}

function Logo() {
  return (
    <Link href="/" className="enl-display text-[22px] leading-none text-ink no-underline">
      егэ <span className="enl-marker">налегке</span>
    </Link>
  );
}

function SubjectSwitch({ subject, section, compact }: { subject: Subject; section: string; compact?: boolean }) {
  return (
    <div
      role="tablist"
      aria-label="Предмет"
      className={cn("flex rounded-full border border-line bg-surface-raised p-1", compact ? "text-[13px]" : "text-sm")}
    >
      {(Object.keys(SUBJECTS) as Subject[]).map((s) => {
        const active = s === subject;
        return (
          <Link
            key={s}
            role="tab"
            aria-selected={active}
            href={`/${s}${section}`}
            data-accent={s}
            data-theme="light"
            className={cn(
              "flex-1 rounded-full px-3 py-1.5 text-center font-semibold no-underline transition-colors",
              active ? "bg-accent text-accent-on" : "text-ink-muted hover:text-ink",
            )}
          >
            {compact ? SUBJECTS[s].short : SUBJECTS[s].title.toLowerCase()}
          </Link>
        );
      })}
    </div>
  );
}

/** Счётчик ошибок на вкладке «Практика» — чтобы работа над ошибками не терялась. */
function NavBadge({ subject, href }: { subject: Subject; href: string }) {
  const { mistakes } = useMistakes(subject);
  if (href !== "/practice" || mistakes.length === 0) return null;
  return (
    <span
      aria-label={`ошибок: ${mistakes.length}`}
      className="grid min-w-5 place-items-center rounded-full bg-accent px-1 text-[11px] font-bold leading-5 text-accent-on"
    >
      {mistakes.length}
    </span>
  );
}

export function AppShell({ subject, children }: { subject: Subject; children: ReactNode }) {
  const pathname = usePathname();
  const section = sectionOf(pathname, subject);

  return (
    <div className="lg:grid lg:min-h-dvh lg:grid-cols-[248px_minmax(0,1fr)]">
      {/* Десктоп: меню слева */}
      <aside className="sticky top-0 hidden h-dvh flex-col gap-6 border-r border-line bg-surface-subtle px-5 py-6 lg:flex">
        <Logo />
        <SubjectSwitch subject={subject} section={section} compact />
        <nav aria-label="Разделы" className="flex flex-col gap-1">
          {NAV.map((item) => {
            const active = section === item.href;
            return (
              <Link
                key={item.label}
                href={`/${subject}${item.href}`}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "flex items-center gap-3 rounded-box-m px-3 py-2.5 font-semibold no-underline transition-colors",
                  active ? "bg-accent-soft text-ink-accent" : "text-ink-muted hover:bg-surface-raised hover:text-ink",
                )}
              >
                <Icon name={item.icon} variant={active ? "bold" : "linear"} size="2xs" />
                {item.label}
                <span className="ml-auto">
                  <NavBadge subject={subject} href={item.href} />
                </span>
              </Link>
            );
          })}
        </nav>
        <Link
          href={`/${subject}/more`}
          className="mt-auto flex items-center gap-3 rounded-box-l border border-line bg-surface-raised p-3 no-underline"
        >
          <span className="grid size-10 place-items-center rounded-full bg-surface-subject font-bold text-ink">А</span>
          <span className="min-w-0">
            <span className="block text-sm font-semibold text-ink">{MENTOR.name}</span>
            <span className="block text-xs text-ink-muted">ваш {MENTOR.role}</span>
          </span>
          <Icon name="chat-round-dots" size="2xs" className="ml-auto text-ink-accent" />
        </Link>
      </aside>

      {/* Телефон: шапка */}
      <header className="sticky top-0 z-20 flex items-center gap-3 border-b border-line bg-surface-page px-4 py-3 lg:hidden">
        <Logo />
        <div className="ml-auto w-[184px]">
          <SubjectSwitch subject={subject} section={section} compact />
        </div>
      </header>

      <main className="min-w-0 px-4 pb-28 pt-5 sm:px-6 lg:px-10 lg:pb-12 lg:pt-8">{children}</main>
      <AchievementToast key={subject} subject={subject} />

      {/* Телефон: вкладки снизу */}
      <nav
        aria-label="Разделы"
        className="fixed inset-x-0 bottom-0 z-20 grid grid-cols-5 border-t border-line bg-surface-raised pb-[env(safe-area-inset-bottom)] lg:hidden"
      >
        {NAV.map((item) => {
          const active = section === item.href;
          return (
            <Link
              key={item.label}
              href={`/${subject}${item.href}`}
              aria-current={active ? "page" : undefined}
              className={cn(
                "flex min-h-14 flex-col items-center justify-center gap-1 text-[11px] font-semibold no-underline",
                active ? "text-ink-accent" : "text-ink-muted",
              )}
            >
              <span className="relative">
                <Icon name={item.icon} variant={active ? "bold" : "linear"} size="2xs" />
                <span className="absolute -right-3 -top-1.5">
                  <NavBadge subject={subject} href={item.href} />
                </span>
              </span>
              {item.label}
            </Link>
          );
        })}
      </nav>
    </div>
  );
}

/** Рабочая область + правая колонка (на xl). Ниже xl колонка уходит под основное. */
export function WithRail({ children, rail }: { children: ReactNode; rail?: ReactNode }) {
  if (!rail) return <div className="mx-auto max-w-3xl">{children}</div>;
  return (
    <div className="mx-auto grid max-w-6xl gap-6 xl:grid-cols-[minmax(0,1fr)_320px] xl:gap-8">
      <div className="min-w-0">{children}</div>
      <aside className="flex flex-col gap-4">{rail}</aside>
    </div>
  );
}
