import Link from "next/link";
import { CalendarClock, Scissors } from "lucide-react";

const navigation = [
  { href: "/", label: "Home" },
  { href: "/about", label: "About" },
  { href: "/book", label: "Book Online" }
];

export function SiteHeader() {
  return (
    <header className="site-header">
      <Link className="brand-mark" href="/" aria-label="Aliz Studio home">
        <span className="brand-mark__icon" aria-hidden="true">
          <Scissors size={18} />
        </span>
        <span>
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
