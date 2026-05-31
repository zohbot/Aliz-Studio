"use client";

import { FormEvent, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  CalendarOff,
  Clock3,
  Plus,
  Save,
  ShieldCheck,
  Trash2,
  ToggleLeft,
  ToggleRight
} from "lucide-react";
import type { AvailabilityBlockedDate, AvailabilityDaySettings, AvailabilitySettings } from "@/lib/domain";

type OwnerAvailabilityManagerProps = {
  initialSettings: AvailabilitySettings;
};

type BlockedDateDraft = {
  date: string;
  reason: string;
};

function todayDateId() {
  const today = new Date();
  const year = today.getFullYear();
  const month = String(today.getMonth() + 1).padStart(2, "0");
  const day = String(today.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

function createBlockedDateId(date: string) {
  return `block_${date.replace(/\D/g, "")}`;
}

function normalizeSettings(settings: AvailabilitySettings): AvailabilitySettings {
  return {
    timezone: settings.timezone,
    weeklyHours: settings.weeklyHours.map((day) => ({
      ...day,
      breakStartTime: day.breakStartTime ?? "",
      breakEndTime: day.breakEndTime ?? ""
    })),
    blockedDates: settings.blockedDates.map((blockedDate) => ({ ...blockedDate })),
    bookingRules: { ...settings.bookingRules },
    updatedAt: settings.updatedAt
  };
}

function validateDay(day: AvailabilityDaySettings) {
  if (!day.isOpen) {
    return "";
  }

  if (day.startTime >= day.endTime) {
    return `${day.label} end time must be after start time.`;
  }

  const hasBreakStart = Boolean(day.breakStartTime);
  const hasBreakEnd = Boolean(day.breakEndTime);

  if (hasBreakStart !== hasBreakEnd) {
    return `${day.label} break start and end are both required.`;
  }

  if (day.breakStartTime && day.breakEndTime) {
    if (day.breakStartTime >= day.breakEndTime) {
      return `${day.label} break end must be after break start.`;
    }

    if (day.breakStartTime < day.startTime || day.breakEndTime > day.endTime) {
      return `${day.label} break must fit inside open hours.`;
    }
  }

  return "";
}

function validateSettings(settings: AvailabilitySettings) {
  for (const day of settings.weeklyHours) {
    const error = validateDay(day);

    if (error) {
      return error;
    }
  }

  if (settings.bookingRules.leadTimeMinutes < 0) {
    return "Booking lead time cannot be negative.";
  }

  if (settings.bookingRules.maxAppointmentsPerSlot < 1) {
    return "Max appointments per slot must be at least 1.";
  }

  if (settings.bookingRules.maxAppointmentsPerDay < 1) {
    return "Max appointments per day must be at least 1.";
  }

  return "";
}

export function OwnerAvailabilityManager({ initialSettings }: OwnerAvailabilityManagerProps) {
  const router = useRouter();
  const [settings, setSettings] = useState(() => normalizeSettings(initialSettings));
  const [blockedDateDraft, setBlockedDateDraft] = useState<BlockedDateDraft>({
    date: "",
    reason: ""
  });
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const openDayCount = useMemo(
    () => settings.weeklyHours.filter((day) => day.isOpen).length,
    [settings.weeklyHours]
  );

  function updateDay(weekday: number, patch: Partial<AvailabilityDaySettings>) {
    setSettings((current) => ({
      ...current,
      weeklyHours: current.weeklyHours.map((day) =>
        day.weekday === weekday
          ? {
              ...day,
              ...patch
            }
          : day
      )
    }));
  }

  function updateBookingRules(patch: Partial<AvailabilitySettings["bookingRules"]>) {
    setSettings((current) => ({
      ...current,
      bookingRules: {
        ...current.bookingRules,
        ...patch
      }
    }));
  }

  function addBlockedDate() {
    const date = blockedDateDraft.date;

    if (!date) {
      setError("Choose a date to block.");
      setMessage("");
      return;
    }

    if (settings.blockedDates.some((blockedDate) => blockedDate.date === date)) {
      setError("That blocked date is already listed.");
      setMessage("");
      return;
    }

    const blockedDate: AvailabilityBlockedDate = {
      id: createBlockedDateId(date),
      date,
      reason: blockedDateDraft.reason.trim() || undefined,
      createdAt: new Date().toISOString()
    };

    setSettings((current) => ({
      ...current,
      blockedDates: [...current.blockedDates, blockedDate].sort((left, right) =>
        left.date.localeCompare(right.date)
      )
    }));
    setBlockedDateDraft({ date: "", reason: "" });
    setError("");
    setMessage("Blocked date added. Save changes to apply it to booking.");
  }

  function removeBlockedDate(blockedDateId: string) {
    setSettings((current) => ({
      ...current,
      blockedDates: current.blockedDates.filter((blockedDate) => blockedDate.id !== blockedDateId)
    }));
    setMessage("Blocked date removed. Save changes to apply the update.");
    setError("");
  }

  async function saveSettings(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const validationError = validateSettings(settings);

    if (validationError) {
      setError(validationError);
      setMessage("");
      return;
    }

    setIsSaving(true);
    setError("");
    setMessage("");

    const response = await fetch("/api/owner/availability", {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        timezone: settings.timezone.trim() || "America/New_York",
        weeklyHours: settings.weeklyHours,
        blockedDates: settings.blockedDates,
        bookingRules: settings.bookingRules
      })
    });
    const payload = await response.json();

    setIsSaving(false);

    if (!response.ok) {
      setError(payload.error || "Could not save availability settings.");
      return;
    }

    setSettings(normalizeSettings(payload.settings));
    setMessage("Availability rules saved.");
    router.refresh();
  }

  return (
    <section className="owner-availability-manager" aria-label="Owner availability manager">
      <div className="availability-summary-grid" aria-label="Availability summary">
        <article>
          <span>Open days</span>
          <strong>{openDayCount}</strong>
        </article>
        <article>
          <span>Blocked dates</span>
          <strong>{settings.blockedDates.length}</strong>
        </article>
        <article>
          <span>Lead time</span>
          <strong>{settings.bookingRules.leadTimeMinutes}m</strong>
        </article>
        <article>
          <span>Timezone</span>
          <strong>{settings.timezone}</strong>
        </article>
      </div>

      {message ? <p className="owner-message">{message}</p> : null}
      {error ? <p className="form-error">{error}</p> : null}

      <form className="availability-editor" onSubmit={saveSettings}>
        <div className="availability-editor__main">
          <section className="availability-panel" aria-labelledby="weekly-hours-heading">
            <div className="availability-panel__header">
              <div>
                <p className="section-kicker">Weekly schedule</p>
                <h2 id="weekly-hours-heading">Business hours</h2>
              </div>
              <Clock3 aria-hidden="true" size={24} />
            </div>

            <div className="availability-day-list">
              {settings.weeklyHours.map((day) => (
                <article className="availability-day-row" key={day.weekday}>
                  <button
                    aria-pressed={day.isOpen}
                    className="availability-day-toggle"
                    onClick={() => updateDay(day.weekday, { isOpen: !day.isOpen })}
                    type="button"
                  >
                    {day.isOpen ? <ToggleRight size={20} /> : <ToggleLeft size={20} />}
                    <span>
                      <strong>{day.label}</strong>
                      <small>{day.isOpen ? "Open" : "Closed"}</small>
                    </span>
                  </button>

                  <div className="availability-time-grid">
                    <label>
                      <span>{day.label} start time</span>
                      <input
                        aria-label={`${day.label} start time`}
                        disabled={!day.isOpen}
                        onChange={(event) => updateDay(day.weekday, { startTime: event.target.value })}
                        type="time"
                        value={day.startTime}
                      />
                    </label>

                    <label>
                      <span>{day.label} end time</span>
                      <input
                        aria-label={`${day.label} end time`}
                        disabled={!day.isOpen}
                        onChange={(event) => updateDay(day.weekday, { endTime: event.target.value })}
                        type="time"
                        value={day.endTime}
                      />
                    </label>

                    <label>
                      <span>{day.label} break start</span>
                      <input
                        aria-label={`${day.label} break start`}
                        disabled={!day.isOpen}
                        onChange={(event) => updateDay(day.weekday, { breakStartTime: event.target.value })}
                        type="time"
                        value={day.breakStartTime ?? ""}
                      />
                    </label>

                    <label>
                      <span>{day.label} break end</span>
                      <input
                        aria-label={`${day.label} break end`}
                        disabled={!day.isOpen}
                        onChange={(event) => updateDay(day.weekday, { breakEndTime: event.target.value })}
                        type="time"
                        value={day.breakEndTime ?? ""}
                      />
                    </label>
                  </div>
                </article>
              ))}
            </div>
          </section>

          <section className="availability-panel" aria-labelledby="blocked-dates-heading">
            <div className="availability-panel__header">
              <div>
                <p className="section-kicker">Closed dates</p>
                <h2 id="blocked-dates-heading">Blocked dates</h2>
              </div>
              <CalendarOff aria-hidden="true" size={24} />
            </div>

            <div className="blocked-date-form">
              <label>
                Blocked date
                <input
                  min={todayDateId()}
                  onChange={(event) =>
                    setBlockedDateDraft((current) => ({ ...current, date: event.target.value }))
                  }
                  type="date"
                  value={blockedDateDraft.date}
                />
              </label>
              <label>
                Reason
                <input
                  maxLength={120}
                  onChange={(event) =>
                    setBlockedDateDraft((current) => ({ ...current, reason: event.target.value }))
                  }
                  placeholder="Vacation, event, private appointment"
                  value={blockedDateDraft.reason}
                />
              </label>
              <button className="secondary-action" onClick={addBlockedDate} type="button">
                <Plus size={17} />
                Add blocked date
              </button>
            </div>

            <div className="blocked-date-list" aria-label="Current blocked dates">
              {settings.blockedDates.length ? (
                settings.blockedDates.map((blockedDate) => (
                  <div className="blocked-date-chip" key={blockedDate.id}>
                    <span>
                      <strong>{blockedDate.date}</strong>
                      <small>{blockedDate.reason || "Closed for owner-managed availability"}</small>
                    </span>
                    <button
                      aria-label={`Remove blocked date ${blockedDate.date}`}
                      onClick={() => removeBlockedDate(blockedDate.id)}
                      type="button"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                ))
              ) : (
                <p className="availability-empty-note">No blocked dates are active.</p>
              )}
            </div>
          </section>
        </div>

        <aside className="availability-editor__side">
          <section className="availability-panel" aria-labelledby="booking-rules-heading">
            <div className="availability-panel__header">
              <div>
                <p className="section-kicker">Booking rules</p>
                <h2 id="booking-rules-heading">Controls</h2>
              </div>
              <ShieldCheck aria-hidden="true" size={24} />
            </div>

            <div className="booking-rule-grid">
              <label>
                Timezone
                <input
                  maxLength={80}
                  onChange={(event) =>
                    setSettings((current) => ({ ...current, timezone: event.target.value }))
                  }
                  value={settings.timezone}
                />
              </label>

              <label>
                Booking lead time minutes
                <input
                  inputMode="numeric"
                  min={0}
                  onChange={(event) =>
                    updateBookingRules({ leadTimeMinutes: Number(event.target.value) })
                  }
                  type="number"
                  value={settings.bookingRules.leadTimeMinutes}
                />
              </label>

              <label>
                Max appointments per slot
                <input
                  inputMode="numeric"
                  max={4}
                  min={1}
                  onChange={(event) =>
                    updateBookingRules({ maxAppointmentsPerSlot: Number(event.target.value) })
                  }
                  type="number"
                  value={settings.bookingRules.maxAppointmentsPerSlot}
                />
              </label>

              <label>
                Max appointments per day
                <input
                  inputMode="numeric"
                  max={48}
                  min={1}
                  onChange={(event) =>
                    updateBookingRules({ maxAppointmentsPerDay: Number(event.target.value) })
                  }
                  type="number"
                  value={settings.bookingRules.maxAppointmentsPerDay}
                />
              </label>

              <label>
                Cancellation cutoff hours
                <input
                  inputMode="numeric"
                  max={168}
                  min={0}
                  onChange={(event) =>
                    updateBookingRules({ cancellationCutoffHours: Number(event.target.value) })
                  }
                  type="number"
                  value={settings.bookingRules.cancellationCutoffHours}
                />
              </label>
            </div>

            <p className="availability-help">
              These rules are demo-safe and currently apply to fixed booking slots. Supabase will
              turn them into durable availability rules, blocked-date rows, and transaction-safe
              booking checks.
            </p>
          </section>

          <div className="availability-actions">
            <button className="primary-action primary-action--wide" disabled={isSaving} type="submit">
              <Save size={17} />
              {isSaving ? "Saving..." : "Save availability"}
            </button>
          </div>
        </aside>
      </form>
    </section>
  );
}
