"use client";

import { FormEvent, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  CalendarClock,
  CheckCircle2,
  CircleDollarSign,
  Clock3,
  Mail,
  NotebookText,
  Phone,
  Save,
  Search,
  Sparkles,
  Tag,
  UserRound,
  X
} from "lucide-react";
import { CUSTOMER_TAGS, type CustomerProfile, type CustomerRecord, type CustomerTag } from "@/lib/domain";
import { formatMoney } from "@/lib/format";

type OwnerCustomerManagerProps = {
  initialCustomers: CustomerRecord[];
};

type CustomerDraft = {
  ownerNotes: string;
  preferredCut: string;
  preferredTimeWindow: string;
  sensitiveNote: string;
  tags: CustomerTag[];
};

const tagLabels: Record<CustomerTag, string> = {
  new_client: "New client",
  prefers_quiet: "Prefers quiet",
  regular: "Regular",
  vip: "VIP"
};

const statusLabels = {
  cancelled: "Canceled",
  completed: "Completed",
  confirmed: "Confirmed",
  no_show: "No show",
  pending_deposit: "Pending deposit"
};

function formatDate(dateId: string | undefined) {
  if (!dateId) {
    return "None yet";
  }

  const [year, month, day] = dateId.split("-").map(Number);

  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric"
  }).format(new Date(year, month - 1, day));
}

function createDraft(profile: CustomerProfile): CustomerDraft {
  return {
    ownerNotes: profile.ownerNotes ?? "",
    preferredCut: profile.preferredCut ?? "",
    preferredTimeWindow: profile.preferredTimeWindow ?? "",
    sensitiveNote: profile.sensitiveNote ?? "",
    tags: [...profile.tags]
  };
}

function getLatestStatus(customer: CustomerRecord) {
  const status = customer.stats.latestStatus;

  return status ? statusLabels[status] : "No appointments";
}

function normalizeSearchValue(value: string) {
  return value.trim().toLowerCase();
}

function mergeProfile(customer: CustomerRecord, profile: CustomerProfile): CustomerRecord {
  return {
    ...customer,
    profile
  };
}

