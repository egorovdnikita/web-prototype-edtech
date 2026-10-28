"use client";

import { useEffect, useState } from "react";
import { Button, ButtonLink } from "@/components/ui/box";
import { Icon } from "@/components/ui/icon";
import { cn } from "@/lib/utils";
import type { Subject } from "@mocks/course";

const KEY = "proto-recheck";

type Kind = "appeal" | "simple";
type Stage = "form" | "sent" | "result" | "appeal" | "closed";

interface Store {
  stage: Stage;
  kind: Kind;
  files: string[];
}

const KINDS: Record<Kind, { title: string; text: string }> = {
  appeal: {
    title: "Перед апелляцией",
    text: "Срочно: проверяющий ответит в течение суток, чтобы вы успели подать апелляцию.",
  },
  simple: {
    title: "Просто узнать, за что сняли баллы",
    text: "Без апелляции — разбор ошибок для себя.",
  },
};

const SLOTS = [
  { id: "forms", title: "Бланки ответов", hint: "Фото или скан бланков №1 и №2" },
  { id: "scores", title: "Разбалловка", hint: "Протокол с баллами по заданиям" },
];

/**
 * Перепроверка бланков ЕГЭ. Ученик присылает бланки
 * и разбалловку, проверяющий куратор отвечает, стоит ли идти на апелляцию.
 * Пройти можно после результатов ЕГЭ; в прототипе — заранее, с демо-ответом.
 */
