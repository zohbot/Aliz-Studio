import type {
  ADMIN_ROLES,
  APPOINTMENT_STATUSES,
  AVAILABILITY_BLOCK_TYPES,
  BOOKING_HOLD_STATUSES,
  NOTIFICATION_CHANNELS,
  NOTIFICATION_STATUSES,
  PAYMENT_PROVIDERS,
  PAYMENT_STATUSES,
  SQUARE_CHECKOUT_MODES
} from "@/lib/domain/constants";

export type Id = string;
export type IsoDateString = string;
export type IsoDateTimeString = string;
export type LocalTimeLabel = string;
export type TimezoneName = string;
export type MoneyCents = number;
export type PriceCents = MoneyCents;
export type ServiceDurationMinutes = number;

export type ServiceId = Id;
export type CustomerId = Id;
export type AppointmentId = Id;
export type PaymentId = Id;
export type AvailabilityBlockId = Id;
export type NotificationLogId = Id;
export type BookingHoldId = Id;
export type AppointmentEventId = Id;

export type ServiceCategory = "haircut" | "beard" | "detail" | "kids" | "add_on";

export type Service = {
  id: ServiceId;
  name: string;
  shortName: string;
  price: number;
  durationMinutes: ServiceDurationMinutes;
  deposit: number;
  description: string;
  detail: string;
  image: string;
  accent: string;
  styleNote: string;
  inclusions: string[];
  category?: ServiceCategory;
  active?: boolean;
  sortOrder?: number;
};

export type CustomerContact = {
  name: string;
  email: string;
  phone: string;
};

export type Customer = CustomerContact & {
  id: CustomerId;
  createdAt: IsoDateTimeString;
  updatedAt: IsoDateTimeString;
};

export type BookingCustomerInput = CustomerContact & {
  notes?: string;
};

export type CustomerInput = BookingCustomerInput;

export type AppointmentStatus = (typeof APPOINTMENT_STATUSES)[number];
export type PaymentStatus = (typeof PAYMENT_STATUSES)[number];
export type PaymentProvider = (typeof PAYMENT_PROVIDERS)[number];
export type SquareCheckoutMode = (typeof SQUARE_CHECKOUT_MODES)[number];
export type KnownNotificationChannel = (typeof NOTIFICATION_CHANNELS)[number];
export type NotificationChannel = KnownNotificationChannel | string;
export type NotificationStatus = (typeof NOTIFICATION_STATUSES)[number];
export type AvailabilityBlockType = (typeof AVAILABILITY_BLOCK_TYPES)[number];
export type BookingHoldStatus = (typeof BOOKING_HOLD_STATUSES)[number];
export type AdminRole = (typeof ADMIN_ROLES)[number];

export type Appointment = {
  id: AppointmentId;
  serviceId: ServiceId;
  serviceName: string;
  appointmentDate: IsoDateString;
  appointmentTime: LocalTimeLabel;
  durationMinutes: ServiceDurationMinutes;
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
  notificationChannels: NotificationChannel[];
  squareCheckoutUrl?: string;
  createdAt: IsoDateTimeString;
  updatedAt: IsoDateTimeString;
};

export type AppointmentUpdateInput = {
  status?: AppointmentStatus;
  paymentStatus?: PaymentStatus;
  ownerNotes?: string;
};

export type AppointmentListFilters = {
  status?: AppointmentStatus | "all";
  paymentStatus?: PaymentStatus | "all";
  serviceId?: ServiceId;
  customerQuery?: string;
  fromDate?: IsoDateString;
  toDate?: IsoDateString;
};

export type AppointmentAuditEvent = {
  id: AppointmentEventId;
  appointmentId: AppointmentId;
  actorType: "system" | "owner" | "customer" | "payment_provider";
  actorId?: string;
  eventType:
    | "created"
    | "status_changed"
    | "payment_changed"
    | "cancelled"
    | "refunded"
    | "availability_blocked"
    | "owner_note_updated";
  payload?: Record<string, unknown>;
  createdAt: IsoDateTimeString;
};

export type AppointmentEvent = AppointmentAuditEvent;

export type BookingQuoteInput = {
  serviceId: ServiceId;
  appointmentDate: IsoDateString;
};

