"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";
import { AchievementToast } from "@/components/progress/achievement-toast";
import { Icon, type IconName } from "@/components/ui/icon";
import { useDistribution } from "@/lib/distribution";
import { accentOf } from "@/lib/style";
import { useMistakes } from "@/lib/mistakes";
import { useNotifications } from "@/lib/notifications";
import { usePayment } from "@/lib/payment";
import { cn } from "@/lib/utils";
import { SUBJECTS, type Subject } from "@mocks/course";
import { MENTORS } from "@mocks/mentor";

// Каркас кабинета ученика. Рабочая область отделена от боковых: на десктопе — меню слева, на телефоне — 5 вкладок снизу.

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
  // Наставник, зачёт и календарь открываются из «Ещё».
  if (/^\/(mentor|exam|calendar|recording|payment|profile|notifications|chats|support|survey|recheck|demo|welcome)/.test(rest)) return "/more";
  if (rest.startsWith("/training/")) return "/practice";
  return NAV.find((n) => n.href && rest.startsWith(n.href))?.href ?? "";
}

/** Куда вести при смене предмета: тот же экран, если он есть у обоих предметов.
 *  Уроки и работы у предметов свои — с них ведём на раздел. */
function switchTarget(pathname: string, subject: Subject, section: string) {
  const rest = pathname.slice(`/${subject}`.length);
  if (rest.startsWith("/training/")) return "/practice/trainings";
  // Записи и анкеты — у предметов свои.
  if (/^\/(recording|survey)\//.test(rest)) return "/more";
  // Тренажёр есть только у обществознания.
  if (rest.startsWith("/practice/trainer")) return "/practice";
  return /^\/(lesson|work)\//.test(rest) ? section : rest;
}

function Logo() {
  return (
    <Link href="/" className="app-display app-wordmark shrink-0 text-[19px] leading-none text-ink no-underline sm:text-[22px]">
      онлайн-школа
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
            data-accent={accentOf(s)}
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

/** Колокольчик уведомлений с числом непрочитанных. */
function Bell({ subject }: { subject: Subject }) {
  const { unread } = useNotifications();
  return (
    <Link
      href={`/${subject}/notifications`}
      aria-label={unread ? `Уведомления, новых: ${unread}` : "Уведомления"}
      className="relative grid size-11 shrink-0 place-items-center rounded-full text-ink no-underline hover:bg-surface-subtle"
    >
      <Icon name="bell" size="2xs" className="text-current" />
      {unread > 0 && (
        <span className="absolute right-1 top-1 grid min-w-5 place-items-center rounded-full bg-accent px-1 text-[11px] font-bold leading-5 text-accent-on">
          {unread}
        </span>
      )}
    </Link>
  );
}

/** Счётчик ошибок на вкладке «Практика» — чтобы работа над ошибками не терялась. */
function NavBadge({ subject, href }: { subject: Subject; href: string }) {
  const { total } = useMistakes(subject);
  if (href !== "/practice" || total === 0) return null;
  return (
    <span
      aria-label={`ошибок: ${total}`}
      className="grid min-w-5 place-items-center rounded-full bg-accent px-1 text-[11px] font-bold leading-5 text-accent-on"
    >
      {total}
    </span>
  );
}

export function AppShell({ subject, children }: { subject: Subject; children: ReactNode }) {
  const pathname = usePathname();
  const section = sectionOf(pathname, subject);
  const target = switchTarget(pathname, subject, section);
  const waiting = useDistribution().isWaiting(subject);

  return (
    <div className="lg:grid lg:min-h-dvh lg:grid-cols-[248px_minmax(0,1fr)]">
      {/* Десктоп: меню слева */}
      <aside className="sticky top-0 hidden h-dvh flex-col gap-6 border-r border-line bg-surface-page px-5 py-6 lg:flex">
        <div className="-my-2 flex items-center justify-between">
          <Logo />
          <Bell subject={subject} />
        </div>
        <SubjectSwitch subject={subject} section={target} compact />
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
                  active ? "bg-accent-soft text-ink-accent" : "text-ink-muted hover:bg-surface-subtle hover:text-ink",
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
          href={`/${subject}/mentor`}
          className="-mx-2 mt-auto flex items-center gap-3 rounded-box-m p-2 no-underline transition-colors hover:bg-surface-subtle"
        >
          <span className="grid size-10 place-items-center rounded-full bg-surface-subtle font-bold text-ink">
            {waiting ? "?" : MENTORS[subject].initial}
          </span>
          <span className="min-w-0">
            <span className="block text-sm font-semibold text-ink">{waiting ? "Подбираем" : MENTORS[subject].name}</span>
            <span className="block text-xs text-ink-muted">ваш наставник</span>
          </span>
        </Link>
      </aside>

      {/* Телефон: шапка */}
      <header className="sticky top-0 z-20 flex items-center gap-1 border-b border-line bg-surface-page py-2 pl-4 pr-3 lg:hidden">
        <Logo />
        <Bell subject={subject} />
        <div className="ml-auto w-[172px]">
          <SubjectSwitch subject={subject} section={target} compact />
        </div>
      </header>

      <main className="min-w-0 px-4 pb-28 pt-5 sm:px-6 lg:px-10 lg:pb-12 lg:pt-8">
        <PaymentGate subject={subject} pathname={pathname}>
          {children}
        </PaymentGate>
      </main>
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

/**
 * Последствия неоплаты: при просрочке — баннер на всех экранах
 * (открытое доступно, новое — после оплаты); после отчисления кабинет закрыт,
 * кроме оплаты и «Ещё».
 */
function PaymentGate({ subject, pathname, children }: { subject: Subject; pathname: string; children: ReactNode }) {
  const { statusOf } = usePayment();
  const status = statusOf(subject);
  const rest = pathname.slice(`/${subject}`.length);
  const open = /^\/(payment|more|profile|notifications|support)/.test(rest);

  if (status === "expelled" && !open) {
    return (
      <section className="mx-auto flex max-w-md flex-col items-center gap-3 rounded-box-l border border-line bg-surface-raised p-8 text-center">
        <Icon name="lock-keyhole" size="xl" />
        <p className="text-lg font-bold">Вы отчислены с курса</p>
        <p className="text-sm text-ink-muted">
          Ноябрь не был оплачен до конца месяца, поэтому с 1 декабря материалы закрыты. Вернуться можно через менеджера.
        </p>
        <Link href={`/${subject}/payment`} className="font-semibold text-ink-accent">
          Подробнее и связаться с менеджером
        </Link>
      </section>
    );
  }
  return (
    <>
      {status === "overdue" && !open && (
        <Link
          href={`/${subject}/payment`}
          data-status="warning"
          className="mx-auto mb-5 flex max-w-6xl items-start gap-3 rounded-box-l border border-status-border bg-status-soft p-3 text-sm text-ink no-underline"
        >
          <Icon name="danger-circle" size="2xs" className="mt-0.5 shrink-0 text-status-ink" />
          <span className="min-w-0 flex-1">
            <span className="font-bold">Ноябрь не оплачен.</span> Открытое доступно до 30 ноября, новые уроки и проверка — после оплаты.
          </span>
          <span className="shrink-0 font-semibold text-status-ink">Оплатить</span>
        </Link>
      )}
      {children}
    </>
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
