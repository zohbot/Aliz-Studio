"use client";

import { FormEvent, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  BadgeCheck,
  Clock3,
  DollarSign,
  Eye,
  EyeOff,
  GripVertical,
  Pencil,
  Save,
  Scissors,
  ToggleLeft,
  ToggleRight,
  X
} from "lucide-react";
import type { Service } from "@/lib/domain";
import { getPackageMarketingCopy } from "@/lib/package-copy";
import { formatMoney } from "@/lib/format";

type OwnerServiceManagerProps = {
  initialServices: Service[];
};

type ServiceDraft = {
  active: boolean;
  deposit: string;
  description: string;
  durationMinutes: string;
  featured: boolean;
  name: string;
  price: string;
  publicVisible: boolean;
  shortName: string;
  sortOrder: string;
};

function createDraft(service: Service): ServiceDraft {
  return {
    active: service.active !== false,
    deposit: String(service.deposit),
    description: service.description,
    durationMinutes: String(service.durationMinutes),
    featured: service.featured === true,
    name: service.name,
    price: String(service.price),
    publicVisible: service.publicVisible !== false,
    shortName: service.shortName,
    sortOrder: String(service.sortOrder ?? 0)
  };
}

function getVisibilityLabel(service: Service) {
  if (service.active === false) {
    return "Inactive";
  }

  if (service.publicVisible === false) {
    return "Hidden";
  }

  return "Live";
}

