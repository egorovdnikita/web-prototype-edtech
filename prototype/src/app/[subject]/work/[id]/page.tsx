import { notFound } from "next/navigation";
import { WorkSolve } from "@/components/work/work-solve";
import { findItem, type Subject } from "@mocks/course";
import { WORKS } from "@mocks/works";

export function generateStaticParams({ params }: { params: { subject: Subject } }) {
  return Object.keys(WORKS)
    .filter((id) => id.startsWith(`${params.subject}-`))
    .map((id) => ({ id }));
}

// B4 — решение работы.
export default function WorkPage({ params }: { params: { subject: Subject; id: string } }) {
  if (!WORKS[params.id] || !findItem(params.subject, params.id)) notFound();
  return <WorkSolve subject={params.subject} id={params.id} />;
}
