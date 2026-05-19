import Link from "next/link";
import { CalendarClock, CheckCircle2, CreditCard, Scissors } from "lucide-react";
import { formatMoney, getService } from "@/lib/services";

type ConfirmationPageProps = {
  searchParams: Promise<{
    appointment?: string;
    date?: string;
    deposit?: string;
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
  const service = params.service ? getService(params.service) : undefined;
  const deposit = Number(params.deposit || service?.deposit || 0);

  return (
    <section className="confirmation-panel">
      <CheckCircle2 size={34} />
      <p className="section-kicker">Appointment held</p>
      <h1>Your spot is ready for deposit.</h1>
      <p>
        Your appointment request is now in the owner dashboard. In production, Square will collect
        the deposit here and the webhook will mark the appointment paid automatically.
      </p>

      <dl className="confirmation-details">
        <div>
          <dt>
            <Scissors size={16} />
            Service
          </dt>
          <dd>{service?.name || "Selected service"}</dd>
        </div>
        <div>
          <dt>
            <CalendarClock size={16} />
            Time
          </dt>
          <dd>
            {formatDate(params.date)}
            {params.time ? ` at ${params.time}` : ""}
          </dd>
        </div>
        <div>
          <dt>
            <CreditCard size={16} />
            Deposit
          </dt>
          <dd>{formatMoney(deposit)}</dd>
        </div>
      </dl>

      {params.appointment ? <p className="confirmation-reference">Reference: {params.appointment}</p> : null}

      <Link className="primary-action" href="/book">
        Book another service
      </Link>
    </section>
  );
}
