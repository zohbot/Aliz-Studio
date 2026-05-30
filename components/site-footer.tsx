import Link from "next/link";
import Image from "next/image";

export function SiteFooter() {
  return (
    <footer className="site-footer">
      <div>
        <Link className="footer-brand" href="/" aria-label="Aliz Studio home">
          <Image alt="" height={60} src="/brand/aliz-studio-logo-dark.png" width={180} />
        </Link>
        <p>
          Snip. Shave. Shine. Booked appointments only. Website design, booking UX, and implementation by{" "}
          <a href="https://worldsoftwares.com" rel="noreferrer" target="_blank">
            SYHTEK
          </a>
          .
        </p>
      </div>
      <div className="footer-links">
        <Link href="/about">About</Link>
        <Link href="/book">Book Online</Link>
        <a href="https://worldsoftwares.com" rel="noreferrer" target="_blank">
          Inquiries
        </a>
      </div>
    </footer>
  );
}
