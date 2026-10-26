"use client";

import Link from "next/link";
import type { ReactNode } from "react";
import { Icon } from "@/components/ui/icon";
import { useDistribution } from "@/lib/distribution";
import { usePayment } from "@/lib/payment";
import { useProfile } from "@/lib/profile";
import { accentOf } from "@/lib/style";
import { cn } from "@/lib/utils";
import { COURSES, SUBJECTS, type Subject } from "@mocks/course";
import { MENTORS } from "@mocks/mentor";
import { CHANNELS, GROUPS, PROFILE, TZ_OPTIONS, tzLabel, type Channel, type NoticeGroup } from "@mocks/notifications";

/** Проверяющий по тарифу: на «Фристайле» ДЗ ученик проверяет сам. Только ник — анонимность. */
const REVIEWER: Record<Subject, string> = { soc: "куратор Сова", hist: "самопроверка ДЗ" };

const field =
  "w-full rounded-box-m border border-line-strong bg-surface-page px-3.5 py-2.5 text-[15px] font-semibold focus:border-accent";

function Section({ id, title, text, children }: { id?: string; title: string; text?: string; children: ReactNode }) {
  return (
    <section id={id} className="flex scroll-mt-20 flex-col gap-3 rounded-box-l border border-line bg-surface-raised p-4 sm:p-5">
      <div>
        <h2 className="font-bold">{title}</h2>
        {text && <p className="text-[13px] text-ink-muted">{text}</p>}
      </div>
      {children}
    </section>
  );
}

function Field({ label, hint, children }: { label: string; hint?: string; children: ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1 block text-[13px] font-semibold text-ink-muted">{label}</span>
      {children}
      {hint && <span className="mt-1 block text-[12px] text-ink-muted">{hint}</span>}
    </label>
  );
}

