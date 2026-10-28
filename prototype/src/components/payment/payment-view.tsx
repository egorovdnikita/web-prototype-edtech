"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/box";
import { Icon } from "@/components/ui/icon";
import { DUE_MONTH, usePayment, type PaymentStatus } from "@/lib/payment";
import { cn, plural } from "@/lib/utils";
import { COURSES, SUBJECTS, type Subject } from "@mocks/course";
import { DISCOUNTS, MONTHS, MONTH_PRICE, SCENARIOS, restOfMonth, rub, type PaymentScenario } from "@mocks/payment";

// Оплата обучения: оплаченный период и кнопка следующего месяца с начала
// Курса, оплата нескольких месяцев, просрочка,
// отчисление. Два предмета — одним платежом: то, что школа называет корзиной.

type Option = { id: string; label: string; note?: string; months: string[]; partial?: boolean; warn?: string; whole?: boolean };

const ALL: Subject[] = ["soc", "hist"];

export function PaymentView() {
  const { scenario, setScenario, statusOf, paid, pay, paidUntil, skipped, history } = usePayment();
  const day = SCENARIOS[scenario].dayOfMonth;
  const statuses = Object.fromEntries(ALL.map((s) => [s, statusOf(s)])) as Record<Subject, PaymentStatus>;
  const anyOverdue = ALL.some((s) => statuses[s] === "overdue");
  const expelled = ALL.filter((s) => statuses[s] === "expelled");
  const owing = ALL.filter((s) => statuses[s] !== "ok" && statuses[s] !== "expelled");

  const [subjects, setSubjects] = useState<Subject[]>(owing.length ? owing : ALL);
  const [optionId, setOptionId] = useState<string>("");
  const [checkout, setCheckout] = useState(false);
  const [done, setDone] = useState<string | null>(null);
  const [link, setLink] = useState(false);

  // Варианты периода: после последнего оплаченного месяца.
  const lastPaidIndex = Math.max(...subjects.map((s) => Math.max(...paid[s].map((m) => MONTHS.findIndex((x) => x.id === m)))));
  const next = MONTHS[lastPaidIndex + 1];
  const rest = MONTHS.slice(lastPaidIndex + 1);
  const options: Option[] = anyOverdue
    ? [
        { id: "rest", label: `Остаток ноября — с ${day} по 30 ноября`, note: "уроки и проверка откроются сразу", months: [DUE_MONTH], partial: true },
        {
          id: "next",
          label: "Декабрь целиком",
          months: ["2026-12"],
          warn: "Ноябрь останется закрытым: уроки и работы ноября не откроются и после оплаты декабря.",
        },
      ]
    : next
      ? [
          { id: "1", label: next.title[0].toUpperCase() + next.title.slice(1), note: `доступ до ${next.last}`, months: [next.id] },
          ...(rest.length >= 3
            ? [{ id: "3", label: `${rest[0].title} – ${rest[2].title}`, note: "3 месяца", months: rest.slice(0, 3).map((m) => m.id) }]
            : []),
          {
            id: "all",
            label: `До конца курса — ${rest.length} ${plural(rest.length, ["месяц", "месяца", "месяцев"])}`,
            note: `−${DISCOUNTS.wholeCourse}%`,
            months: rest.map((m) => m.id),
            whole: true,
          },
        ]
      : [];
  const option = options.find((o) => o.id === optionId) ?? options[0];

  // Новый сценарий — снова предлагаем оплатить то, что сейчас не оплачено.
  useEffect(() => {
    setOptionId("");
    setSubjects(owing.length ? owing : ALL);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [scenario]);

  // Сумма: за месяц по зафиксированной цене; остаток — по дням.
  const lines = subjects.map((s) => {
    const perMonth = MONTH_PRICE[s];
    const sum = option?.partial ? restOfMonth(perMonth, day) : perMonth * (option?.months.length ?? 0);
    return { subject: s, sum };
  });
  const base = lines.reduce((a, l) => a + l.sum, 0);
  // Скидки в прототипе применяем по очереди.
  const both = subjects.length === 2 ? Math.round((base * DISCOUNTS.bothSubjects) / 100) : 0;
  const whole = option?.whole ? Math.round(((base - both) * DISCOUNTS.wholeCourse) / 100) : 0;
  const total = base - both - whole;

  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-5">
      <header>
        <h1 className="app-display text-[28px] leading-tight sm:text-[34px]">оплата обучения</h1>
        <p className="text-sm text-ink-muted">Единый день оплаты — 1-е число. Цена зафиксирована на весь учебный год.</p>
      </header>

      {/* Статус по предметам */}
      <section className="flex flex-col gap-3">
        {ALL.map((s) => (
          <StatusCard key={s} subject={s} status={statuses[s]} paidUntil={paidUntil(s)} skipped={skipped(s)} />
        ))}
      </section>

      {done && (
        <p role="status" className="flex items-center gap-2 rounded-box-m bg-status-soft p-3 font-semibold text-status-ink">
          <Icon name="check-circle" variant="bold" size="2xs" /> {done}
        </p>
      )}

      {expelled.length === ALL.length ? (
        <section className="rounded-box-l border border-line bg-surface-raised p-4">
          <h2 className="font-bold">Как вернуться</h2>
          <p className="mt-1 text-sm text-ink-muted">
            После отчисления оплатить самому уже нельзя — возвращение обсуждается с менеджером: он подберёт месяц и тариф.
          </p>
          <Button size="l" className="mt-3">
            Написать менеджеру
          </Button>
        </section>
      ) : (
        options.length > 0 && (
          <section className="flex flex-col gap-4 rounded-box-l border border-line bg-surface-raised p-4">
            <fieldset>
              <legend className="mb-2 font-bold">Что оплачиваем</legend>
              <div className="flex flex-col gap-2 sm:flex-row">
                {ALL.filter((s) => statuses[s] !== "expelled").map((s) => {
                  const on = subjects.includes(s);
                  return (
                    <label
                      key={s}
                      className={cn(
                        "flex flex-1 cursor-pointer items-start gap-3 rounded-box-m border p-3",
                        on ? "border-accent bg-surface-raised" : "border-line",
                      )}
                    >
                      <input
                        type="checkbox"
                        checked={on}
                        onChange={() => setSubjects(on ? subjects.filter((x) => x !== s) : [...subjects, s])}
                        className="mt-1 size-4 accent-[var(--accent-fill-solid)]"
                      />
                      <span>
                        <span className="block font-semibold">{SUBJECTS[s].title}</span>
                        <span className="block text-[13px] text-ink-muted">
                          «{COURSES[s].tariff}» · {rub(MONTH_PRICE[s])} в месяц
                        </span>
                      </span>
                    </label>
                  );
                })}
              </div>
              {subjects.length === 1 && ALL.filter((s) => statuses[s] !== "expelled").length === 2 && (
                <p className="mt-2 text-[13px] text-ink-muted">Оба предмета одним платежом — скидка {DISCOUNTS.bothSubjects}%.</p>
              )}
            </fieldset>

            <fieldset>
              <legend className="mb-2 font-bold">Период</legend>
              <div className="flex flex-col gap-2">
                {options.map((o) => (
                  <label
                    key={o.id}
                    className={cn(
                      "flex cursor-pointer items-start gap-3 rounded-box-m border p-3",
                      option?.id === o.id ? "border-accent bg-surface-raised" : "border-line",
                    )}
                  >
                    <input
                      type="radio"
                      name="period"
                      checked={option?.id === o.id}
                      onChange={() => setOptionId(o.id)}
                      className="mt-1 size-4 accent-[var(--accent-fill-solid)]"
                    />
                    <span className="min-w-0">
                      <span className="block font-semibold">{o.label}</span>
                      {o.note && <span className="block text-[13px] text-ink-muted">{o.note}</span>}
                      {o.warn && option?.id === o.id && (
                        <span data-status="warning" className="mt-1 flex items-start gap-1.5 text-[13px] font-semibold text-status-ink">
                          <Icon name="danger-circle" size="min" className="mt-0.5 shrink-0" /> {o.warn}
                        </span>
                      )}
                    </span>
                  </label>
                ))}
              </div>
            </fieldset>

            <dl className="flex flex-col gap-1 border-t border-line-subtle pt-3 text-sm">
              {lines.map((l) => (
                <div key={l.subject} className="flex justify-between">
                  <dt className="text-ink-muted">{SUBJECTS[l.subject].title}</dt>
                  <dd>{rub(l.sum)}</dd>
                </div>
              ))}
              {both > 0 && (
                <div className="flex justify-between text-status-ink">
                  <dt>Два предмета −{DISCOUNTS.bothSubjects}%</dt>
                  <dd>−{rub(both)}</dd>
                </div>
              )}
              {whole > 0 && (
                <div className="flex justify-between text-status-ink">
                  <dt>До конца курса −{DISCOUNTS.wholeCourse}%</dt>
                  <dd>−{rub(whole)}</dd>
                </div>
              )}
              <div className="mt-1 flex items-baseline justify-between">
                <dt className="font-bold">Итого</dt>
                <dd className="app-display text-[28px]">{rub(total)}</dd>
              </div>
            </dl>

            <div className="flex flex-col gap-2 sm:flex-row">
              <Button size="l" disabled={!subjects.length} onClick={() => setCheckout(true)} className="sm:flex-1">
                Оплатить {rub(total)}
              </Button>
              <Button size="l" appearance="outline" disabled={!subjects.length} onClick={() => setLink(true)}>
                Ссылка для родителя
              </Button>
            </div>
            {link && (
              <div className="rounded-box-m bg-surface-subtle p-3 text-sm">
                <p className="font-semibold">Ссылка на оплату — {rub(total)}</p>
                <p className="mt-1 break-all font-mono text-[13px] text-ink-muted">pay.example.com/o/7Q2K-{total}</p>
                <p className="mt-1 text-[13px] text-ink-muted">Платить может кто угодно — доступ получите вы. Чек придёт на почту плательщика.</p>
              </div>
            )}
            <p className="text-[12px] text-ink-muted">Напомним об оплате за 3 дня — на почту и в мессенджер.</p>
          </section>
        )
      )}

      <section className="rounded-box-l border border-line bg-surface-raised p-4">
        <h2 className="font-bold">История платежей</h2>
        <ul className="mt-2 divide-y divide-line-subtle text-sm">
          {history.map((h) => (
            <li key={h.date + h.what} className="flex justify-between gap-3 py-2">
              <span>
                <span className="block">{h.what}</span>
                <span className="block text-[12px] text-ink-muted">
                  {h.date} · платил {h.payer}
                </span>
              </span>
              <span className="shrink-0 font-semibold">{rub(h.sum)}</span>
            </li>
          ))}
        </ul>
      </section>

      {/* Переключатель сценариев — только для показа прототипа */}
      <section className="rounded-box-l border border-dashed border-line-strong p-4">
        <p className="text-sm font-bold">Демо: посмотреть состояния</p>
        <p className="text-[13px] text-ink-muted">Сдвигает «сегодня», чтобы показать просрочку и отчисление.</p>
        <div className="mt-2 flex flex-wrap gap-2">
          {(Object.keys(SCENARIOS) as PaymentScenario[]).map((s) => (
            <button
              key={s}
              type="button"
              aria-pressed={scenario === s}
              onClick={() => {
                setScenario(s);
                setDone(null);
              }}
              className={cn(
                "rounded-full border px-3.5 py-1.5 text-sm font-semibold",
                scenario === s ? "border-ink bg-ink text-surface-page" : "border-line bg-surface-raised text-ink-muted",
              )}
            >
              {SCENARIOS[s].label}
            </button>
          ))}
        </div>
      </section>

      {checkout && option && (
        <Checkout
          total={total}
          onClose={() => setCheckout(false)}
          onPaid={() => {
            pay(subjects, option.months, option.partial, {
              date: SCENARIOS[scenario].today,
              what: `${option.label} · ${subjects.map((s) => SUBJECTS[s].short).join(" + ")}`,
              sum: total,
              payer: "вы",
            });
            setCheckout(false);
            setLink(false);
            setDone(`Оплачено: ${option.label.toLowerCase()} · ${subjects.map((s) => SUBJECTS[s].short).join(" + ")}. Чек — на почте.`);
          }}
        />
      )}
    </div>
  );
}

