import {
  APPOINTMENT_STATUSES,
  AVAILABILITY_BLOCK_TYPES,
  BOOKING_HOLD_STATUSES,
  NOTIFICATION_CHANNELS,
  NOTIFICATION_STATUSES,
  PAYMENT_PROVIDERS,
  PAYMENT_STATUSES
} from "@/lib/domain";
import type {
  Appointment,
  AppointmentAuditEvent,
  AppointmentId,
  AvailabilityBlock,
  BookingHold,
  BookingSettings,
  BusinessHoursRule,
  Customer,
  CustomerId,
  DepositPayment,
  IsoDateString,
  IsoDateTimeString,
  MoneyCents,
  NotificationLog,
  OwnerSettings,
  PriceCents,
  Service,
  ServiceCategory,
  ServiceId,
  TimezoneName
} from "@/lib/domain";

export const DEMO_SEED_VERSION = "2026-05-30.task-5";
export const DEMO_TIMEZONE: TimezoneName = "America/New_York";
export const DEMO_ANCHOR_DATE: IsoDateString = "2030-06-15";

const DEMO_CREATED_AT: IsoDateTimeString = "2030-06-01T14:00:00.000Z";
const DEMO_UPDATED_AT: IsoDateTimeString = "2030-06-01T14:00:00.000Z";

type DemoServiceSeed = Service & {
  category: ServiceCategory;
  active: true;
  sortOrder: number;
  priceCents: PriceCents;
  depositCents: MoneyCents;
};

type DemoAppointmentSeed = Appointment & {
  customerId: CustomerId;
  startsAt: IsoDateTimeString;
  endsAt: IsoDateTimeString;
  timezone: TimezoneName;
};

function cents(dollars: number): MoneyCents {
  return dollars * 100;
}

export const demoServices: readonly DemoServiceSeed[] = [
  {
    id: "basic-cut",
    name: "Basic Cut",
    shortName: "Basic",
    category: "haircut",
    active: true,
    sortOrder: 10,
    price: 30,
    priceCents: cents(30),
    durationMinutes: 30,
    deposit: 10,
    depositCents: cents(10),
    description: "Clean clippers, crisp shape, and a fresh finish.",
    detail: "A dependable appointment for regular upkeep, clean edges, and a confident reset.",
    image: "/images/aliz-style-high-fade.png",
    accent: "Precision",
    styleNote: "Best for weekly or bi-weekly maintenance.",
    inclusions: ["Consultation", "Clipper cut", "Neck cleanup", "Finishing style"]
  },
  {
    id: "plus-cut",
    name: "Plus Cut",
    shortName: "Plus",
    category: "haircut",
    active: true,
    sortOrder: 20,
    price: 35,
    priceCents: cents(35),
    durationMinutes: 40,
    deposit: 10,
    depositCents: cents(10),
    description: "A more detailed cut with extra time for refinement.",
    detail: "Built for clients who want more shaping, texture control, or a little extra precision.",
    image: "/images/aliz-style-burst-fade.png",
    accent: "Texture",
    styleNote: "A stronger choice for fades, curls, and shape work.",
    inclusions: ["Consultation", "Detailed fade", "Texture shaping", "Razor edge finish"]
  },
  {
    id: "deluxe-cut",
    name: "Deluxe Cut",
    shortName: "Deluxe",
    category: "haircut",
    active: true,
    sortOrder: 30,
    price: 40,
    priceCents: cents(40),
    durationMinutes: 50,
    deposit: 15,
    depositCents: cents(15),
    description: "Premium grooming with a sharper finish and detail work.",
    detail: "A full service appointment for a polished cut, beard balance, and clean presentation.",
    image: "/images/aliz-style-classic-taper.png",
    accent: "Signature",
    styleNote: "The complete appointment for the sharpest finish.",
    inclusions: ["Style consultation", "Premium haircut", "Beard balance", "Hot towel finish"]
  },
  {
    id: "kids-cut",
    name: "Kids Cut",
    shortName: "Kids",
    category: "kids",
    active: true,
    sortOrder: 40,
    price: 25,
    priceCents: cents(25),
    durationMinutes: 30,
    deposit: 10,
    depositCents: cents(10),
    description: "Patient, clean, and appointment-paced for younger clients.",
    detail: "A relaxed haircut experience designed to keep the visit easy for kids and parents.",
    image: "/images/aliz-style-burst-fade.png",
    accent: "Fresh",
    styleNote: "A calm, quick cut with room for patience.",
    inclusions: ["Simple consultation", "Age-appropriate cut", "Line cleanup", "Parent-friendly pacing"]
  },
  {
    id: "shape-up",
    name: "Shape Up",
    shortName: "Shape",
    category: "detail",
    active: true,
    sortOrder: 50,
    price: 15,
    priceCents: cents(15),
    durationMinutes: 20,
    deposit: 5,
    depositCents: cents(5),
    description: "Fast edge cleanup for a sharper look between cuts.",
    detail: "Lineup and finishing work for clients who need definition without a full haircut.",
    image: "/images/aliz-style-high-fade.png",
    accent: "Crisp",
    styleNote: "Made for keeping edges clean between full appointments.",
    inclusions: ["Hairline cleanup", "Neckline cleanup", "Razor detail", "Quick finish"]
  },
  {
    id: "beard-trim",
    name: "Beard Trim",
    shortName: "Beard",
    category: "beard",
    active: true,
    sortOrder: 60,
    price: 20,
    priceCents: cents(20),
    durationMinutes: 25,
    deposit: 5,
    depositCents: cents(5),
    description: "Balanced beard shaping, neckline cleanup, and edge detail.",
    detail: "Focused facial-hair grooming with the same appointment-only care as the full services.",
    image: "/images/aliz-style-classic-taper.png",
    accent: "Balance",
    styleNote: "For clean beard shape without a full haircut.",
    inclusions: ["Beard consultation", "Shape and trim", "Cheek line detail", "Neckline finish"]
  },
  {
    id: "eyebrows",
    name: "Eyebrows",
    shortName: "Brows",
    category: "add_on",
    active: true,
    sortOrder: 70,
    price: 10,
    priceCents: cents(10),
    durationMinutes: 15,
    deposit: 5,
    depositCents: cents(5),
    description: "Subtle eyebrow cleanup for a finished look.",
    detail: "A small add-on or standalone appointment for clean details that do not feel overdone.",
    image: "/images/aliz-hero-gentleman.png",
    accent: "Detail",
    styleNote: "Small detail, big difference in the final look.",
    inclusions: ["Natural brow cleanup", "Shape refinement", "Stray hair removal", "Balanced finish"]
  }
];

