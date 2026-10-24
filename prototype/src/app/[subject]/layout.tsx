import { notFound } from "next/navigation";
import type { ReactNode } from "react";
import { AppShell } from "@/components/shell/app-shell";
import { ProgressProvider } from "@/lib/progress";
import { MistakesProvider } from "@/lib/mistakes";
import { WorksProvider } from "@/lib/works";
import { isSubject } from "@mocks/course";

export function generateStaticParams() {
  return [{ subject: "soc" }, { subject: "hist" }];
}

// Предмет — мода Box UI. data-theme ставим рядом с data-accent: токены темы
// разрешаются там, где объявлены, и без этого акцент предмета до них не дотянется.
export default function SubjectLayout({ children, params }: { children: ReactNode; params: { subject: string } }) {
  if (!isSubject(params.subject)) notFound();
  return (
    <div data-theme="light" data-accent={params.subject} className="min-h-dvh bg-surface-page text-ink">
      <ProgressProvider>
        <WorksProvider>
          <MistakesProvider>
            <AppShell subject={params.subject}>{children}</AppShell>
          </MistakesProvider>
        </WorksProvider>
      </ProgressProvider>
    </div>
  );
}