export function OwnerServiceManager({ initialServices }: OwnerServiceManagerProps) {
  const router = useRouter();
  const [services, setServices] = useState(initialServices);
  const [selectedServiceId, setSelectedServiceId] = useState("");
  const [draft, setDraft] = useState<ServiceDraft | null>(null);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  const selectedService = useMemo(
    () => services.find((service) => service.id === selectedServiceId) || null,
    [selectedServiceId, services]
  );

  function openService(service: Service) {
    setSelectedServiceId(service.id);
    setDraft(createDraft(service));
    setError("");
    setMessage("");
  }

  function closeService() {
    setSelectedServiceId("");
    setDraft(null);
    setError("");
  }

  function updateDraft(patch: Partial<ServiceDraft>) {
    setDraft((current) => (current ? { ...current, ...patch } : current));
  }

  function validateDraft(currentDraft: ServiceDraft) {
    const price = Number(currentDraft.price);
    const deposit = Number(currentDraft.deposit);
    const durationMinutes = Number(currentDraft.durationMinutes);
    const sortOrder = Number(currentDraft.sortOrder);

    if (!currentDraft.name.trim()) {
      return "Service name is required.";
    }

    if (!Number.isInteger(price) || price < 0) {
      return "Price must be a whole non-negative dollar amount.";
    }

    if (!Number.isInteger(deposit) || deposit < 0) {
      return "Deposit must be a whole non-negative dollar amount.";
    }

    if (deposit > price) {
      return "Deposit cannot exceed the service price.";
    }

    if (!Number.isInteger(durationMinutes) || durationMinutes < 5 || durationMinutes > 240) {
      return "Duration must be between 5 and 240 minutes.";
    }

    if (!Number.isInteger(sortOrder) || sortOrder < 0) {
      return "Sort order must be a whole non-negative number.";
    }

    return "";
  }

  async function saveService(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!selectedService || !draft) {
      return;
    }

    const validationError = validateDraft(draft);

    if (validationError) {
      setError(validationError);
      setMessage("");
      return;
    }

    setIsSaving(true);
    setError("");
    setMessage("");

    const response = await fetch(`/api/owner/services/${selectedService.id}`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        active: draft.active,
        deposit: Number(draft.deposit),
        description: draft.description.trim(),
        durationMinutes: Number(draft.durationMinutes),
        featured: draft.featured,
        name: draft.name.trim(),
        price: Number(draft.price),
        publicVisible: draft.publicVisible,
        shortName: draft.shortName.trim(),
        sortOrder: Number(draft.sortOrder)
      })
    });
    const payload = await response.json();

    setIsSaving(false);

    if (!response.ok) {
      setError(payload.error || "Could not save service.");
      return;
    }

    setServices((currentServices) =>
      currentServices
        .map((service) => (service.id === payload.service.id ? payload.service : service))
        .sort((left, right) => (left.sortOrder ?? 999) - (right.sortOrder ?? 999))
    );
    setSelectedServiceId(payload.service.id);
    setDraft(createDraft(payload.service));
    setMessage(`${payload.service.name} saved.`);
    router.refresh();
  }

  return (
    <section className="owner-service-manager" aria-label="Owner service manager">
      {message ? <p className="owner-message">{message}</p> : null}

      <div className="owner-service-grid">
        {services.map((service) => {
          const copy = getPackageMarketingCopy(service.id);

          return (
            <article className="owner-service-card" data-service-id={service.id} key={service.id}>
              <div className="owner-service-card__topline">
                <span className={`service-state service-state--${getVisibilityLabel(service).toLowerCase()}`}>
                  {getVisibilityLabel(service)}
                </span>
                {service.featured ? (
                  <span className="service-state service-state--featured">
                    <BadgeCheck size={14} />
                    Signature
                  </span>
                ) : null}
              </div>

              <div className="owner-service-card__main">
                <div>
                  <p className="section-kicker">{service.id}</p>
                  <h2>{service.name}</h2>
                  <p>{service.description}</p>
                </div>
                <button className="secondary-action" onClick={() => openService(service)} type="button">
                  <Pencil size={16} />
                  Edit
                </button>
              </div>

              <dl className="owner-service-card__facts">
                <div>
                  <dt>
                    <DollarSign size={15} />
                    Price
                  </dt>
                  <dd>{formatMoney(service.price)}</dd>
                </div>
                <div>
                  <dt>
                    <DollarSign size={15} />
                    Deposit
                  </dt>
                  <dd>{formatMoney(service.deposit)}</dd>
                </div>
                <div>
                  <dt>
                    <Clock3 size={15} />
                    Duration
                  </dt>
                  <dd>{service.durationMinutes}m</dd>
                </div>
                <div>
                  <dt>
                    <GripVertical size={15} />
                    Sort
                  </dt>
                  <dd>{service.sortOrder ?? 0}</dd>
                </div>
              </dl>

              <div className="owner-service-preview">
                <strong>Public preview</strong>
                <p>{copy?.shortDescription ?? service.detail}</p>
              </div>
            </article>
          );
        })}
      </div>

      {selectedService && draft ? (
        <div className="service-detail-backdrop">
          <aside
            aria-labelledby="service-detail-title"
            aria-modal="true"
            className="service-detail-drawer"
            role="dialog"
          >
            <div className="service-detail-drawer__topline">
              <span className="service-state service-state--demo">Demo-safe edit</span>
              <button
                aria-label="Close service details"
                className="appointment-detail-drawer__close"
                onClick={closeService}
                type="button"
              >
                <X size={18} />
              </button>
            </div>

            <div className="service-detail-drawer__header">
              <div>
                <p className="section-kicker">Service detail</p>
                <h2 id="service-detail-title">{selectedService.name}</h2>
                <p>Stable ID: {selectedService.id}. Slugs and public routes are preserved.</p>
              </div>
              <div className="service-detail-drawer__icon">
                <Scissors size={24} />
              </div>
            </div>

            <form className="service-edit-form" onSubmit={saveService}>
              <label>
                Display name
                <input
                  maxLength={80}
                  onChange={(event) => updateDraft({ name: event.target.value })}
                  required
                  value={draft.name}
                />
              </label>

              <label>
                Short name
                <input
                  maxLength={28}
                  onChange={(event) => updateDraft({ shortName: event.target.value })}
                  required
                  value={draft.shortName}
                />
              </label>

              <label className="service-edit-form__wide">
                Short description
                <textarea
                  maxLength={180}
                  onChange={(event) => updateDraft({ description: event.target.value })}
                  required
                  value={draft.description}
                />
              </label>

              <label>
                Price
                <input
                  inputMode="numeric"
                  min={0}
                  onChange={(event) => updateDraft({ price: event.target.value })}
                  required
                  type="number"
                  value={draft.price}
                />
              </label>

              <label>
                Deposit
                <input
                  inputMode="numeric"
                  min={0}
                  onChange={(event) => updateDraft({ deposit: event.target.value })}
                  required
                  type="number"
                  value={draft.deposit}
                />
              </label>

              <label>
                Duration minutes
                <input
                  inputMode="numeric"
                  max={240}
                  min={5}
                  onChange={(event) => updateDraft({ durationMinutes: event.target.value })}
                  required
                  type="number"
                  value={draft.durationMinutes}
                />
              </label>

              <label>
                Sort order
                <input
                  inputMode="numeric"
                  min={0}
                  onChange={(event) => updateDraft({ sortOrder: event.target.value })}
                  required
                  type="number"
                  value={draft.sortOrder}
                />
              </label>

              <div className="service-toggle-grid">
                <button
                  aria-pressed={draft.active}
                  className="service-toggle"
                  onClick={() => updateDraft({ active: !draft.active })}
                  type="button"
                >
                  {draft.active ? <ToggleRight size={20} /> : <ToggleLeft size={20} />}
                  <span>
                    <strong>Bookable</strong>
                    <small>{draft.active ? "Shown in booking" : "Hidden from booking"}</small>
                  </span>
                </button>

                <button
                  aria-pressed={draft.publicVisible}
                  className="service-toggle"
                  onClick={() => updateDraft({ publicVisible: !draft.publicVisible })}
                  type="button"
                >
                  {draft.publicVisible ? <Eye size={20} /> : <EyeOff size={20} />}
                  <span>
                    <strong>Public</strong>
                    <small>{draft.publicVisible ? "Shown on public pages" : "Hidden from public lists"}</small>
                  </span>
                </button>

                <button
                  aria-pressed={draft.featured}
                  className="service-toggle"
                  onClick={() => updateDraft({ featured: !draft.featured })}
                  type="button"
                >
                  <BadgeCheck size={20} />
                  <span>
                    <strong>Signature</strong>
                    <small>{draft.featured ? "Featured package" : "Standard package"}</small>
                  </span>
                </button>
              </div>

              {error ? <p className="form-error service-edit-form__wide">{error}</p> : null}

              <div className="service-detail-drawer__actions">
                <button className="secondary-action" onClick={closeService} type="button">
                  Cancel
                </button>
                <button className="primary-action" disabled={isSaving} type="submit">
                  <Save size={17} />
                  {isSaving ? "Saving..." : "Save service"}
                </button>
              </div>
            </form>
          </aside>
        </div>
      ) : null}
    </section>
  );
}