export const demoCustomers: readonly Customer[] = [
  {
    id: "cus_demo_001",
    name: "Jordan Price",
    email: "jordan.price@example.com",
    phone: "(555) 010-0101",
    createdAt: "2030-05-10T15:20:00.000Z",
    updatedAt: "2030-05-10T15:20:00.000Z"
  },
  {
    id: "cus_demo_002",
    name: "Malik Stone",
    email: "malik.stone@example.com",
    phone: "(555) 010-0102",
    createdAt: "2030-05-12T18:45:00.000Z",
    updatedAt: "2030-05-29T16:10:00.000Z"
  },
  {
    id: "cus_demo_003",
    name: "Evan Brooks",
    email: "evan.brooks@example.com",
    phone: "(555) 010-0103",
    createdAt: "2030-05-14T12:30:00.000Z",
    updatedAt: "2030-05-14T12:30:00.000Z"
  },
  {
    id: "cus_demo_004",
    name: "Noah Bennett",
    email: "noah.bennett@example.com",
    phone: "(555) 010-0104",
    createdAt: "2030-05-18T19:05:00.000Z",
    updatedAt: "2030-06-02T14:15:00.000Z"
  },
  {
    id: "cus_demo_005",
    name: "Cameron Hayes",
    email: "cameron.hayes@example.com",
    phone: "(555) 010-0105",
    createdAt: "2030-05-21T20:00:00.000Z",
    updatedAt: "2030-05-21T20:00:00.000Z"
  },
  {
    id: "cus_demo_006",
    name: "Riley Carter",
    email: "riley.carter@example.com",
    phone: "(555) 010-0106",
    createdAt: "2030-05-25T13:40:00.000Z",
    updatedAt: "2030-06-03T17:25:00.000Z"
  }
];

