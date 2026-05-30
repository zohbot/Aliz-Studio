-- Aliz Studio production booking backend foundation.
-- This migration is schema-only: it does not connect the app runtime to Supabase.

create extension if not exists pgcrypto;
create extension if not exists btree_gist;
create extension if not exists citext;

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create table public.admin_users (
  id uuid primary key default gen_random_uuid(),
  auth_user_id uuid unique references auth.users(id) on delete set null,
  email citext not null unique,
  display_name text,
  role text not null,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  constraint admin_users_role_check check (role in ('owner', 'manager'))
);

comment on table public.admin_users is
  'Future owner/admin profile table. Supports Supabase Auth later without replacing current custom owner auth in this task.';

create table public.services (
  id text primary key,
  slug text not null unique,
  name text not null,
  short_name text,
  short_description text,
  description text,
  category text,
  duration_minutes integer not null,
  price_cents integer not null,
  deposit_cents integer not null,
  image_path text,
  accent text,
  style_note text,
  inclusions jsonb not null default '[]'::jsonb,
  active boolean not null default true,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  constraint services_duration_minutes_check check (duration_minutes > 0),
  constraint services_price_cents_check check (price_cents >= 0),
  constraint services_deposit_cents_check check (deposit_cents >= 0),
  constraint services_deposit_cents_lte_price_cents_check check (deposit_cents <= price_cents),
  constraint services_inclusions_array_check check (jsonb_typeof(inclusions) = 'array')
);

comment on table public.services is
  'Durable service catalog. Text IDs preserve current static service IDs such as basic-cut and deluxe-cut.';

