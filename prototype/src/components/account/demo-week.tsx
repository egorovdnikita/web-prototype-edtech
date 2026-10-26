"use client";

import Link from "next/link";
import { useState } from "react";
import { hasExams } from "@/components/calendar/calendar-view";
import { ButtonLink } from "@/components/ui/box";
import { Icon } from "@/components/ui/icon";
import { useProfile } from "@/lib/profile";
import { cn } from "@/lib/utils";
import { COURSES, SUBJECTS, type Subject } from "@mocks/course";
import { PROFILE, tzLabel } from "@mocks/notifications";

function Check({ ok, children }: { ok: boolean; children: React.ReactNode }) {
  return (
    <li className="flex items-start gap-2 text-[15px]">
      <Icon
        name={ok ? "check-circle" : "lock-keyhole"}
        variant={ok ? "bold" : "linear"}
        size="2xs"
        className={cn("mt-0.5 shrink-0", ok ? "text-ink-olive" : "text-ink-subtle")}
      />
      <span className={cn(!ok && "text-ink-muted")}>{children}</span>
    </li>
  );
}

/**
 * B24, до покупки: демонеделя (US 02.10, 02.11). Открыта текущая неделя курса на её
 * даты — уроки, тесты и ДЗ; сданное сохранится и уйдёт на проверку после покупки.
 */
export function DemoWeek({ subject }: { subject: Subject }) {
  const course = COURSES[subject];
  const week = course.weeks.find((w) => w.number === course.currentWeek)!;
  const lessons = week.lessons.filter((l) => l.items.some((i) => i.status !== "locked"));

  return (
    <div className="mx-auto flex max-w-2xl flex-col gap-5">
      <section className="rounded-box-l bg-surface-subject p-5">
        <p className="text-[13px] font-bold uppercase tracking-wide">демонеделя · бесплатно</p>
        <h1 className="enl-display mt-1 text-[26px] leading-tight sm:text-[32px]">
          неделя {week.number} курса — {week.range}
        </h1>
        <p className="mt-2 text-[15px]">
          {SUBJECTS[subject].title}, {course.product.toLowerCase()}. Учитесь вместе с курсом: те же уроки и дедлайны, что у
          учеников.
        </p>
      </section>

      <section className="grid gap-4 sm:grid-cols-2">
        <div className="rounded-box-l border border-line bg-surface-raised p-4 shadow-raised">
          <h2 className="font-bold">Открыто</h2>
          <ul className="mt-2 flex flex-col gap-2">
            <Check ok>Уроки и тесты недели</Check>
            <Check ok>ДЗ — можно сдать, проверка после покупки</Check>
            <Check ok>Вебинар недели</Check>
            <Check ok>Материалы курса</Check>
          </ul>
        </div>
        <div className="rounded-box-l border border-line bg-surface-raised p-4 shadow-raised">
          <h2 className="font-bold">После покупки</h2>
          <ul className="mt-2 flex flex-col gap-2">
            <Check ok={false}>Наставник и мини-группа</Check>
            <Check ok={false}>Проверка ДЗ {hasExams(subject) ? "куратором" : "и пробников"}</Check>
            <Check ok={false}>Счастливая зачётка и ачивки</Check>
            <Check ok={false}>Запись на продлёнки и коворкинги</Check>
          </ul>
        </div>
      </section>

      <section className="flex flex-col gap-2">
        <h2 className="font-bold">Уроки недели</h2>
        <ul className="flex flex-col gap-2">
          {lessons.map((l) => (
            <li key={l.id}>
              <Link
                href={`/${subject}/lesson/${l.id}`}
                className="flex items-center gap-3 rounded-box-l border border-line bg-surface-raised p-4 no-underline shadow-raised hover:border-accent-border"
              >
                <span className="grid size-10 shrink-0 place-items-center rounded-box-m bg-surface-subject text-sm font-extrabold">{l.number}</span>
                <span className="min-w-0 flex-1 font-semibold text-ink">{l.title}</span>
                <Icon name="alt-arrow-right" size="min" className="text-ink-subtle" />
              </Link>
            </li>
          ))}
        </ul>
        <p className="flex items-center gap-2 rounded-box-m bg-surface-subtle p-3 text-sm">
          <Icon name="hourglass" size="2xs" className="shrink-0 text-ink-accent" />
          Пример: «ДЗ №1 сдано · проверка после покупки». Работы из демонедели не пропадут.
        </p>
      </section>

      <section className="flex flex-col gap-3 rounded-box-l border border-line bg-surface-raised p-4 shadow-raised">
        <h2 className="font-bold">Купить курс</h2>
        <p className="text-sm text-ink-muted">
          После оплаты доступ откроется сам — под почтой из заказа, без регистрации и повторного входа. Тариф и цена — на
          странице курса.
        </p>
        <ButtonLink href={`/${subject}/welcome`} size="l">
          Демо: курс оплачен — первый вход
        </ButtonLink>
      </section>
    </div>
  );
}