export const demoAppointments: readonly DemoAppointmentSeed[] = [
  {
    id: "apt_demo_001",
    customerId: "cus_demo_001",
    serviceId: "basic-cut",
    serviceName: "Basic Cut",
    appointmentDate: "2030-06-17",
    appointmentTime: "10:00 AM",
    startsAt: "2030-06-17T14:00:00.000Z",
    endsAt: "2030-06-17T14:30:00.000Z",
    timezone: DEMO_TIMEZONE,
    durationMinutes: 30,
    price: 30,
    deposit: 10,
    amountDueAtVisit: 20,
    customerName: "Jordan Price",
    customerEmail: "jordan.price@example.com",
    customerPhone: "(555) 010-0101",
    customerNotes: "Keep the sides tight and leave a little length on top.",
    ownerNotes: "Demo pending hold awaiting deposit.",
    status: "pending_deposit",
    paymentStatus: "pending",
    notificationChannels: ["email", "sms"],
    squareCheckoutUrl: "/checkout?appointment=apt_demo_001&seed=1",
    createdAt: "2030-06-10T13:00:00.000Z",
    updatedAt: "2030-06-10T13:00:00.000Z"
  },
  {
    id: "apt_demo_002",
    customerId: "cus_demo_002",
    serviceId: "deluxe-cut",
    serviceName: "Deluxe Cut",
    appointmentDate: "2030-06-17",
    appointmentTime: "11:00 AM",
    startsAt: "2030-06-17T15:00:00.000Z",
    endsAt: "2030-06-17T15:50:00.000Z",
    timezone: DEMO_TIMEZONE,
    durationMinutes: 50,
    price: 40,
    deposit: 15,
    amountDueAtVisit: 25,
    customerName: "Malik Stone",
    customerEmail: "malik.stone@example.com",
    customerPhone: "(555) 010-0102",
    customerNotes: "Low taper with beard balance.",
    ownerNotes: "Deposit recorded in demo payment seed.",
    status: "confirmed",
    paymentStatus: "paid",
    notificationChannels: ["email", "sms"],
    squareCheckoutUrl: "/checkout?appointment=apt_demo_002&seed=1",
    createdAt: "2030-06-08T16:05:00.000Z",
    updatedAt: "2030-06-08T16:22:00.000Z"
  },
  {
    id: "apt_demo_003",
    customerId: "cus_demo_003",
    serviceId: "beard-trim",
    serviceName: "Beard Trim",
    appointmentDate: "2030-06-12",
    appointmentTime: "2:00 PM",
    startsAt: "2030-06-12T18:00:00.000Z",
    endsAt: "2030-06-12T18:25:00.000Z",
    timezone: DEMO_TIMEZONE,
    durationMinutes: 25,
    price: 20,
    deposit: 5,
    amountDueAtVisit: 15,
    customerName: "Evan Brooks",
    customerEmail: "evan.brooks@example.com",
    customerPhone: "(555) 010-0103",
    customerNotes: "Natural beard shape, not too sharp.",
    ownerNotes: "Completed demo appointment.",
    status: "completed",
    paymentStatus: "paid",
    notificationChannels: ["email"],
    createdAt: "2030-06-05T12:45:00.000Z",
    updatedAt: "2030-06-12T18:40:00.000Z"
  },
  {
    id: "apt_demo_004",
    customerId: "cus_demo_004",
    serviceId: "plus-cut",
    serviceName: "Plus Cut",
    appointmentDate: "2030-06-18",
    appointmentTime: "3:30 PM",
    startsAt: "2030-06-18T19:30:00.000Z",
    endsAt: "2030-06-18T20:10:00.000Z",
    timezone: DEMO_TIMEZONE,
    durationMinutes: 40,
    price: 35,
    deposit: 10,
    amountDueAtVisit: 25,
    customerName: "Noah Bennett",
    customerEmail: "noah.bennett@example.com",
    customerPhone: "(555) 010-0104",
    customerNotes: "Rescheduled from earlier in the week.",
    ownerNotes: "Cancelled in demo after customer called.",
    status: "cancelled",
    paymentStatus: "refunded",
    notificationChannels: ["email", "sms"],
    squareCheckoutUrl: "/checkout?appointment=apt_demo_004&seed=1",
    createdAt: "2030-06-06T20:30:00.000Z",
    updatedAt: "2030-06-11T15:45:00.000Z"
  },
  {
    id: "apt_demo_005",
    customerId: "cus_demo_005",
    serviceId: "shape-up",
    serviceName: "Shape Up",
    appointmentDate: "2030-06-13",
    appointmentTime: "5:00 PM",
    startsAt: "2030-06-13T21:00:00.000Z",
    endsAt: "2030-06-13T21:20:00.000Z",
    timezone: DEMO_TIMEZONE,
    durationMinutes: 20,
    price: 15,
    deposit: 5,
    amountDueAtVisit: 10,
    customerName: "Cameron Hayes",
    customerEmail: "cameron.hayes@example.com",
    customerPhone: "(555) 010-0105",
    customerNotes: "Quick lineup before travel.",
    ownerNotes: "Marked no show in demo dashboard.",
    status: "no_show",
    paymentStatus: "paid",
    notificationChannels: ["email"],
    squareCheckoutUrl: "/checkout?appointment=apt_demo_005&seed=1",
    createdAt: "2030-06-07T15:10:00.000Z",
    updatedAt: "2030-06-13T21:30:00.000Z"
  },
  {
    id: "apt_demo_006",
    customerId: "cus_demo_006",
    serviceId: "kids-cut",
    serviceName: "Kids Cut",
    appointmentDate: "2030-06-19",
    appointmentTime: "12:30 PM",
    startsAt: "2030-06-19T16:30:00.000Z",
    endsAt: "2030-06-19T17:00:00.000Z",
    timezone: DEMO_TIMEZONE,
    durationMinutes: 30,
    price: 25,
    deposit: 10,
    amountDueAtVisit: 15,
    customerName: "Riley Carter",
    customerEmail: "riley.carter@example.com",
    customerPhone: "(555) 010-0106",
    customerNotes: "Parent prefers a quick, calm appointment.",
    ownerNotes: "Leave room for a slower start if needed.",
    status: "confirmed",
    paymentStatus: "paid",
    notificationChannels: ["email", "sms"],
    squareCheckoutUrl: "/checkout?appointment=apt_demo_006&seed=1",
    createdAt: "2030-06-09T13:35:00.000Z",
    updatedAt: "2030-06-09T13:47:00.000Z"
  },
  {
    id: "apt_demo_007",
    customerId: "cus_demo_001",
    serviceId: "eyebrows",
    serviceName: "Eyebrows",
    appointmentDate: "2030-06-20",
    appointmentTime: "2:00 PM",
    startsAt: "2030-06-20T18:00:00.000Z",
    endsAt: "2030-06-20T18:15:00.000Z",
    timezone: DEMO_TIMEZONE,
    durationMinutes: 15,
    price: 10,
    deposit: 5,
    amountDueAtVisit: 5,
    customerName: "Jordan Price",
    customerEmail: "jordan.price@example.com",
    customerPhone: "(555) 010-0101",
    customerNotes: "Standalone detail cleanup.",
    ownerNotes: "Demo second appointment for same customer.",
    status: "pending_deposit",
    paymentStatus: "pending",
    notificationChannels: ["email"],
    squareCheckoutUrl: "/checkout?appointment=apt_demo_007&seed=1",
    createdAt: "2030-06-10T19:20:00.000Z",
    updatedAt: "2030-06-10T19:20:00.000Z"
  },
  {
    id: "apt_demo_008",
    customerId: "cus_demo_002",
    serviceId: "basic-cut",
    serviceName: "Basic Cut",
    appointmentDate: "2030-06-11",
    appointmentTime: "10:00 AM",
    startsAt: "2030-06-11T14:00:00.000Z",
    endsAt: "2030-06-11T14:30:00.000Z",
    timezone: DEMO_TIMEZONE,
    durationMinutes: 30,
    price: 30,
    deposit: 10,
    amountDueAtVisit: 20,
    customerName: "Malik Stone",
    customerEmail: "malik.stone@example.com",
    customerPhone: "(555) 010-0102",
    customerNotes: "Same clean basic cut as last visit.",
    ownerNotes: "Completed and paid in demo history.",
    status: "completed",
    paymentStatus: "paid",
    notificationChannels: ["email", "sms"],
    squareCheckoutUrl: "/checkout?appointment=apt_demo_008&seed=1",
    createdAt: "2030-06-03T16:00:00.000Z",
    updatedAt: "2030-06-11T14:45:00.000Z"
  }
];

