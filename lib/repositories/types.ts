import type {
  Appointment,
  AppointmentStatus,
  AvailabilitySettings,
  AvailabilitySettingsUpdateInput,
  AppointmentUpdateInput,
  CreateAppointmentInput,
  CustomerId,
  CustomerProfile,
  CustomerProfileUpdateInput,
  PaymentStatus,
  Service,
  ServiceUpdateInput
} from "@/lib/domain";

export const REPOSITORY_BACKENDS = ["file", "demo", "supabase"] as const;

export type RepositoryBackend = (typeof REPOSITORY_BACKENDS)[number];

export type RepositoryContext = {
  backend?: RepositoryBackend;
};

export type AppointmentStats = {
  total: number;
  upcoming: number;
  confirmed: number;
  pendingDeposits: number;
  projectedRevenue: number;
  depositsCollected: number;
};

export type CompleteAppointmentDepositInput = {
  appointmentId: string;
  cardholderName: string;
  cardLastFour: string;
};

export type CreateAppointmentRepositoryInput = CreateAppointmentInput;

export type UpdateAppointmentRepositoryInput = AppointmentUpdateInput;

export type UpdateServiceRepositoryInput = ServiceUpdateInput;

export type UpdateAvailabilitySettingsRepositoryInput = AvailabilitySettingsUpdateInput;

export type UpdateCustomerProfileRepositoryInput = CustomerProfileUpdateInput;

export type AppointmentRepositoryErrorCode =
  | "invalid_backend"
  | "not_configured"
  | "not_implemented"
  | "slot_unavailable";

export class AppointmentRepositoryError extends Error {
  readonly backend?: RepositoryBackend;
  readonly code: AppointmentRepositoryErrorCode;

  constructor(message: string, options: { backend?: RepositoryBackend; code: AppointmentRepositoryErrorCode }) {
    super(message);
    this.name = "AppointmentRepositoryError";
    this.backend = options.backend;
    this.code = options.code;
  }
}

export type ServiceRepositoryErrorCode =
  | "invalid_backend"
  | "not_configured"
  | "not_implemented"
  | "invalid_service";

export class ServiceRepositoryError extends Error {
  readonly backend?: RepositoryBackend;
  readonly code: ServiceRepositoryErrorCode;

  constructor(message: string, options: { backend?: RepositoryBackend; code: ServiceRepositoryErrorCode }) {
    super(message);
    this.name = "ServiceRepositoryError";
    this.backend = options.backend;
    this.code = options.code;
  }
}

export type AvailabilityRepositoryErrorCode =
  | "invalid_backend"
  | "not_configured"
  | "not_implemented"
  | "invalid_settings";

export class AvailabilityRepositoryError extends Error {
  readonly backend?: RepositoryBackend;
  readonly code: AvailabilityRepositoryErrorCode;

  constructor(message: string, options: { backend?: RepositoryBackend; code: AvailabilityRepositoryErrorCode }) {
    super(message);
    this.name = "AvailabilityRepositoryError";
    this.backend = options.backend;
    this.code = options.code;
  }
}

export type CustomerProfileRepositoryErrorCode =
  | "invalid_backend"
  | "not_configured"
  | "not_implemented"
  | "invalid_profile";

export class CustomerProfileRepositoryError extends Error {
  readonly backend?: RepositoryBackend;
  readonly code: CustomerProfileRepositoryErrorCode;

  constructor(
    message: string,
    options: { backend?: RepositoryBackend; code: CustomerProfileRepositoryErrorCode }
  ) {
    super(message);
    this.name = "CustomerProfileRepositoryError";
    this.backend = options.backend;
    this.code = options.code;
  }
}

export type AppointmentRepository = {
  readonly backend: RepositoryBackend;
  listAppointments(): Promise<Appointment[]>;
  getAppointmentById(appointmentId: string): Promise<Appointment | null>;
  createAppointment(input: CreateAppointmentRepositoryInput): Promise<Appointment>;
  getReservedTimesForDate(appointmentDate: string): Promise<string[]>;
  isAppointmentSlotAvailable(appointmentDate: string, appointmentTime: string): Promise<boolean>;
  updateAppointment(
    appointmentId: string,
    patch: UpdateAppointmentRepositoryInput
  ): Promise<Appointment | null>;
  updateAppointmentStatus(
    appointmentId: string,
    status: AppointmentStatus
  ): Promise<Appointment | null>;
  updateAppointmentPaymentStatus(
    appointmentId: string,
    paymentStatus: PaymentStatus
  ): Promise<Appointment | null>;
  setAppointmentCheckoutUrl(appointmentId: string, squareCheckoutUrl: string): Promise<Appointment | null>;
  completeAppointmentDeposit(input: CompleteAppointmentDepositInput): Promise<Appointment | null>;
  getAppointmentStats(): Promise<AppointmentStats>;
};

export type ServiceRepository = {
  readonly backend: RepositoryBackend;
  listServices(): Promise<Service[]>;
  getServiceById(serviceId: string): Promise<Service | null>;
  updateService(serviceId: string, patch: UpdateServiceRepositoryInput): Promise<Service | null>;
};

export type AvailabilityRepository = {
  readonly backend: RepositoryBackend;
  getAvailabilitySettings(): Promise<AvailabilitySettings>;
  updateAvailabilitySettings(
    input: UpdateAvailabilitySettingsRepositoryInput
  ): Promise<AvailabilitySettings>;
};

export type CustomerProfileRepository = {
  readonly backend: RepositoryBackend;
  listCustomerProfiles(): Promise<CustomerProfile[]>;
  getCustomerProfile(customerId: CustomerId): Promise<CustomerProfile | null>;
  updateCustomerProfile(
    customerId: CustomerId,
    patch: UpdateCustomerProfileRepositoryInput
  ): Promise<CustomerProfile>;
};
