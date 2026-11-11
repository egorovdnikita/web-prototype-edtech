import type { Subject } from "@mocks/course";
import { PaymentView } from "@/components/payment/payment-view";

// Оплата общая для обоих предметов; поддержка открывается в текущем предмете.
export default function PaymentPage({ params }: { params: { subject: Subject } }) {
  return <PaymentView subject={params.subject} />;
}
