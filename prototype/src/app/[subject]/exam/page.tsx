import { ExamRoom } from "@/components/mentor/exam-room";
import type { Subject } from "@mocks/course";

// Зачёт по видеосвязи.
export default function ExamPage({ params }: { params: { subject: Subject } }) {
  return <ExamRoom subject={params.subject} />;
}