/** A4 — профиль. Сохраняется сам при каждом изменении. */
export function ProfileView() {
  const { profile, update, saved } = useProfile();
  const { paidUntil } = usePayment();
  const { isWaiting } = useDistribution();
  const initial = profile.name.trim()[0]?.toUpperCase() ?? "?";
  // Пример пересчёта: практика с АМ — понедельник, 17:00 по Москве.
  const hour = 17 + profile.tz;
  const local = `${String(hour % 24).padStart(2, "0")}:00${hour >= 24 ? " следующего дня" : ""}`;

  const setChannel = (group: NoticeGroup, channel: Channel, on: boolean) =>
    update({ channels: { ...profile.channels, [group]: { ...profile.channels[group], [channel]: on } } });

  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-4">
      <header className="flex items-center gap-4">
        <span className="grid size-16 shrink-0 place-items-center rounded-full bg-surface-subject text-2xl font-extrabold">
          {initial}
        </span>
        <div className="min-w-0 flex-1">
          <h1 className="enl-display truncate text-[28px] normal-case leading-tight sm:text-[34px]">{profile.name || "Без имени"}</h1>
          <p className="text-sm text-ink-muted">
            {profile.grade} класс · {tzLabel(profile.tz)}
          </p>
        </div>
        <p role="status" className={cn("text-sm font-semibold text-ink-olive transition-opacity", saved ? "opacity-100" : "opacity-0")}>
          Сохранено
        </p>
      </header>

      <Section title="О себе" text="Так к вам обращаются наставник и сотрудники школы.">
        <div className="grid gap-3 sm:grid-cols-2">
          <Field label="Имя">
            <input value={profile.name} onChange={(e) => update({ name: e.target.value })} className={field} autoComplete="given-name" />
          </Field>
          <Field label="Класс">
            <div role="radiogroup" aria-label="Класс" className="grid grid-cols-2 gap-2">
              {["10", "11"].map((g) => (
                <button
                  key={g}
                  type="button"
                  role="radio"
                  aria-checked={profile.grade === g}
                  onClick={() => update({ grade: g })}
                  className={cn(
                    "rounded-box-m border-2 py-2 text-[15px] font-semibold transition-colors",
                    profile.grade === g ? "border-accent bg-surface-raised" : "border-line bg-surface-page",
                  )}
                >
                  {g} класс
                </button>
              ))}
            </div>
          </Field>
          <Field label="Часовой пояс" hint={`Практика с АМ в понедельник в 17:00 по Москве — у вас в ${local}.`}>
            <select value={profile.tz} onChange={(e) => update({ tz: Number(e.target.value) })} className={field}>
              {TZ_OPTIONS.map((tz) => (
                <option key={tz} value={tz}>
                  {tzLabel(tz)}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Почта" hint="Это логин. Сменить — через техподдержку.">
            <input value={PROFILE.email} readOnly className={cn(field, "bg-surface-subtle text-ink-muted")} />
          </Field>
        </div>
      </Section>

      <Section title="Контакты" text="Чтобы наставник мог связаться, если вы пропали.">
        <div className="grid gap-3 sm:grid-cols-2">
          <Field label="Telegram">
            <input value={profile.telegram} onChange={(e) => update({ telegram: e.target.value })} placeholder="@ник" className={field} />
          </Field>
          <Field label="ВКонтакте">
            <input value={profile.vk} onChange={(e) => update({ vk: e.target.value })} placeholder="vk.com/…" className={field} />
          </Field>
        </div>
      </Section>

      <Section title="Мои курсы" text="У каждого предмета — свой наставник. Проверяющий анонимен: вопросы по проверке — через наставника.">
        <ul className="flex flex-col gap-2">
          {(["soc", "hist"] as Subject[]).map((s) => (
            <li
              key={s}
              data-accent={accentOf(s)}
              data-theme="light"
              className="flex flex-wrap items-center gap-x-3 gap-y-1 rounded-box-m bg-surface-subject p-3"
            >
              <span className="font-bold">{SUBJECTS[s].title}</span>
              <span className="text-sm">«{COURSES[s].tariff}»</span>
              <span className="w-full text-[13px]">
                {isWaiting(s) ? "Наставника подбираем" : `Наставник — ${MENTORS[s].name} · ${REVIEWER[s]}`} · оплачено до {paidUntil(s)}
              </span>
              <Link href={`/${s}/payment`} className="text-[13px] font-semibold text-ink-accent">
                Оплата
              </Link>
              <Link href={`/${s}/mentor`} className="text-[13px] font-semibold text-ink-accent">
                Наставник
              </Link>
            </li>
          ))}
        </ul>
      </Section>

      <Section
        title="Отчёт родителю"
        text="Раз в месяц, 6-го числа: задания обязательного плана по неделям, комментарий наставника и рекомендации. Допы «на 100» в отчёт не входят."
      >
        <Field label="Почта родителя" hint="Родителю не нужен вход в кабинет — отчёт приходит письмом.">
          <input
            type="email"
            value={profile.parentEmail}
            onChange={(e) => update({ parentEmail: e.target.value })}
            placeholder="почта@example.com"
            className={field}
          />
        </Field>
      </Section>

      <Section id="notifications" title="Уведомления" text="В кабинете приходят всегда. Здесь — куда ещё их дублировать.">
        <ul className="flex flex-col divide-y divide-line-subtle">
          {(Object.keys(GROUPS) as NoticeGroup[]).map((g) => (
            <li key={g} className="flex flex-col gap-2 py-3 first:pt-0 sm:flex-row sm:items-center">
              <span className="min-w-0 flex-1">
                <span className="block font-semibold">{GROUPS[g].title}</span>
                <span className="block text-[13px] text-ink-muted">{GROUPS[g].text}</span>
              </span>
              <span className="flex flex-wrap gap-2">
                {(Object.keys(CHANNELS) as Channel[]).map((c) => {
                  const on = profile.channels[g][c];
                  return (
                    <button
                      key={c}
                      type="button"
                      role="switch"
                      aria-checked={on}
                      aria-label={`${GROUPS[g].title}: ${CHANNELS[c]}`}
                      onClick={() => setChannel(g, c, !on)}
                      className={cn(
                        "flex min-h-11 items-center gap-1.5 rounded-full border-2 px-3.5 text-sm font-semibold transition-colors",
                        on ? "border-accent bg-surface-raised text-ink" : "border-line bg-surface-page text-ink-muted",
                      )}
                    >
                      {on && <Icon name="check-circle" variant="bold" size="min" className="text-ink-accent" />}
                      {CHANNELS[c]}
                    </button>
                  );
                })}
              </span>
            </li>
          ))}
        </ul>
        {(["telegram", "vk"] as const)
          .filter((c) => !profile[c] && Object.values(profile.channels).some((ch) => ch[c]))
          .map((c) => (
            <p key={c} className="rounded-box-m bg-accent-soft p-3 text-sm">
              Укажите {CHANNELS[c]} в контактах — иначе дублировать туда некуда.
            </p>
          ))}
        <label className="flex cursor-pointer items-start gap-3 border-t border-line-subtle pt-3">
          <input
            type="checkbox"
            checked={profile.marketing}
            onChange={(e) => update({ marketing: e.target.checked })}
            className="mt-1 size-4 accent-[var(--accent-fill-solid)]"
          />
          <span>
            <span className="block font-semibold">Новости и акции школы</span>
            <span className="block text-[13px] text-ink-muted">Новые курсы, интенсивы, скидки. Можно отписаться в любой момент.</span>
          </span>
        </label>
      </Section>

      <Section title="Мой результат ЕГЭ" text="По желанию — поделиться успехом со школой и наставником.">
        <p className="flex items-center gap-2 rounded-box-m bg-surface-subtle p-3 text-sm text-ink-muted">
          <Icon name="lock-keyhole" size="xs" className="shrink-0" />
          Откроется в июле, когда придут результаты экзамена.
        </p>
      </Section>
    </div>
  );
}
