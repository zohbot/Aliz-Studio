import { randomUUID } from "crypto";
import { copyFile, mkdir, readFile, rename, unlink, writeFile } from "fs/promises";
import path from "path";
import type { Appointment } from "@/lib/domain";
import { appointmentListSchema } from "@/lib/domain";
import type {
  AppointmentRepository,
  AppointmentStats,
  CompleteAppointmentDepositInput,
  CreateAppointmentRepositoryInput,
  UpdateAppointmentRepositoryInput
} from "@/lib/repositories/types";

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

function sortAppointments(appointments: Appointment[]) {
  return appointments.sort((left, right) => {
    const leftTime = `${left.appointmentDate} ${left.appointmentTime}`;
    const rightTime = `${right.appointmentDate} ${right.appointmentTime}`;

    return leftTime.localeCompare(rightTime);
  });
}

function appendOwnerNote(existingNote: string | undefined, nextNote: string) {
  const mergedNote = existingNote ? `${existingNote}\n${nextNote}` : nextNote;

  return mergedNote.slice(-800);
}

export function createFileAppointmentRepository(): AppointmentRepository {
  let appointmentMutationQueue = Promise.resolve();

  function runAppointmentMutation<T>(operation: () => Promise<T>) {
    const result = appointmentMutationQueue.then(operation, operation);

    appointmentMutationQueue = result.then(
      () => undefined,
      () => undefined
    );

    return result;
  }

  async function writeAppointments(appointments: Appointment[]) {
    const data = `${JSON.stringify(appointments, null, 2)}\n`;
    const temporaryFile = `${appointmentsFile}.${randomUUID()}.tmp`;
    await mkdir(dataDirectory, { recursive: true });
    await writeFile(temporaryFile, data, "utf8");

    let attempts = 0;
    const maxAttempts = 4;

    while (attempts < maxAttempts) {
      attempts += 1;
      try {
        await rename(temporaryFile, appointmentsFile);
        return;
      } catch (error) {
        const code = (error as NodeJS.ErrnoException).code;

        if (code === "EPERM" || code === "EACCES") {
          await new Promise((resolve) => setTimeout(resolve, attempts * 50));
          continue;
        }

        break;
      }
    }

    try {
      await copyFile(temporaryFile, appointmentsFile);
    } finally {
      await unlink(temporaryFile).catch(() => {});
    }
  }

  async function ensureAppointmentsFile() {
    await mkdir(dataDirectory, { recursive: true });

    try {
      await readFile(appointmentsFile, "utf8");
    } catch {
      await writeAppointments(buildSeedAppointments());
    }
  }

  async function listAppointments() {
    await ensureAppointmentsFile();

    const raw = await readFile(appointmentsFile, "utf8");
    const candidate = JSON.parse(raw);
    const parsed = appointmentListSchema.safeParse(candidate);

    if (!parsed.success) {
      await writeAppointments(buildSeedAppointments());

      return sortAppointments(buildSeedAppointments());
    }

    return sortAppointments(parsed.data);
  }

  async function getAppointmentById(appointmentId: string) {
    const appointments = await listAppointments();

    return appointments.find((appointment) => appointment.id === appointmentId) || null;
  }

  async function getReservedTimesForDate(appointmentDate: string) {
    const appointments = await listAppointments();

    return appointments
      .filter(
        (appointment) =>
          appointment.appointmentDate === appointmentDate &&
          ["pending_deposit", "confirmed"].includes(appointment.status)
      )
      .map((appointment) => appointment.appointmentTime);
  }

  async function isAppointmentSlotAvailable(appointmentDate: string, appointmentTime: string) {
    const reservedTimes = await getReservedTimesForDate(appointmentDate);

    return !reservedTimes.includes(appointmentTime);
  }

  async function updateAppointment(appointmentId: string, patch: UpdateAppointmentRepositoryInput) {
    return runAppointmentMutation(async () => {
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
    });
  }

  async function completeAppointmentDeposit(input: CompleteAppointmentDepositInput) {
    return runAppointmentMutation(async () => {
      const appointments = await listAppointments();
      const index = appointments.findIndex((appointment) => appointment.id === input.appointmentId);

      if (index === -1) {
        return null;
      }

      const appointment = appointments[index];

      if (appointment.paymentStatus === "paid") {
        return appointment;
      }

      if (!["pending_deposit", "confirmed"].includes(appointment.status)) {
        throw new Error("Appointment cannot accept a deposit in its current state.");
      }

      const updated: Appointment = {
        ...appointment,
        status: "confirmed",
        paymentStatus: "paid",
        ownerNotes: appendOwnerNote(
          appointment.ownerNotes,
          `Mock checkout: ${input.cardholderName} paid deposit with card ending ${input.cardLastFour}.`
        ),
        updatedAt: new Date().toISOString()
      };
      const nextAppointments = appointments.map((currentAppointment, appointmentIndex) =>
        appointmentIndex === index ? updated : currentAppointment
      );

      await writeAppointments(nextAppointments);

      return updated;
    });
  }

  async function getAppointmentStats(): Promise<AppointmentStats> {
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

  return {
    backend: "file",
    listAppointments,
    getAppointmentById,
    createAppointment(input: CreateAppointmentRepositoryInput) {
      return runAppointmentMutation(async () => {
        const isAvailable = await isAppointmentSlotAvailable(input.quote.appointmentDate, input.appointmentTime);

        if (!isAvailable) {
          throw new Error("That appointment time was just reserved. Please choose another slot.");
        }

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
      });
    },
    getReservedTimesForDate,
    isAppointmentSlotAvailable,
    updateAppointment,
    updateAppointmentStatus(appointmentId, status) {
      return updateAppointment(appointmentId, { status });
    },
    updateAppointmentPaymentStatus(appointmentId, paymentStatus) {
      return updateAppointment(appointmentId, { paymentStatus });
    },
    setAppointmentCheckoutUrl(appointmentId, squareCheckoutUrl) {
      return runAppointmentMutation(async () => {
        const appointments = await listAppointments();
        const index = appointments.findIndex((appointment) => appointment.id === appointmentId);

        if (index === -1) {
          return null;
        }

        const updated: Appointment = {
          ...appointments[index],
          squareCheckoutUrl,
          updatedAt: new Date().toISOString()
        };
        const nextAppointments = appointments.map((appointment, appointmentIndex) =>
          appointmentIndex === index ? updated : appointment
        );

        await writeAppointments(nextAppointments);

        return updated;
      });
    },
    completeAppointmentDeposit,
    getAppointmentStats
  };
}