export const demoBookingHolds: readonly BookingHold[] = [
  {
    id: "hold_demo_001",
    appointmentId: "apt_demo_001",
    serviceId: "basic-cut",
    customerId: "cus_demo_001",
    appointmentDate: "2030-06-17",
    appointmentTime: "10:00 AM",
    status: "active",
    expiresAt: "2030-06-10T13:20:00.000Z",
    createdAt: "2030-06-10T13:00:00.000Z"
  },
  {
    id: "hold_demo_002",
    serviceId: "plus-cut",
    customerId: "cus_demo_004",
    appointmentDate: "2030-06-18",
    appointmentTime: "3:30 PM",
    status: "converted",
    expiresAt: "2030-06-06T20:50:00.000Z",
    createdAt: "2030-06-06T20:30:00.000Z"
  },
  {
    id: "hold_demo_003",
    serviceId: "shape-up",
    customerId: "cus_demo_005",
    appointmentDate: "2030-06-14",
    appointmentTime: "5:00 PM",
    status: "expired",
    expiresAt: "2030-06-08T17:20:00.000Z",
    createdAt: "2030-06-08T17:00:00.000Z"
  }
];

export const demoPayments: readonly DepositPayment[] = [
  {
    id: "pay_demo_001",
    appointmentId: "apt_demo_001",
    provider: "square",
    status: "pending",
    amountCents: cents(10),
    currency: "USD",
    paymentKind: "deposit",
    reference: {
      provider: "square",
      providerCheckoutId: "demo_square_checkout_001",
      checkoutUrl: "/checkout?appointment=apt_demo_001&seed=1"
    },
    createdAt: "2030-06-10T13:00:00.000Z",
    updatedAt: "2030-06-10T13:00:00.000Z"
  },
  {
    id: "pay_demo_002",
    appointmentId: "apt_demo_002",
    provider: "square",
    status: "paid",
    amountCents: cents(15),
    currency: "USD",
    paymentKind: "deposit",
    reference: {
      provider: "square",
      providerCheckoutId: "demo_square_checkout_002",
      providerPaymentId: "demo_square_payment_002",
      checkoutUrl: "/checkout?appointment=apt_demo_002&seed=1"
    },
    createdAt: "2030-06-08T16:05:00.000Z",
    updatedAt: "2030-06-08T16:22:00.000Z",
    paidAt: "2030-06-08T16:22:00.000Z"
  },
  {
    id: "pay_demo_003",
    appointmentId: "apt_demo_003",
    provider: "square",
    status: "paid",
    amountCents: cents(5),
    currency: "USD",
    paymentKind: "deposit",
    reference: {
      provider: "square",
      providerCheckoutId: "demo_square_checkout_003",
      providerPaymentId: "demo_square_payment_003"
    },
    createdAt: "2030-06-05T12:45:00.000Z",
    updatedAt: "2030-06-05T12:52:00.000Z",
    paidAt: "2030-06-05T12:52:00.000Z"
  },
  {
    id: "pay_demo_004",
    appointmentId: "apt_demo_004",
    provider: "square",
    status: "refunded",
    amountCents: cents(10),
    currency: "USD",
    paymentKind: "deposit",
    reference: {
      provider: "square",
      providerCheckoutId: "demo_square_checkout_004",
      providerPaymentId: "demo_square_payment_004"
    },
    createdAt: "2030-06-06T20:30:00.000Z",
    updatedAt: "2030-06-11T15:45:00.000Z",
    paidAt: "2030-06-06T20:44:00.000Z",
    refundedAt: "2030-06-11T15:45:00.000Z"
  },
  {
    id: "pay_demo_005",
    appointmentId: "apt_demo_005",
    provider: "square",
    status: "paid",
    amountCents: cents(5),
    currency: "USD",
    paymentKind: "deposit",
    reference: {
      provider: "square",
      providerCheckoutId: "demo_square_checkout_005",
      providerPaymentId: "demo_square_payment_005"
    },
    createdAt: "2030-06-07T15:10:00.000Z",
    updatedAt: "2030-06-07T15:16:00.000Z",
    paidAt: "2030-06-07T15:16:00.000Z"
  },
  {
    id: "pay_demo_006",
    appointmentId: "apt_demo_006",
    provider: "square",
    status: "paid",
    amountCents: cents(10),
    currency: "USD",
    paymentKind: "deposit",
    reference: {
      provider: "square",
      providerCheckoutId: "demo_square_checkout_006",
      providerPaymentId: "demo_square_payment_006"
    },
    createdAt: "2030-06-09T13:35:00.000Z",
    updatedAt: "2030-06-09T13:47:00.000Z",
    paidAt: "2030-06-09T13:47:00.000Z"
  },
  {
    id: "pay_demo_007",
    appointmentId: "apt_demo_007",
    provider: "square",
    status: "pending",
    amountCents: cents(5),
    currency: "USD",
    paymentKind: "deposit",
    reference: {
      provider: "square",
      providerCheckoutId: "demo_square_checkout_007",
      checkoutUrl: "/checkout?appointment=apt_demo_007&seed=1"
    },
    createdAt: "2030-06-10T19:20:00.000Z",
    updatedAt: "2030-06-10T19:20:00.000Z"
  },
  {
    id: "pay_demo_008",
    appointmentId: "apt_demo_008",
    provider: "square",
    status: "paid",
    amountCents: cents(10),
    currency: "USD",
    paymentKind: "deposit",
    reference: {
      provider: "square",
      providerCheckoutId: "demo_square_checkout_008",
      providerPaymentId: "demo_square_payment_008"
    },
    createdAt: "2030-06-03T16:00:00.000Z",
    updatedAt: "2030-06-03T16:09:00.000Z",
    paidAt: "2030-06-03T16:09:00.000Z"
  }
];