create table public.customers (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  email citext not null,
  phone text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

comment on table public.customers is
  'Customer contact records for bookings. Customers do not need accounts for the MVP.';

create table public.appointments (
  id uuid primary key default gen_random_uuid(),
  service_id text not null references public.services(id),
  customer_id uuid not null references public.customers(id),
  starts_at timestamptz not null,
  ends_at timestamptz not null,
  timezone text not null default 'America/New_York',
  status text not null,
  price_cents integer not null,
  deposit_cents integer not null,
  amount_due_at_visit_cents integer not null,
  customer_notes text,
  owner_notes text,
  deposit_expires_at timestamptz,
  cancelled_at timestamptz,
  cancellation_reason text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  constraint appointments_time_range_check check (ends_at > starts_at),
  constraint appointments_status_check check (
    status in ('pending_deposit', 'confirmed', 'completed', 'cancelled', 'no_show')
  ),
  constraint appointments_price_cents_check check (price_cents >= 0),
  constraint appointments_deposit_cents_check check (deposit_cents >= 0),
  constraint appointments_amount_due_at_visit_cents_check check (amount_due_at_visit_cents >= 0),
  constraint appointments_deposit_cents_lte_price_cents_check check (deposit_cents <= price_cents)
);

comment on table public.appointments is
  'Durable appointment records. Active pending_deposit and confirmed appointments are protected from overlap by a GiST exclusion constraint.';

alter table public.appointments
  add constraint appointments_no_overlapping_active_times
  exclude using gist (
    tstzrange(starts_at, ends_at, '[)') with &&
  )
  where (status in ('pending_deposit', 'confirmed'));

create table public.booking_holds (
  id uuid primary key default gen_random_uuid(),
  appointment_id uuid not null unique references public.appointments(id) on delete cascade,
  status text not null,
  expires_at timestamptz not null,
  released_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  constraint booking_holds_status_check check (
    status in ('active', 'expired', 'converted', 'cancelled')
  )
);

comment on table public.booking_holds is
  'Future hold-expiration records for pending deposits. Runtime behavior is unchanged until repository adapters are added.';

create table public.payments (
  id uuid primary key default gen_random_uuid(),
  appointment_id uuid not null references public.appointments(id) on delete cascade,
  payment_kind text not null default 'deposit',
  provider text not null default 'square',
  checkout_mode text not null default 'live',
  status text not null,
  amount_cents integer not null,
  currency text not null default 'USD',
  provider_checkout_id text,
  provider_payment_id text,
  provider_reference text,
  checkout_url text,
  receipt_url text,
  idempotency_key text,
  paid_at timestamptz,
  refunded_at timestamptz,
  raw_provider_payload jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  constraint payments_kind_check check (payment_kind = 'deposit'),
  constraint payments_provider_check check (provider in ('square')),
  constraint payments_checkout_mode_check check (checkout_mode in ('stub', 'live')),
  constraint payments_status_check check (status in ('pending', 'paid', 'refunded')),
  constraint payments_amount_cents_check check (amount_cents >= 0),
  constraint payments_currency_check check (currency = 'USD')
);

comment on table public.payments is
  'Square deposit payment records and reconciliation metadata. Production confirmation should come from verified webhooks.';

create table public.square_webhook_events (
  id uuid primary key default gen_random_uuid(),
  provider_event_id text not null unique,
  event_type text not null,
  payload jsonb not null,
  processed_at timestamptz,
  processing_error text,
  created_at timestamptz not null default now()
);

comment on table public.square_webhook_events is
  'Square webhook idempotency and audit table. Store provider event IDs before processing.';

create table public.availability_rules (
  id uuid primary key default gen_random_uuid(),
  weekday smallint not null,
  start_time time not null,
  end_time time not null,
  timezone text not null default 'America/New_York',
  slot_interval_minutes integer not null default 15,
  active boolean not null default true,
  effective_from date,
  effective_through date,
  label text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  constraint availability_rules_weekday_check check (weekday between 0 and 6),
  constraint availability_rules_time_range_check check (end_time > start_time),
  constraint availability_rules_slot_interval_minutes_check check (slot_interval_minutes > 0),
  constraint availability_rules_effective_range_check check (
    effective_from is null
    or effective_through is null
    or effective_through >= effective_from
  )
);

comment on table public.availability_rules is
  'Recurring business-hour rules used by future availability calculation.';

create table public.availability_blocks (
  id uuid primary key default gen_random_uuid(),
  starts_at timestamptz not null,
  ends_at timestamptz not null,
  timezone text not null default 'America/New_York',
  all_day boolean not null default false,
  block_type text not null,
  reason text,
  created_by uuid references public.admin_users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  constraint availability_blocks_time_range_check check (ends_at > starts_at),
  constraint availability_blocks_type_check check (block_type in ('full_day', 'time_range'))
);

comment on table public.availability_blocks is
  'Owner-managed blocked times and days. This table does not auto-cancel existing appointments.';

create table public.notification_logs (
  id uuid primary key default gen_random_uuid(),
  appointment_id uuid references public.appointments(id) on delete set null,
  channel text not null,
  provider text,
  recipient text not null,
  status text not null,
  subject text,
  message_preview text,
  provider_message_id text,
  error_message text,
  sent_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  constraint notification_logs_channel_check check (channel in ('email', 'sms')),
  constraint notification_logs_status_check check (status in ('queued', 'sent', 'failed', 'skipped'))
);

comment on table public.notification_logs is
  'Notification attempt records. A sent status should only be stored after provider confirmation.';

create table public.app_settings (
  key text primary key,
  value_json jsonb not null,
  updated_at timestamptz not null default now(),
  updated_by uuid references public.admin_users(id) on delete set null
);

comment on table public.app_settings is
  'JSON settings table for owner settings, booking settings, notification preferences, and future feature flags.';

create table public.appointment_events (
  id uuid primary key default gen_random_uuid(),
  appointment_id uuid not null references public.appointments(id) on delete cascade,
  actor_type text not null,
  actor_id text,
  event_type text not null,
  payload jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),

  constraint appointment_events_actor_type_check check (
    actor_type in ('system', 'owner', 'customer', 'payment_provider')
  ),
  constraint appointment_events_event_type_check check (
    event_type in (
      'created',
      'status_changed',
      'payment_changed',
      'cancelled',
      'refunded',
      'availability_blocked',
      'owner_note_updated'
    )
  ),
  constraint appointment_events_payload_object_check check (jsonb_typeof(payload) = 'object')
);

