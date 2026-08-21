import { useQuery } from "@tanstack/react-query";
import {
  UserPlus,
  Edit3,
  UserX,
  CircleDollarSign,
  Trash2,
  FileClock,
  Users,
  FileUp,
  FileDown,
} from "lucide-react";
import api from "../services/api";
import { formatDateShort } from "../utils/format";

function readLocalActivities(customerId) {
  try {
    const raw = localStorage.getItem('cablesync_local_activities');
    if (!raw) return [];
    const store = JSON.parse(raw);
    return store[customerId] || [];
  } catch (e) {
    return [];
  }
}

const ACTION_ICONS = {
  CUSTOMER_CREATED: UserPlus,
  CUSTOMER_UPDATED: Edit3,
  CUSTOMER_DEACTIVATED: UserX,
  PAYMENT_ADDED: CircleDollarSign,
  PAYMENT_DELETED: Trash2,
  PAYMENT_UPDATED: Edit3, // Future use
  BULK_PAYMENT: Users, // Future use
  IMPORT: FileUp, // Future use
  EXPORT: FileDown, // Future use
  default: FileClock,
};

// Read-only auto-generated system notes - never operator-written free
// text. Every entry here was created automatically by the backend when
// a payment or customer record changed (see utils/activityLog.js).
export default function ActivityLog({ customerId }) {
  const {
    data: remoteLogs = [],
    isLoading,
    isError,
    error,
  } = useQuery({
    queryKey: ["activityLog", customerId],
    queryFn: () => api.get(`/customers/${customerId}/activity`).then((res) => res.data),
  });

  // Normalize remote response: some API shapes return an array directly,
  // others wrap it in { data: [...] } — handle both safely.
  const remoteEntries = Array.isArray(remoteLogs)
    ? remoteLogs
    : Array.isArray(remoteLogs?.data)
    ? remoteLogs.data
    : [];

  // Merge local (browser-only) activity entries with the remote entries so
  // immediate edits show up even if backend doesn't emit detailed messages.
  const localLogs = readLocalActivities(customerId) || [];
  const logs = [...localLogs, ...remoteEntries];

  if (isLoading) {
    return (
      <div>
        <h2 className="font-display text-lg text-ink mb-3">Activity</h2>
        <p className="text-ink-soft text-sm">Loading activity...</p>
      </div>
    );
  }

  return (
    <div>
      <h2 className="font-display text-lg text-ink mb-3">Activity</h2>
      {isError && <p className="text-due text-sm">{error.message || "Could not load activity"}</p>}
      {!isError && logs.length === 0 && (
        <div className="text-center py-8 bg-card rounded-lg shadow-ledger">
          <FileClock className="mx-auto h-12 w-12 text-ink-soft/50" />
          <p className="mt-4 font-semibold text-ink-soft">No activity yet</p>
          <p className="text-sm text-ink-soft/80">
            Customer edits and payments will appear here.
          </p>
        </div>
      )}
      {!isError && logs.length > 0 && (
        <div className="flow-root">
          <ul className="-mb-8">
            {logs.map((log, logIdx) => {
            const Icon = ACTION_ICONS[log.action] || ACTION_ICONS.default;
            return (
              <li key={log._id}>
                <div className="relative pb-8">
                  {logIdx !== logs.length - 1 ? (
                    <span className="absolute left-5 top-5 -ml-px h-full w-0.5 bg-hairline" aria-hidden="true" />
                  ) : null}
                  <div className="relative flex items-start space-x-4">
                    <div className="relative">
                      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-card ring-4 ring-paper">
                        <Icon className="h-5 w-5 text-ink-soft" />
                      </div>
                    </div>
                    <div className="min-w-0 flex-1 py-1.5">
                      <p className="text-sm font-medium text-ink">{log.message}</p>
                      <p className="mt-0.5 text-xs text-ink-soft">
                        {formatDateShort(log.createdAt)}
                      </p>
                    </div>
                  </div>
                </div>
              </li>
            );
            })}
          </ul>
        </div>
      )}
    </div>
  );
}
