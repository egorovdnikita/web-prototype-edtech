import { DemoWeek } from "@/components/account/demo-week";
import type { Subject } from "@mocks/course";

// Демонеделя до покупки.
export default function DemoPage({ params }: { params: { subject: Subject } }) {
  return <DemoWeek subject={params.subject} />;
}
