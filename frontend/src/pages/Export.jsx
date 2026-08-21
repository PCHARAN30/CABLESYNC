import { useState } from "react";
import api from "../services/api";
import TopBar from "../components/TopBar";
import { Download, FileSpreadsheet } from "lucide-react";

export default function Export() {
  const [isExporting, setIsExporting] = useState(false);
  const [error, setError] = useState("");

  const handleExport = async () => {
    setIsExporting(true);
    setError("");
    try {
      const response = await api.post("/export/csv", {}, { responseType: 'blob' });
      
      // Create a link to download the file
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      const filename = `cablesync_customers_${new Date().toISOString().split('T')[0]}.csv`;
      link.setAttribute('download', filename);
      document.body.appendChild(link);
      link.click();
      link.parentNode.removeChild(link);

    } catch (err) {
      setError("Failed to export data. Please try again.");
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="min-h-screen bg-paper">
      <TopBar title="Export Data" backTo="/reports" />
      <div className="mx-auto max-w-3xl px-4 py-10 sm:px-6 lg:px-8">
        <div className="rounded-xl bg-card p-6 shadow-ledger">
          <h2 className="text-xl font-semibold text-ink mb-4">Export Customer Data</h2>
          <p className="text-ink-soft mb-6">
            Download a complete list of your active customers, including their current billing status and dues.
          </p>

          {error && <p className="text-due text-sm mb-4">{error}</p>}

          <div className="space-y-4">
            <div className="rounded-lg border border-hairline p-4">
              <h3 className="font-semibold text-ink mb-2">Export All Customers</h3>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3 text-sm text-ink-soft">
                  <FileSpreadsheet className="h-8 w-8 text-paid" />
                  <span>CSV Format</span>
                </div>
                <button
                  onClick={handleExport}
                  disabled={isExporting}
                  className="flex items-center gap-2 rounded-lg bg-brass px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-brass-dark disabled:opacity-50"
                >
                  <Download className="h-4 w-4" />
                  {isExporting ? "Exporting..." : "Download"}
                </button>
              </div>
            </div>
            <div className="rounded-lg border border-hairline p-4 opacity-50">
              <h3 className="font-semibold text-ink mb-2">PDF / Excel</h3>
              <p className="text-sm text-ink-soft">Support for more formats is coming soon.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}