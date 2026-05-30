import type { Appointment } from "@/lib/domain";
import { demoAppointments } from "@/lib/demo";
import type {
  AppointmentRepository,
  AppointmentStats,
  CompleteAppointmentDepositInput,
  CreateAppointmentRepositoryInput,
  UpdateAppointmentRepositoryInput
} from "@/lib/repositories/types";

const DEMO_MUTATION_TIMESTAMP = "2030-06-15T15:00:00.000Z";

function cloneAppointment(appointment: Appointment): Appointment {
  return {
    id: appointment.id,
    serviceId: appointment.serviceId,
    serviceName: appointment.serviceName,
    appointmentDate: appointment.appointmentDate,
    appointmentTime: appointment.appointmentTime,
    durationMinutes: appointment.durationMinutes,
    price: appointment.price,
    deposit: appointment.deposit,
    amountDueAtVisit: appointment.amountDueAtVisit,
    customerName: appointment.customerName,
    customerEmail: appointment.customerEmail,
    customerPhone: appointment.customerPhone,
    customerNotes: appointment.customerNotes,
    ownerNotes: appointment.ownerNotes,
    status: appointment.status,
    paymentStatus: appointment.paymentStatus,
    notificationChannels: [...appointment.notificationChannels],
    squareCheckoutUrl: appointment.squareCheckoutUrl,
    createdAt: appointment.createdAt,
    updatedAt: appointment.updatedAt
  };
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

export function createDemoAppointmentRepository(): AppointmentRepository {
  let appointmentMutationQueue = Promise.resolve();
  let nextAppointmentNumber = demoAppointments.length + 1;
  let appointments = demoAppointments.map((appointment) => cloneAppointment(appointment));

  function runAppointmentMutation<T>(operation: () => Promise<T>) {
    const result = appointmentMutationQueue.then(operation, operation);

    appointmentMutationQueue = result.then(
      () => undefined,
      () => undefined
    );

    return result;
  }

  async function listAppointments() {
    return sortAppointments(appointments.map((appointment) => cloneAppointment(appointment)));
  }

  async function getAppointmentById(appointmentId: string) {
    const appointment = appointments.find((item) => item.id === appointmentId);

    return appointment ? cloneAppointment(appointment) : null;
  }

  async function getReservedTimesForDate(appointmentDate: string) {
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
      const index = appointments.findIndex((appointment) => appointment.id === appointmentId);

      if (index === -1) {
        return null;
      }

      const updated: Appointment = {
        ...appointments[index],
        ...patch,
        updatedAt: DEMO_MUTATION_TIMESTAMP
      };
      appointments = appointments.map((appointment, appointmentIndex) =>
        appointmentIndex === index ? updated : appointment
      );

      return cloneAppointment(updated);
    });
  }

  async function completeAppointmentDeposit(input: CompleteAppointmentDepositInput) {
    return runAppointmentMutation(async () => {
      const index = appointments.findIndex((appointment) => appointment.id === input.appointmentId);

      if (index === -1) {
        return null;
      }

      const appointment = appointments[index];

      if (appointment.paymentStatus === "paid") {
        return cloneAppointment(appointment);
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
        updatedAt: DEMO_MUTATION_TIMESTAMP
      };
      appointments = appointments.map((currentAppointment, appointmentIndex) =>
        appointmentIndex === index ? updated : currentAppointment
      );

      return cloneAppointment(updated);
    });
  }

  async function getAppointmentStats(): Promise<AppointmentStats> {
    const currentAppointments = await listAppointments();
    const upcoming = currentAppointments.filter((appointment) =>
      ["pending_deposit", "confirmed"].includes(appointment.status)
    );
    const confirmed = currentAppointments.filter((appointment) => appointment.status === "confirmed");
    const pendingDeposits = currentAppointments.filter((appointment) => appointment.paymentStatus === "pending");
    const projectedRevenue = upcoming.reduce((total, appointment) => total + appointment.price, 0);
    const depositsCollected = currentAppointments.reduce((total, appointment) => {
      if (appointment.paymentStatus === "paid") {
        return total + appointment.deposit;
      }

      return total;
    }, 0);

    return {
      total: currentAppointments.length,
      upcoming: upcoming.length,
      confirmed: confirmed.length,
      pendingDeposits: pendingDeposits.length,
      projectedRevenue,
      depositsCollected
    };
  }

  return {
    backend: "demo",
    listAppointments,
    getAppointmentById,
    createAppointment(input: CreateAppointmentRepositoryInput) {
      return runAppointmentMutation(async () => {
        const isAvailable = await isAppointmentSlotAvailable(input.quote.appointmentDate, input.appointmentTime);

        if (!isAvailable) {
          throw new Error("That appointment time was just reserved. Please choose another slot.");
        }

        const appointmentNumber = String(nextAppointmentNumber).padStart(3, "0");
        nextAppointmentNumber += 1;

        const appointment: Appointment = {
          id: `apt_demo_runtime_${appointmentNumber}`,
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
          createdAt: DEMO_MUTATION_TIMESTAMP,
          updatedAt: DEMO_MUTATION_TIMESTAMP
        };

        appointments = [...appointments, appointment];

        return cloneAppointment(appointment);
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
        const index = appointments.findIndex((appointment) => appointment.id === appointmentId);

        if (index === -1) {
          return null;
        }

        const updated: Appointment = {
          ...appointments[index],
          squareCheckoutUrl,
          updatedAt: DEMO_MUTATION_TIMESTAMP
        };
        appointments = appointments.map((appointment, appointmentIndex) =>
          appointmentIndex === index ? updated : appointment
        );

        return cloneAppointment(updated);
      });
    },
    completeAppointmentDeposit,
    getAppointmentStats
  };
}
