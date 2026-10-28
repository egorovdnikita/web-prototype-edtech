import { notFound } from "next/navigation";
import { RecordingView } from "@/components/meetings/recording-view";
import type { Subject } from "@mocks/course";
import { EVENTS } from "@mocks/meetings";
import { RECORDINGS } from "@mocks/recordings";

export function generateStaticParams({ params }: { params: { subject: Subject } }) {
  return Object.keys(RECORDINGS)
    .filter((id) => EVENTS.find((e) => e.id === id)?.subject === params.subject)
    .map((id) => ({ id }));
}

// Запись встречи: видео, таймкоды, чат, задачник.
export default function RecordingPage({ params }: { params: { subject: Subject; id: string } }) {
  const recording = RECORDINGS[params.id];
  if (!recording || EVENTS.find((e) => e.id === params.id)?.subject !== params.subject) notFound();
  return <RecordingView subject={params.subject} recording={recording} />;
}