export const demoAvailabilityRules: readonly BusinessHoursRule[] = [
  {
    id: "hours_demo_monday",
    weekday: 1,
    startTime: "10:00 AM",
    endTime: "6:00 PM",
    slotIntervalMinutes: 30,
    timezone: DEMO_TIMEZONE,
    active: true
  },
  {
    id: "hours_demo_tuesday",
    weekday: 2,
    startTime: "10:00 AM",
    endTime: "6:00 PM",
    slotIntervalMinutes: 30,
    timezone: DEMO_TIMEZONE,
    active: true
  },
  {
    id: "hours_demo_wednesday",
    weekday: 3,
    startTime: "10:00 AM",
    endTime: "6:00 PM",
    slotIntervalMinutes: 30,
    timezone: DEMO_TIMEZONE,
    active: true
  },
  {
    id: "hours_demo_thursday",
    weekday: 4,
    startTime: "10:00 AM",
    endTime: "6:00 PM",
    slotIntervalMinutes: 30,
    timezone: DEMO_TIMEZONE,
    active: true
  },
  {
    id: "hours_demo_friday",
    weekday: 5,
    startTime: "10:00 AM",
    endTime: "6:00 PM",
    slotIntervalMinutes: 30,
    timezone: DEMO_TIMEZONE,
    active: true
  },
  {
    id: "hours_demo_saturday",
    weekday: 6,
    startTime: "10:00 AM",
    endTime: "3:00 PM",
    slotIntervalMinutes: 30,
    timezone: DEMO_TIMEZONE,
    active: true
  }
];

