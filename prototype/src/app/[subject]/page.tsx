import { WithRail } from "@/components/shell/app-shell";
import { GradebookCard, MentorCard, PaymentCard } from "@/components/plan/side-cards";
import { WeekPlanner } from "@/components/plan/week-planner";
import type { Subject } from "@mocks/course";

// Главная ученика = планер недели.
export default function WeekPage({ params }: { params: { subject: Subject } }) {
  return (
    <WithRail
      rail={
        <>
          <GradebookCard subject={params.subject} />
          <MentorCard subject={params.subject} />
          <PaymentCard subject={params.subject} />
        </>
      }
    >
      <WeekPlanner subject={params.subject} />
    </WithRail>
  );
}
