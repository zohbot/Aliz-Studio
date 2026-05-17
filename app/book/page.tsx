import type { Metadata } from "next";
import { BookingConfigurator } from "@/components/booking-configurator";

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

  return (
    <>
      <section className="subpage-hero subpage-hero--booking">
        <p className="section-kicker">Book Online</p>
        <h1>Select a service, reserve a time, and continue to deposit.</h1>
        <p>
          This is the customer-facing foundation for the full booking engine. Square checkout,
          calendar availability, and owner notifications are prepared as backend integration points.
        </p>
      </section>
      <BookingConfigurator initialServiceId={params.service} />
    </>
  );
}
