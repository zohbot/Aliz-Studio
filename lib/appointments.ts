import { randomUUID } from "crypto";
import { mkdir, readFile, rename, writeFile } from "fs/promises";
import path from "path";
import { z } from "zod";
import type { BookingQuote } from "@/lib/booking";

export const appointmentStatusSchema = z.enum([
  "pending_deposit",
  "confirmed",
  "completed",
  "cancelled",
  "no_show"
]);

export const paymentStatusSchema = z.enum(["pending", "paid", "refunded"]);

export const ownerAppointmentUpdateSchema = z.object({
  status: appointmentStatusSchema.optional(),
  paymentStatus: paymentStatusSchema.optional(),
  ownerNotes: z.string().max(800).optional()
});

export type AppointmentStatus = z.infer<typeof appointmentStatusSchema>;
export type PaymentStatus = z.infer<typeof paymentStatusSchema>;

export type Appointment = {
  id: string;
  serviceId: string;
  serviceName: string;
  appointmentDate: string;
  appointmentTime: string;
  durationMinutes: number;
  price: number;
  deposit: number;
  amountDueAtVisit: number;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  customerNotes?: string;
  ownerNotes?: string;
  status: AppointmentStatus;
  paymentStatus: PaymentStatus;
  notificationChannels: string[];
  squareCheckoutUrl?: string;
  createdAt: string;
  updatedAt: string;
};

export type CreateAppointmentInput = {
  quote: BookingQuote;
  appointmentTime: string;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  customerNotes?: string;
  squareCheckoutUrl?: string;
};

const dataDirectory = path.join(process.cwd(), "data");
const appointmentsFile = path.join(dataDirectory, "appointments.json");

function toDateId(offsetDays: number) {
  const date = new Date();
  date.setDate(date.getDate() + offsetDays);

  return date.toISOString().slice(0, 10);
}

function buildSeedAppointments(): Appointment[] {
  const now = new Date().toISOString();

  return [
    {
      id: "apt_seed_101",
      serviceId: "deluxe-cut",
      serviceName: "Deluxe Cut",
      appointmentDate: toDateId(1),
      appointmentTime: "11:00 AM",
      durationMinutes: 50,
      price: 40,
      deposit: 15,
      amountDueAtVisit: 25,
      customerName: "Marcus Reed",
      customerEmail: "marcus@example.com",
      customerPhone: "(555) 014-0131",
      customerNotes: "Prefers a low taper and beard balance.",
      ownerNotes: "Repeat client. Confirm beard line before starting.",
      status: "confirmed",
      paymentStatus: "paid",
      notificationChannels: ["email", "sms"],
      squareCheckoutUrl: "https://squareup.com/checkout/aliz-demo-deluxe",
      createdAt: now,
      updatedAt: now
    },
    {
      id: "apt_seed_102",
      serviceId: "basic-cut",
      serviceName: "Basic Cut",
      appointmentDate: toDateId(2),
      appointmentTime: "2:00 PM",
      durationMinutes: 30,
      price: 30,
      deposit: 10,
      amountDueAtVisit: 20,
      customerName: "Darius Cole",
      customerEmail: "darius@example.com",
      customerPhone: "(555) 014-0188",
      status: "pending_deposit",
      paymentStatus: "pending",
      notificationChannels: ["email"],
      squareCheckoutUrl: "https://squareup.com/checkout/aliz-demo-basic",
      createdAt: now,
      updatedAt: now
    },
    {
      id: "apt_seed_103",
      serviceId: "shape-up",
      serviceName: "Shape Up",
      appointmentDate: toDateId(0),
      appointmentTime: "5:00 PM",
      durationMinutes: 20,
      price: 15,
      deposit: 5,
      amountDueAtVisit: 10,
      customerName: "Andre Mills",
      customerEmail: "andre@example.com",
      customerPhone: "(555) 014-0162",
      customerNotes: "Quick lineup before an event.",
      status: "confirmed",
      paymentStatus: "paid",
      notificationChannels: ["email", "sms"],
      createdAt: now,
      updatedAt: now
    }
  ];
}

async function ensureAppointmentsFile() {
  await mkdir(dataDirectory, { recursive: true });

  try {
    await readFile(appointmentsFile, "utf8");
  } catch {
    await writeAppointments(buildSeedAppointments());
  }
}

async function writeAppointments(appointments: Appointment[]) {
  await mkdir(dataDirectory, { recursive: true });

  const temporaryFile = `${appointmentsFile}.${randomUUID()}.tmp`;
  await writeFile(temporaryFile, `${JSON.stringify(appointments, null, 2)}\n`, "utf8");
  await rename(temporaryFile, appointmentsFile);
}

export async function listAppointments() {
  await ensureAppointmentsFile();

  const raw = await readFile(appointmentsFile, "utf8");
  const parsed = z.array(z.custom<Appointment>()).parse(JSON.parse(raw));

  return parsed.sort((left, right) => {
    const leftTime = `${left.appointmentDate} ${left.appointmentTime}`;
    const rightTime = `${right.appointmentDate} ${right.appointmentTime}`;

    return leftTime.localeCompare(rightTime);
  });
}

export async function createAppointment(input: CreateAppointmentInput) {
  const now = new Date().toISOString();
  const appointment: Appointment = {
    id: `apt_${randomUUID()}`,
    serviceId: input.quote.serviceId,
    serviceName: input.quote.serviceName,
    appointmentDate: input.quote.appointmentDate,
    appointmentTime: input.appointmentTime,
    durationMinutes: input.quote.durationMinutes,
    price: input.quote.price,
    deposit: input.quote.deposit,
    amountDueAtVisit: input.quote.amountDueAtVisit,
    customerName: input.customerName,
    customerEmail: input.customerEmail,
    customerPhone: input.customerPhone,
    customerNotes: input.customerNotes,
    status: "pending_deposit",
    paymentStatus: "pending",
    notificationChannels: ["email", "sms"],
    squareCheckoutUrl: input.squareCheckoutUrl,
    createdAt: now,
    updatedAt: now
  };
  const appointments = await listAppointments();

  await writeAppointments([...appointments, appointment]);

  return appointment;
}

export async function updateAppointment(appointmentId: string, patch: z.infer<typeof ownerAppointmentUpdateSchema>) {
  const appointments = await listAppointments();
  const index = appointments.findIndex((appointment) => appointment.id === appointmentId);

  if (index === -1) {
    return null;
  }

  const updated: Appointment = {
    ...appointments[index],
    ...patch,
    updatedAt: new Date().toISOString()
  };
  const nextAppointments = appointments.map((appointment, appointmentIndex) =>
    appointmentIndex === index ? updated : appointment
  );

  await writeAppointments(nextAppointments);

  return updated;
}

export async function getAppointmentStats() {
  const appointments = await listAppointments();
  const upcoming = appointments.filter((appointment) =>
    ["pending_deposit", "confirmed"].includes(appointment.status)
  );
  const confirmed = appointments.filter((appointment) => appointment.status === "confirmed");
  const pendingDeposits = appointments.filter((appointment) => appointment.paymentStatus === "pending");
  const projectedRevenue = upcoming.reduce((total, appointment) => total + appointment.price, 0);
  const depositsCollected = appointments.reduce((total, appointment) => {
    if (appointment.paymentStatus === "paid") {
      return total + appointment.deposit;
    }

    return total;
  }, 0);

  return {
    total: appointments.length,
    upcoming: upcoming.length,
    confirmed: confirmed.length,
    pendingDeposits: pendingDeposits.length,
    projectedRevenue,
    depositsCollected
  };
}
