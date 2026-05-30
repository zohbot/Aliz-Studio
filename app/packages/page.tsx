import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import {
  ArrowRight,
  BadgeCheck,
  CalendarClock,
  CheckCircle2,
  Clock,
  CreditCard,
  Sparkles
} from "lucide-react";
import { getPackageMarketingCopy } from "@/lib/package-copy";
import { formatMoney, getService, services } from "@/lib/services";

export const metadata: Metadata = {
  title: "Packages",
  description:
    "Compare Aliz Studio barbering packages, pricing, duration, deposits, and appointment-only details before booking."
};

const confidenceItems = [
  {
    title: "Appointment-only",
    body: "Appointments are reserved by time slot so the experience stays calm, focused, and on schedule."
  },
  {
    title: "Clear timing",
    body: "Each package shows the reserved duration up front, making it easier to choose the right level of detail."
  },
  {
    title: "Demo-safe deposits",
    body: "Deposits help hold the selected appointment time. This demo currently uses mock deposit language until production payments are connected."
  }
];

export default function PackagesPage() {
  const featuredService = getService("deluxe-cut") ?? services[0];
  const featuredCopy = getPackageMarketingCopy(featuredService.id);

  return (
    <>
      <section className="packages-hero">
        <div className="packages-hero__copy">
          <p className="section-kicker">Service packages</p>
          <h1>Choose the cut that fits the moment.</h1>
          <p>
            From a clean weekly reset to a full detail session, Aliz Studio packages are built around
            appointment-only time, sharp finishing, and a calm booking experience.
          </p>
          <div className="packages-hero__actions">
            <Link className="primary-action" href="/book">
              <CalendarClock size={18} />
              Book a package
            </Link>
            <a className="secondary-action" href="#compare-packages">
              Compare packages
            </a>
          </div>
        </div>
        <div className="packages-hero__aside" aria-label="Booking guidance">
          <Sparkles size={22} />
          <h2>Not sure what to choose?</h2>
          <p>
            Start with Basic for upkeep, Plus for extra finish, or Deluxe for the most detailed
            session.
          </p>
        </div>
      </section>

      <section className="packages-feature" aria-labelledby="signature-package">
        <div className="packages-feature__media" data-service-id={featuredService.id}>
          <Image
            alt={`${featuredService.name} signature package preview`}
            fill
            priority
            sizes="(max-width: 980px) 100vw, 42vw"
            src={featuredService.image}
          />
          <span>
            <BadgeCheck size={16} />
            Signature
          </span>
        </div>
        <div className="packages-feature__copy">
          <p className="section-kicker">Featured package</p>
          <h2 id="signature-package">{featuredService.name}</h2>
          <p>{featuredCopy?.expandedDescription ?? featuredService.detail}</p>
          <div className="packages-feature__stats" aria-label={`${featuredService.name} summary`}>
            <div>
              <span>Price</span>
              <strong>{formatMoney(featuredService.price)}</strong>
            </div>
            <div>
              <span>Duration</span>
              <strong>{featuredService.durationMinutes}m</strong>
            </div>
            <div>
              <span>Deposit</span>
              <strong>{formatMoney(featuredService.deposit)}</strong>
            </div>
          </div>
          <p className="packages-feature__tone">
            {featuredCopy?.toneLine ?? featuredService.styleNote}
          </p>
          <Link className="primary-action" href={`/book?service=${featuredService.id}`}>
            Select Deluxe Cut
            <ArrowRight size={18} />
          </Link>
        </div>
      </section>

      <section className="packages-list" id="compare-packages">
        <div className="section-heading">
          <p className="section-kicker">Compare packages</p>
          <h2>Every option, clearly framed.</h2>
        </div>
        <div className="packages-grid">
          {services.map((service) => {
            const copy = getPackageMarketingCopy(service.id);

            return (
              <article className="package-card" data-service-id={service.id} key={service.id}>
                <div className="package-card__header">
                  <div>
                    <p className="section-kicker">{service.accent}</p>
                    <h3>{service.name}</h3>
                  </div>
                  {copy?.badge ? <span className="package-card__badge">{copy.badge}</span> : null}
                </div>
                <p className="package-card__short">{copy?.shortDescription ?? service.description}</p>
                <p>{copy?.expandedDescription ?? service.detail}</p>
                <dl className="package-card__facts">
                  <div>
                    <dt>Price</dt>
                    <dd>{formatMoney(service.price)}</dd>
                  </div>
                  <div>
                    <dt>Duration</dt>
                    <dd>{service.durationMinutes}m</dd>
                  </div>
                  <div>
                    <dt>Deposit</dt>
                    <dd>{formatMoney(service.deposit)}</dd>
                  </div>
                </dl>
                <div className="package-card__detail">
                  <strong>Best for</strong>
                  <p>{copy?.bestFor ?? service.styleNote}</p>
                </div>
                <div className="package-card__detail">
                  <strong>Includes</strong>
                  <ul>
                    {(copy?.includes ?? service.inclusions).map((item) => (
                      <li key={item}>
                        <CheckCircle2 size={16} />
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>
                <p className="package-card__tone">{copy?.toneLine ?? service.styleNote}</p>
                <div className="package-card__actions">
                  <Link className="primary-action" href={`/book?service=${service.id}`}>
                    Book {service.shortName}
                  </Link>
                  <Link className="secondary-action" href={`/services/${service.id}`}>
                    View details
                  </Link>
                </div>
              </article>
            );
          })}
        </div>
      </section>

      <section className="packages-confidence">
        <div>
          <p className="section-kicker">Booking confidence</p>
          <h2>Know what happens before checkout.</h2>
        </div>
        <div className="packages-confidence__grid">
          {confidenceItems.map((item) => (
            <article key={item.title}>
              {item.title === "Appointment-only" ? (
                <CalendarClock size={20} />
              ) : item.title === "Clear timing" ? (
                <Clock size={20} />
              ) : (
                <CreditCard size={20} />
              )}
              <h3>{item.title}</h3>
              <p>{item.body}</p>
            </article>
          ))}
        </div>
      </section>
    </>
  );
}
