import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowLeft, CalendarClock, Scissors, UsersRound } from "lucide-react";
import { OwnerCustomerManager } from "@/components/owner-customer-manager";
import { getOwnerSession } from "@/lib/admin-auth";
import { listCustomerRecords } from "@/lib/customers";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Owner Customers"
};

export default async function OwnerCustomersPage() {
  const session = await getOwnerSession();

  if (!session) {
    redirect("/owner/login");
  }

  const customers = await listCustomerRecords();

  return (
    <>
      <section className="owner-dashboard-hero owner-services-hero">
        <div className="owner-dashboard-hero__copy">
          <p className="section-kicker">Owner client book</p>
          <h1>Review customers, visit history, and private owner notes.</h1>
          <p>
            Signed in as {session.name}. Customer records are generated from appointment history so
            the client book stays demo-safe while preparing for a future Supabase customer table.
          </p>
          <div className="owner-services-hero__actions">
            <Link className="secondary-action" href="/owner/dashboard">
              <ArrowLeft size={17} />
              Dashboard
            </Link>
            <Link className="secondary-action" href="/owner/services">
              <Scissors size={17} />
              Services
            </Link>
            <Link className="secondary-action" href="/owner/availability">
              <CalendarClock size={17} />
              Availability
            </Link>
          </div>
        </div>
        <aside className="owner-service-note">
          <UsersRound aria-hidden="true" size={24} />
          <strong>Owner-only customer context.</strong>
          <p>
            Notes, tags, and preferences persist to ignored demo storage. Real customer records
            still require Supabase, RLS, and production privacy controls.
          </p>
        </aside>
      </section>

      <OwnerCustomerManager initialCustomers={customers} />
    </>
  );
}
