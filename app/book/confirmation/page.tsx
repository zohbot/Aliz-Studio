import Link from "next/link";
import { CheckCircle2 } from "lucide-react";

export default function ConfirmationPage() {
  return (
    <section className="confirmation-panel">
      <CheckCircle2 size={34} />
      <p className="section-kicker">Deposit route preview</p>
      <h1>Booking request received.</h1>
      <p>
        In the live integration, this page will confirm Square payment status, store the appointment,
        and trigger owner notifications.
      </p>
      <Link className="primary-action" href="/book">
        Book another service
      </Link>
    </section>
  );
}
