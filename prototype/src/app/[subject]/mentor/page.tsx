import { MentorView } from "@/components/mentor/mentor-view";
import type { Subject } from "@mocks/course";

// B17 — мой наставник и сообщения.
export default function MentorPage({ params }: { params: { subject: Subject } }) {
  return <MentorView subject={params.subject} />;
}
