import Link from "next/link";
import Image from "next/image";
import { CalendarClock, CheckCircle2, ShieldCheck } from "lucide-react";
import { ServiceGrid } from "@/components/service-grid";

const principles = [
  "Appointments paced around the cut, not a waiting room.",
  "Clear service pricing before the customer starts booking.",
  "Deposit-ready checkout designed to keep Square visually familiar."
];

export default function Home() {
  return (
    <>
      <section className="hero-section">
        <div className="hero-copy">
          <p className="section-kicker">Snip. Shave. Shine.</p>
          <h1>Appointment-only grooming with a sharper booking experience.</h1>
          <p>
            Aliz Studio keeps the familiar service menu but turns the website into a complete booking
            flow: pick a service, choose a time, place a deposit, and let the owner get notified.
          </p>
          <div className="hero-actions">
            <Link className="primary-action" href="/book">
              <CalendarClock size={18} />
              Book an appointment
            </Link>
            <Link className="secondary-action" href="/about">
              About the studio
            </Link>
          </div>
        </div>
        <div className="hero-visual" aria-label="Styled haircut photography">
          <div className="hero-visual__frame hero-visual__frame--one">
            <Image
              alt="Gentleman with a premium modern haircut"
              fill
              priority
              sizes="(max-width: 980px) 85vw, 36vw"
              src="/images/aliz-hero-gentleman.png"
            />
          </div>
          <div className="hero-visual__frame hero-visual__frame--two">
            <Image
              alt="Sharp fade hairstyle detail"
              fill
              sizes="(max-width: 980px) 55vw, 25vw"
              src="/images/aliz-style-high-fade.png"
            />
          </div>
          <div className="hero-visual__badge">
            <ShieldCheck size={18} />
            Deposit-secured appointments
          </div>
        </div>
      </section>

      <section className="content-band content-band--compact">
        <div className="section-heading">
          <p className="section-kicker">Services</p>
          <h2>Choose the package, then reserve the chair.</h2>
        </div>
        <ServiceGrid />
      </section>

      <section className="experience-band">
        <div className="section-heading">
          <p className="section-kicker">Booking logic</p>
          <h2>Built for an appointment-only shop.</h2>
        </div>
        <div className="principle-grid">
          {principles.map((principle) => (
            <div className="principle-item" key={principle}>
              <CheckCircle2 size={20} />
              <span>{principle}</span>
            </div>
          ))}
        </div>
      </section>
    </>
  );
}
