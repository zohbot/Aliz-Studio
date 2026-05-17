import type { Metadata } from "next";
import Link from "next/link";
import { CalendarDays, MapPin, Sparkles } from "lucide-react";

export const metadata: Metadata = {
  title: "About"
};

export default function AboutPage() {
  return (
    <>
      <section className="subpage-hero">
        <p className="section-kicker">About Aliz Studio</p>
        <h1>Modern barbering shaped around reserved time and clean detail.</h1>
        <p>
          The current site already has the bones: services, prices, and a direct path to book. This
          revamp keeps that clarity while making the studio feel premium, personal, and easier to run.
        </p>
      </section>

      <section className="story-grid">
        <article>
          <Sparkles size={24} />
          <h2>Studio Feel</h2>
          <p>
            The visual direction should feel refined and real: sharp grooming, warm service, and
            photography that looks like actual client-ready work rather than generic stock.
          </p>
        </article>
        <article>
          <CalendarDays size={24} />
          <h2>Appointments First</h2>
          <p>
            No walk-in assumptions. The booking experience will guide every customer toward an
            available slot and protect that slot with a deposit.
          </p>
        </article>
        <article>
          <MapPin size={24} />
          <h2>Local Trust</h2>
          <p>
            The site should make service choice, pricing, timing, and payment expectations obvious
            before the customer reaches checkout.
          </p>
        </article>
      </section>

      <section className="cta-band">
        <div>
          <p className="section-kicker">Ready when they are</p>
          <h2>Give customers a clear path from service to deposit.</h2>
        </div>
        <Link className="primary-action" href="/book">
          Book Online
        </Link>
      </section>
    </>
  );
}
