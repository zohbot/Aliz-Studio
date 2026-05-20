import type { Metadata } from "next";
import Link from "next/link";
import { AlertCircle } from "lucide-react";
import { MockCheckout } from "@/components/mock-checkout";
import { getAppointmentById } from "@/lib/appointments";

export const metadata: Metadata = {
  title: "Checkout"
};

type CheckoutPageProps = {
  searchParams: Promise<{
    appointment?: string;
  }>;
};

export default async function CheckoutPage({ searchParams }: CheckoutPageProps) {
  const params = await searchParams;
  const appointment = params.appointment ? await getAppointmentById(params.appointment) : null;

  if (!appointment) {
    return (
      <section className="confirmation-panel">
        <AlertCircle size={34} />
        <p className="section-kicker">Checkout unavailable</p>
        <h1>We could not find that appointment.</h1>
        <p>Start a new booking to reserve a current time slot and continue to the mock checkout.</p>
        <Link className="primary-action" href="/book">
          Start booking
        </Link>
      </section>
    );
  }

  return <MockCheckout appointment={appointment} />;
}
