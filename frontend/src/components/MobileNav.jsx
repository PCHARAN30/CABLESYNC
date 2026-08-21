import { Link, useLocation } from "react-router-dom";
import { SlidersHorizontal, UsersRound, ChartNoAxesCombined } from "lucide-react";

export default function MobileNav() {
  const location = useLocation();
  const isCustomers = location.pathname.startsWith("/customers") || location.pathname === "/";
  const isReports = location.pathname.startsWith("/reports");

  const itemClass = (active) => `mobile-nav-item ${active ? "active" : ""}`;

  return (
    <nav className="mobile-nav" aria-label="Primary navigation">
      <Link to="/customers" className={itemClass(isCustomers)}>
        <UsersRound className="h-5 w-5" /><span>Customers</span>
      </Link>
      <Link to="/reports" className={itemClass(isReports)}>
        <ChartNoAxesCombined className="h-5 w-5" /><span>Reports</span>
      </Link>
      <Link to="/settings" className={itemClass(false)} aria-label="Open settings">
        <SlidersHorizontal className="h-5 w-5" /><span>Settings</span>
      </Link>
    </nav>
  );
}
