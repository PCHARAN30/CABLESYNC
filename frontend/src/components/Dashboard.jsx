import { Link } from "react-router-dom";
import { useQuery } from "react-query";
import {
  Users,
  IndianRupee,
  UserCheck,
  UserX,
  ListChecks,
  Plus,
  AlertTriangle,
  Book,
} from "lucide-react";

import { api } from "../api";
import StatCard from "../components/StatCard";
import RecentPayments from "../components/RecentPayments";
import ExpiringCustomers from "../components/ExpiringCustomers";
import TodaysDue from "../components/TodaysDue";
import DashboardSkeleton from "../components/DashboardSkeleton";
import SearchBar from "../components/SearchBar";

function Dashboard() {
  const { data, isLoading, isError, error } = useQuery(
    "dashboardSummary",
    async () => {
      const response = await api.get("/summary");
      return response.data;
    },
    {
      staleTime: 1000 * 60 * 5, // 5 minutes
    },
  );

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
    paidCount,
    partialCount,
    dueCount,
    todaysCollection,
    todaysDueCount,
    newCustomersToday,
    recentPayments,
    expiringSoon,
  } = data;

  return (
    <div className="space-y-6 lg:space-y-8">
      {/* Header */}
      <header className="flex flex-col items-center justify-between gap-4 sm:flex-row">
        <div className="w-full flex-1">
          <SearchBar />
        </div>
        <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row">
          <Link
            to="/reports"
            className="flex items-center justify-center gap-2 rounded-lg border border-hairline bg-paper px-4 py-2.5 text-sm font-semibold text-ink shadow-sm transition-colors hover:border-ink-soft"
          >
            <Book className="h-4 w-4" />
            <span>Reports</span>
          </Link>
          <Link
            to="/customers/new"
            className="flex items-center justify-center gap-2 rounded-lg bg-brass px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-brass-dark"
          >
            <Plus className="h-4 w-4" />
            <span>Add Customer</span>
          </Link>
        </div>
      </header>

      {/* Stat Cards */}
      <div className="grid grid-cols-2 gap-4 md:grid-cols-4 lg:gap-6">
        <StatCard
          title="Today's Collection"
          value={`₹${todaysCollection.toLocaleString("en-IN")}`}
          icon={IndianRupee}
          color="text-brass"
          linkTo="/reports/daily"
        />
        <StatCard
          title="Paid Customers"
          value={paidCount}
          icon={UserCheck}
          color="text-paid"
          linkTo="/customers?filter=paid"
        />
        <StatCard
          title="Due Customers"
          value={dueCount}
          icon={UserX}
          color="text-due"
          linkTo="/customers?filter=due"
        />
        <StatCard
          title="Partial Payments"
          value={partialCount}
          icon={ListChecks}
          color="text-ink-soft"
          linkTo="/customers?filter=partial"
        />
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3 lg:gap-8">
        <div className="lg:col-span-2">
          <RecentPayments payments={recentPayments} />
        </div>

        <div className="space-y-6 lg:space-y-8">
          <TodaysDue count={todaysDueCount} />
          <ExpiringCustomers customers={expiringSoon} />
        </div>
      </div>

      {/* Footer Stats */}
      <div className="grid grid-cols-2 gap-4 pt-4 md:grid-cols-4 lg:gap-6">
        <StatCard
          title="Total Customers"
          value={totalCustomers}
          icon={Users}
          color="text-ink"
          isSmall
        />
        <StatCard
          title="New Today"
          value={newCustomersToday}
          icon={Plus}
          color="text-ink"
          isSmall
        />
      </div>
    </div>
  );
}

export default Dashboard;