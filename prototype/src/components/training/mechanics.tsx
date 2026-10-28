"use client";

import { useCallback, useEffect, useMemo, useRef, useState, type ButtonHTMLAttributes, type ReactNode } from "react";
import { Icon } from "@/components/ui/icon";
import { shuffle } from "@/lib/trainings";
import { cn } from "@/lib/utils";
import type { TrainingData } from "@mocks/trainings";

// Семь механик каталога. Общее правило для всех: только нажатия, без наведения
// и перетаскивания; цели не меньше 44 px; ошибка — короткая встряска и красная
// рамка, ничего не блокирует; верное остаётся на месте и отмечено галочкой.

export interface MechanicProps<D> {
  data: D;
  seed: string;
  /** Индекс элемента данных, на котором ошибся ученик, — для работы над ошибками. */
  onMistake: (unit: number) => void;
  onDone: () => void;
}

type ChipState = "idle" | "selected" | "correct" | "wrong";

function Chip({
  state = "idle",
  className,
  children,
  ...rest
}: { state?: ChipState; children: ReactNode } & ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      type="button"
      aria-pressed={state === "selected"}
      disabled={state === "correct"}
      data-status={state === "wrong" ? "negative" : state === "correct" ? "positive" : undefined}
      className={cn(
        "flex min-h-11 items-center gap-2 rounded-box-m border-2 px-3 py-2 text-left text-[15px] font-semibold leading-snug transition-colors",
        state === "idle" && "border-line bg-surface-raised hover:border-line-strong",
        state === "selected" && "border-accent bg-surface-raised",
        state === "correct" && "border-transparent bg-status-soft",
        state === "wrong" && "app-shake border-status-border bg-status-soft",
        className,
      )}
      {...rest}
    >
      {state === "correct" && <Icon name="check-circle" variant="bold" size="min" className="shrink-0 text-status-ink" />}
      {state === "wrong" && <Icon name="close-circle" size="min" className="shrink-0 text-status-ink" />}
      <span className="min-w-0">{children}</span>
    </button>
  );
}

/** Короткая подсветка ошибки: ключ элемента на 600 мс. */
function useFlash() {
  const [key, setKey] = useState<string | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout>>();
  const flash = useCallback((k: string) => {
    clearTimeout(timer.current);
    setKey(k);
    timer.current = setTimeout(() => setKey(null), 600);
  }, []);
  return [key, flash] as const;
}

function Hint({ children }: { children: ReactNode }) {
  return <p className="text-[13px] text-ink-muted">{children}</p>;
}

/** Панель вариантов. На телефоне прилипает к низу над вкладками: цель
 *  и варианты видны одновременно, не надо листать туда-обратно. */
function Dock({ children }: { children: ReactNode }) {
  return (
    <div className="sticky bottom-[calc(57px+env(safe-area-inset-bottom))] z-10 -mx-4 flex flex-col gap-2 border-t border-line bg-surface-page px-4 py-3 lg:static lg:mx-0 lg:border-0 lg:bg-transparent lg:p-0">
      {children}
    </div>
  );
}

/* ——— pick: найди лишнее, угадай по подсказкам, разминка на память ——— */