export type BookingQuote = {
  serviceId: ServiceId;
  serviceName: string;
  appointmentDate: IsoDateString;
  durationMinutes: ServiceDurationMinutes;
  price: number;
  deposit: number;
  amountDueAtVisit: number;
};

export type BookingRequest = BookingQuoteInput &
  BookingCustomerInput & {
    appointmentTime: LocalTimeLabel;
  };

export type BookingCreateInput = BookingRequest;

export type CreateAppointmentInput = {
  quote: BookingQuote;
  appointmentTime: LocalTimeLabel;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  customerNotes?: string;
  squareCheckoutUrl?: string;
};

export type BookingHold = {
  id: BookingHoldId;
  appointmentId?: AppointmentId;
  serviceId: ServiceId;
  customerId?: CustomerId;
  appointmentDate: IsoDateString;
  appointmentTime: LocalTimeLabel;
  status: BookingHoldStatus;
  expiresAt: IsoDateTimeString;
  createdAt: IsoDateTimeString;
};

export type PaymentProviderReference = {
  provider: PaymentProvider;
  providerCheckoutId?: string;
  providerPaymentId?: string;
  checkoutUrl?: string;
};

export type SquareCheckoutReference = {
  checkoutUrl: string;
  provider: "square";
  mode: SquareCheckoutMode;
};

export type Payment = {
  id: PaymentId;
  appointmentId: AppointmentId;
  provider: PaymentProvider;
  status: PaymentStatus;
  amountCents: MoneyCents;
  currency: "USD";
  reference?: PaymentProviderReference;
  createdAt: IsoDateTimeString;
  updatedAt: IsoDateTimeString;
  paidAt?: IsoDateTimeString;
  refundedAt?: IsoDateTimeString;
};

export type DepositPayment = Payment & {
  paymentKind: "deposit";
};

export type NotificationDispatchResult = {
  queued: boolean;
  channels: NotificationChannel[];
  preview: string;
  status?: NotificationStatus;
  providerMessageIds?: string[];
};

export type BookingCreateResult = {
  status: "pending_deposit";
  appointment: Appointment;
  quote: BookingQuote;
  checkout: SquareCheckoutReference;
  notification: NotificationDispatchResult;
};

export type AvailabilitySlot = {
  label: LocalTimeLabel;
  value: LocalTimeLabel;
  isReserved?: boolean;
};

export type BlockedTimeRange = {
  startsAt: IsoDateTimeString;
  endsAt: IsoDateTimeString;
  timezone: TimezoneName;
};

export type AvailabilityBlock = {
  id: AvailabilityBlockId;
  type: AvailabilityBlockType;
  reason?: string;
  allDay: boolean;
  startsAt: IsoDateTimeString;
  endsAt: IsoDateTimeString;
  timezone: TimezoneName;
  createdAt: IsoDateTimeString;
  updatedAt: IsoDateTimeString;
};

export type AvailabilityBlockInput = Omit<AvailabilityBlock, "id" | "createdAt" | "updatedAt">;

export type BusinessHoursRule = {
  id: Id;
  weekday: 0 | 1 | 2 | 3 | 4 | 5 | 6;
  startTime: LocalTimeLabel;
  endTime: LocalTimeLabel;
  slotIntervalMinutes: number;
  timezone: TimezoneName;
  active: boolean;
};

export type AvailabilityRule = BusinessHoursRule;

export type NotificationLog = {
  id: NotificationLogId;
  appointmentId?: AppointmentId;
  channel: NotificationChannel;
  recipient: string;
  status: NotificationStatus;
  provider?: "resend" | "twilio" | "mock";
  error?: string;
  createdAt: IsoDateTimeString;
  sentAt?: IsoDateTimeString;
};

export type OwnerNotificationPayload = {
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  quote: BookingQuote;
};

export type BookingNotification = OwnerNotificationPayload;

export type BookingSettings = {
  timezone: TimezoneName;
  depositHoldMinutes: number;
  defaultBufferMinutes: number;
  maxBookingDaysAhead: number;
};

export type OwnerSettings = {
  ownerName: string;
  notificationEmail?: string;
  notificationPhone?: string;
  enabledNotificationChannels: NotificationChannel[];
  booking: BookingSettings;
};