comment on table public.appointment_events is
  'Append-only appointment audit trail for owner actions, payment updates, cancellations, notes, and blocked-time activity.';

create index admin_users_active_idx on public.admin_users (active);
create index services_active_sort_order_idx on public.services (active, sort_order);
create index services_category_idx on public.services (category);
create index customers_email_idx on public.customers (email);
create index customers_phone_idx on public.customers (phone);
create index appointments_starts_at_idx on public.appointments (starts_at);
create index appointments_status_idx on public.appointments (status);
create index appointments_customer_id_idx on public.appointments (customer_id);
create index appointments_service_id_idx on public.appointments (service_id);
create index appointments_time_range_gist_idx
  on public.appointments using gist (tstzrange(starts_at, ends_at, '[)'));
create index booking_holds_status_expires_at_idx on public.booking_holds (status, expires_at);
create unique index payments_provider_checkout_id_uidx
  on public.payments (provider, provider_checkout_id)
  where provider_checkout_id is not null;
create unique index payments_provider_payment_id_uidx
  on public.payments (provider, provider_payment_id)
  where provider_payment_id is not null;
create unique index payments_idempotency_key_uidx
  on public.payments (idempotency_key)
  where idempotency_key is not null;
create index payments_appointment_id_idx on public.payments (appointment_id);
create index payments_status_idx on public.payments (status);
create index square_webhook_events_event_type_idx on public.square_webhook_events (event_type);
create index square_webhook_events_processed_at_idx on public.square_webhook_events (processed_at);
create index availability_rules_weekday_active_idx on public.availability_rules (weekday, active);
create index availability_blocks_starts_ends_idx on public.availability_blocks (starts_at, ends_at);
create index availability_blocks_time_range_gist_idx
  on public.availability_blocks using gist (tstzrange(starts_at, ends_at, '[)'));
create index notification_logs_appointment_id_idx on public.notification_logs (appointment_id);
create index notification_logs_channel_idx on public.notification_logs (channel);
create index notification_logs_status_idx on public.notification_logs (status);
create index notification_logs_created_at_idx on public.notification_logs (created_at);
create index appointment_events_appointment_id_idx on public.appointment_events (appointment_id);
create index appointment_events_created_at_idx on public.appointment_events (created_at);

create trigger set_admin_users_updated_at
before update on public.admin_users
for each row execute function public.set_updated_at();

create trigger set_services_updated_at
before update on public.services
for each row execute function public.set_updated_at();

create trigger set_customers_updated_at
before update on public.customers
for each row execute function public.set_updated_at();

create trigger set_appointments_updated_at
before update on public.appointments
for each row execute function public.set_updated_at();

create trigger set_booking_holds_updated_at
before update on public.booking_holds
for each row execute function public.set_updated_at();

create trigger set_payments_updated_at
before update on public.payments
for each row execute function public.set_updated_at();

create trigger set_availability_rules_updated_at
before update on public.availability_rules
for each row execute function public.set_updated_at();

create trigger set_availability_blocks_updated_at
before update on public.availability_blocks
for each row execute function public.set_updated_at();

create trigger set_notification_logs_updated_at
before update on public.notification_logs
for each row execute function public.set_updated_at();

create trigger set_app_settings_updated_at
before update on public.app_settings
for each row execute function public.set_updated_at();

alter table public.admin_users enable row level security;
alter table public.services enable row level security;
alter table public.customers enable row level security;
alter table public.appointments enable row level security;
alter table public.booking_holds enable row level security;
alter table public.payments enable row level security;
alter table public.square_webhook_events enable row level security;
alter table public.availability_rules enable row level security;
alter table public.availability_blocks enable row level security;
alter table public.notification_logs enable row level security;
alter table public.app_settings enable row level security;
alter table public.appointment_events enable row level security;

-- No anon/authenticated policies are created here.
-- Future Next.js server routes should access these tables through server-side Supabase clients.
-- Never expose service-role keys to browser code.
