import { notFound } from "next/navigation";
import { SurveyView } from "@/components/account/survey-view";
import type { Subject } from "@mocks/course";

/** Пробники, после которых есть анкета. В прототипе — первый, сданный 02.10. */
const PROBES: Record<string, { id: string; title: string }> = { "probe-1": { id: "probe-1", title: "Пробник №1" } };

export function generateStaticParams() {
  return Object.keys(PROBES).map((id) => ({ id }));
}

// B21 — анкета после пробника.
export default function SurveyPage({ params }: { params: { subject: Subject; id: string } }) {
  const probe = PROBES[params.id];
  if (!probe) notFound();
  return <SurveyView subject={params.subject} probe={probe} />;
}
