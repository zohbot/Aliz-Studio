"use client";

import { useMemo, useState } from "react";
import { CalendarDays, ChevronLeft, ChevronRight, Clock, CreditCard, Scissors, Send, Sparkles } from "lucide-react";
import { getPreviewSlots } from "@/lib/availability";
import { formatMoney, services } from "@/lib/services";

type BookingConfiguratorProps = {
  initialServiceId?: string;
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

export function BookingConfigurator({ initialServiceId }: BookingConfiguratorProps) {
  const [serviceId, setServiceId] = useState(initialServiceId || services[0].id);
  const [selectedDate, setSelectedDate] = useState(() => toDateId(new Date()));
  const [selectedSlot, setSelectedSlot] = useState("");
  const [visibleMonth, setVisibleMonth] = useState(() => {
    const today = new Date();

    return new Date(today.getFullYear(), today.getMonth(), 1);
  });

  const service = useMemo(
    () => services.find((item) => item.id === serviceId) || services[0],
    [serviceId]
  );

  const slots = getPreviewSlots();
  const remainingBalance = Math.max(service.price - service.deposit, 0);
  const calendarDays = useMemo(() => buildCalendarDays(visibleMonth), [visibleMonth]);
  const monthLabel = getMonthLabel(visibleMonth);
  const selectedDateLabel = getSelectedDateLabel(selectedDate);

  function moveMonth(direction: -1 | 1) {
    setVisibleMonth((current) => new Date(current.getFullYear(), current.getMonth() + direction, 1));
    setSelectedSlot("");
  }

  return (
    <section className="booking-shell" aria-label="Booking form">
      <div className="booking-panel booking-panel--services">
        <p className="section-kicker">Choose your service</p>
        <div className="service-picker" role="listbox" aria-label="Available services">
          {services.map((item) => (
            <button
              aria-selected={item.id === serviceId}
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
          ))}
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
                Open
              </span>
            </button>
          ))}
        </div>
        <p className="time-note">Times are shown for the selected date. Deposits hold the appointment.</p>
      </div>

      <aside className="booking-summary" aria-label="Booking summary">
        <div>
          <p className="section-kicker">Appointment summary</p>
          <h2>{service.name}</h2>
          <p>{service.detail}</p>
        </div>

        <dl className="price-list">
          <div>
            <dt>Selected date</dt>
            <dd>{selectedDateLabel}</dd>
          </div>
          <div>
            <dt>Package</dt>
            <dd>{formatMoney(service.price)}</dd>
          </div>
          <div>
            <dt>Deposit due now</dt>
            <dd>{formatMoney(service.deposit)}</dd>
          </div>
          <div>
            <dt>Due at visit</dt>
            <dd>{formatMoney(remainingBalance)}</dd>
          </div>
        </dl>

        <div className="square-note">
          <CreditCard size={18} />
          <span>Square checkout-ready deposit handoff</span>
        </div>

        <button
          className="primary-action primary-action--wide"
          disabled={!selectedDate || !selectedSlot}
          type="button"
        >
          <Send size={18} />
          Continue to deposit
        </button>
      </aside>
    </section>
  );
}
