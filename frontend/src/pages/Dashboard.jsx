import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import {
  IndianRupee,
  UserCheck,
  UserX,
  AlertTriangle,
  Users,
  ArrowUpRight,
  Plus,
  BarChart3,
  UserPlus,
  ReceiptText,
  CalendarClock,
} from "lucide-react";

import api from "../services/api";
import StatCard from "../components/StatCard";
import RecentPayments from "../components/RecentPayments";
import DashboardSkeleton from "../components/DashboardSkeleton";

export default function Dashboard() {
  const { data, isLoading, isError, error } = useQuery({
    queryKey: ["dashboardSummary"],
    queryFn: async () => {
      const response = await api.get("/dashboard/summary");
      return response.data.data;
    },
    staleTime: 1000 * 60 * 5, // 5 minutes
  });

  if (isLoading) {
    return <DashboardSkeleton />;
  }

  if (isError) {
    return (
      <div className="flex h-[60vh] flex-col items-center justify-center text-center">
        <AlertTriangle className="mb-4 h-16 w-16 text-due" />
        <h2 className="mb-2 text-2xl font-bold text-ink">
          Could Not Load Dashboard
        </h2>
        <p className="max-w-md text-ink-soft">
          There was an error fetching the dashboard data. Please check your
          network connection and try again.
        </p>
        <p className="mt-4 text-sm text-ink-soft/70">
          Error: {error.message}
        </p>
      </div>
    );
  }

  const {
    totalCustomers,
    todaysCollection,
    dueCount,
    todaysDueCount,
    recentPayments,
  } = data;

  return (
    <div className="app-page">
      <header className="sticky top-0 z-40 border-b border-hairline bg-card/90 backdrop-blur-xl">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3 sm:px-6">
          <Link to="/" className="flex items-center gap-2 font-display text-xl font-semibold text-ink"><span className="grid h-8 w-8 place-items-center rounded-lg bg-brass text-sm font-sans font-bold text-white">C</span>CableSync</Link>
          <nav className="hidden gap-1 sm:flex">
            <Link className="rounded-lg bg-brass/10 px-3 py-2 text-sm font-semibold text-brass-dark" to="/">Overview</Link>
            <Link className="rounded-lg px-3 py-2 text-sm font-medium text-ink-soft hover:bg-paper" to="/customers">Customers</Link>
            <Link className="rounded-lg px-3 py-2 text-sm font-medium text-ink-soft hover:bg-paper" to="/reports">Reports</Link>
          </nav>
          <Link to="/customers/new" className="btn-prism px-3 py-2 text-sm"><Plus className="h-4 w-4" /><span className="hidden sm:inline">Add customer</span></Link>
        </div>
      </header>
      <main className="mx-auto max-w-6xl space-y-6 px-4 py-6 sm:px-6 lg:space-y-8 lg:py-8">
      <div className="relative overflow-hidden rounded-3xl p-6 text-white shadow-lg sm:p-8" style={{ background: 'linear-gradient(120deg, var(--hero-start), var(--hero-end))' }}>
        <div className="absolute -right-16 -top-16 h-56 w-56 rounded-full bg-brass/40 blur-3xl" />
        <div className="relative flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
          <div><p className="mb-2 text-sm font-medium text-white/65">Network command center</p><h1 className="font-display text-3xl font-semibold sm:text-4xl">Good to see you back.</h1><p className="mt-2 max-w-xl text-white/70">Track subscriptions, collections, and customers from one calm workspace.</p></div>
          <Link to="/reports" className="inline-flex items-center gap-2 self-start rounded-xl bg-white/10 px-4 py-2.5 text-sm font-semibold backdrop-blur hover:bg-white/20 sm:self-auto"><BarChart3 className="h-4 w-4" />View reports <ArrowUpRight className="h-4 w-4" /></Link>
        </div>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4 lg:gap-5">
        <div className="col-span-2">
          <StatCard
            title="All Customers"
            value={totalCustomers}
            icon={Users}
            color="text-ink"
            linkTo="/customers"
          />
        </div>
        <StatCard
          title="Today's Collection"
          value={`₹${todaysCollection.toLocaleString("en-IN")}`}
          icon={IndianRupee}
          color="text-brass"
          linkTo="/reports/daily"
        />
        <StatCard
          title="Due Customers"
          value={dueCount}
          icon={UserX}
          color="text-due"
          linkTo="/customers?filter=due"
        />
      </div>

      <div className="grid gap-5 lg:grid-cols-[1.5fr_1fr]">
        <RecentPayments payments={recentPayments} />
        <section className="rounded-2xl border border-hairline bg-card p-5 shadow-ledger sm:p-6">
          <div className="flex items-center justify-between"><div><p className="text-sm font-semibold text-ink">Today’s focus</p><p className="mt-1 text-sm text-ink-soft">Keep the billing cycle moving.</p></div><span className="grid h-10 w-10 place-items-center rounded-xl bg-due-soft text-due"><CalendarClock className="h-5 w-5" /></span></div>
          <div className="my-5 rounded-xl bg-paper p-4"><p className="text-sm text-ink-soft">Customers needing attention</p><p className="mt-1 font-display text-3xl font-semibold text-ink"><span className="text-due">{todaysDueCount ?? dueCount}</span> due today</p></div>
          <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-1">
            <Link to="/customers/new" className="btn-prism px-4 py-3 text-sm"><UserPlus className="h-4 w-4" />Add customer</Link>
            <Link to="/customers?filter=due" className="btn-orbit px-4 py-3 text-sm"><ReceiptText className="h-4 w-4 text-due" />Review dues</Link>
          </div>
        </section>
      </div>
      </main>
    </div>
  );
}
