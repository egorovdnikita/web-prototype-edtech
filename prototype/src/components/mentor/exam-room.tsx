"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { hasExams } from "@/components/calendar/calendar-view";
import { Button, ButtonLink } from "@/components/ui/box";
import { Icon } from "@/components/ui/icon";
import { useBookings } from "@/lib/bookings";
import { cn } from "@/lib/utils";
import type { Subject } from "@mocks/course";
import { EXAM, dayLabel } from "@mocks/meetings";
import { EXAM_PREP_MINUTES, MENTORS, TICKETS, type Ticket } from "@mocks/mentor";

// B18 — зачёт по видеосвязи один на один с наставником (08.06): проверить
// камеру и микрофон, дождаться наставника, вытянуть билет, подготовиться и ответить.
// Видео в прототипе — заглушки: доступ к камере не запрашиваем.

type Stage = "check" | "waiting" | "ticket" | "prep" | "answer" | "done";

export function ExamRoom({ subject }: { subject: Subject }) {
  const mentor = MENTORS[subject];
  const { exam, examResult, finishExam } = useBookings();
  const [stage, setStage] = useState<Stage>("check");
  const [mic, setMic] = useState(true);
  const [cam, setCam] = useState(true);
  const [ticket, setTicket] = useState<Ticket | null>(null);
  const [drawing, setDrawing] = useState(false);
  const [left, setLeft] = useState(EXAM_PREP_MINUTES * 60);

  // Наставник «подключается» через пару секунд после входа.
  useEffect(() => {
    if (stage !== "waiting") return;
    const timer = window.setTimeout(() => setStage("ticket"), 2500);
    return () => window.clearTimeout(timer);
  }, [stage]);

  useEffect(() => {
    if (stage !== "prep") return;
    const tick = window.setInterval(() => setLeft((s) => Math.max(0, s - 1)), 1000);
    return () => window.clearInterval(tick);
  }, [stage]);

  useEffect(() => {
    if (stage === "prep" && left === 0) setStage("answer");
  }, [stage, left]);

  if (!hasExams(subject)) {
    return (
      <Notice title="Зачётов на вашем тарифе нет" text="Зачёты с наставником — на тарифах «С инструктором» и VIP.">
        <ButtonLink href={`/${subject}/mentor`} appearance="soft">
          К наставнику
        </ButtonLink>
      </Notice>
    );
  }

  if (stage === "done" || (examResult && stage === "check")) {
    const r = examResult!;
    return (
      <div className="mx-auto flex max-w-xl flex-col gap-4">
        <section className="rounded-box-l bg-surface-subject p-5 text-center">
          <Icon name="cup-star" size="xl" className="mx-auto text-ink-accent" />
          <p className="enl-display mt-2 text-[28px]">{r.passed ? "зачёт!" : "не зачтено"}</p>
          <p className="text-sm text-ink-muted">
            Билет №{r.ticket} · {r.date} · {mentor.name}
          </p>
        </section>
        <section className="enl-grid-paper rounded-box-l border border-accent-border p-4">
          <p className="enl-display text-ink-accent">обратная связь</p>
          <p className="mt-1 leading-relaxed">{r.feedback}</p>
        </section>
        <p className="text-[13px] text-ink-muted">
          Запись зачёта видят только наставник и ведущий наставник. Результат — на странице наставника.
        </p>
        <ButtonLink href={`/${subject}/mentor`} size="l">
          К наставнику
        </ButtonLink>
      </div>
    );
  }

  const when = exam && dayLabel(exam.date);
  const mmss = `${Math.floor(left / 60)}:${String(left % 60).padStart(2, "0")}`;

  const draw = () => {
    setDrawing(true);
    window.setTimeout(() => {
      setTicket(TICKETS[2]);
      setDrawing(false);
    }, 900);
  };

  return (
    <div className="mx-auto flex max-w-5xl flex-col gap-4">
      <nav aria-label="Где я" className="text-sm">
        <Link href={`/${subject}/mentor`} className="flex items-center gap-1 font-semibold text-ink-accent no-underline">
          <Icon name="arrow-left" size="min" /> Наставник
        </Link>
      </nav>
      <header>
        <h1 className="text-[24px] font-extrabold leading-tight sm:text-[28px]">{EXAM.title}</h1>
        <p className="text-sm text-ink-muted">
          {EXAM.topic} · {EXAM.minutes} минут · {mentor.name}
          {when && ` · ${when.weekday}, ${when.day} ${when.month}, ${exam!.time}`}
        </p>
      </header>

      {!exam && stage === "check" && (
        <p className="flex items-start gap-2 rounded-box-m bg-surface-subtle p-3 text-sm">
          <Icon name="info-circle" size="2xs" className="mt-0.5 shrink-0" />
          Вы не записаны на зачёт — в прототипе войти можно и так. В жизни кнопка «Войти» появится за 15 минут до записи.
        </p>
      )}

      <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_340px]">
        {/* Видео */}
        <section className="overflow-hidden rounded-box-l bg-ink" aria-label="Видеосвязь">
          <div className="relative grid aspect-video place-items-center text-surface-page">
            {stage === "check" ? (
              <span className="flex flex-col items-center gap-2 text-center text-sm opacity-80">
                <Icon name="videocamera" size="xl" />
                {cam ? "Так вас увидит наставник" : "Камера выключена"}
              </span>
            ) : stage === "waiting" ? (
              <span className="flex flex-col items-center gap-2 text-sm opacity-80" role="status">
                <span className="size-3 animate-pulse rounded-full bg-surface-page" />
                Ждём {mentor.name}…
              </span>
            ) : (
              <span className="flex flex-col items-center gap-2">
                <span className="grid size-24 place-items-center rounded-full bg-surface-subject text-4xl font-extrabold text-ink">
                  {mentor.initial}
                </span>
                <span className="text-sm opacity-80">{mentor.name}</span>
              </span>
            )}
            {/* Своё окно */}
            {stage !== "check" && (
              <div className="absolute bottom-2 right-2 grid aspect-video w-20 place-items-center sm:bottom-3 sm:right-3 rounded-box-m border-2 border-surface-page bg-surface-subtle text-[11px] font-semibold text-ink-muted sm:w-40">
                {cam ? "вы" : "камера выкл."}
              </div>
            )}
          </div>
          {/* Панель управления — отдельной полосой, чтобы не закрывать видео */}
          <div className="flex justify-center gap-3 px-3 py-3">
            <CallButton active={mic} label={mic ? "Выключить микрофон" : "Включить микрофон"} icon="microphone-3" onClick={() => setMic(!mic)} />
            <CallButton active={cam} label={cam ? "Выключить камеру" : "Включить камеру"} icon="videocamera" onClick={() => setCam(!cam)} />
            {stage !== "check" && (
              <Link
                href={`/${subject}/mentor`}
                aria-label="Выйти из зачёта"
                className="grid size-11 place-items-center rounded-full bg-accent text-accent-on no-underline"
              >
                <Icon name="end-call" variant="bold" size="2xs" />
              </Link>
            )}
          </div>
        </section>

        {/* Ход зачёта */}
        <section className="flex flex-col gap-3 rounded-box-l border border-line bg-surface-raised p-4 shadow-raised">
          {stage === "check" && (
            <>
              <h2 className="font-bold">Перед входом</h2>
              <ul className="flex flex-col gap-2 text-sm">
                <Check ok={cam} text={cam ? "Камера работает" : "Камера выключена — наставнику важно вас видеть"} />
                <Check ok={mic} text={mic ? "Микрофон работает" : "Микрофон выключен"} />
                <Check ok text="Билеты темы опубликованы — можно пролистать перед зачётом" />
              </ul>
              <Button size="l" onClick={() => setStage("waiting")} disabled={!mic}>
                Войти в зачёт
              </Button>
              {!mic && <p className="text-[13px] text-ink-muted">Включите микрофон — без него ответить не получится.</p>}
            </>
          )}

          {stage === "waiting" && (
            <>
              <h2 className="font-bold">Вы в зачёте</h2>
              <p className="text-sm text-ink-muted">Наставник подключится в назначенное время. Билет вытянете вместе.</p>
            </>
          )}

          {(stage === "ticket" || stage === "prep" || stage === "answer") && (
            <>
              <p className="flex items-center gap-2 text-sm font-semibold text-ink-olive" role="status">
                <span className="size-2 rounded-full bg-surface-lime" /> {mentor.name} на связи
              </p>
              {!ticket ? (
                <>
                  <h2 className="font-bold">Тема «Политика»</h2>
                  <p className="text-sm text-ink-muted">Билет выпадет случайно. На подготовку — {EXAM_PREP_MINUTES} минут, потом ответ.</p>
                  <Button size="l" onClick={draw} disabled={drawing} startIcon={<Icon name="ticket" size="min" />}>
                    {drawing ? "Тянем билет…" : "Вытянуть билет"}
                  </Button>
                </>
              ) : (
                <>
                  <div className="rounded-box-m border-2 border-accent bg-surface-page p-3">
                    <p className="enl-display text-ink-accent">билет №{ticket.number}</p>
                    <p className="font-bold">{ticket.title}</p>
                    <ol className="mt-2 list-decimal pl-5 text-sm leading-relaxed">
                      {ticket.questions.map((q) => (
                        <li key={q}>{q}</li>
                      ))}
                    </ol>
                  </div>
                  {stage === "ticket" && (
                    <Button size="l" onClick={() => setStage("prep")}>
                      Начать подготовку · {EXAM_PREP_MINUTES} мин
                    </Button>
                  )}
                  {stage === "prep" && (
                    <>
                      <p className="flex items-center justify-between rounded-box-m bg-surface-marker px-3 py-2 font-bold" role="timer">
                        Подготовка <span className="tabular-nums">{mmss}</span>
                      </p>
                      <Button size="l" onClick={() => setStage("answer")}>
                        Готов отвечать
                      </Button>
                    </>
                  )}
                  {stage === "answer" && (
                    <>
                      <p className="text-sm">Отвечайте наставнику по пунктам билета. Он может задать уточняющие вопросы.</p>
                      <Button
                        size="l"
                        appearance="outline"
                        onClick={() => {
                          finishExam({
                            date: "29.10",
                            ticket: ticket.number,
                            passed: true,
                            feedback:
                              "Подсистемы назвала все, функции объяснила своими словами — отлично. В примере с гражданским обществом не хватило конкретики: назови организацию и что именно она сделала.",
                          });
                          setStage("done");
                        }}
                      >
                        Завершить (демо: наставник ставит «зачтено»)
                      </Button>
                    </>
                  )}
                </>
              )}
            </>
          )}
          <p className="mt-auto text-[12px] text-ink-muted">
            Зачёт записывается. Запись видят только наставник и ведущий наставник.
          </p>
        </section>
      </div>
    </div>
  );
}

