import type { BookingQuote } from "@/lib/booking";

export type SquareCheckoutResult = {
  checkoutUrl: string;
  provider: "square";
  mode: "stub" | "live";
};

export async function createSquareDepositCheckout(quote: BookingQuote): Promise<SquareCheckoutResult> {
  const sandboxUrl = new URL("/book/confirmation", process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000");
  sandboxUrl.searchParams.set("service", quote.serviceId);
  sandboxUrl.searchParams.set("deposit", String(quote.deposit));

  // Future integration point: Square Checkout API or Web Payments SDK tokenization.
  return {
    checkoutUrl: sandboxUrl.toString(),
    provider: "square",
    mode: "stub"
  };
}
