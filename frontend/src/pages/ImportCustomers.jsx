import { useState } from "react";
import { useNavigate } from "react-router-dom";
import Papa from "papaparse";
import api from "../services/api";
import TopBar from "../components/TopBar";
import { UploadCloud, Check, X, AlertTriangle, Users, FileWarning } from "lucide-react";

const STEPS = {
  UPLOAD: 1,
  PREVIEW: 2,
  SUMMARY: 3,
};

export default function ImportCustomers() {
  const navigate = useNavigate();
  const [step, setStep] = useState(STEPS.UPLOAD);
  const [file, setFile] = useState(null);
  const [previewData, setPreviewData] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [finalSummary, setFinalSummary] = useState(null);

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile) {
      setFile(selectedFile);
      setError("");
    }
  };

  const handlePreview = () => {
    if (!file) {
      setError("Please select a file to upload.");
      return;
    }
    setIsLoading(true);
    setError("");
    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: async (results) => {
        try {
          const res = await api.post("/import/preview", { records: results.data });
          setPreviewData(res.data);
          setStep(STEPS.PREVIEW);
        } catch (err) {
          setError(err.response?.data?.error || "Failed to analyze the file.");
        } finally {
          setIsLoading(false);
        }
      },
      error: (err) => {
        setError(`CSV parsing error: ${err.message}`);
        setIsLoading(false);
      },
    });
  };

  const handleExecute = async () => {
    if (!previewData || previewData.validRows.length === 0) return;
    setIsLoading(true);
    setError("");
    try {
      const res = await api.post("/import/execute", { records: previewData.validRows });
      setFinalSummary(res.data);
      setStep(STEPS.SUMMARY);
    } catch (err) {
      setError(err.response?.data?.error || "An unexpected error occurred during import.");
    } finally {
      setIsLoading(false);
    }
  };

  const renderUploadStep = () => (
    <div className="text-center">
      <h2 className="text-xl font-semibold text-ink mb-2">Upload Customer Data</h2>
      <p className="text-ink-soft mb-6">Select a CSV file with customer information.</p>
      <div className="mx-auto max-w-md">
        <label className="flex flex-col items-center justify-center w-full h-48 border-2 border-hairline border-dashed rounded-lg cursor-pointer bg-card hover:bg-paper">
          <div className="flex flex-col items-center justify-center pt-5 pb-6">
            <UploadCloud className="w-10 h-10 mb-3 text-ink-soft" />
            <p className="mb-2 text-sm text-ink-soft">
              <span className="font-semibold">Click to upload</span> or drag and drop
            </p>
            <p className="text-xs text-ink-soft">CSV file (max 5MB)</p>
          </div>
          <input type="file" className="hidden" accept=".csv" onChange={handleFileChange} />
        </label>
        {file && <p className="mt-4 text-sm text-ink">Selected file: <span className="font-medium">{file.name}</span></p>}
      </div>
      <button onClick={handlePreview} disabled={isLoading || !file} className="mt-8 bg-brass text-white font-medium rounded-lg py-2.5 px-8 hover:bg-brass-dark transition-colors disabled:opacity-50">
        {isLoading ? "Analyzing..." : "Preview Import"}
      </button>
    </div>
  );

  const renderPreviewStep = () => (
    <div>
      <h2 className="text-xl font-semibold text-ink mb-4">Import Preview</h2>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6 text-center">
        <div className="bg-paid-soft p-4 rounded-lg"><p className="text-2xl font-bold text-paid">{previewData.summary.valid}</p><p className="text-sm font-medium text-paid">Ready to Import</p></div>
        <div className="bg-partial-soft p-4 rounded-lg"><p className="text-2xl font-bold text-partial">{previewData.summary.duplicates}</p><p className="text-sm font-medium text-partial">Duplicates Found</p></div>
        <div className="bg-due-soft p-4 rounded-lg"><p className="text-2xl font-bold text-due">{previewData.summary.invalid}</p><p className="text-sm font-medium text-due">Invalid Rows</p></div>
      </div>

      {previewData.invalidRows.length > 0 && (
        <div className="mb-4">
          <h3 className="font-semibold text-due mb-2">Invalid Rows (will be skipped)</h3>
          <div className="max-h-40 overflow-y-auto rounded-md border border-hairline bg-paper p-2 text-xs">
            {previewData.invalidRows.map((row, i) => <p key={i} className="font-mono">Row {row.__file_row + 2}: {row.error}</p>)}
          </div>
        </div>
      )}

      {previewData.duplicateRows.length > 0 && (
        <div className="mb-6">
          <h3 className="font-semibold text-partial mb-2">Duplicate Rows (will be skipped)</h3>
          <div className="max-h-40 overflow-y-auto rounded-md border border-hairline bg-paper p-2 text-xs">
            {previewData.duplicateRows.map((row, i) => <p key={i} className="font-mono">Row {row.__file_row + 2}: {row.name} ({row.cafNumber}) - {row.error}</p>)}
          </div>
        </div>
      )}

      <div className="flex gap-4">
        <button onClick={() => setStep(STEPS.UPLOAD)} className="flex-1 border border-hairline rounded-lg py-2.5 font-semibold text-ink bg-paper hover:border-ink-soft">Back</button>
        <button onClick={handleExecute} disabled={isLoading || previewData.summary.valid === 0} className="flex-1 bg-brass text-white font-medium rounded-lg py-2.5 hover:bg-brass-dark transition-colors disabled:opacity-50">
          {isLoading ? "Importing..." : `Import ${previewData.summary.valid} Customers`}
        </button>
      </div>
    </div>
  );

  const renderSummaryStep = () => (
    <div className="text-center">
      <div className="w-16 h-16 bg-paid-soft rounded-full mx-auto flex items-center justify-center mb-4">
        <Check className="w-8 h-8 text-paid" />
      </div>
      <h2 className="text-xl font-semibold text-ink mb-2">Import Complete</h2>
      <p className="text-ink-soft mb-6">{finalSummary.message}</p>
      <button onClick={() => navigate('/customers')} className="bg-brass text-white font-medium rounded-lg py-2.5 px-8 hover:bg-brass-dark transition-colors">
        View Customers
      </button>
    </div>
  );

  const renderStep = () => {
    switch (step) {
      case STEPS.UPLOAD: return renderUploadStep();
      case STEPS.PREVIEW: return renderPreviewStep();
      case STEPS.SUMMARY: return renderSummaryStep();
      default: return renderUploadStep();
    }
  };

  return (
    <div className="min-h-screen bg-paper">
      <TopBar title="Import Customers" backTo="/customers" />
      <div className="mx-auto max-w-3xl px-4 py-10 sm:px-6 lg:px-8">
        <div className="rounded-xl bg-card p-6 shadow-ledger">
          {error && (
            <div className="bg-due-soft text-due text-sm font-medium p-3 rounded-md mb-6 flex items-start gap-2">
              <AlertTriangle className="h-5 w-5 shrink-0" />
              <div>{error}</div>
            </div>
          )}
          {renderStep()}
        </div>
      </div>
    </div>
  );
}
