import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowLeft, CalendarClock, Scissors } from "lucide-react";
import { OwnerAvailabilityManager } from "@/components/owner-availability-manager";
import { getOwnerSession } from "@/lib/admin-auth";
import { getAvailabilitySettings } from "@/lib/availability";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Owner Availability"
};

export default async function OwnerAvailabilityPage() {
  const session = await getOwnerSession();

  if (!session) {
    redirect("/owner/login");
  }

  const settings = await getAvailabilitySettings();

  return (
    <>
      <section className="owner-dashboard-hero owner-services-hero">
        <div className="owner-dashboard-hero__copy">
          <p className="section-kicker">Owner availability</p>
          <h1>Set booking hours, blocked dates, and demo-safe rules.</h1>
          <p>
            Signed in as {session.name}. These controls update the current file-backed
            availability settings so the public booking flow can respect owner-managed hours before
            Supabase is connected.
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
            <Link className="primary-action" href="/book">
              <CalendarClock size={17} />
              Preview booking
            </Link>
          </div>
        </div>
        <aside className="owner-service-note">
          <strong>Demo-safe scheduling controls.</strong>
          <p>
            Edits persist to ignored JSON storage locally and writable temp storage on Vercel.
            Production durability still belongs to the future Supabase adapter.
          </p>
        </aside>
      </section>

      <OwnerAvailabilityManager initialSettings={settings} />
    </>
  );
}
