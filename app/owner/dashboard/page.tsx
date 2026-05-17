import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { OwnerAppointmentBoard } from "@/components/owner-appointment-board";
import { getOwnerSession } from "@/lib/admin-auth";
import { getAppointmentStats, listAppointments } from "@/lib/appointments";
import { formatMoney } from "@/lib/services";

export const metadata: Metadata = {
  title: "Owner Dashboard"
};

export default async function OwnerDashboardPage() {
  const session = await getOwnerSession();

  if (!session) {
    redirect("/owner/login");
  }

  const [appointments, stats] = await Promise.all([listAppointments(), getAppointmentStats()]);

  return (
    <>
      <section className="owner-dashboard-hero">
        <div>
          <p className="section-kicker">Owner dashboard</p>
          <h1>Manage bookings, deposits, and the day ahead.</h1>
          <p>
            Signed in as {session.name}. This backend view is wired to protected APIs and a local
            appointment store so you can test real owner workflows before connecting a production
            database and notification provider.
          </p>
        </div>
      </section>

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