export function OwnerCustomerManager({ initialCustomers }: OwnerCustomerManagerProps) {
  const router = useRouter();
  const [customers, setCustomers] = useState(initialCustomers);
  const [query, setQuery] = useState("");
  const [tagFilter, setTagFilter] = useState<"all" | CustomerTag>("all");
  const [selectedCustomerId, setSelectedCustomerId] = useState("");
  const [draft, setDraft] = useState<CustomerDraft | null>(null);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [savingId, setSavingId] = useState("");

  const visibleCustomers = useMemo(() => {
    const normalizedQuery = normalizeSearchValue(query);

    return customers.filter((customer) => {
      const matchesTag = tagFilter === "all" || customer.profile.tags.includes(tagFilter);
      const matchesQuery =
        !normalizedQuery ||
        customer.name.toLowerCase().includes(normalizedQuery) ||
        customer.email.toLowerCase().includes(normalizedQuery) ||
        customer.phone.toLowerCase().includes(normalizedQuery) ||
        customer.phone.replace(/\D/g, "").includes(normalizedQuery.replace(/\D/g, ""));

      return matchesTag && matchesQuery;
    });
  }, [customers, query, tagFilter]);

  const selectedCustomer = useMemo(
    () => customers.find((customer) => customer.id === selectedCustomerId) || null,
    [customers, selectedCustomerId]
  );

  const summary = useMemo(
    () => ({
      customers: customers.length,
      upcoming: customers.reduce((total, customer) => total + customer.stats.upcomingAppointments, 0),
      completed: customers.reduce((total, customer) => total + customer.stats.completedAppointments, 0),
      projectedValue: customers.reduce((total, customer) => total + customer.stats.totalProjectedValue, 0)
    }),
    [customers]
  );

  function openCustomer(customer: CustomerRecord) {
    setSelectedCustomerId(customer.id);
    setDraft(createDraft(customer.profile));
    setError("");
    setMessage("");
  }

  function closeCustomer() {
    setSelectedCustomerId("");
    setDraft(null);
    setError("");
  }

  function updateDraft(patch: Partial<CustomerDraft>) {
    setDraft((current) => (current ? { ...current, ...patch } : current));
  }

  function toggleTag(tag: CustomerTag) {
    setDraft((current) => {
      if (!current) {
        return current;
      }

      const tags = current.tags.includes(tag)
        ? current.tags.filter((currentTag) => currentTag !== tag)
        : [...current.tags, tag];

      return {
        ...current,
        tags
      };
    });
  }

  async function saveCustomerProfile(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!selectedCustomer || !draft) {
      return;
    }

    setSavingId(selectedCustomer.id);
    setError("");
    setMessage("");

    const response = await fetch(`/api/owner/customers/${selectedCustomer.id}`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        ownerNotes: draft.ownerNotes,
        preferredCut: draft.preferredCut,
        preferredTimeWindow: draft.preferredTimeWindow,
        sensitiveNote: draft.sensitiveNote,
        tags: draft.tags
      })
    });
    const payload = await response.json();

    setSavingId("");

    if (!response.ok) {
      setError(payload.error || "Could not save customer notes.");
      return;
    }

    setCustomers((currentCustomers) =>
      currentCustomers.map((customer) =>
        customer.id === selectedCustomer.id ? mergeProfile(customer, payload.profile) : customer
      )
    );
    setDraft(createDraft(payload.profile));
    setMessage(`${selectedCustomer.name} saved.`);
    router.refresh();
  }

  return (
    <section className="owner-customer-manager" aria-label="Owner customer records">
      <div className="customer-summary-grid" aria-label="Customer record summary">
        <article>
          <span>Customers</span>
          <strong>{summary.customers}</strong>
        </article>
        <article>
          <span>Upcoming visits</span>
          <strong>{summary.upcoming}</strong>
        </article>
        <article>
          <span>Completed visits</span>
          <strong>{summary.completed}</strong>
        </article>
        <article>
          <span>Projected history</span>
          <strong>{formatMoney(summary.projectedValue)}</strong>
        </article>
      </div>

      <div className="owner-toolbar customer-toolbar">
        <label className="owner-search">
          <Search size={18} />
          <input
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search name, phone, or email"
            type="search"
            value={query}
          />
        </label>

        <select
          aria-label="Filter by customer tag"
          onChange={(event) => setTagFilter(event.target.value as "all" | CustomerTag)}
          value={tagFilter}
        >
          <option value="all">All tags</option>
          {CUSTOMER_TAGS.map((tag) => (
            <option key={tag} value={tag}>
              {tagLabels[tag]}
            </option>
          ))}
        </select>
      </div>

      {message ? <p className="owner-message">{message}</p> : null}

      <div className="customer-record-grid">
        {visibleCustomers.length ? (
          visibleCustomers.map((customer) => (
            <article className="customer-record-card" key={customer.id}>
              <div className="customer-record-card__topline">
                <span className={`status-badge status-badge--${customer.stats.latestStatus ?? "completed"}`}>
                  {getLatestStatus(customer)}
                </span>
                <span className="appointment-card__id">{customer.id}</span>
              </div>

              <div className="customer-record-card__main">
                <div>
                  <p className="section-kicker">Client record</p>
                  <h2>{customer.name}</h2>
                  <p>{customer.stats.mostBookedService ?? "No preferred service yet"}</p>
                </div>
                <button className="secondary-action" onClick={() => openCustomer(customer)} type="button">
                  <NotebookText size={17} />
                  View history
                </button>
              </div>

              <dl className="customer-contact-list">
                <div>
                  <dt>
                    <Phone size={15} />
                    Phone
                  </dt>
                  <dd>{customer.phone || "Not provided"}</dd>
                </div>
                <div>
                  <dt>
                    <Mail size={15} />
                    Email
                  </dt>
                  <dd>{customer.email || "Not provided"}</dd>
                </div>
              </dl>

              <div className="customer-stat-strip" aria-label={`${customer.name} history summary`}>
                <span>
                  <strong>{customer.stats.totalAppointments}</strong>
                  total
                </span>
                <span>
                  <strong>{customer.stats.upcomingAppointments}</strong>
                  upcoming
                </span>
                <span>
                  <strong>{customer.stats.completedAppointments}</strong>
                  completed
                </span>
                <span>
                  <strong>{formatMoney(customer.stats.totalProjectedValue)}</strong>
                  history
                </span>
              </div>

              <div className="customer-tag-row">
                {customer.profile.tags.length ? (
                  customer.profile.tags.map((tag) => (
                    <span className="customer-tag" key={tag}>
                      <Tag size={13} />
                      {tagLabels[tag]}
                    </span>
                  ))
                ) : (
                  <span className="customer-tag customer-tag--muted">No owner tags yet</span>
                )}
              </div>
            </article>
          ))
        ) : (
          <article className="appointment-empty-state">
            <strong>No customers match this view.</strong>
            <p>Try searching by another name, phone number, or email.</p>
          </article>
        )}
      </div>

      {selectedCustomer && draft ? (
        <div className="appointment-detail-backdrop">
          <aside
            aria-labelledby="customer-detail-title"
            aria-modal="true"
            className="appointment-detail-drawer customer-detail-drawer"
            role="dialog"
          >
            <div className="appointment-detail-drawer__topline">
              <span className={`status-badge status-badge--${selectedCustomer.stats.latestStatus ?? "completed"}`}>
                {getLatestStatus(selectedCustomer)}
              </span>
              <button
                aria-label="Close customer details"
                className="appointment-detail-drawer__close"
                onClick={closeCustomer}
                type="button"
              >
                <X size={18} />
              </button>
            </div>

            <div className="appointment-detail-drawer__header">
              <div>
                <p className="section-kicker">Customer detail</p>
                <h2 id="customer-detail-title">{selectedCustomer.name}</h2>
                <p>{selectedCustomer.stats.mostBookedService ?? "Appointment history generated from bookings."}</p>
              </div>
              <div className="customer-detail-drawer__icon">
                <UserRound size={24} />
              </div>
            </div>

            <div className="appointment-detail-pill-grid" aria-label="Customer summary">
              <article className="appointment-detail-stat">
                <span className="appointment-detail-stat__icon">
                  <CalendarClock size={16} />
                </span>
                <div>
                  <p>Next appointment</p>
                  <strong>{formatDate(selectedCustomer.stats.nextAppointmentDate)}</strong>
                </div>
              </article>
              <article className="appointment-detail-stat">
                <span className="appointment-detail-stat__icon">
                  <CheckCircle2 size={16} />
                </span>
                <div>
                  <p>Completed</p>
                  <strong>{selectedCustomer.stats.completedAppointments} visits</strong>
                </div>
              </article>
              <article className="appointment-detail-stat">
                <span className="appointment-detail-stat__icon">
                  <CircleDollarSign size={16} />
                </span>
                <div>
                  <p>Paid deposits</p>
                  <strong>{formatMoney(selectedCustomer.stats.totalPaidDeposits)}</strong>
                </div>
              </article>
            </div>

            <dl className="appointment-detail-list">
              <div>
                <dt>
                  <Phone size={15} />
                  Phone
                </dt>
                <dd>{selectedCustomer.phone || "Not provided"}</dd>
              </div>
              <div>
                <dt>
                  <Mail size={15} />
                  Email
                </dt>
                <dd>{selectedCustomer.email || "Not provided"}</dd>
              </div>
              <div>
                <dt>
                  <Clock3 size={15} />
                  Last visit
                </dt>
                <dd>{formatDate(selectedCustomer.stats.lastAppointmentDate)}</dd>
              </div>
              <div>
                <dt>
                  <Sparkles size={15} />
                  Favorite
                </dt>
                <dd>{selectedCustomer.stats.mostBookedService ?? "Not enough history yet"}</dd>
              </div>
            </dl>

            <form className="customer-profile-form" onSubmit={saveCustomerProfile}>
              <section className="customer-profile-panel" aria-labelledby="customer-tags-heading">
                <div>
                  <p className="section-kicker">Owner tags</p>
                  <h3 id="customer-tags-heading">Preferences</h3>
                </div>
                <div className="customer-tag-picker">
                  {CUSTOMER_TAGS.map((tag) => (
                    <button
                      aria-pressed={draft.tags.includes(tag)}
                      className="customer-tag-option"
                      key={tag}
                      onClick={() => toggleTag(tag)}
                      type="button"
                    >
                      <Tag size={14} />
                      {tagLabels[tag]}
                    </button>
                  ))}
                </div>
              </section>

              <div className="customer-profile-grid">
                <label>
                  Preferred cut
                  <input
                    maxLength={80}
                    onChange={(event) => updateDraft({ preferredCut: event.target.value })}
                    placeholder="Low taper, beard balance, shape up"
                    value={draft.preferredCut}
                  />
                </label>
                <label>
                  Preferred time window
                  <input
                    maxLength={80}
                    onChange={(event) => updateDraft({ preferredTimeWindow: event.target.value })}
                    placeholder="Late afternoon, Saturdays"
                    value={draft.preferredTimeWindow}
                  />
                </label>
                <label className="customer-profile-grid__wide">
                  Owner notes
                  <textarea
                    maxLength={1200}
                    onChange={(event) => updateDraft({ ownerNotes: event.target.value })}
                    placeholder="Owner-only client notes. These are never shown publicly."
                    value={draft.ownerNotes}
                  />
                </label>
                <label className="customer-profile-grid__wide">
                  Sensitive owner note
                  <textarea
                    maxLength={500}
                    onChange={(event) => updateDraft({ sensitiveNote: event.target.value })}
                    placeholder="Private reminders for the owner only."
                    value={draft.sensitiveNote}
                  />
                </label>
              </div>

              {error ? <p className="form-error">{error}</p> : null}

              <div className="customer-history-panel" aria-label="Appointment history">
                <div>
                  <p className="section-kicker">Booking history</p>
                  <h3>Appointment timeline</h3>
                </div>
                <ol className="customer-timeline">
                  {selectedCustomer.appointments.map((appointment) => (
                    <li key={appointment.id}>
                      <span className={`status-badge status-badge--${appointment.status}`}>
                        {statusLabels[appointment.status]}
                      </span>
                      <div>
                        <strong>{appointment.serviceName}</strong>
                        <p>
                          {formatDate(appointment.appointmentDate)} at {appointment.appointmentTime} ·{" "}
                          {formatMoney(appointment.price)}
                        </p>
                      </div>
                    </li>
                  ))}
                </ol>
              </div>

              <div className="appointment-detail-drawer__actions">
                <button className="secondary-action" onClick={closeCustomer} type="button">
                  Close
                </button>
                <button className="primary-action" disabled={savingId === selectedCustomer.id} type="submit">
                  <Save size={17} />
                  {savingId === selectedCustomer.id ? "Saving..." : "Save customer notes"}
                </button>
              </div>
            </form>
          </aside>
        </div>
      ) : null}
    </section>
  );
}
