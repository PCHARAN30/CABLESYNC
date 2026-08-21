import { Link, useLocation } from "react-router-dom";
import { UsersRound, ChartNoAxesCombined, SlidersHorizontal } from "lucide-react";

// Real top navigation for desktop (>=768px). Mobile keeps the floating
// bottom bar (MobileNav) instead — see index.css for the breakpoint switch.
export default function DesktopNav() {
  const location = useLocation();
  const path = location.pathname;

  const links = [
    { to: "/customers", label: "Customers", icon: UsersRound, match: (p) => p.startsWith("/customers") || p === "/" },
    { to: "/reports", label: "Reports", icon: ChartNoAxesCombined, match: (p) => p.startsWith("/reports") },
    { to: "/settings", label: "Settings", icon: SlidersHorizontal, match: (p) => p.startsWith("/settings") },
  ];

  return (
    <nav className="desktop-nav items-center gap-1" aria-label="Primary navigation">
      {links.map(({ to, label, icon: Icon, match }) => (
        <Link key={to} to={to} className={`desktop-nav-item ${match(path) ? "active" : ""}`}>
          <Icon className="h-4 w-4" />
          {label}
        </Link>
      ))}
    </nav>
  );
}
