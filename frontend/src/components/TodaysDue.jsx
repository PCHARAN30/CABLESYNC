import { Link } from "react-router-dom";
import { UserX, ArrowRight } from "lucide-react";

function TodaysDue({ count }) {
  return (
    <Link
      to="/customers?filter=due"
      className="group flex items-center justify-between rounded-xl bg-due-soft p-4 shadow-ledger transition-all hover:bg-due-soft/80"
    >
      <div>
        <h3 className="font-semibold text-due">Today's Due Customers</h3>
        <p className="font-display text-3xl font-bold text-due">{count}</p>
      </div>
      <UserX className="h-8 w-8 text-due/80" />
      <ArrowRight className="absolute bottom-3 right-3 h-5 w-5 text-due/50 opacity-0 transition-opacity group-hover:opacity-100" />
    </Link>
  );
}

export default TodaysDue;