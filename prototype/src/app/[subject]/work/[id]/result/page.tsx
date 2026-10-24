import { notFound } from "next/navigation";
import { WorkResult } from "@/components/work/work-result";
import { findItem, type Subject } from "@mocks/course";
import { WORKS } from "@mocks/works";

export function generateStaticParams({ params }: { params: { subject: Subject } }) {
  return Object.keys(WORKS)
    .filter((id) => id.startsWith(`${params.subject}-`))
    .map((id) => ({ id }));
}

// B5 — результат теста, B6 — проверка куратором, B7 — самопроверка.
export default function WorkResultPage({ params }: { params: { subject: Subject; id: string } }) {
  if (!WORKS[params.id] || !findItem(params.subject, params.id)) notFound();
  return <WorkResult subject={params.subject} id={params.id} />;
}