export const demoAvailabilityBlocks: readonly AvailabilityBlock[] = [
  {
    id: "block_demo_all_day_closure",
    type: "full_day",
    reason: "Demo all-day studio closure.",
    allDay: true,
    startsAt: "2030-06-24T04:00:00.000Z",
    endsAt: "2030-06-25T04:00:00.000Z",
    timezone: DEMO_TIMEZONE,
    createdAt: DEMO_CREATED_AT,
    updatedAt: DEMO_UPDATED_AT
  },
  {
    id: "block_demo_partial_day",
    type: "time_range",
    reason: "Demo partial-day owner errand.",
    allDay: false,
    startsAt: "2030-06-18T17:00:00.000Z",
    endsAt: "2030-06-18T18:30:00.000Z",
    timezone: DEMO_TIMEZONE,
    createdAt: DEMO_CREATED_AT,
    updatedAt: DEMO_UPDATED_AT
  },
  {
    id: "block_demo_lunch_break",
    type: "time_range",
    reason: "Demo lunch and personal break.",
    allDay: false,
    startsAt: "2030-06-19T16:00:00.000Z",
    endsAt: "2030-06-19T16:45:00.000Z",
    timezone: DEMO_TIMEZONE,
    createdAt: DEMO_CREATED_AT,
    updatedAt: DEMO_UPDATED_AT
  },
  {
    id: "block_demo_future_vacation",
    type: "full_day",
    reason: "Demo future vacation block.",
    allDay: true,
    startsAt: "2030-07-03T04:00:00.000Z",
    endsAt: "2030-07-07T04:00:00.000Z",
    timezone: DEMO_TIMEZONE,
    createdAt: DEMO_CREATED_AT,
    updatedAt: DEMO_UPDATED_AT
  }
];

export const demoNotificationLogs: readonly NotificationLog[] = [
  {
    id: "notify_demo_001",
    appointmentId: "apt_demo_001",
    channel: "email",
    recipient: "owner@example.com",
    status: "queued",
    provider: "mock",
    createdAt: "2030-06-10T13:00:05.000Z"
  },
  {
    id: "notify_demo_002",
    appointmentId: "apt_demo_002",
    channel: "email",
    recipient: "owner@example.com",
    status: "sent",
    provider: "mock",
    createdAt: "2030-06-08T16:22:05.000Z",
    sentAt: "2030-06-08T16:22:06.000Z"
  },
  {
    id: "notify_demo_003",
    appointmentId: "apt_demo_002",
    channel: "sms",
    recipient: "+15550109999",
    status: "sent",
    provider: "mock",
    createdAt: "2030-06-08T16:22:05.000Z",
    sentAt: "2030-06-08T16:22:06.000Z"
  },
  {
    id: "notify_demo_004",
    appointmentId: "apt_demo_004",
    channel: "email",
    recipient: "owner@example.com",
    status: "sent",
    provider: "mock",
    createdAt: "2030-06-11T15:45:05.000Z",
    sentAt: "2030-06-11T15:45:06.000Z"
  },
  {
    id: "notify_demo_005",
    appointmentId: "apt_demo_007",
    channel: "sms",
    recipient: "+15550109999",
    status: "failed",
    provider: "mock",
    error: "Demo SMS failure record only. No real message was sent.",
    createdAt: "2030-06-10T19:20:05.000Z"
  },
  {
    id: "notify_demo_006",
    channel: "sms",
    recipient: "+15550109999",
    status: "skipped",
    provider: "mock",
    error: "SMS disabled in demo owner settings.",
    createdAt: "2030-06-01T14:00:00.000Z"
  }
];

