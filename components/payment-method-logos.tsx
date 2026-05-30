import {
  BadgeDollarSign,
  CreditCard,
  Landmark,
  Smartphone,
  WalletCards
} from "lucide-react";

const paymentMethods = [
  { id: "card", label: "Credit or debit", Icon: CreditCard },
  { id: "wallet", label: "Mobile wallet mock", Icon: Smartphone },
  { id: "google", label: "Google Pay style mock", Icon: WalletCards },
  { id: "apple", label: "Apple Pay style mock", Icon: Smartphone },
  { id: "square", label: "Square-style demo", Icon: BadgeDollarSign },
  { id: "manual", label: "Manual deposit placeholder", Icon: Landmark }
];

type PaymentMethodLogosProps = {
  compact?: boolean;
};

export function PaymentMethodLogos({ compact = false }: PaymentMethodLogosProps) {
  return (
    <div
      aria-label="Demo payment presentation: credit or debit, mobile wallet mock, Google Pay style mock, Apple Pay style mock, Square-style demo, and manual deposit placeholder"
      className={`payment-methods${compact ? " payment-methods--compact" : ""}`}
    >
      {paymentMethods.map(({ Icon, ...method }) => (
        <span aria-label={method.label} className={`payment-logo payment-logo--${method.id}`} key={method.id}>
          <Icon aria-hidden="true" className="payment-logo__icon" size={18} />
          <span className="payment-logo__text">{method.label}</span>
        </span>
      ))}
    </div>
  );
}
