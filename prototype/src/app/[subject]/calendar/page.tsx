import { Suspense } from "react";
import { CalendarView } from "@/components/calendar/calendar-view";
import type { Subject } from "@mocks/course";

// B14 — календарь, B15 — запись на встречу (окно поверх календаря, ?e=<id>).
export default function CalendarPage({ params }: { params: { subject: Subject } }) {
  return (
    <Suspense>
      <CalendarView subject={params.subject} />
    </Suspense>
  );
}
