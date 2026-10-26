"use client";

import Link from "next/link";
import { hasExams } from "@/components/calendar/calendar-view";
import { MentorView } from "@/components/mentor/mentor-view";
import { Button } from "@/components/ui/box";
import { Icon } from "@/components/ui/icon";
import { useDistribution } from "@/lib/distribution";
import { useProfile } from "@/lib/profile";
import { cn } from "@/lib/utils";
import { SUBJECTS, type Subject } from "@mocks/course";
import { tzLabel } from "@mocks/notifications";

/**
 * «Мой наставник» до распределения. Ученик понимает, что происходит, что от него
 * не нужно ничего делать и чем заняться сейчас. Критерии подбора — как у ЕНЛ:
 * часовой пояс (разница до 2 часов), опыт наставника, пожелания из анкеты.
 */
export function MentorWaiting({ subject }: { subject: Subject }) {
  const { assign } = useDistribution();
  const { profile } = useProfile();
  const curator = hasExams(subject);

  const steps = [
    { title: "Анкета получена", text: `Часовой пояс ${tzLabel(profile.tz)}, пожелания к наставнику — учтём.`, state: "done" },
    {
      title: curator ? "Подбираем наставника и проверяющего" : "Подбираем наставника",
      text: "Вручную: по часовому поясу (разница не больше 2 часов), опыту наставника и вашим пожеланиям.",
      state: "now",
    },
    {
      title: "Наставник напишет первым",
      text: "Здесь, в сообщениях. Придёт уведомление — в кабинете и в Telegram, если он подключён.",
      state: "next",
    },
  ] as const;

  return (
    <div className="mx-auto flex max-w-2xl flex-col gap-5">
      <header className="flex items-center gap-4">
        <span className="grid size-16 shrink-0 place-items-center rounded-full border-2 border-dashed border-line-strong bg-surface-raised">
          <Icon name="user-circle" size="s" />
        </span>
        <div>
          <p className="text-sm text-ink-muted">ваш наставник · {SUBJECTS[subject].title.toLowerCase()}</p>
          <h1 className="text-[24px] font-extrabold leading-tight sm:text-[28px]">Подбираем наставника</h1>
        </div>
      </header>

      <ol className="flex flex-col gap-0 rounded-box-l border border-line bg-surface-raised p-4">
        {steps.map((s, i) => (
          <li key={s.title} className="flex gap-3">
            <span className="flex flex-col items-center">
              <span
                className={cn(
                  "grid size-8 shrink-0 place-items-center rounded-full text-sm font-bold",
                  s.state === "done" && "bg-surface-lime text-ink-olive",
                  s.state === "now" && "bg-accent text-accent-on",
                  s.state === "next" && "border-2 border-line bg-surface-page text-ink-muted",
                )}
              >
                {s.state === "done" ? <Icon name="check-circle" variant="bold" size="min" /> : i + 1}
              </span>
              {i < steps.length - 1 && <span className="my-1 w-0.5 flex-1 bg-line" aria-hidden />}
            </span>
            <span className={cn("pb-4", i === steps.length - 1 && "pb-0")}>
              <span className={cn("block font-bold", s.state === "next" && "text-ink-muted")}>
                {s.title}
                {s.state === "now" && <span className="ml-2 rounded-full bg-surface-marker px-1.5 text-[12px] font-extrabold">сейчас</span>}
              </span>
              <span className="block text-sm text-ink-muted">{s.text}</span>
            </span>
          </li>
        ))}
      </ol>

      <section className="rounded-box-l bg-surface-subject p-4">
        <h2 className="enl-display text-lg">пока ждёте</h2>
        <ul className="mt-2 flex flex-col gap-1.5 text-[15px]">
          <li>
            Уроки, тесты и тренировки уже открыты —{" "}
            <Link href={`/${subject}`} className="font-semibold text-ink-accent">
              задачи недели
            </Link>
            .
          </li>
          <li>
            ДЗ откроется вместе с наставником{curator && " и проверяющим"}. Если дедлайн пройдёт раньше — сдать можно ещё 2
            недели после него.
          </li>
          {curator && <li>Запись на зачёт тоже появится после распределения.</li>}
          <li>
            Вопрос по доступу —{" "}
            <Link href={`/${subject}/more`} className="font-semibold text-ink-accent">
              техподдержка
            </Link>
            .
          </li>
        </ul>
      </section>

      <div className="flex flex-col items-start gap-1 border-t border-dashed border-line pt-4">
        <Button appearance="outline" size="s" onClick={() => assign(subject)}>
          Демо: назначить наставника
        </Button>
        <p className="text-[12px] text-ink-muted">В жизни это делает учебный отдел — кнопка только для показа.</p>
      </div>
    </div>
  );
}

/** Страница наставника: до распределения — ожидание, после — переписка и план. */
export function MentorEntry({ subject }: { subject: Subject }) {
  const { isWaiting } = useDistribution();
  return isWaiting(subject) ? <MentorWaiting subject={subject} /> : <MentorView subject={subject} />;
}
