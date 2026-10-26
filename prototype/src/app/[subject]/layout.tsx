import { notFound } from "next/navigation";
import type { ReactNode } from "react";
import { AppShell } from "@/components/shell/app-shell";
import { accentOf } from "@/lib/style";
import { ProgressProvider } from "@/lib/progress";
import { BookingsProvider } from "@/lib/bookings";
import { DistributionProvider } from "@/lib/distribution";
import { MistakesProvider } from "@/lib/mistakes";
import { NotificationsProvider } from "@/lib/notifications";
import { PaymentProvider } from "@/lib/payment";
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
    <div data-theme="light" data-accent={accentOf(params.subject)} className="min-h-dvh bg-surface-page text-ink">
      <DistributionProvider>
        <ProgressProvider>
          <WorksProvider>
            <MistakesProvider>
              <BookingsProvider>
                <PaymentProvider>
                  <NotificationsProvider>
                    <AppShell subject={params.subject}>{children}</AppShell>
                  </NotificationsProvider>
                </PaymentProvider>
              </BookingsProvider>
            </MistakesProvider>
          </WorksProvider>
        </ProgressProvider>
      </DistributionProvider>
    </div>
  );
}
