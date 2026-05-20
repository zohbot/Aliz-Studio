import Link from "next/link";
import { CalendarClock, CheckCircle2, CreditCard, ReceiptText, Scissors } from "lucide-react";
import { getAppointmentById } from "@/lib/appointments";
import { formatMoney, getService } from "@/lib/services";

type ConfirmationPageProps = {
  searchParams: Promise<{
    appointment?: string;
    date?: string;
    deposit?: string;
    paid?: string;
    receipt?: string;
    service?: string;
    time?: string;
  }>;
};

function formatDate(dateId?: string) {
  if (!dateId) {
    return "Selected date";
  }

  const [year, month, day] = dateId.split("-").map(Number);

  return new Intl.DateTimeFormat("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric"
  }).format(new Date(year, month - 1, day));
}

export default async function ConfirmationPage({ searchParams }: ConfirmationPageProps) {
  const params = await searchParams;
  const appointment = params.appointment ? await getAppointmentById(params.appointment) : null;
  const service = appointment ? getService(appointment.serviceId) : params.service ? getService(params.service) : undefined;
  const deposit = Number(params.deposit || appointment?.deposit || service?.deposit || 0);
  const paid = params.paid === "1" || appointment?.paymentStatus === "paid";

  return (
    <section className="confirmation-panel">
      <CheckCircle2 size={34} />
      <p className="section-kicker">{paid ? "Appointment confirmed" : "Appointment held"}</p>
      <h1>{paid ? "Your appointment is confirmed." : "Your spot is ready for deposit."}</h1>
      <p>
        {paid
          ? "Your mock deposit has been recorded, and the owner dashboard now shows this appointment as paid and confirmed."
          : "Your appointment request is now in the owner dashboard. In production, Square will collect the deposit here and the webhook will mark the appointment paid automatically."}
      </p>

      <dl className="confirmation-details">
        <div>
          <dt>
            <Scissors size={16} />
            Service
          </dt>
          <dd>{appointment?.serviceName || service?.name || "Selected service"}</dd>
        </div>
        <div>
          <dt>
            <CalendarClock size={16} />
            Time
          </dt>
          <dd>
            {formatDate(appointment?.appointmentDate || params.date)}
            {appointment?.appointmentTime || params.time ? ` at ${appointment?.appointmentTime || params.time}` : ""}
          </dd>
        </div>
        <div>
          <dt>
            <CreditCard size={16} />
            Deposit status
          </dt>
          <dd>
            {formatMoney(deposit)}
            {paid ? " paid" : " due"}
          </dd>
        </div>
        {params.receipt ? (
          <div>
            <dt>
              <ReceiptText size={16} />
              Receipt
            </dt>
            <dd>{params.receipt}</dd>
          </div>
        ) : null}
      </dl>

      {params.appointment ? <p className="confirmation-reference">Reference: {params.appointment}</p> : null}

      <div className="confirmation-actions">
        <Link className="primary-action" href="/book">
          Book another service
        </Link>
        <Link className="secondary-action" href="/owner/dashboard">
          View owner dashboard
        </Link>
      </div>
    </section>
  );
}
