import { RecheckView } from "@/components/account/recheck-view";
import type { Subject } from "@mocks/course";

// Перепроверка бланков ЕГЭ.
export default function RecheckPage({ params }: { params: { subject: Subject } }) {
  return <RecheckView subject={params.subject} />;
}