export function RecheckView({ subject }: { subject: Subject }) {
  const [store, setStore] = useState<Store>({ stage: "form", kind: "appeal", files: [] });

  useEffect(() => {
    try {
      const saved = window.localStorage.getItem(KEY);
      if (saved) setStore(JSON.parse(saved));
    } catch {
      // без сохранения
    }
  }, []);

  const save = (patch: Partial<Store>) => {
    const next = { ...store, ...patch };
    setStore(next);
    try {
      window.localStorage.setItem(KEY, JSON.stringify(next));
    } catch {
      // без сохранения
    }
  };

  const ready = SLOTS.every((s) => store.files.some((f) => f.startsWith(`${s.id}:`)));

  return (
    <div className="mx-auto flex max-w-xl flex-col gap-5">
      <header>
        <h1 className="app-display text-[28px] leading-tight sm:text-[34px]">перепроверка бланков</h1>
        <p className="text-sm text-ink-muted">После ЕГЭ: проверяющий куратор посмотрит бланки и скажет, стоит ли идти на апелляцию.</p>
      </header>

      <p className="flex items-start gap-2 rounded-box-m border border-dashed border-line p-3 text-[13px] text-ink-muted">
        Откроется в июле, когда придут результаты экзамена. В прототипе можно попробовать заранее.
      </p>

      {store.stage === "form" && (
        <>
          <fieldset className="flex flex-col gap-2">
            <legend className="mb-2 font-bold">Что нужно?</legend>
            {(Object.keys(KINDS) as Kind[]).map((k) => (
              <button
                key={k}
                type="button"
                role="radio"
                aria-checked={store.kind === k}
                onClick={() => save({ kind: k })}
                className={cn(
                  "flex flex-col gap-0.5 rounded-box-l border-2 p-4 text-left transition-colors",
                  store.kind === k ? "border-accent bg-surface-raised" : "border-line bg-surface-raised",
                )}
              >
                <span className="font-bold">{KINDS[k].title}</span>
                <span className="text-sm text-ink-muted">{KINDS[k].text}</span>
              </button>
            ))}
          </fieldset>

          <fieldset className="flex flex-col gap-2">
            <legend className="mb-2 font-bold">Файлы</legend>
            {SLOTS.map((slot) => {
              const files = store.files.filter((f) => f.startsWith(`${slot.id}:`)).map((f) => f.slice(slot.id.length + 1));
              return (
                <label
                  key={slot.id}
                  className={cn(
                    "flex cursor-pointer items-center gap-3 rounded-box-l border-2 border-dashed p-4 transition-colors",
                    files.length ? "border-transparent bg-status-soft" : "border-line-strong bg-surface-raised hover:border-accent",
                  )}
                >
                  <Icon name={files.length ? "check-circle" : "paperclip"} variant={files.length ? "bold" : "linear"} size="xs" className="shrink-0" />
                  <span className="min-w-0 flex-1">
                    <span className="block font-semibold">{slot.title}</span>
                    <span className="block truncate text-[13px] text-ink-muted">{files.length ? files.join(", ") : slot.hint}</span>
                  </span>
                  <span className="shrink-0 text-sm font-semibold text-ink-accent">{files.length ? "Заменить" : "Загрузить"}</span>
                  {/* Файлы никуда не уходят: в прототипе запоминаем только имена. */}
                  <input
                    type="file"
                    multiple
                    accept="image/*,application/pdf"
                    className="sr-only"
                    onChange={(e) => {
                      const names = Array.from(e.target.files ?? []).map((f) => `${slot.id}:${f.name}`);
                      if (names.length) save({ files: [...store.files.filter((f) => !f.startsWith(`${slot.id}:`)), ...names] });
                    }}
                  />
                </label>
              );
            })}
            <button
              type="button"
              onClick={() => save({ files: ["forms:бланк-1.jpg", "forms:бланк-2.jpg", "scores:разбалловка.pdf"] })}
              className="self-start text-[13px] font-semibold text-ink-muted underline"
            >
              Демо: подставить файлы
            </button>
          </fieldset>

          <Button size="l" disabled={!ready} onClick={() => save({ stage: "sent" })}>
            Отправить на перепроверку
          </Button>
        </>
      )}

      {store.stage === "sent" && (
        <Status title="Бланки у проверяющего">
          {store.kind === "appeal"
            ? "Ответ придёт в течение суток — уведомлением и здесь."
            : "Ответ придёт уведомлением и появится здесь."}
          <Button appearance="outline" size="s" className="mt-3 self-start" onClick={() => save({ stage: "result" })}>
            Демо: прислать ответ проверяющего
          </Button>
        </Status>
      )}

      {(store.stage === "result" || store.stage === "appeal" || store.stage === "closed") && (
        <section className="flex flex-col gap-3 rounded-box-l border border-line bg-surface-raised p-4">
          <p className="text-[13px] font-semibold text-ink-muted">Результат перепроверки · проверяющий куратор Лис</p>
          <p className="text-[15px] leading-relaxed">
            В задании 25 можно претендовать на +1 балл: пример из сферы экономики раскрыт, а засчитан не был. В задании 21
            баллы сняты обоснованно — ответ не по условию.
          </p>
          <p className="rounded-box-m bg-accent-soft p-3 text-sm font-semibold">Вывод: на апелляцию идти стоит, шанс +1 балл.</p>
        </section>
      )}

      {store.stage === "result" && (
        <div className="flex flex-col gap-2 sm:flex-row">
          <Button size="l" onClick={() => save({ stage: "appeal" })}>
            Иду на апелляцию
          </Button>
          <Button size="l" appearance="outline" onClick={() => save({ stage: "closed" })}>
            Не пойду
          </Button>
        </div>
      )}

      {store.stage === "appeal" && (
        <Status title="Готовим базу для апелляции">
          Проверяющий перепроверит работу целиком и пришлёт аргументы по каждому спорному заданию — с ними идти на апелляцию.
        </Status>
      )}

      {store.stage === "closed" && <Status title="Перепроверка закрыта">Разбор остаётся здесь.</Status>}

      {store.stage !== "form" && (
        <button
          type="button"
          onClick={() => save({ stage: "form", files: [] })}
          className="self-start text-[13px] font-semibold text-ink-muted underline"
        >
          Демо: начать заново
        </button>
      )}

      <ButtonLink href={`/${subject}/support`} appearance="soft" className="self-start">
        Вопрос не про бланки — в техподдержку
      </ButtonLink>
    </div>
  );
}

function Status({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section role="status" className="flex flex-col rounded-box-l bg-surface-subtle p-4">
      <p className="flex items-center gap-2 font-bold">
        {title}
      </p>
      <div className="mt-1 flex flex-col text-sm">{children}</div>
    </section>
  );
}
