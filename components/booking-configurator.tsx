"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import {
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  Clock,
  CreditCard,
  Mail,
  MessageSquareText,
  Phone,
  Scissors,
  Send,
  Sparkles,
  UserRound
} from "lucide-react";
import { getPreviewSlots } from "@/lib/availability";
import { formatMoney } from "@/lib/format";
import { PaymentMethodLogos } from "@/components/payment-method-logos";
import type { AvailabilitySlot, Service } from "@/lib/domain";

type BookingConfiguratorProps = {
  initialServiceId?: string;
  services: Service[];
};

const weekdays = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

function toDateId(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

function startOfToday() {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  return today;
}

function buildCalendarDays(monthDate: Date) {
  const year = monthDate.getFullYear();
  const month = monthDate.getMonth();
  const firstDay = new Date(year, month, 1);
  const calendarStart = new Date(firstDay);
  calendarStart.setDate(firstDay.getDate() - firstDay.getDay());

  return Array.from({ length: 42 }, (_, index) => {
    const date = new Date(calendarStart);
    date.setDate(calendarStart.getDate() + index);

    return {
      date,
      dayNumber: date.getDate(),
      id: toDateId(date),
      isCurrentMonth: date.getMonth() === month,
      isPast: date < startOfToday()
    };
  });
}

function getMonthLabel(date: Date) {
  return new Intl.DateTimeFormat("en-US", {
    month: "long",
    year: "numeric"
  }).format(date);
}

function getSelectedDateLabel(dateId: string) {
  const [year, month, day] = dateId.split("-").map(Number);
  const date = new Date(year, month - 1, day);

  return new Intl.DateTimeFormat("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric"
  }).format(date);
}

function hasTenPhoneDigits(phone: string) {
  return phone.replace(/\D/g, "").length === 10;
}

function formatUsPhone(value: string) {
  const digits = value.replace(/\D/g, "").slice(0, 10);

  if (digits.length <= 3) {
    return digits;
  }

  if (digits.length <= 6) {
    return `(${digits.slice(0, 3)}) ${digits.slice(3)}`;
  }

  return `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6)}`;
}