function CallButton({ active, label, icon, onClick }: { active: boolean; label: string; icon: "microphone-3" | "videocamera"; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      aria-pressed={!active}
      className={cn(
        "relative grid size-11 place-items-center rounded-full transition-colors",
        active ? "bg-surface-page text-ink" : "bg-surface-subtle text-ink-subtle",
      )}
    >
      <Icon name={icon} variant={active ? "bold" : "linear"} size="2xs" />
      {!active && <span className="absolute h-0.5 w-6 rotate-45 rounded-full bg-accent" aria-hidden />}
    </button>
  );
}

function Check({ ok, text }: { ok: boolean; text: string }) {
  return (
    <li className="flex items-start gap-2">
      <Icon name={ok ? "check-circle" : "danger-circle"} variant={ok ? "bold" : "linear"} size="2xs" className={cn("shrink-0", ok ? "text-ink-olive" : "text-ink-accent")} />
      {text}
    </li>
  );
}

function Notice({ title, text, children }: { title: string; text: string; children?: React.ReactNode }) {
  return (
    <section className="mx-auto flex max-w-md flex-col items-center gap-2 rounded-box-l border border-line bg-surface-raised p-8 text-center shadow-raised">
      <p className="text-lg font-bold">{title}</p>
      <p className="text-sm text-ink-muted">{text}</p>
      {children}
    </section>
  );
}
