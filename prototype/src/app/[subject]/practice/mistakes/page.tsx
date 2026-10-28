import { MistakesView } from "@/components/practice/mistakes-view";
import type { Subject } from "@mocks/course";

// Работа над ошибками.
export default function MistakesPage({ params }: { params: { subject: Subject } }) {
  return <MistakesView subject={params.subject} />;
}
