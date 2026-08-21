import { Link } from "react-router-dom";
import { Compass } from "lucide-react";

export default function NotFound() {
  return <main className="app-page grid min-h-screen place-items-center px-4"><section className="max-w-md rounded-3xl border border-hairline bg-card p-8 text-center shadow-ledger"><span className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-brass/10 text-brass"><Compass className="h-7 w-7" /></span><p className="mt-6 text-sm font-semibold text-brass-dark">404 · LOST CONNECTION</p><h1 className="mt-2 font-display text-3xl font-semibold text-ink">This page isn’t in your workspace.</h1><p className="mt-3 text-sm text-ink-soft">Use the overview to get back to your daily collection work.</p><Link to="/" className="btn-prism mt-6 px-4 py-3 text-sm">Return to overview</Link></section></main>;
}