export function Pick({ data, seed, onMistake, onDone }: MechanicProps<Extract<TrainingData, { mechanic: "pick" }>>) {
  const [round, setRound] = useState(0);
  const [clues, setClues] = useState(1);
  const [wrong, setWrong] = useState<number[]>([]);
  const [flashKey, flash] = useFlash();
  const current = useRef<HTMLElement>(null);

  // Новый ряд появляется ниже — показываем его, на телефоне он за краем экрана.
  useEffect(() => {
    if (round > 0 && round < data.rounds.length) current.current?.scrollIntoView({ behavior: "smooth", block: "center" });
  }, [round, data.rounds.length]);

  return (
    <div className="flex flex-col gap-4">
      {data.rounds.slice(0, round + 1).map((r, ri) => {
        const solved = ri < round;
        const order = shuffle(r.options.map((_, i) => i), `${seed}-${ri}`);
        return (
          <section key={ri} ref={ri === round ? current : undefined} className="flex flex-col gap-3">
            <h3 className="font-bold">
              {data.rounds.length > 1 && <span className="text-ink-muted">{ri + 1} из {data.rounds.length} · </span>}
              {r.prompt}
            </h3>
            {r.clues && (
              <ol className="flex flex-col gap-2">
                {r.clues.slice(0, solved ? r.clues.length : clues).map((c, i) => (
                  <li key={i} className="flex gap-2 rounded-box-m bg-surface-subtle p-3 text-[15px] leading-snug">
                    <span className="font-bold text-ink-accent">{i + 1}.</span>
                    {c}
                  </li>
                ))}
              </ol>
            )}
            <div className="grid gap-2 sm:grid-cols-2">
              {order.map((i) => {
                const state: ChipState = solved
                  ? i === r.answer
                    ? "correct"
                    : "idle"
                  : flashKey === `${ri}-${i}`
                    ? "wrong"
                    : "idle";
                return (
                  <Chip
                    key={i}
                    state={state}
                    disabled={solved}
                    className={cn(!solved && wrong.includes(i) && "text-ink-subtle line-through", solved && i !== r.answer && "opacity-60")}
                    onClick={() => {
                      if (i === r.answer) {
                        setWrong([]);
                        setClues(1);
                        if (round === data.rounds.length - 1) {
                          setRound(round + 1);
                          onDone();
                        } else setRound(round + 1);
                        return;
                      }
                      flash(`${ri}-${i}`);
                      setWrong((w) => [...w, i]);
                      onMistake(ri);
                      // Неверный ответ открывает следующую подсказку.
                      if (r.clues) setClues((c) => Math.min(c + 1, r.clues!.length));
                    }}
                  >
                    {r.options[i]}
                  </Chip>
                );
              })}
            </div>
            {!solved && r.clues && clues < r.clues.length && (
              <button
                type="button"
                onClick={() => setClues(clues + 1)}
                className="self-start text-sm font-semibold text-ink-accent"
              >
                Ещё подсказка
              </button>
            )}
            {solved && <p className="rounded-box-m bg-surface-subtle p-3 text-sm leading-relaxed">{r.why}</p>}
          </section>
        );
      })}
    </div>
  );
}

/* ——— match: найди соответствия ——— */

export function Match({ data, seed, onMistake, onDone }: MechanicProps<Extract<TrainingData, { mechanic: "match" }>>) {
  const left = useMemo(() => shuffle(data.pairs.map((_, i) => i), `${seed}-l`), [data, seed]);
  const right = useMemo(() => shuffle(data.pairs.map((_, i) => i), `${seed}-r`), [data, seed]);
  const [sel, setSel] = useState<{ side: "l" | "r"; i: number } | null>(null);
  const [done, setDone] = useState<number[]>([]);
  const [flashKey, flash] = useFlash();

  const tap = (side: "l" | "r", i: number) => {
    if (!sel || sel.side === side) return setSel({ side, i });
    if (sel.i === i) {
      const next = [...done, i];
      setDone(next);
      setSel(null);
      if (next.length === data.pairs.length) onDone();
      return;
    }
    flash(`${side}-${i}`);
    onMistake(sel.i);
  };
  const state = (side: "l" | "r", i: number): ChipState =>
    done.includes(i) ? "correct" : flashKey === `${side}-${i}` ? "wrong" : sel?.side === side && sel.i === i ? "selected" : "idle";

  return (
    <div className="grid gap-4 sm:grid-cols-[minmax(0,2fr)_minmax(0,3fr)]">
      <div className="flex flex-col gap-2">
        <Hint>{data.left}</Hint>
        <div className="flex flex-wrap gap-2 sm:flex-col">
          {left.map((i) => (
            <Chip key={i} state={state("l", i)} onClick={() => tap("l", i)}>
              {data.pairs[i][0]}
            </Chip>
          ))}
        </div>
      </div>
      <div className="flex flex-col gap-2">
        <Hint>{data.right}</Hint>
        {right.map((i) => (
          <Chip key={i} state={state("r", i)} onClick={() => tap("r", i)} className="font-normal">
            {done.includes(i) && <span className="mr-1 font-bold">{data.pairs[i][0]} —</span>}
            {data.pairs[i][1]}
          </Chip>
        ))}
      </div>
    </div>
  );
}

/* ——— slots: заполни пропуски, почини схему, восстанови план ——— */

