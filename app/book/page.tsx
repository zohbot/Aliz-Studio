import type { Metadata } from "next";
import { BookingConfigurator } from "@/components/booking-configurator";
import { listBookableServices } from "@/lib/services";

export const runtime = "nodejs";

export const metadata: Metadata = {
  title: "Book Online"
};

type BookPageProps = {
  searchParams: Promise<{
    service?: string;
  }>;
};

export default async function BookPage({ searchParams }: BookPageProps) {
  const params = await searchParams;
  const services = await listBookableServices();

  return (
    <>
      <section className="subpage-hero subpage-hero--booking">
        <p className="section-kicker">Book Online</p>
        <h1>Select a service, reserve a time, and continue to deposit.</h1>
        <p>
          Choose a package, pick an available slot, add your details, and continue through a
          sandbox-style checkout. Reserved times are protected from duplicate booking.
        </p>
      </section>
      <BookingConfigurator initialServiceId={params.service} services={services} />
    </>
  );
}
