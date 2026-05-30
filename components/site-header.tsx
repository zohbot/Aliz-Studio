import Link from "next/link";
import Image from "next/image";
import { CalendarClock } from "lucide-react";

const navigation = [
  { href: "/", label: "Home" },
  { href: "/about", label: "About" },
  { href: "/book", label: "Book Online" },
  { href: "/owner/login", label: "Owner" }
];

export function SiteHeader() {
  return (
    <header className="site-header">
      <Link className="brand-mark" href="/" aria-label="Aliz Studio home">
        <span className="brand-mark__asset" aria-hidden="true">
          <Image
            alt=""
            className="brand-mark__signature"
            height={60}
            priority
            src="/brand/aliz-studio-logo-dark.png"
            width={180}
          />
          <Image
            alt=""
            className="brand-mark__symbol"
            height={42}
            priority
            src="/brand/aliz-mark-dark.png"
            width={42}
          />
        </span>
        <span className="brand-mark__label">
          <strong>Aliz Studio</strong>
          <small>Appointment-only barbering</small>
        </span>
      </Link>

      <nav aria-label="Primary navigation">
        {navigation.map((item) => (
          <Link key={item.href} href={item.href}>
            {item.label}
          </Link>
        ))}
      </nav>

      <Link className="header-action" href="/book">
        <CalendarClock size={17} />
        <span>Reserve</span>
      </Link>
    </header>
  );
}