export const demoBookingSettings: BookingSettings = {
  timezone: DEMO_TIMEZONE,
  depositHoldMinutes: 20,
  defaultBufferMinutes: 10,
  maxBookingDaysAhead: 120
};

export const demoOwnerSettings: OwnerSettings = {
  ownerName: "Aliz Studio Demo Owner",
  notificationEmail: "owner@example.com",
  notificationPhone: "(555) 010-9999",
  enabledNotificationChannels: ["email"],
  booking: demoBookingSettings
};

export const demoAppointmentEvents: readonly AppointmentAuditEvent[] = [
  {
    id: "evt_demo_001",
    appointmentId: "apt_demo_001",
    actorType: "customer",
    eventType: "created",
    payload: {
      source: "demo_seed",
      serviceId: "basic-cut"
    },
    createdAt: "2030-06-10T13:00:00.000Z"
  },
  {
    id: "evt_demo_002",
    appointmentId: "apt_demo_002",
    actorType: "payment_provider",
    actorId: "square_demo",
    eventType: "payment_changed",
    payload: {
      from: "pending",
      to: "paid",
      paymentId: "pay_demo_002",
      providerPaymentId: "demo_square_payment_002"
    },
    createdAt: "2030-06-08T16:22:00.000Z"
  },
  {
    id: "evt_demo_003",
    appointmentId: "apt_demo_002",
    actorType: "system",
    eventType: "status_changed",
    payload: {
      from: "pending_deposit",
      to: "confirmed",
      reason: "deposit_paid"
    },
    createdAt: "2030-06-08T16:22:01.000Z"
  },
  {
    id: "evt_demo_004",
    appointmentId: "apt_demo_004",
    actorType: "owner",
    actorId: "owner_demo",
    eventType: "cancelled",
    payload: {
      reason: "customer_requested",
      refundPaymentId: "pay_demo_004"
    },
    createdAt: "2030-06-11T15:45:00.000Z"
  },
  {
    id: "evt_demo_005",
    appointmentId: "apt_demo_006",
    actorType: "owner",
    actorId: "owner_demo",
    eventType: "owner_note_updated",
    payload: {
      notePreview: "Leave room for a slower start if needed."
    },
    createdAt: "2030-06-09T13:47:00.000Z"
  },
  {
    id: "evt_demo_006",
    appointmentId: "apt_demo_004",
    actorType: "owner",
    actorId: "owner_demo",
    eventType: "availability_blocked",
    payload: {
      availabilityBlockId: "block_demo_partial_day",
      reason: "blocked_time_created"
    },
    createdAt: "2030-06-01T14:00:00.000Z"
  }
];

function assertSeedInvariant(condition: unknown, message: string): asserts condition {
  if (!condition) {
    throw new Error(`Invalid demo seed data: ${message}`);
  }
}

function assertUniqueIds(collectionName: string, items: readonly { id: string }[]) {
  const ids = new Set<string>();

  for (const item of items) {
    assertSeedInvariant(!ids.has(item.id), `${collectionName} has duplicate id ${item.id}.`);
    ids.add(item.id);
  }
}

function assertKnownValue(collectionName: string, value: string, knownValues: ReadonlySet<string>) {
  assertSeedInvariant(knownValues.has(value), `${collectionName} uses unknown value ${value}.`);
}

function assertChronologicalRange(collectionName: string, startsAt: string, endsAt: string) {
  assertSeedInvariant(
    Number.isFinite(Date.parse(startsAt)) && Number.isFinite(Date.parse(endsAt)),
    `${collectionName} has an invalid ISO date range.`
  );
  assertSeedInvariant(
    Date.parse(startsAt) < Date.parse(endsAt),
    `${collectionName} must start before it ends.`
  );
}

