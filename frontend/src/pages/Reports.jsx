import { Link } from "react-router-dom";
import TopBar from "../components/TopBar";
import {
  ChevronRight,
  FileText,
  Calendar,
  Map,
  Users,
  TrendingUp,
  UserX,
} from "lucide-react";
import { Download } from "lucide-react";

const availableReports = [
  {
    name: "Pending Dues",
    description: "List of all customers with outstanding balances.",
    path: "/reports/pending-dues",
    icon: FileText,
  },
  {
    name: "Daily Collection",
    description: "Collections for a specific day.",
    path: "/reports/daily",
    icon: Calendar,
  },
  {
    name: "Export Data",
    description: "Download customer data in CSV format.",
    path: "/export",
    icon: Download,
  },
];
const advancedReports = [
  { name: "Monthly Collection", description: "Billing, collection rate and outstanding balance.", path: "/reports/monthly", icon: Calendar },
  { name: "Area Collection", description: "Compare billing and collections by service area.", path: "/reports/area", icon: Map },
  { name: "Top Defaulters", description: "Prioritize customers with the largest pending balances.", path: "/reports/defaulters", icon: UserX },
  { name: "Collection Trend", description: "See payment activity over the last six months.", path: "/reports/trend", icon: TrendingUp },
];

export default function Reports() {
  return (
    <div className="app-page">
      <TopBar title="Reports" />
      <div className="mx-auto max-w-3xl px-4 py-6 sm:px-6 lg:px-8">
        <div className="mb-8"><p className="text-sm font-semibold text-brass-dark">Reporting workspace</p><h1 className="font-display text-3xl font-semibold text-ink">Reports</h1><p className="mt-1 text-lg font-medium text-ink-soft">Collections at a glance</p><p className="mt-1 text-sm text-ink-soft">Start with the reports that support today’s decisions.</p></div>
        <p className="mb-3 text-xs font-semibold uppercase tracking-[.15em] text-ink-soft">Available now</p><div className="space-y-3">
          {availableReports.map((report) => (
            <Link key={report.name} to={report.path} className="block rounded-2xl border border-hairline bg-card p-5 shadow-ledger transition-all hover:-translate-y-0.5 hover:border-brass/40 hover:shadow-lg">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <report.icon className="h-6 w-6 text-brass" />
                  <div>
                    <h3 className="font-semibold text-ink">{report.name}</h3>
                    <p className="text-sm text-ink-soft">{report.description}</p>
                  </div>
                </div>
                <ChevronRight className="h-5 w-5 text-ink-soft" />
              </div>
            </Link>
          ))}
        </div><p className="mb-3 mt-8 text-xs font-semibold uppercase tracking-[.15em] text-ink-soft">Advanced reports</p><div className="grid gap-3 sm:grid-cols-2">{advancedReports.map((report) => <Link key={report.name} to={report.path} className="group flex items-center gap-3 rounded-xl border border-hairline bg-card p-4 text-ink-soft shadow-ledger transition hover:-translate-y-0.5 hover:border-brass/40"><report.icon className="h-5 w-5 text-brass" /><div className="min-w-0 flex-1"><p className="text-sm font-semibold text-ink">{report.name}</p><p className="mt-0.5 text-xs text-ink-soft">{report.description}</p></div><ChevronRight className="h-4 w-4 group-hover:text-brass-dark" /></Link>)}</div>
      </div>
    </div>
  );
}
