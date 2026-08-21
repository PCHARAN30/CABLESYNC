import { useEffect, useState, useCallback, useMemo } from "react";
import { useSearchParams, Link } from "react-router-dom";
import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { debounce } from "lodash";
import api from "../services/api";
import TopBar from "../components/TopBar";
import CustomerCard from "../components/CustomerCard";
import { Search, Upload, UserPlus, UsersRound } from "lucide-react";

const getAreas = (customers) => {
  const areas = new Set(customers.map((c) => c.area).filter(Boolean));
  return ["All Areas", ...Array.from(areas).sort()];
};

export default function CustomerList() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [query, setQuery] = useState(searchParams.get("q") || "");
  const [status, setStatus] = useState(searchParams.get("filter") || "all");
  const [area, setArea] = useState(searchParams.get("area") || "All Areas");
  const [page, setPage] = useState(Number(searchParams.get("page")) || 1);

  const debouncedSetQuery = useMemo(() => debounce(setQuery, 300), []);

  const {
    data,
    isLoading,
    isError,
    error,
    isPlaceholderData,
  } = useQuery({
    queryKey: ["customers", query, status, area, page],
    queryFn: async () => {
      const params = {};
      if (query) params.q = query;
      if (status && status !== "all") params.status = status;
      if (area && area !== "All Areas") params.area = area;
      params.page = page;

      const response = await api.get("/customers", { params });
      return response.data;
    },
    placeholderData: keepPreviousData,
  });

  const responseData = data?.data || {};
  const customers = responseData.customers || [];
  const availableAreas = useMemo(() => getAreas(customers), [customers]);

  useEffect(() => {
    const newParams = {};
    if (query) newParams.q = query;
    if (status && status !== "all") newParams.filter = status;
    if (area && area !== "All Areas") newParams.area = area;
    if (page > 1) newParams.page = page;
    setSearchParams(newParams, { replace: true });
  }, [query, status, area, page, setSearchParams]);

  const handleClearFilters = () => {
    setQuery("");
    setStatus("all");
    setArea("All Areas");
    setSearchParams({}, { replace: true });
  };

  return (
    <div className="app-page">
      <TopBar title="Customers" />
      <div className="mx-auto max-w-5xl px-4 py-6 sm:px-6 lg:px-8">
        <div className="mb-6 flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
          <div><p className="text-sm font-medium text-brass-dark">Customer directory</p><h2 className="font-display text-3xl font-semibold text-ink">Manage subscriptions</h2><p className="mt-1 text-sm text-ink-soft">Search, filter and open a customer record in seconds.</p></div>
          <div className="flex gap-2">
          <Link
            to="/import"
            className="btn-orbit px-3 py-2 text-sm"
          >
            <Upload className="h-4 w-4" />
            Import
          </Link>
          <Link to="/customers/new" className="btn-prism px-3 py-2 text-sm"><UserPlus className="h-4 w-4" />Add customer</Link>
          </div>
        </div>
        <div className="mb-5 rounded-2xl border border-hairline bg-card p-3 shadow-ledger sm:p-4">
          <div className="relative">
            <Search className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-ink-soft" />
          <input
            type="text"
            defaultValue={query}
            onChange={(e) => debouncedSetQuery(e.target.value)}
            placeholder="Search by name, phone, CAF, area, serial..."
            className="w-full rounded-xl border border-hairline bg-paper py-3 pl-11 pr-4 text-base text-ink placeholder:text-ink-soft focus:border-brass focus:outline-none focus:ring-2 focus:ring-brass/20"
            autoFocus
          />
          </div>
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              className="w-full rounded-lg border border-hairline bg-paper p-2.5 text-sm font-medium text-ink shadow-sm focus:border-brass focus:outline-none focus:ring-2 focus:ring-brass/40"
            >
              <option value="all">All Statuses</option>
              <option value="paid">Paid</option>
              <option value="PARTIAL">Partial</option>
              <option value="DUE">Due</option>
              <option value="INACTIVE">Inactive</option>
            </select>
            <select
              value={area}
              onChange={(e) => setArea(e.target.value)}
              className="w-full rounded-lg border border-hairline bg-paper p-2.5 text-sm font-medium text-ink shadow-sm focus:border-brass focus:outline-none focus:ring-2 focus:ring-brass/40"
            >
              {availableAreas.map((a) => (
                <option key={a} value={a}>{a}</option>
              ))}
            </select>
          </div>
        </div>

        {isLoading && <p className="text-ink-soft text-sm">Loading…</p>}
        {isError && <p className="text-due text-sm">{error.message}</p>}
        {!isLoading && !isError && customers.length === 0 && (
          <p className="text-ink-soft text-sm">No customers match.</p>
        )}

        <div className="mb-3 flex items-center justify-between"><p className="text-sm font-medium text-ink-soft">{responseData.total || customers.length} customers</p></div>
        <div className="mb-6 grid grid-cols-1 gap-3 md:grid-cols-2">
          {customers.map((c) => (
            <CustomerCard key={c._id} customer={c} highlight={query} />
          ))}
        </div>

        {responseData.totalPages > 1 && (
          <div className="flex justify-between items-center">
            <button
              onClick={() => setPage((old) => Math.max(old - 1, 1))}
              disabled={page === 1}
              className="rounded-lg border border-hairline bg-paper px-4 py-2 text-sm font-semibold text-ink shadow-sm disabled:opacity-50"
            >
              Previous
            </button>
            <span className="text-sm text-ink-soft">Page {responseData.currentPage} of {responseData.totalPages}</span>
            <button
              onClick={() => setPage((old) => (responseData && !isPlaceholderData && responseData.totalPages > old ? old + 1 : old))}
              disabled={isPlaceholderData || page === responseData.totalPages}
              className="rounded-lg border border-hairline bg-paper px-4 py-2 text-sm font-semibold text-ink shadow-sm disabled:opacity-50"
            >
              Next
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
