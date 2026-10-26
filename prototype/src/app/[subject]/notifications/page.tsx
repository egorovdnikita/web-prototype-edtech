import { NotificationsView } from "@/components/account/notifications-view";
import type { Subject } from "@mocks/course";

// A5 — уведомления.
export default function NotificationsPage({ params }: { params: { subject: Subject } }) {
  return <NotificationsView subject={params.subject} />;
}
