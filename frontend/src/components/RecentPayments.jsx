import { Link } from "react-router-dom";
import { IndianRupee, BookUser } from "lucide-react";
import DashboardSection from "./DashboardSection";
import { format } from "date-fns/format";

function RecentPayments({ payments }) {
  return (
    <DashboardSection title="Recent Payments" icon={BookUser}>
      {payments && payments.length > 0 ? (
        <div className="divide-y divide-hairline">
          {payments.map((p) => (
            <Link
              key={p._id}
              to={`/customers/${p.customerId._id}`}
              className="group flex items-center justify-between rounded-xl px-3 py-4 transition-colors hover:bg-paper"
            >
              <div className="flex-1">
                <p className="font-semibold text-ink">{p.customerId.name}</p>
                <p className="text-sm text-ink-soft">
                  {format(new Date(p.paymentDate), "dd MMM, hh:mm a")}
                </p>
              </div>
              <div className="text-right">
                <p className="font-mono text-lg font-semibold text-paid group-hover:scale-105 transition-transform">
                  ₹{p.amount.toLocaleString("en-IN")}
                </p>
                <p className="text-sm text-ink-soft">{p.paymentMode}</p>
              </div>
            </Link>
          ))}
        </div>
      ) : (
        <div className="py-8 text-center text-ink-soft">
          <IndianRupee className="mx-auto h-12 w-12" />
          <p className="mt-4 font-semibold">No payments recorded yet.</p>
          <p className="text-sm">
            When you record a payment, it will appear here.
          </p>
        </div>
      )}
    </DashboardSection>
  );
}

export default RecentPayments;
