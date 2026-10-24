import { notFound } from "next/navigation";
import { LessonView } from "@/components/lesson/lesson-view";
import { COURSES, findLesson, type Subject } from "@mocks/course";

export function generateStaticParams({ params }: { params: { subject: Subject } }) {
  return COURSES[params.subject].weeks.flatMap((w) => w.lessons.map((l) => ({ id: l.id })));
}

// B3 — урок.
export default function LessonPage({ params }: { params: { subject: Subject; id: string } }) {
  const found = findLesson(params.subject, params.id);
  if (!found) notFound();
  return <LessonView subject={params.subject} lessonId={params.id} />;
}
