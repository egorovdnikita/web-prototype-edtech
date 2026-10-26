import { notFound } from "next/navigation";
import { TrainingPlayer } from "@/components/training/training-player";
import type { Subject } from "@mocks/course";
import { TRAININGS, findTraining } from "@mocks/trainings";

export function generateStaticParams({ params }: { params: { subject: Subject } }) {
  return TRAININGS.filter((t) => t.subject === params.subject).map((t) => ({ id: t.id }));
}

// B8 + B10 — перерешивание тренировки: только элементы, где были ошибки.
export default function TrainingMistakesPage({ params }: { params: { subject: Subject; id: string } }) {
  const training = findTraining(params.id);
  if (!training || training.subject !== params.subject) notFound();
  return <TrainingPlayer subject={params.subject} training={training} mode="mistakes" />;
}
