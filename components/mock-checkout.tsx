"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import {
  BadgeCheck,
  CalendarClock,
  CreditCard,
  LockKeyhole,
  ReceiptText,
  ShieldCheck,
  Sparkles
} from "lucide-react";
import type { Appointment } from "@/lib/appointments";
import { formatMoney } from "@/lib/services";
import { PaymentMethodLogos } from "@/components/payment-method-logos";

type MockCheckoutProps = {
  appointment: Appointment;
};

function formatDate(dateId: string) {
  const [year, month, day] = dateId.split("-").map(Number);

  return new Intl.DateTimeFormat("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric"
  }).format(new Date(year, month - 1, day));
}

function formatCardNumber(value: string) {
  return value
    .replace(/\D/g, "")
    .slice(0, 16)
    .replace(/(\d{4})(?=\d)/g, "$1 ");
}

function formatExpiry(value: string) {
  const digits = value.replace(/\D/g, "").slice(0, 4);

  if (digits.length <= 2) {
    return digits;
  }

  return `${digits.slice(0, 2)}/${digits.slice(2)}`;
}

export function MockCheckout({ appointment }: MockCheckoutProps) {
  const router = useRouter();
  const [message, setMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage("");

    const formData = new FormData(event.currentTarget);
    const submittedCardholderName = String(formData.get("cardholderName") || "").trim();
    const submittedCardDigits = String(formData.get("cardNumber") || "").replace(/\D/g, "");
    const submittedExpiry = String(formData.get("expiry") || "").trim();
    const submittedCvc = String(formData.get("cvc") || "").trim();
    const submittedBillingZip = String(formData.get("billingZip") || "").trim();

    if (
      submittedCardholderName.length < 2 ||
      submittedCardDigits.length < 12 ||
      submittedExpiry.length !== 5 ||
      submittedCvc.length < 3 ||
      submittedBillingZip.length < 5
    ) {
      setMessage("Add the mock card details to complete the deposit.");
      return;
    }

    setIsSubmitting(true);

    const response = await fetch("/api/checkout/complete", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        appointmentId: appointment.id,
        cardholderName: submittedCardholderName,
        cardLastFour: submittedCardDigits.slice(-4)
      })
    });
    const payload = await response.json();

    setIsSubmitting(false);

    if (!response.ok) {
      setMessage(payload.error || "Payment could not be completed.");
      return;
    }

    router.push(
      `/book/confirmation?appointment=${encodeURIComponent(appointment.id)}&paid=1&receipt=${encodeURIComponent(
        payload.receipt.id
      )}`
    );
  }

  return (
    <section className="checkout-shell" aria-label="Mock Square checkout">
      <div className="checkout-main">
        <div className="checkout-brand-strip">
          <span>
            <ShieldCheck size={17} />
            Square sandbox-style checkout
          </span>
          <span>
            <LockKeyhole size={17} />
            Demo payment
          </span>
        </div>

        <div className="checkout-card">
          <p className="section-kicker">Secure deposit</p>
          <h1>Reserve your appointment with a deposit.</h1>
          <p>
            This mock checkout simulates the Square step without charging a real card. Use any test
            card number, such as 4242 4242 4242 4242.
          </p>
          <PaymentMethodLogos />

          <div className="checkout-progress" aria-label="Checkout progress">
            <span data-active="true">
              <Sparkles size={15} />
              Service
            </span>
            <span data-active="true">
              <CalendarClock size={15} />
              Time
            </span>
            <span data-active="true">
              <CreditCard size={15} />
              Deposit
            </span>
          </div>

          <form className="checkout-form" onSubmit={handleSubmit}>
            <label>
              <span>Name on card</span>
              <input
                autoComplete="cc-name"
                defaultValue={appointment.customerName}
                name="cardholderName"
                required
              />
            </label>

            <label>
              <span>Card number</span>
              <input
                autoComplete="cc-number"
                inputMode="numeric"
                name="cardNumber"
                onChange={(event) => {
                  event.currentTarget.value = formatCardNumber(event.currentTarget.value);
                }}
                placeholder="4242 4242 4242 4242"
                required
              />
            </label>

            <div className="checkout-form__split">
              <label>
                <span>Expiration</span>
                <input
                  autoComplete="cc-exp"
                  inputMode="numeric"
                  name="expiry"
                  onChange={(event) => {
                    event.currentTarget.value = formatExpiry(event.currentTarget.value);
                  }}
                  placeholder="12/30"
                  required
                />
              </label>
              <label>
                <span>CVC</span>
                <input
                  autoComplete="cc-csc"
                  inputMode="numeric"
                  maxLength={4}
                  name="cvc"
                  onChange={(event) => {
                    event.currentTarget.value = event.currentTarget.value.replace(/\D/g, "").slice(0, 4);
                  }}
                  placeholder="123"
                  required
                />
              </label>
              <label>
                <span>ZIP code</span>
                <input
                  autoComplete="postal-code"
                  inputMode="numeric"
                  maxLength={10}
                  name="billingZip"
                  placeholder="07030"
                  required
                />
              </label>
            </div>

            {message ? <p className="form-error">{message}</p> : null}

            <button className="primary-action primary-action--wide" disabled={isSubmitting} type="submit">
              <LockKeyhole size={18} />
              {isSubmitting ? "Processing..." : `Pay ${formatMoney(appointment.deposit)} deposit`}
            </button>
          </form>
        </div>
      </div>

      <aside className="checkout-summary" aria-label="Checkout summary">
        <div className="checkout-summary__header">
          <ReceiptText size={22} />
          <div>
            <p className="section-kicker">Appointment order</p>
            <h2>{appointment.serviceName}</h2>
          </div>
        </div>

        <dl className="price-list">
          <div>
            <dt>Client</dt>
            <dd>{appointment.customerName}</dd>
          </div>
          <div>
            <dt>Date</dt>
            <dd>{formatDate(appointment.appointmentDate)}</dd>
          </div>
          <div>
            <dt>Time</dt>
            <dd>{appointment.appointmentTime}</dd>
          </div>
          <div>
            <dt>Service total</dt>
            <dd>{formatMoney(appointment.price)}</dd>
          </div>
          <div>
            <dt>Deposit today</dt>
            <dd>{formatMoney(appointment.deposit)}</dd>
          </div>
          <div>
            <dt>Due at visit</dt>
            <dd>{formatMoney(appointment.amountDueAtVisit)}</dd>
          </div>
        </dl>

        <div className="checkout-trust-panel">
          <BadgeCheck size={20} />
          <div>
            <strong>Deposit holds the time slot.</strong>
            <p>The owner dashboard updates to paid and confirmed after this mock payment.</p>
          </div>
        </div>
      </aside>
    </section>
  );
}
