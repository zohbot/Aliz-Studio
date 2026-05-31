import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowLeft, CalendarClock } from "lucide-react";
import { OwnerServiceManager } from "@/components/owner-service-manager";
import { getOwnerSession } from "@/lib/admin-auth";
import { listServices } from "@/lib/services";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Owner Services"
};

export default async function OwnerServicesPage() {
  const session = await getOwnerSession();

  if (!session) {
    redirect("/owner/login");
  }

  const services = await listServices();

  return (
    <>
      <section className="owner-dashboard-hero owner-services-hero">
        <div className="owner-dashboard-hero__copy">
          <p className="section-kicker">Owner services</p>
          <h1>Manage the public menu without touching production data.</h1>
          <p>
            Signed in as {session.name}. Edits are protected owner actions and remain demo-safe in
            the current file-backed service store until Supabase is intentionally connected.
          </p>
          <div className="owner-services-hero__actions">
            <Link className="secondary-action" href="/owner/dashboard">
              <ArrowLeft size={17} />
              Dashboard
            </Link>
            <Link className="primary-action" href="/book">
              <CalendarClock size={17} />
              Preview booking
            </Link>
          </div>
        </div>
        <aside className="owner-service-note">
          <strong>Core services stay protected.</strong>
          <p>
            This sprint supports safe edits, soft visibility controls, and sort order. Stable IDs
            and service routes are preserved.
          </p>
        </aside>
      </section>

      <OwnerServiceManager initialServices={services} />
    </>
  );
}
