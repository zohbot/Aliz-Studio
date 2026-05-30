import type { BookingQuote, SquareCheckoutReference } from "@/lib/domain";

export type SquareCheckoutResult = SquareCheckoutReference;

export async function createSquareDepositCheckout(quote: BookingQuote): Promise<SquareCheckoutResult> {
  const sandboxUrl = new URL("/checkout", "https://alizstudio.local");
  sandboxUrl.searchParams.set("service", quote.serviceId);
  sandboxUrl.searchParams.set("deposit", String(quote.deposit));

  // Future integration point: Square Checkout API or Web Payments SDK tokenization.
  return {
    checkoutUrl: `${sandboxUrl.pathname}${sandboxUrl.search}`,
    provider: "square",
    mode: "stub"
  };
}