function StatusCard({ subject, status, paidUntil, skipped }: { subject: Subject; status: PaymentStatus; paidUntil: string; skipped?: string }) {
  const tone = status === "overdue" || status === "expelled";
  return (
    <div
      data-status={tone ? "negative" : status === "due" ? "warning" : "positive"}
      className={cn(
        "flex items-start gap-3 rounded-box-l border p-4",
        tone ? "border-status-border bg-status-soft" : "border-line bg-surface-raised",
      )}
    >
      <span className="grid size-10 shrink-0 place-items-center rounded-box-m bg-surface-raised">
        <Icon name={status === "ok" ? "check-circle" : status === "due" ? "wallet" : "danger-circle"} variant={status === "ok" ? "bold" : "linear"} size="2xs" className={status === "due" ? undefined : "text-status-ink"} />
      </span>
      <div className="min-w-0 text-sm">
        <p className="font-bold">
          {SUBJECTS[subject].title} · «{COURSES[subject].tariff}»
        </p>
        {status === "ok" && <p>Оплачено до {paidUntil}.{skipped && ` ${skipped[0].toUpperCase()}${skipped.slice(1)} пропущен и закрыт.`}</p>}
        {status === "due" && (
          <p>
            Оплачено до {paidUntil}. Ноябрь — оплатить до 1 ноября, <span className="font-semibold">осталось 7 дней</span>.
          </p>
        )}
        {status === "overdue" && (
          <p>
            <span className="font-semibold">Ноябрь не оплачен.</span> Открытые уроки и работы доступны до 30 ноября, новые уроки и проверка — после оплаты. Не
            оплатить до 30 ноября — отчисление.
          </p>
        )}
        {status === "expelled" && (
          <p>
            <span className="font-semibold">Отчислены 1 декабря</span> — ноябрь так и не оплачен. Материалы закрыты.
          </p>
        )}
      </div>
    </div>
  );
}

