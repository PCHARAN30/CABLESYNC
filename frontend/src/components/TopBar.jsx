import { Link, useNavigate } from 'react-router-dom';
import DesktopNav from './DesktopNav';

// Shared top bar: CableSync on the left and primary navigation beside it.
// Page titles stay in the page content; on mobile the title remains available
// in the header for compact context.
export default function TopBar({ title, backTo, rightAction, hideBrand = false }) {
  const navigate = useNavigate();
  return (
    <header className="sticky top-0 z-40 border-b border-hairline bg-card/90 backdrop-blur-xl">
      <div className="mx-auto relative max-w-6xl px-4 py-3 sm:px-6">
        <div className="flex items-center gap-3">
          {!hideBrand && (
            <Link to="/customers" className="flex items-center gap-2 font-display text-xl font-semibold text-ink">
              <span className="grid h-8 w-8 place-items-center rounded-lg bg-brass text-sm font-sans font-bold text-white">C</span>
              CableSync
            </Link>
          )}
          <div className="ml-8"><DesktopNav /></div>
        </div>

        {backTo ? (
          <button
            onClick={() => navigate(backTo)}
            aria-label="Go back"
            className="absolute left-4 text-ink-soft hover:text-ink transition-colors flex items-center justify-center rounded-full border border-hairline bg-card/80 shadow-sm px-3 py-1"
            style={{ top: '100%', transform: 'translateY(12px)', backdropFilter: 'blur(6px)', zIndex: 50 }}
          >
            Back
          </button>
        ) : null}

        {title ? (
          <h1 className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 font-display text-lg text-ink md:hidden">{title}</h1>
        ) : null}

        {rightAction ? (
          <div className="absolute right-4 top-1/2 -translate-y-1/2">
            {rightAction}
          </div>
        ) : null}
      </div>
    </header>
  );
}