export function validateDemoSeedData() {
  assertUniqueIds("services", demoServices);
  assertUniqueIds("customers", demoCustomers);
  assertUniqueIds("appointments", demoAppointments);
  assertUniqueIds("booking holds", demoBookingHolds);
  assertUniqueIds("payments", demoPayments);
  assertUniqueIds("availability rules", demoAvailabilityRules);
  assertUniqueIds("availability blocks", demoAvailabilityBlocks);
  assertUniqueIds("notification logs", demoNotificationLogs);
  assertUniqueIds("appointment events", demoAppointmentEvents);

  const serviceIds = new Set<ServiceId>(demoServices.map((service) => service.id));
  const customerIds = new Set<CustomerId>(demoCustomers.map((customer) => customer.id));
  const appointmentIds = new Set<AppointmentId>(demoAppointments.map((appointment) => appointment.id));
  const availabilityBlockIds = new Set(demoAvailabilityBlocks.map((block) => block.id));
  const appointmentStatuses = new Set<string>(APPOINTMENT_STATUSES);
  const paymentStatuses = new Set<string>(PAYMENT_STATUSES);
  const paymentProviders = new Set<string>(PAYMENT_PROVIDERS);
  const bookingHoldStatuses = new Set<string>(BOOKING_HOLD_STATUSES);
  const notificationChannels = new Set<string>(NOTIFICATION_CHANNELS);
  const notificationStatuses = new Set<string>(NOTIFICATION_STATUSES);
  const availabilityBlockTypes = new Set<string>(AVAILABILITY_BLOCK_TYPES);

  for (const appointment of demoAppointments) {
    assertSeedInvariant(serviceIds.has(appointment.serviceId), `${appointment.id} references an unknown service.`);
    assertSeedInvariant(customerIds.has(appointment.customerId), `${appointment.id} references an unknown customer.`);
    assertKnownValue("appointments", appointment.status, appointmentStatuses);
    assertKnownValue("appointments", appointment.paymentStatus, paymentStatuses);
    assertChronologicalRange(`appointment ${appointment.id}`, appointment.startsAt, appointment.endsAt);
  }

  for (const hold of demoBookingHolds) {
    assertSeedInvariant(serviceIds.has(hold.serviceId), `${hold.id} references an unknown service.`);
    assertKnownValue("booking holds", hold.status, bookingHoldStatuses);

    if (hold.appointmentId) {
      assertSeedInvariant(appointmentIds.has(hold.appointmentId), `${hold.id} references an unknown appointment.`);
    }

    if (hold.customerId) {
      assertSeedInvariant(customerIds.has(hold.customerId), `${hold.id} references an unknown customer.`);
    }
  }

  for (const payment of demoPayments) {
    assertSeedInvariant(appointmentIds.has(payment.appointmentId), `${payment.id} references an unknown appointment.`);
    assertKnownValue("payments", payment.provider, paymentProviders);
    assertKnownValue("payments", payment.status, paymentStatuses);
  }

  for (const block of demoAvailabilityBlocks) {
    assertKnownValue("availability blocks", block.type, availabilityBlockTypes);
    assertChronologicalRange(`availability block ${block.id}`, block.startsAt, block.endsAt);
  }

  for (const log of demoNotificationLogs) {
    assertKnownValue("notification logs", log.channel, notificationChannels);
    assertKnownValue("notification logs", log.status, notificationStatuses);

    if (log.appointmentId) {
      assertSeedInvariant(appointmentIds.has(log.appointmentId), `${log.id} references an unknown appointment.`);
    }
  }

  for (const event of demoAppointmentEvents) {
    assertSeedInvariant(appointmentIds.has(event.appointmentId), `${event.id} references an unknown appointment.`);

    if (event.eventType === "availability_blocked") {
      const availabilityBlockId = event.payload?.availabilityBlockId;
      assertSeedInvariant(
        typeof availabilityBlockId === "string" && availabilityBlockIds.has(availabilityBlockId),
        `${event.id} references an unknown availability block.`
      );
    }
  }
}

export function getDemoSeedData() {
  validateDemoSeedData();

  return {
    version: DEMO_SEED_VERSION,
    timezone: DEMO_TIMEZONE,
    anchorDate: DEMO_ANCHOR_DATE,
    services: demoServices,
    customers: demoCustomers,
    appointments: demoAppointments,
    bookingHolds: demoBookingHolds,
    payments: demoPayments,
    availabilityRules: demoAvailabilityRules,
    availabilityBlocks: demoAvailabilityBlocks,
    notificationLogs: demoNotificationLogs,
    ownerSettings: demoOwnerSettings,
    bookingSettings: demoBookingSettings,
    appointmentEvents: demoAppointmentEvents
  };
}

export function getDemoSeedSummary() {
  const seed = getDemoSeedData();

  return {
    version: seed.version,
    timezone: seed.timezone,
    anchorDate: seed.anchorDate,
    counts: {
      services: seed.services.length,
      customers: seed.customers.length,
      appointments: seed.appointments.length,
      bookingHolds: seed.bookingHolds.length,
      payments: seed.payments.length,
      availabilityRules: seed.availabilityRules.length,
      availabilityBlocks: seed.availabilityBlocks.length,
      notificationLogs: seed.notificationLogs.length,
      appointmentEvents: seed.appointmentEvents.length
    }
  };
}
