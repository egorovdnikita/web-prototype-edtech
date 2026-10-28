import { ProgramTabs } from "@/components/program/program-tabs";
import { MaterialsView } from "@/components/program/materials-view";
import { COURSES, SUBJECTS, type Subject } from "@mocks/course";

// Материалы курса — библиотека, конспекты, шпаргалки, разборы, мини-курсы, сессии.
export default function MaterialsPage({ params }: { params: { subject: Subject } }) {
  const course = COURSES[params.subject];
  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-5">
      <header>
        <h1 className="app-display text-[28px] leading-tight sm:text-[34px]">программа курса</h1>
        <p className="text-sm text-ink-muted">
          {SUBJECTS[params.subject].title} · {course.product} · тариф «{course.tariff}»
        </p>
      </header>
      <ProgramTabs subject={params.subject} active="materials" />
      <MaterialsView subject={params.subject} />
    </div>
  );
}
