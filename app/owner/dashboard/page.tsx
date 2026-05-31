import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { CalendarClock, Scissors } from "lucide-react";
import { OwnerAppointmentBoard } from "@/components/owner-appointment-board";
import { OwnerSessionActions } from "@/components/owner-session-actions";
import { getOwnerSession } from "@/lib/admin-auth";
import { getAppointmentStats, listAppointments } from "@/lib/appointments";
import type { Appointment } from "@/lib/domain";
import type { AppointmentStats } from "@/lib/repositories";
import { formatMoney } from "@/lib/services";

export const runtime = "nodejs";

export const metadata: Metadata = {
  title: "Owner Dashboard"
};

const emptyStats: AppointmentStats = {
  total: 0,
  upcoming: 0,
  confirmed: 0,
  pendingDeposits: 0,
  projectedRevenue: 0,
  depositsCollected: 0
};

export default async function OwnerDashboardPage() {
  const session = await getOwnerSession();

  if (!session) {
    redirect("/owner/login");
  }

  let appointments: Appointment[] = [];
  let stats = emptyStats;
  let dashboardError = "";

  try {
    [appointments, stats] = await Promise.all([listAppointments(), getAppointmentStats()]);
  } catch {
    dashboardError =
      "Temporary demo storage is unavailable. Owner access is active, but booking records cannot be loaded right now.";
  }

  return (
    <>
      <section className="owner-dashboard-hero">
        <div className="owner-dashboard-hero__copy">
          <p className="section-kicker">Owner dashboard</p>
          <h1>Manage bookings, deposits, and the day ahead.</h1>
          <p>
            Signed in as {session.name}. This backend view is wired to protected APIs and a local
            appointment store so you can test real owner workflows before connecting a production
            database and notification provider.
          </p>
          <div className="owner-services-hero__actions">
            <Link className="secondary-action" href="/owner/services">
              <Scissors size={17} />
              Manage services
            </Link>
            <Link className="secondary-action" href="/owner/availability">
              <CalendarClock size={17} />
              Availability
            </Link>
          </div>
        </div>
        <OwnerSessionActions ownerName={session.name} />
      </section>

      {dashboardError ? (
        <section className="owner-dashboard-alert" role="alert">
          <strong>Owner access is active.</strong>
          <p>{dashboardError}</p>
          <a className="secondary-action" href="/owner/dashboard">
            Retry dashboard
          </a>
        </section>
      ) : null}

      <section className="owner-stat-grid" aria-label="Appointment statistics">
        <article>
          <span>Total appointments</span>
          <strong>{stats.total}</strong>
        </article>
        <article>
          <span>Upcoming</span>
          <strong>{stats.upcoming}</strong>
        </article>
        <article>
          <span>Pending deposits</span>
          <strong>{stats.pendingDeposits}</strong>
        </article>
        <article>
          <span>Projected revenue</span>
          <strong>{formatMoney(stats.projectedRevenue)}</strong>
        </article>
        <article>
          <span>Deposits collected</span>
          <strong>{formatMoney(stats.depositsCollected)}</strong>
        </article>
      </section>

      <OwnerAppointmentBoard initialAppointments={appointments} />
    </>
  );
}
