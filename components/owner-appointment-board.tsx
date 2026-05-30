"use client";

import { useMemo, useState } from "react";
import { CalendarClock, CheckCircle2, CircleDollarSign, LogOut, Save, Search } from "lucide-react";
import type { Appointment, AppointmentStatus, PaymentStatus } from "@/lib/domain";
import { formatMoney } from "@/lib/services";

type OwnerAppointmentBoardProps = {
  initialAppointments: Appointment[];
};

const appointmentStatuses: { value: AppointmentStatus; label: string }[] = [
  { value: "pending_deposit", label: "Pending deposit" },
  { value: "confirmed", label: "Confirmed" },
  { value: "completed", label: "Completed" },
  { value: "cancelled", label: "Cancelled" },
  { value: "no_show", label: "No show" }
];

const paymentStatuses: { value: PaymentStatus; label: string }[] = [
  { value: "pending", label: "Pending" },
  { value: "paid", label: "Paid" },
  { value: "refunded", label: "Refunded" }
];

function formatDate(dateId: string) {
  const [year, month, day] = dateId.split("-").map(Number);

  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric"
  }).format(new Date(year, month - 1, day));
}

export function OwnerAppointmentBoard({ initialAppointments }: OwnerAppointmentBoardProps) {
  const [appointments, setAppointments] = useState(initialAppointments);
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | AppointmentStatus>("all");
  const [savingId, setSavingId] = useState("");
  const [message, setMessage] = useState("");

  const visibleAppointments = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();

    return appointments.filter((appointment) => {
      const matchesStatus = statusFilter === "all" || appointment.status === statusFilter;
      const matchesQuery =
        !normalizedQuery ||
        appointment.customerName.toLowerCase().includes(normalizedQuery) ||
        appointment.serviceName.toLowerCase().includes(normalizedQuery) ||
        appointment.customerPhone.toLowerCase().includes(normalizedQuery);

      return matchesStatus && matchesQuery;
    });
  }, [appointments, query, statusFilter]);

  async function updateLocalAppointment(
    appointmentId: string,
    patch: Partial<Pick<Appointment, "status" | "paymentStatus" | "ownerNotes">>
  ) {
    setAppointments((current) =>
      current.map((appointment) =>
        appointment.id === appointmentId ? { ...appointment, ...patch } : appointment
      )
    );
  }

  async function saveAppointment(appointment: Appointment) {
    setSavingId(appointment.id);
    setMessage("");

    const response = await fetch(`/api/owner/appointments/${appointment.id}`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        status: appointment.status,
        paymentStatus: appointment.paymentStatus,
        ownerNotes: appointment.ownerNotes || ""
      })
    });
    const payload = await response.json();

    setSavingId("");

    if (!response.ok) {
      setMessage(payload.error || "Could not save appointment.");
      return;
    }

    updateLocalAppointment(appointment.id, payload.appointment);
    setMessage("Appointment saved.");
  }

  async function logout() {
    await fetch("/api/owner/auth/logout", {
      method: "POST"
    });
    window.location.assign("/owner/login");
  }

  return (
    <section className="owner-board" aria-label="Owner appointment manager">
      <div className="owner-toolbar">
        <label className="owner-search">
          <Search size={18} />
          <input
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search client, service, or phone"
            type="search"
            value={query}
          />
        </label>

        <select
          aria-label="Filter by appointment status"
          onChange={(event) => setStatusFilter(event.target.value as "all" | AppointmentStatus)}
          value={statusFilter}
        >
          <option value="all">All appointments</option>
          {appointmentStatuses.map((status) => (
            <option key={status.value} value={status.value}>
              {status.label}
            </option>
          ))}
        </select>

        <button className="secondary-action owner-logout" onClick={logout} type="button">
          <LogOut size={17} />
          Logout
        </button>
      </div>

      {message ? <p className="owner-message">{message}</p> : null}

      <div className="appointment-list">
        {visibleAppointments.map((appointment) => (
          <article className="appointment-card" key={appointment.id}>
            <div className="appointment-card__topline">
              <span className={`status-badge status-badge--${appointment.status}`}>
                {appointmentStatuses.find((status) => status.value === appointment.status)?.label}
              </span>
              <span className="appointment-card__id">{appointment.id}</span>
            </div>

            <div className="appointment-card__main">
              <div>
                <h2>{appointment.customerName}</h2>
                <p>{appointment.serviceName}</p>
              </div>
              <div className="appointment-money">
                <strong>{formatMoney(appointment.price)}</strong>
                <span>{formatMoney(appointment.deposit)} deposit</span>
              </div>
            </div>

            <div className="appointment-meta-grid">
              <span>
                <CalendarClock size={16} />
                {formatDate(appointment.appointmentDate)} at {appointment.appointmentTime}
              </span>
              <span>
                <CheckCircle2 size={16} />
                {appointment.durationMinutes} minutes
              </span>
              <span>
                <CircleDollarSign size={16} />
                {appointment.paymentStatus}
              </span>
            </div>

            <dl className="appointment-contact">
              <div>
                <dt>Email</dt>
                <dd>{appointment.customerEmail}</dd>
              </div>
              <div>
                <dt>Phone</dt>
                <dd>{appointment.customerPhone}</dd>
              </div>
              <div>
                <dt>Customer notes</dt>
                <dd>{appointment.customerNotes || "None"}</dd>
              </div>
            </dl>

            <div className="appointment-controls">
              <label>
                Appointment status
                <select
                  onChange={(event) =>
                    updateLocalAppointment(appointment.id, {
                      status: event.target.value as AppointmentStatus
                    })
                  }
                  value={appointment.status}
                >
                  {appointmentStatuses.map((status) => (
                    <option key={status.value} value={status.value}>
                      {status.label}
                    </option>
                  ))}
                </select>
              </label>

              <label>
                Payment status
                <select
                  onChange={(event) =>
                    updateLocalAppointment(appointment.id, {
                      paymentStatus: event.target.value as PaymentStatus
                    })
                  }
                  value={appointment.paymentStatus}
                >
                  {paymentStatuses.map((status) => (
                    <option key={status.value} value={status.value}>
                      {status.label}
                    </option>
                  ))}
                </select>
              </label>

              <label className="appointment-controls__notes">
                Owner notes
                <textarea
                  onChange={(event) =>
                    updateLocalAppointment(appointment.id, {
                      ownerNotes: event.target.value
                    })
                  }
                  value={appointment.ownerNotes || ""}
                />
              </label>
            </div>

            <div className="appointment-card__actions">
              {appointment.squareCheckoutUrl ? (
                <a className="secondary-action" href={appointment.squareCheckoutUrl}>
                  Square checkout
                </a>
              ) : null}
              <button
                className="primary-action"
                disabled={savingId === appointment.id}
                onClick={() => saveAppointment(appointment)}
                type="button"
              >
                <Save size={17} />
                {savingId === appointment.id ? "Saving..." : "Save"}
              </button>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
