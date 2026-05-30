"use client";

import { useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  CalendarClock,
  CalendarPlus,
  CheckCircle2,
  CircleDollarSign,
  Clock3,
  CreditCard,
  Hash,
  LogOut,
  Mail,
  NotebookText,
  Phone,
  Save,
  Search,
  X
} from "lucide-react";
import type { Appointment, AppointmentStatus, PaymentStatus } from "@/lib/domain";
import { formatMoney } from "@/lib/services";

type OwnerAppointmentBoardProps = {
  initialAppointments: Appointment[];
};

const appointmentStatuses: { value: AppointmentStatus; label: string }[] = [
  { value: "pending_deposit", label: "Pending deposit" },
  { value: "confirmed", label: "Confirmed" },
  { value: "completed", label: "Completed" },
  { value: "cancelled", label: "Canceled" },
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

function formatTimestamp(timestamp: string) {
  const date = new Date(timestamp);

  if (Number.isNaN(date.getTime())) {
    return "Not available";
  }

  return new Intl.DateTimeFormat("en-US", {
    dateStyle: "medium",
    timeStyle: "short"
  }).format(date);
}

function getStatusLabel(status: AppointmentStatus) {
  return appointmentStatuses.find((item) => item.value === status)?.label || status;
}

function getPaymentLabel(paymentStatus: PaymentStatus) {
  return paymentStatuses.find((item) => item.value === paymentStatus)?.label || paymentStatus;
}

function getPaymentSummary(appointment: Appointment) {
  if (appointment.paymentStatus === "paid") {
    return `Mock deposit marked paid: ${formatMoney(appointment.deposit)}.`;
  }

  if (appointment.paymentStatus === "refunded") {
    return `Mock deposit marked refunded: ${formatMoney(appointment.deposit)}.`;
  }

  return `Mock deposit pending: ${formatMoney(appointment.deposit)} not collected.`;
}

export function OwnerAppointmentBoard({ initialAppointments }: OwnerAppointmentBoardProps) {
  const router = useRouter();
  const appointmentDraftsRef = useRef(
    new Map(initialAppointments.map((appointment) => [appointment.id, appointment]))
  );
  const [appointments, setAppointments] = useState(initialAppointments);
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | AppointmentStatus>("all");
  const [savingId, setSavingId] = useState("");
  const [message, setMessage] = useState("");
  const [selectedAppointmentId, setSelectedAppointmentId] = useState("");

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

  const selectedAppointment = useMemo(
    () => appointments.find((appointment) => appointment.id === selectedAppointmentId) || null,
    [appointments, selectedAppointmentId]
  );

  async function updateLocalAppointment(
    appointmentId: string,
    patch: Partial<Pick<Appointment, "status" | "paymentStatus" | "ownerNotes">>
  ) {
    const currentDraft =
      appointmentDraftsRef.current.get(appointmentId) ||
      appointments.find((appointment) => appointment.id === appointmentId);

    if (currentDraft) {
      appointmentDraftsRef.current.set(appointmentId, { ...currentDraft, ...patch });
    }

    setAppointments((current) =>
      current.map((appointment) =>
        appointment.id === appointmentId ? { ...appointment, ...patch } : appointment
      )
    );
  }

  async function saveAppointment(appointment: Appointment) {
    const appointmentDraft = appointmentDraftsRef.current.get(appointment.id) || appointment;

    setSavingId(appointment.id);
    setMessage("");

    const response = await fetch(`/api/owner/appointments/${appointment.id}`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        status: appointmentDraft.status,
        paymentStatus: appointmentDraft.paymentStatus,
        ownerNotes: appointmentDraft.ownerNotes || ""
      })
    });
    const payload = await response.json();

    setSavingId("");

    if (!response.ok) {
      setMessage(payload.error || "Could not save appointment.");
      return;
    }

    appointmentDraftsRef.current.set(appointment.id, payload.appointment);
    updateLocalAppointment(appointment.id, payload.appointment);
    setMessage("Appointment saved.");
    router.refresh();
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
        {visibleAppointments.length ? (
          visibleAppointments.map((appointment) => (
            <article className="appointment-card" key={appointment.id}>
              <div className="appointment-card__topline">
                <span className={`status-badge status-badge--${appointment.status}`}>
                  {getStatusLabel(appointment.status)}
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
                  Mock deposit: {getPaymentLabel(appointment.paymentStatus)}
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
                    maxLength={800}
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
                <button
                  className="secondary-action"
                  onClick={() => setSelectedAppointmentId(appointment.id)}
                  type="button"
                >
                  <NotebookText size={17} />
                  View details
                </button>
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
          ))
        ) : (
          <article className="appointment-empty-state">
            <strong>No appointments match this view.</strong>
            <p>Try clearing the search field or switching the status filter.</p>
          </article>
        )}
      </div>

      {selectedAppointment ? (
        <div className="appointment-detail-backdrop">
          <aside
            aria-labelledby="appointment-detail-title"
            aria-modal="true"
            className="appointment-detail-drawer"
            role="dialog"
          >
            <div className="appointment-detail-drawer__topline">
              <span className={`status-badge status-badge--${selectedAppointment.status}`}>
                {getStatusLabel(selectedAppointment.status)}
              </span>
              <button
                aria-label="Close appointment details"
                className="appointment-detail-drawer__close"
                onClick={() => setSelectedAppointmentId("")}
                type="button"
              >
                <X size={18} />
              </button>
            </div>

            <div className="appointment-detail-drawer__header">
              <div>
                <p className="section-kicker">Appointment detail</p>
                <h2 id="appointment-detail-title">{selectedAppointment.customerName}</h2>
                <p>{selectedAppointment.serviceName}</p>
              </div>
              <div className="appointment-detail-drawer__price">
                <strong>{formatMoney(selectedAppointment.price)}</strong>
                <span>{selectedAppointment.durationMinutes} minutes</span>
              </div>
            </div>

            <div className="appointment-detail-pill-grid" aria-label="Appointment summary">
              <article className="appointment-detail-stat">
                <span className="appointment-detail-stat__icon">
                  <CalendarClock size={16} />
                </span>
                <div>
                  <p>Date and time</p>
                  <strong>
                    {formatDate(selectedAppointment.appointmentDate)} at {selectedAppointment.appointmentTime}
                  </strong>
                </div>
              </article>
              <article className="appointment-detail-stat">
                <span className="appointment-detail-stat__icon">
                  <CircleDollarSign size={16} />
                </span>
                <div>
                  <p>Mock deposit</p>
                  <strong>{getPaymentSummary(selectedAppointment)}</strong>
                </div>
              </article>
              <article className="appointment-detail-stat">
                <span className="appointment-detail-stat__icon">
                  <Clock3 size={16} />
                </span>
                <div>
                  <p>Last updated</p>
                  <strong>{formatTimestamp(selectedAppointment.updatedAt)}</strong>
                </div>
              </article>
            </div>

            <dl className="appointment-detail-list">
              <div>
                <dt>
                  <Phone size={15} />
                  Phone
                </dt>
                <dd>{selectedAppointment.customerPhone || "Not provided"}</dd>
              </div>
              <div>
                <dt>
                  <Mail size={15} />
                  Email
                </dt>
                <dd>{selectedAppointment.customerEmail || "Not provided"}</dd>
              </div>
              <div>
                <dt>
                  <CalendarPlus size={15} />
                  Created
                </dt>
                <dd>{formatTimestamp(selectedAppointment.createdAt)}</dd>
              </div>
              <div>
                <dt>
                  <Hash size={15} />
                  Appointment ID
                </dt>
                <dd>{selectedAppointment.id}</dd>
              </div>
            </dl>

            <div className="appointment-detail-note-grid">
              <article>
                <span>
                  <NotebookText size={15} />
                  Customer notes
                </span>
                <p>{selectedAppointment.customerNotes || "No customer notes were provided."}</p>
              </article>
              <article>
                <span>
                  <CreditCard size={15} />
                  Payment note
                </span>
                <p>
                  This is a demo/mock deposit record only. Do not treat it as a real card charge until
                  production Square reconciliation is connected.
                </p>
              </article>
            </div>

            <div className="appointment-controls appointment-controls--detail">
              <label>
                Appointment status
                <select
                  onChange={(event) =>
                    updateLocalAppointment(selectedAppointment.id, {
                      status: event.target.value as AppointmentStatus
                    })
                  }
                  value={selectedAppointment.status}
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
                    updateLocalAppointment(selectedAppointment.id, {
                      paymentStatus: event.target.value as PaymentStatus
                    })
                  }
                  value={selectedAppointment.paymentStatus}
                >
                  {paymentStatuses.map((status) => (
                    <option key={status.value} value={status.value}>
                      Mock {status.label.toLowerCase()}
                    </option>
                  ))}
                </select>
              </label>

              <label className="appointment-controls__notes">
                Owner notes
                <textarea
                  maxLength={800}
                  onChange={(event) =>
                    updateLocalAppointment(selectedAppointment.id, {
                      ownerNotes: event.target.value
                    })
                  }
                  placeholder="Add internal notes for the owner. These are not customer-facing."
                  value={selectedAppointment.ownerNotes || ""}
                />
              </label>
            </div>

            <div className="appointment-detail-drawer__actions">
              <button
                className="secondary-action"
                onClick={() => setSelectedAppointmentId("")}
                type="button"
              >
                Close
              </button>
              <button
                className="primary-action"
                disabled={savingId === selectedAppointment.id}
                onClick={() => saveAppointment(selectedAppointment)}
                type="button"
              >
                <Save size={17} />
                {savingId === selectedAppointment.id ? "Saving..." : "Save detail changes"}
              </button>
            </div>
          </aside>
        </div>
      ) : null}
    </section>
  );
}
