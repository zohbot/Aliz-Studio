import Link from "next/link";

export function SiteFooter() {
  return (
    <footer className="site-footer">
      <div>
        <strong>Aliz Studio</strong>
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
