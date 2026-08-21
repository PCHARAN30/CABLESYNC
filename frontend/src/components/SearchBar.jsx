import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Search } from "lucide-react";

export default function SearchBar() {
  const [query, setQuery] = useState("");
  const navigate = useNavigate();

  function handleSubmit(e) {
    e.preventDefault();
    if (query.trim()) {
      navigate(`/customers?q=${encodeURIComponent(query.trim())}`);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="relative w-full">
      <input
        type="text"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Search customers by name, phone, CAF..."
        className="w-full rounded-xl border border-hairline bg-card py-3 pl-10 pr-4 text-base text-ink shadow-ledger placeholder:text-ink-soft focus:border-brass focus:outline-none focus:ring-2 focus:ring-brass/40"
      />
      <Search className="pointer-events-none absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-ink-soft" />
    </form>
  );
}