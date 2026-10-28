import { ChatsView } from "@/components/chats/chats-view";
import type { Subject } from "@mocks/course";

// Чаты мини-группы и курса.
export default function ChatsPage({ params }: { params: { subject: Subject } }) {
  return <ChatsView subject={params.subject} />;
}
