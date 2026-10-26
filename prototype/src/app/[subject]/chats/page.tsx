import { ChatsView } from "@/components/chats/chats-view";
import type { Subject } from "@mocks/course";

// B19 — чаты мини-группы и курса.
export default function ChatsPage({ params }: { params: { subject: Subject } }) {
  return <ChatsView subject={params.subject} />;
}