/**
 * B24, первый вход после покупки (US 01.07, 02.01, 02.11). Ученик сразу внутри,
 * видит, что работы демонедели сохранились, и три шага на старт.
 */
export function Welcome({ subject }: { subject: Subject }) {
  const { profile } = useProfile();
  const [watched, setWatched] = useState(false);
  const curator = hasExams(subject);

  const steps = [
    {
      done: watched,
      title: "Посмотрите вводный урок от АМ",
      text: "Как устроена неделя, что такое обязательный план и допы на 100.",
      action: (
        <button type="button" onClick={() => setWatched(true)} className="text-sm font-semibold text-ink-accent">
          {watched ? "Просмотрено" : "Смотреть"}
        </button>
      ),
    },
    {
      done: Boolean(profile.telegram),
      title: "Проверьте профиль",
      text: `Часовой пояс ${tzLabel(profile.tz)} и Telegram — по ним подбирают наставника и присылают напоминания.`,
      action: (
        <Link href={`/${subject}/profile`} className="text-sm font-semibold text-ink-accent">
          Профиль
        </Link>
      ),
    },
    {
      done: false,
      title: "Дождитесь наставника",
      text: "Его подбирают вручную, он напишет первым. Уроки и тесты открыты уже сейчас.",
      action: (
        <Link href={`/${subject}/mentor`} className="text-sm font-semibold text-ink-accent">
          Наставник
        </Link>
      ),
    },
  ];

  return (
    <div className="mx-auto flex max-w-2xl flex-col gap-5">
      <header>
        <p className="text-[13px] font-semibold text-ink-muted">курс оплачен · вы вошли под {PROFILE.email}</p>
        <h1 className="enl-display text-[28px] normal-case leading-tight sm:text-[34px]">Добро пожаловать, {profile.name}!</h1>
      </header>

      <p className="flex items-start gap-2 rounded-box-l bg-surface-lime p-4 text-[15px]">
        <Icon name="check-circle" variant="bold" size="2xs" className="mt-0.5 shrink-0 text-ink-olive" />
        Работы из демонедели сохранились. ДЗ №1 «Задание 25»{" "}
        {curator ? "ушло на проверку куратору — результат в течение 3 дней." : "открыто для самопроверки по критериям."}
      </p>

      <section className="flex flex-col gap-2">
        <h2 className="font-bold">Три шага на старт</h2>
        <ol className="flex flex-col gap-2">
          {steps.map((s, i) => (
            <li key={s.title} className="flex items-start gap-3 rounded-box-l border border-line bg-surface-raised p-4 shadow-raised">
              <span
                className={cn(
                  "grid size-8 shrink-0 place-items-center rounded-full text-sm font-bold",
                  s.done ? "bg-surface-lime text-ink-olive" : "bg-surface-subject",
                )}
              >
                {s.done ? <Icon name="check-circle" variant="bold" size="min" /> : i + 1}
              </span>
              <span className="min-w-0 flex-1">
                <span className="block font-semibold">{s.title}</span>
                <span className="block text-sm text-ink-muted">{s.text}</span>
              </span>
              <span className="shrink-0">{s.action}</span>
            </li>
          ))}
        </ol>
      </section>

      <ButtonLink href={`/${subject}`} size="l">
        К задачам недели
      </ButtonLink>
    </div>
  );
}