export function Slots({ data, seed, onMistake, onDone }: MechanicProps<Extract<TrainingData, { mechanic: "slots" }>>) {
  const bank = useMemo(() => shuffle([...data.answers, ...data.extra], seed), [data, seed]);
  const [filled, setFilled] = useState<(string | null)[]>(() => data.answers.map(() => null));
  const firstEmpty = filled.findIndex((f) => f === null);
  const [chosen, setChosen] = useState<number | null>(null);
  const active = chosen !== null && filled[chosen] === null ? chosen : firstEmpty;
  const [flashKey, flash] = useFlash();

  const parts = data.text.split(/\[(\d+)\]/);
  const num = (i: number) => data.numbers?.[i] ?? i + 1;

  return (
    <div className="flex flex-col gap-4">
      <p className="rounded-box-l bg-surface-raised p-4 text-[17px] leading-[2.4]">
        {parts.map((part, k) => {
          if (k % 2 === 0) return <span key={k}>{part}</span>;
          const i = Number(part);
          const value = filled[i];
          if (value)
            return (
              <span key={k} className="rounded-box-xs bg-status-soft px-1.5 py-0.5 font-semibold">
                {value}
              </span>
            );
          return (
            <button
              key={k}
              type="button"
              onClick={() => setChosen(i)}
              aria-label={`Пропуск ${num(i)}${active === i ? ", выбран" : ""}`}
              aria-pressed={active === i}
              className={cn(
                "inline-block min-h-9 min-w-24 rounded-box-xs border-2 border-dashed px-2 align-middle leading-8",
                active === i ? "border-accent bg-surface-raised" : "border-line-strong bg-surface-page",
              )}
            >
              <span className="text-sm text-ink-muted">{num(i)}</span>
            </button>
          );
        })}
      </p>
      {active >= 0 && (
        <Dock>
          <Hint>Пропуск {num(active)} выбран. Нажмите на слово — или сначала на другой пропуск.</Hint>
          <div className="flex flex-wrap gap-2">
            {bank.map((word) => {
              const used = filled.includes(word);
              if (used) return null;
              return (
                <Chip
                  key={word}
                  state={flashKey === word ? "wrong" : "idle"}
                  onClick={() => {
                    if (active < 0) return;
                    if (data.answers[active] === word) {
                      const next = filled.map((f, i) => (i === active ? word : f));
                      setFilled(next);
                      setChosen(null);
                      if (next.every(Boolean)) onDone();
                      return;
                    }
                    flash(word);
                    onMistake(active);
                  }}
                >
                  {word}
                </Chip>
              );
            })}
          </div>
        </Dock>
      )}
    </div>
  );
}

/* ——— order: расставь по порядку, собери цепочку ——— */

export function Order({ data, seed, onMistake, onDone }: MechanicProps<Extract<TrainingData, { mechanic: "order" }>>) {
  const pool = useMemo(() => {
    const s = shuffle(data.items.map((_, i) => i), seed);
    // Перемешалось в верный порядок — сдвигаем, иначе нечего решать.
    return s.every((v, i) => v === i) ? [...s.slice(1), s[0]] : s;
  }, [data, seed]);
  const [placed, setPlaced] = useState(0);
  const [flashKey, flash] = useFlash();

  return (
    <div className="grid gap-4 sm:grid-cols-2">
      <ol className="flex flex-col gap-2">
        {data.items.slice(0, placed + 1).map((item, i) => (
          <li
            key={i}
            className={cn(
              "flex min-h-11 items-center gap-3 rounded-box-m border-2 px-3 py-2 text-[15px] leading-snug",
              i < placed ? "border-transparent bg-status-soft font-semibold" : "border-dashed border-line",
              i === placed && "border-accent",
            )}
          >
            <span className="w-5 shrink-0 text-center font-bold text-ink-muted">{i + 1}</span>
            {i < placed ? (
              <span className="flex flex-1 flex-wrap items-baseline justify-between gap-x-2">
                {item}
                {data.notes && <span className="text-[13px] font-bold text-status-ink">{data.notes[i]}</span>}
              </span>
            ) : (
              <span className="text-sm text-ink-subtle">что дальше?</span>
            )}
          </li>
        ))}
      </ol>
      <div className="flex flex-col gap-2">
        <Hint>Осталось: {data.items.length - placed}</Hint>
        {pool
          .filter((i) => i >= placed)
          .map((i) => (
            <Chip
              key={i}
              state={flashKey === String(i) ? "wrong" : "idle"}
              onClick={() => {
                if (i === placed) {
                  setPlaced(placed + 1);
                  if (placed + 1 === data.items.length) onDone();
                  return;
                }
                flash(String(i));
                onMistake(placed);
              }}
            >
              {data.items[i]}
            </Chip>
          ))}
      </div>
    </div>
  );
}

/* ——— sort: разложи по категориям ——— */