function Checkout({ total, onClose, onPaid }: { total: number; onClose: () => void; onPaid: () => void }) {
  const [method, setMethod] = useState("sbp");
  return (
    <div role="dialog" aria-modal="true" aria-label="Оплата" className="fixed inset-0 z-30 flex items-end justify-center bg-[var(--surface-base-fill-overlay)] sm:items-center" onClick={onClose}>
      <div className="w-full max-w-md rounded-t-box-xl bg-surface-raised p-5 pb-[calc(1.25rem+env(safe-area-inset-bottom))] sm:rounded-box-xl" onClick={(e) => e.stopPropagation()}>
        <h2 className="text-lg font-extrabold">Оплата {rub(total)}</h2>
        <p className="text-[13px] text-ink-muted">Прототип: деньги не списываются.</p>
        <div className="mt-3 flex flex-col gap-2">
          {[
            ["sbp", "СБП — через приложение банка"],
            ["card", "Банковская карта"],
          ].map(([id, label]) => (
            <label key={id} className={cn("flex cursor-pointer items-center gap-3 rounded-box-m border p-3", method === id ? "border-accent bg-surface-raised" : "border-line")}>
              <input type="radio" name="method" checked={method === id} onChange={() => setMethod(id)} className="size-4 accent-[var(--accent-fill-solid)]" />
              {label}
            </label>
          ))}
        </div>
        <div className="mt-4 flex gap-3">
          <Button size="l" appearance="outline" className="flex-1" onClick={onClose}>
            Отмена
          </Button>
          <Button size="l" className="flex-1" onClick={onPaid}>
            Оплатить
          </Button>
        </div>
      </div>
    </div>
  );
}
