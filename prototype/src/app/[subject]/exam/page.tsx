import { ExamRoom } from "@/components/mentor/exam-room";
import type { Subject } from "@mocks/course";

// B18 — зачёт по видеосвязи.
export default function ExamPage({ params }: { params: { subject: Subject } }) {
  return <ExamRoom subject={params.subject} />;
}