export function Sort({ data, seed, onMistake, onDone }: MechanicProps<Extract<TrainingData, { mechanic: "sort" }>>) {
  const pool = useMemo(() => shuffle(data.items.map((_, i) => i), seed), [data, seed]);
  const [sel, setSel] = useState<number | null>(null);
  const [done, setDone] = useState<number[]>([]);
  const [flashKey, flash] = useFlash();

  const drop = (ci: number) => {
    if (sel === null) return;
    if (data.items[sel].category === ci) {
      const next = [...done, sel];
      setDone(next);
      setSel(null);
      if (next.length === data.items.length) onDone();
      return;
    }
    flash(`i-${sel}`);
    onMistake(sel);
  };

  // Карточки остаются на месте и получают метку категории — список не прыгает.
  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-2">
        <Hint>Осталось {data.items.length - done.length}</Hint>
        <div className="flex flex-wrap gap-2">
          {pool.map((i) => {
            const placed = done.includes(i);
            return (
              <Chip
                key={i}
                state={placed ? "correct" : flashKey === `i-${i}` ? "wrong" : sel === i ? "selected" : "idle"}
                onClick={() => setSel(sel === i ? null : i)}
              >
                {data.items[i].text}
                {placed && <span className="block text-[13px] font-normal">→ {data.categories[data.items[i].category]}</span>}
              </Chip>
            );
          })}
        </div>
      </div>
      <Dock>
        <Hint>{sel === null ? "Сначала выберите карточку" : "Куда её?"}</Hint>
        <div className="grid grid-cols-3 gap-2">
          {data.categories.map((c, ci) => {
            const count = done.filter((i) => data.items[i].category === ci).length;
            return (
              <button
                key={c}
                type="button"
                disabled={sel === null}
                onClick={() => drop(ci)}
                className={cn(
                  "flex min-h-14 min-w-0 flex-col items-center justify-center rounded-box-m border-2 px-1 py-2 text-center text-[13px] font-bold leading-tight hyphens-auto transition-colors sm:text-sm",
                  sel !== null ? "border-accent bg-surface-raised hover:bg-accent-soft" : "border-line bg-surface-subtle text-ink-muted",
                )}
              >
                {c}
                <span className="mt-0.5 text-[12px] font-semibold text-ink-muted">{count ? `уже ${count}` : "пусто"}</span>
              </button>
            );
          })}
        </div>
      </Dock>
    </div>
  );
}

/* ——— fragments: найди ошибку ———
   Было: фрагменты подсвечивались при наведении. Стало: все кандидаты видны сразу
   (пунктир), нажатие — выбор. Так на телефоне видно, куда можно нажать. */

export function Fragments({ data, onMistake, onDone }: MechanicProps<Extract<TrainingData, { mechanic: "fragments" }>>) {
  const [found, setFound] = useState<number[]>([]);
  const [flashKey, flash] = useFlash();

  return (
    <div className="flex flex-col gap-3">
      <Hint>
        Найдено {found.length} из {data.errors}
      </Hint>
      <p className="rounded-box-l bg-surface-raised p-4 text-[17px] leading-[2.2]">
        {data.parts.map((part, k) => {
          if (typeof part === "string") return <span key={k}>{part}</span>;
          if (found.includes(k))
            return (
              <span key={k}>
                <s className="decoration-accent decoration-2">{part.text}</s>{" "}
                <span className="font-semibold">{part.fix}</span>
              </span>
            );
          return (
            <button
              key={k}
              type="button"
              onClick={() => {
                if (part.fix) {
                  const next = [...found, k];
                  setFound(next);
                  if (next.length === data.errors) onDone();
                  return;
                }
                flash(String(k));
                onMistake(k);
              }}
              data-status={flashKey === String(k) ? "negative" : undefined}
              className={cn(
                "rounded-box-xs px-0.5 py-1 underline decoration-dotted decoration-2 underline-offset-[6px] transition-colors",
                flashKey === String(k) ? "app-shake bg-status-soft decoration-[var(--status-border-default)]" : "decoration-line-strong hover:bg-surface-subtle",
              )}
            >
              {part.text}
            </button>
          );
        })}
      </p>
      {flashKey && <p className="text-sm font-semibold text-ink-accent">Здесь всё верно — ищите дальше.</p>}
    </div>
  );
}

/* ——— map: найди на карте, расставь на карте ———
   Было: зона на карте проявлялась, когда к ней подводят курсор. Стало: все точки
   видны и пронумерованы, каждая — кнопка 44 px. Подпись ставится нажатием. */

