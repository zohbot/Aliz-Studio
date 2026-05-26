import type { CSSProperties } from "react";
import {
  siAmericanexpress,
  siCashapp,
  siDiscover,
  siMastercard,
  siSquare,
  siVisa,
  siZelle
} from "simple-icons";

const paymentMethods = [
  { id: "visa", label: "Visa", icon: siVisa },
  { id: "mastercard", label: "Mastercard", icon: siMastercard },
  { id: "discover", label: "Discover", icon: siDiscover },
  { id: "amex", label: "American Express", icon: siAmericanexpress },
  { id: "cashapp", label: "Cash App", icon: siCashapp },
  { id: "zelle", label: "Zelle", icon: siZelle },
  { id: "square", label: "Square Pay", icon: siSquare }
];

type PaymentMethodLogosProps = {
  compact?: boolean;
};

export function PaymentMethodLogos({ compact = false }: PaymentMethodLogosProps) {
  return (
    <div
      aria-label="Available payment methods: Visa, Mastercard, Discover, American Express, Cash App, Zelle, and Square Pay"
      className={`payment-methods${compact ? " payment-methods--compact" : ""}`}
    >
      {paymentMethods.map((method) => (
        <span
          aria-label={method.label}
          className={`payment-logo payment-logo--${method.id}`}
          key={method.id}
          style={{ "--payment-brand-color": `#${method.icon.hex}` } as CSSProperties}
        >
          <svg aria-hidden="true" className="payment-logo__icon" role="img" viewBox="0 0 24 24">
            <path d={method.icon.path} />
          </svg>
          <span className="payment-logo__text">{method.label}</span>
        </span>
      ))}
    </div>
  );
}
