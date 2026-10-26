import { notFound } from "next/navigation";
import { TrainerSession } from "@/components/practice/trainer-session";
import type { Subject } from "@mocks/course";
import { TRAINER, type TrainerSet } from "@mocks/trainer";

export function generateStaticParams({ params }: { params: { subject: Subject } }) {
  const tasks = TRAINER[params.subject]?.tasks ?? [];
  if (!tasks.length) return [];
  const numbers = Array.from(new Set(tasks.map((t) => t.ege)));
  return [...numbers.map((n) => ({ set: `n${n}` })), { set: "weak" }, { set: "mix" }];
}

// Подборка тренажёра: номер, слабые номера или микс.
export default function TrainerSetPage({ params }: { params: { subject: Subject; set: string } }) {
  const tasks = TRAINER[params.subject]?.tasks ?? [];
  const valid =
    params.set === "weak" || params.set === "mix" || tasks.some((t) => `n${t.ege}` === params.set);
  if (!tasks.length || !valid) notFound();
  return <TrainerSession subject={params.subject} set={params.set as TrainerSet} />;
}
