import { MentorEntry } from "@/components/mentor/mentor-waiting";
import type { Subject } from "@mocks/course";

// Мой наставник и сообщения.
export default function MentorPage({ params }: { params: { subject: Subject } }) {
  return <MentorEntry subject={params.subject} />;
}
