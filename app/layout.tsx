import type { Metadata } from "next";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || "https://aliz.zohbot.net"),
  title: {
    default: "Aliz Studio | Appointment-Only Barbering",
    template: "%s | Aliz Studio"
  },
  description:
    "Book appointment-only barbering services at Aliz Studio: cuts, shape ups, beard trims, kids cuts, and detail grooming.",
  manifest: "/manifest.webmanifest",
  alternates: {
    canonical: "/"
  },
  icons: {
    icon: [
      { url: "/icon.svg", type: "image/svg+xml" },
      { url: "/icons/icon-192.png", sizes: "192x192", type: "image/png" },
      { url: "/icons/icon-512.png", sizes: "512x512", type: "image/png" }
    ],
    apple: [{ url: "/icons/apple-touch-icon.png", sizes: "180x180", type: "image/png" }]
  },
  openGraph: {
    title: "Aliz Studio | Appointment-Only Barbering",
    description:
      "Reserve appointment-only barbering services with clear service pricing and a mock deposit demo flow.",
    siteName: "Aliz Studio",
    type: "website",
    url: "/"
  },
  twitter: {
    card: "summary",
    title: "Aliz Studio | Appointment-Only Barbering",
    description:
      "Reserve appointment-only barbering services with clear service pricing and a mock deposit demo flow."
  }
};

export default function RootLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html data-scroll-behavior="smooth" lang="en">
      <body>
        <SiteHeader />
        <main>{children}</main>
        <SiteFooter />
      </body>
    </html>
  );
}
