import { Welcome } from "@/components/account/demo-week";
import type { Subject } from "@mocks/course";

// Первый вход после покупки.
export default function WelcomePage({ params }: { params: { subject: Subject } }) {
  return <Welcome subject={params.subject} />;
}
