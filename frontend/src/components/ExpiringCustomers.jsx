import { Link } from "react-router-dom";
import { CalendarClock, Users } from "lucide-react";
import DashboardSection from "./DashboardSection";
import  format  from "date-fns/format";

function ExpiringCustomers({ customers }) {
  return (
    <DashboardSection title="Expiring Soon" icon={CalendarClock}>
      {customers && customers.length > 0 ? (
        <div className="space-y-2">
          {customers.map((c) => (
            <Link
              key={c.customerId}
              to={`/customers/${c.customerId}`}
              className="flex items-center justify-between rounded-lg p-2 transition-colors hover:bg-paper"
            >
              <p className="font-semibold text-ink">{c.name}</p>
              <p className="text-sm font-medium text-ink-soft">
                {format(new Date(c.paidThroughDate), "dd MMM")}
              </p>
            </Link>
          ))}
        </div>
      ) : (
        <div className="py-8 text-center text-ink-soft">
          <Users className="mx-auto h-12 w-12" />
          <p className="mt-4 font-semibold">No customers expiring soon.</p>
          <p className="text-sm">
            Customers with payments due in the next 7 days will appear here.
          </p>
        </div>
      )}
    </DashboardSection>
  );
}

export default ExpiringCustomers;