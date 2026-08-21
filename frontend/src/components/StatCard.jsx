import { Link } from "react-router-dom";
import { ArrowRight } from "lucide-react";

function StatCard({
  title,
  value,
  icon: Icon,
  color,
  linkTo,
  isSmall = false,
}) {
  const content = (
    <div
      className={`group relative flex flex-col justify-between overflow-hidden rounded-2xl border border-hairline bg-card p-5 shadow-ledger transition-all ${
        linkTo ? "hover:-translate-y-1 hover:shadow-lg" : ""
      } ${isSmall ? "h-24" : "h-32 md:h-36"}`}
    >
      <div className="flex items-start justify-between">
        <h3
          className={`font-semibold ${isSmall ? "text-sm" : "text-base"} text-ink-soft`}
        >
          {title}
        </h3>
        {Icon && <span className={`grid h-10 w-10 place-items-center rounded-xl bg-paper ${color}`}><Icon className="h-5 w-5" strokeWidth={2.25} /></span>}
      </div>
      <p
        className={`font-display font-semibold tracking-tight ${isSmall ? "text-2xl" : "text-3xl md:text-4xl"} ${color}`}
      >
        {value}
      </p>
      {linkTo && (
        <ArrowRight className="absolute bottom-3 right-3 h-5 w-5 text-ink-soft/30 opacity-0 transition-opacity group-hover:opacity-100" />
      )}
    </div>
  );

  return linkTo ? <Link to={linkTo}>{content}</Link> : content;
}

export default StatCard;
