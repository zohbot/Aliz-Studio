const paymentMethods = [
  { id: "visa", label: "Visa" },
  { id: "mastercard", label: "Mastercard" },
  { id: "discover", label: "Discover" },
  { id: "amex", label: "American Express" },
  { id: "cashapp", label: "Cash App" },
  { id: "zelle", label: "Zelle" },
  { id: "square", label: "Square Pay" }
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
        <span className={`payment-logo payment-logo--${method.id}`} key={method.id}>
          {method.id === "mastercard" ? <span className="payment-logo__mark" aria-hidden="true" /> : null}
          {method.id === "square" ? <span className="payment-logo__square" aria-hidden="true" /> : null}
          <span>{method.label}</span>
        </span>
      ))}
    </div>
  );
}