export function MapPlace({ data, seed, onMistake, onDone }: MechanicProps<Extract<TrainingData, { mechanic: "map" }>>) {
  // В работе над ошибками ставим только подписи с ошибками, остальные точки — как отвлекающие.
  const labels = useMemo(() => shuffle(data.only ?? data.pins.map((_, i) => i), seed), [data, seed]);
  const [sel, setSel] = useState<number | null>(null);
  const [done, setDone] = useState<number[]>([]);
  const [flashKey, flash] = useFlash();

  const place = (pin: number) => {
    if (sel === null) return;
    if (sel === pin) {
      const next = [...done, pin];
      setDone(next);
      setSel(null);
      if (next.length === labels.length) onDone();
      return;
    }
    flash(`p-${pin}`);
    onMistake(sel);
  };

  return (
    <div className="grid gap-4 lg:grid-cols-[minmax(0,3fr)_minmax(0,2fr)]">
      <div className="relative aspect-[320/300] w-full overflow-hidden rounded-box-l border border-line bg-surface-raised">
        <svg viewBox="0 0 320 300" className="absolute inset-0 size-full" aria-hidden>
          {/* Финский залив и Балтика, Азовское и Чёрное море — схема без масштаба. */}
          <path
            d="M0 0 L0 160 L22 120 L28 80 L30 42 L45 32 L80 38 L120 34 L150 27 L160 20 L150 14 L90 14 L40 18 L0 0 Z"
            className="fill-surface-subtle"
          />
          <path d="M190 300 L225 284 L262 288 L276 280 L300 285 L320 280 L320 300 Z" className="fill-surface-subtle" />
          <text x="8" y="120" className="fill-ink-muted text-[9px] italic">Балтийское</text>
          <text x="8" y="131" className="fill-ink-muted text-[9px] italic">море</text>
          {data.landmarks.map((l) => (
            <g key={l.label}>
              <rect x={l.x - 3} y={l.y - 3} width="6" height="6" className="fill-ink" />
              <text x={l.x + 6} y={l.y + 3} className="fill-ink text-[10px] font-semibold">
                {l.label}
              </text>
            </g>
          ))}
        </svg>
        {data.pins.map((p, i) => {
          const placed = done.includes(i);
          const align = p.x < 80 ? "left-0" : p.x > 240 ? "right-0" : "left-1/2 -translate-x-1/2";
          return (
            <div
              key={i}
              className="absolute -translate-x-1/2 -translate-y-1/2"
              style={{ left: `${(p.x / 320) * 100}%`, top: `${(p.y / 300) * 100}%` }}
            >
              <button
                type="button"
                disabled={placed}
                onClick={() => place(i)}
                aria-label={placed ? `Точка ${i + 1}: ${p.label}` : `Точка ${i + 1}`}
                className="grid size-11 place-items-center"
              >
                <span
                  data-status={flashKey === `p-${i}` ? "negative" : undefined}
                  className={cn(
                    "grid size-7 place-items-center rounded-full border-2 text-sm font-bold transition-colors",
                    placed
                      ? "border-transparent bg-status-soft"
                      : flashKey === `p-${i}`
                        ? "app-shake border-status-border bg-status-soft"
                        : sel !== null
                          ? "border-accent bg-accent text-accent-on"
                          : "border-ink bg-surface-raised",
                  )}
                >
                  {placed ? <Icon name="check-circle" variant="bold" size="min" className="text-status-ink" /> : i + 1}
                </span>
              </button>
              {placed && (
                <span
                  className={cn(
                    "pointer-events-none absolute top-full -mt-1 whitespace-nowrap rounded-box-xs bg-surface-raised px-1.5 py-0.5 text-[11px] font-bold",
                    align,
                  )}
                >
                  {p.year}
                </span>
              )}
            </div>
          );
        })}
      </div>
      {/* На телефоне подписи над картой: выбрал — и точка сразу под пальцем, без прокрутки. */}
      <div className="order-first flex flex-col gap-2 lg:order-none">
        <Hint>{sel === null ? "Выберите сражение" : "Теперь нажмите на точку на карте"}</Hint>
        <div className="flex flex-wrap gap-2 lg:flex-col">
          {labels.map((i) => (
            <Chip
              key={i}
              state={done.includes(i) ? "correct" : sel === i ? "selected" : "idle"}
              onClick={() => setSel(sel === i ? null : i)}
            >
              {data.pins[i].label}
              {done.includes(i) && (
                <span className="hidden text-[13px] font-normal lg:block">
                  {data.pins[i].year} — {data.pins[i].note}
                </span>
              )}
            </Chip>
          ))}
        </div>
      </div>
    </div>
  );
}
