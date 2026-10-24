import { WithRail } from "@/components/shell/app-shell";
import { GradebookCard, MentorCard } from "@/components/plan/side-cards";
import { WeekPlanner } from "@/components/plan/week-planner";
import type { Subject } from "@mocks/course";

// B1 — главная ученика = планер недели (рекомендация разбора, раздел 5).
export default function WeekPage({ params }: { params: { subject: Subject } }) {
  return (
    <WithRail
      rail={
        <>
          <GradebookCard subject={params.subject} />
          <MentorCard subject={params.subject} />
        </>
      }
    >
      <WeekPlanner subject={params.subject} />
    </WithRail>
  );
}
