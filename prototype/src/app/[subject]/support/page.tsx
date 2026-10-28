import { SupportView } from "@/components/account/support-view";
import type { Subject } from "@mocks/course";

// Техподдержка.
export default function SupportPage({ params }: { params: { subject: Subject } }) {
  return <SupportView subject={params.subject} />;
}