export function BookingConfigurator({ initialServiceId, services }: BookingConfiguratorProps) {
  const fallbackService = services[0];
  const initialSelectedService = services.some((service) => service.id === initialServiceId)
    ? initialServiceId
    : fallbackService?.id;
  const [serviceId, setServiceId] = useState(initialSelectedService || "");
  const [selectedDate, setSelectedDate] = useState(() => toDateId(new Date()));
  const [selectedSlot, setSelectedSlot] = useState("");
  const [slots, setSlots] = useState<AvailabilitySlot[]>(() => getPreviewSlots());
  const [customerName, setCustomerName] = useState("");
  const [customerEmail, setCustomerEmail] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [customerNotes, setCustomerNotes] = useState("");
  const [formMessage, setFormMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [visibleMonth, setVisibleMonth] = useState(() => {
    const today = new Date();

    return new Date(today.getFullYear(), today.getMonth(), 1);
  });

  const service = useMemo(
    () => services.find((item) => item.id === serviceId) || fallbackService,
    [fallbackService, serviceId, services]
  );
  const hasBookableServices = services.length > 0 && Boolean(service);

  const remainingBalance = service ? Math.max(service.price - service.deposit, 0) : 0;
  const calendarDays = useMemo(() => buildCalendarDays(visibleMonth), [visibleMonth]);
  const monthLabel = getMonthLabel(visibleMonth);
  const selectedDateLabel = getSelectedDateLabel(selectedDate);
  const canSubmit =
    hasBookableServices &&
    Boolean(selectedDate && selectedSlot && customerName && customerEmail && customerPhone) &&
    !isSubmitting;

  useEffect(() => {
    let isCurrent = true;

    async function loadAvailability() {
      const response = await fetch(`/api/booking/availability?date=${selectedDate}`);
      const payload = await response.json();

      if (!isCurrent) {
        return;
      }

      if (!response.ok) {
        setSlots(getPreviewSlots());
        return;
      }

      setSlots(payload.slots);

      if (payload.slots.some((slot: AvailabilitySlot) => slot.value === selectedSlot && slot.isReserved)) {
        setSelectedSlot("");
      }
    }

    loadAvailability();

    return () => {
      isCurrent = false;
    };
  }, [selectedDate, selectedSlot]);

  function moveMonth(direction: -1 | 1) {
    setVisibleMonth((current) => new Date(current.getFullYear(), current.getMonth() + direction, 1));
    setSelectedSlot("");
  }

  async function handleBookingSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setFormMessage("");

    if (!hasTenPhoneDigits(customerPhone)) {
      setFormMessage("Enter a 10-digit US phone number.");
      return;
    }

    setIsSubmitting(true);

    const response = await fetch("/api/booking/create", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        serviceId: service?.id,
        appointmentDate: selectedDate,
        appointmentTime: selectedSlot,
        customerName,
        customerEmail,
        customerPhone,
        notes: customerNotes
      })
    });
    const payload = await response.json();

    setIsSubmitting(false);

    if (!response.ok) {
      setFormMessage(payload.error || "We could not reserve that appointment. Please try again.");
      return;
    }

    window.location.assign(payload.checkout.checkoutUrl);
  }

  return (
    <form className="booking-shell" aria-label="Booking form" onSubmit={handleBookingSubmit}>
      <div className="booking-panel booking-panel--services">
        <p className="section-kicker">Choose your service</p>
        <p className="booking-panel__hint">
          Select one package to update the summary, price, duration, and deposit.
        </p>
        <div className="service-picker" role="group" aria-label="Available services">
          {services.length ? (
            services.map((item) => (
              <button
                aria-pressed={item.id === serviceId}
                className="service-option"
                key={item.id}
                onClick={() => {
                  setServiceId(item.id);
                  setSelectedSlot("");
                }}
                type="button"
              >
                <span className="service-option__name">
                  <Scissors size={15} />
                  {item.name}
                </span>
                <strong>{formatMoney(item.price)}</strong>
              </button>
            ))
          ) : (
            <p className="booking-panel__hint">No bookable services are active right now.</p>
          )}
        </div>
      </div>

      <div className="booking-panel booking-panel--calendar">
        <div className="calendar-header">
          <div>
            <p className="section-kicker">Select date and time</p>
            <h2>{monthLabel}</h2>
          </div>
          <div className="calendar-controls" aria-label="Calendar month controls">
            <button aria-label="Previous month" onClick={() => moveMonth(-1)} type="button">
              <ChevronLeft size={18} />
            </button>
            <button aria-label="Next month" onClick={() => moveMonth(1)} type="button">
              <ChevronRight size={18} />
            </button>
          </div>
        </div>

        <div className="calendar-grid" aria-label="Appointment calendar">
          {weekdays.map((day) => (
            <span className="calendar-weekday" key={day}>
              {day}
            </span>
          ))}
          {calendarDays.map((day) => (
            <button
              aria-pressed={selectedDate === day.id}
              className="calendar-day"
              data-outside-month={!day.isCurrentMonth}
              disabled={day.isPast}
              key={day.id}
              onClick={() => {
                setSelectedDate(day.id);
                setSelectedSlot("");
              }}
              type="button"
            >
              <span>{day.dayNumber}</span>
            </button>
          ))}
        </div>
      </div>

      <div className="booking-panel booking-panel--times">
        <p className="section-kicker">Available time slots</p>
        <div className="selected-date-pill">
          <CalendarDays size={18} />
          <span>{selectedDateLabel}</span>
        </div>
        <div className="slot-list">
          {slots.map((slot) => (
            <button
              aria-pressed={selectedSlot === slot.value}
              className="slot-button"
              disabled={slot.isReserved}
              key={slot.value}
              onClick={() => setSelectedSlot(slot.value)}
              type="button"
            >
              <span className="slot-button__time">
                <Clock size={16} />
                {slot.label}
              </span>
              <span className="slot-button__signal">
                <Sparkles size={13} />
                {slot.isReserved ? "Reserved" : "Open"}
              </span>
            </button>
          ))}
        </div>
        <p className="time-note">Times are shown for the selected date. Deposits hold the appointment.</p>
      </div>

      <aside className="booking-summary" aria-label="Booking summary">
        <div>
          <p className="section-kicker">Appointment summary</p>
          <h2>{service?.name ?? "No active services"}</h2>
          <p>{service?.detail ?? "The owner has not enabled any bookable services yet."}</p>
        </div>

        <dl className="price-list">
          <div>
            <dt>Selected date</dt>
            <dd>{selectedDateLabel}</dd>
          </div>
          <div>
            <dt>Package</dt>
            <dd>{formatMoney(service?.price ?? 0)}</dd>
          </div>
          <div>
            <dt>Deposit due now</dt>
            <dd>{formatMoney(service?.deposit ?? 0)} mock</dd>
          </div>
          <div>
            <dt>Due at visit</dt>
            <dd>{formatMoney(remainingBalance)}</dd>
          </div>
        </dl>

        <div className="booking-customer-form">
          <p className="section-kicker">Your details</p>
          <label>
            <span>
              <UserRound size={15} />
              Full name
            </span>
            <input
              autoCapitalize="words"
              autoComplete="name"
              autoCorrect="on"
              name="customerName"
              onChange={(event) => setCustomerName(event.target.value)}
              required
              value={customerName}
            />
          </label>
          <label>
            <span>
              <Mail size={15} />
              Email
            </span>
            <input
              autoComplete="email"
              name="customerEmail"
              onChange={(event) => setCustomerEmail(event.target.value)}
              required
              type="email"
              value={customerEmail}
            />
          </label>
          <label>
            <span>
              <Phone size={15} />
              Phone
            </span>
            <input
              aria-describedby="booking-phone-help"
              autoComplete="tel"
              inputMode="tel"
              name="customerPhone"
              onChange={(event) => setCustomerPhone(formatUsPhone(event.target.value))}
              required
              type="tel"
              value={customerPhone}
            />
            <small id="booking-phone-help">Use a 10-digit US number. We will format it for you.</small>
          </label>
          <label>
            <span>
              <MessageSquareText size={15} />
              Notes
            </span>
            <textarea
              maxLength={500}
              name="customerNotes"
              onChange={(event) => setCustomerNotes(event.target.value)}
              placeholder="Haircut preferences, timing notes, or anything the owner should know."
              value={customerNotes}
            />
          </label>
        </div>

        <div className="square-note">
          <CreditCard size={18} />
          <span>Mock Square checkout for demo testing. No real card will be charged.</span>
        </div>

        <PaymentMethodLogos compact />

        {formMessage ? <p className="form-error">{formMessage}</p> : null}

        <button
          className="primary-action primary-action--wide"
          disabled={!canSubmit}
          type="submit"
        >
          <Send size={18} />
          {isSubmitting ? "Reserving..." : "Continue to mock deposit"}
        </button>
      </aside>
    </form>
  );
}
