import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowRight, CalendarClock, CheckCircle2, Clock, CreditCard, ShieldCheck } from "lucide-react";
import { formatMoney, getService, services } from "@/lib/services";

type ServicePageProps = {
  params: Promise<{
    serviceId: string;
  }>;
};

export function generateStaticParams() {
  return services.map((service) => ({
    serviceId: service.id
  }));
}

export async function generateMetadata({ params }: ServicePageProps): Promise<Metadata> {
  const { serviceId } = await params;
  const service = getService(serviceId);

  if (!service) {
    return {
      title: "Service"
    };
  }

  return {
    title: service.name,
    description: `${service.name} at Aliz Studio: ${service.description}`
  };
}

export default async function ServicePage({ params }: ServicePageProps) {
  const { serviceId } = await params;
  const service = getService(serviceId);

  if (!service) {
    notFound();
  }

  const relatedServices = services.filter((item) => item.id !== service.id).slice(0, 3);

  return (
    <>
      <section className="package-hero" data-service-id={service.id}>
        <div className="package-hero__media">
          <Image
            alt={`${service.name} hairstyle preview`}
            fill
            priority
            sizes="(max-width: 980px) 100vw, 48vw"
            src={service.image}
          />
          <span className="package-hero__tag">{service.accent} package</span>
        </div>

        <div className="package-hero__copy">
          <p className="section-kicker">Selected package</p>
          <h1>{service.name}</h1>
          <p>{service.detail}</p>

          <div className="package-stats" aria-label="Package summary">
            <div>
              <span>Price</span>
              <strong>{formatMoney(service.price)}</strong>
            </div>
            <div>
              <span>Deposit</span>
              <strong>{formatMoney(service.deposit)}</strong>
            </div>
            <div>
              <span>Duration</span>
              <strong>{service.durationMinutes}m</strong>
            </div>
          </div>

          <div className="package-actions">
            <Link className="primary-action" href={`/book?service=${service.id}`}>
              <CalendarClock size={18} />
              Pick date and time
            </Link>
            <Link className="secondary-action" href="/">
              View all packages
            </Link>
          </div>
        </div>
      </section>

      <section className="package-details">
        <div className="package-panel package-panel--dark">
          <p className="section-kicker">What to expect</p>
          <h2>{service.styleNote}</h2>
          <p>
            This page is the richer package stop before checkout: customers can confirm what is
            included, understand the deposit, and move into the calendar with confidence.
          </p>
          <div className="package-flow">
            <span>
              <Clock size={17} />
              Select appointment
            </span>
            <ArrowRight size={16} />
            <span>
              <CreditCard size={17} />
              Square deposit
            </span>
            <ArrowRight size={16} />
            <span>
              <ShieldCheck size={17} />
              Owner notified
            </span>
          </div>
        </div>

        <div className="package-panel">
          <p className="section-kicker">Included</p>
          <ul className="included-list">
            {service.inclusions.map((item) => (
              <li key={item}>
                <CheckCircle2 size={18} />
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </div>
      </section>

      <section className="related-packages">
        <div className="section-heading">
          <p className="section-kicker">Still deciding?</p>
          <h2>Other packages clients compare.</h2>
        </div>
        <div className="mini-package-grid">
          {relatedServices.map((item) => (
            <Link className="mini-package" href={`/services/${item.id}`} key={item.id}>
              <Image alt={`${item.name} preview`} fill loading="eager" sizes="33vw" src={item.image} />
              <span>{item.name}</span>
              <strong>{formatMoney(item.price)}</strong>
            </Link>
          ))}
        </div>
      </section>
    </>
  );
}
