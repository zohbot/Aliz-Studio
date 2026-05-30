import Link from "next/link";
import Image from "next/image";

export function SiteFooter() {
  return (
    <footer className="site-footer">
      <div className="site-footer__brand">
        <Link className="footer-brand" href="/" aria-label="Aliz Studio home">
          <span aria-hidden="true">
            <Image
              alt=""
              className="theme-logo--for-light"
              height={60}
              src="/brand/aliz-studio-logo-dark.png"
              width={180}
            />
            <Image
              alt=""
              className="theme-logo--for-night"
              height={60}
              src="/brand/aliz-studio-logo-light.png"
              width={180}
            />
          </span>
        </Link>
        <p className="site-footer__tagline">Snip. Shave. Shine. Booked appointments only.</p>
        <p className="site-footer__credit">
          Website design, booking UX, and implementation by{" "}
          <a href="https://worldsoftwares.com" rel="noreferrer" target="_blank">
            SYHTEK
          </a>
          .
        </p>
      </div>
      <nav className="footer-links" aria-label="Footer navigation">
        <span>Navigate</span>
        <Link href="/about">About</Link>
        <Link href="/packages">Packages</Link>
        <Link href="/book">Book Online</Link>
        <a href="https://worldsoftwares.com" rel="noreferrer" target="_blank">
          Inquiries
        </a>
      </nav>
    </footer>
  );
}
