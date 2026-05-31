import Link from "next/link";
import Image from "next/image";
import { ArrowRight, Clock, Sparkles } from "lucide-react";
import type { Service } from "@/lib/domain";
import { formatMoney } from "@/lib/format";

type ServiceGridProps = {
  services: Service[];
};

export function ServiceGrid({ services }: ServiceGridProps) {
  return (
    <div className="service-grid">
      {services.map((service) => (
        <article className="service-card" data-service-id={service.id} key={service.id}>
          <div className="service-card__media">
            <Image
              alt={`${service.name} hairstyle inspiration`}
              fill
              loading="eager"
              sizes="(max-width: 640px) 100vw, (max-width: 980px) 50vw, 25vw"
              src={service.image}
            />
            <span className="service-card__accent">
              <Sparkles size={14} />
              {service.accent}
            </span>
          </div>
          <div className="service-card__body">
            <p className="service-card__eyebrow">{service.durationMinutes} min reserved</p>
            <h3>{service.name}</h3>
            <p>{service.description}</p>
          </div>
          <div className="service-card__footer">
            <span className="service-price">{formatMoney(service.price)}</span>
            <span className="service-duration">
              <Clock size={15} />
              {service.durationMinutes}m
            </span>
          </div>
          <Link className="service-card__link" href={`/services/${service.id}`}>
            View package
            <ArrowRight size={16} />
          </Link>
        </article>
      ))}
    </div>
  );
}
