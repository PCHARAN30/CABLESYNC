import { useEffect, useState } from "react";
import { Moon, RefreshCw, Plus, Trash2 } from "lucide-react";
import api from "../services/api";
import { useToasts } from "../hooks/useToasts";
import TopBar from "../components/TopBar";
import "../components/UtilityPanel.css";

function readPlans() {
  try {
    const raw = localStorage.getItem("cablesync_monthly_plans");
    return raw ? JSON.parse(raw) : [];
  } catch (e) {
    return [];
  }
}

function writePlans(plans) {
  localStorage.setItem("cablesync_monthly_plans", JSON.stringify(plans));
  window.dispatchEvent(new Event("cablesync:plans-updated"));
}

export default function Settings() {
  const [showConfirm, setShowConfirm] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [isBusy, setIsBusy] = useState(false);
  const [plans, setPlans] = useState(() => readPlans());
  const [planName, setPlanName] = useState("");
  const [planAmount, setPlanAmount] = useState("");
  const { addToast } = useToasts();

  useEffect(() => {
    const storedTheme = localStorage.getItem("cablesync_theme");
    const dark = storedTheme === "dark";
    setIsDarkMode(dark);
    document.body.classList.toggle("dark-mode", dark);
  }, []);

  const handleToggleTheme = () => {
    const nextDark = !isDarkMode;
    setIsDarkMode(nextDark);
    document.body.classList.toggle("dark-mode", nextDark);
    localStorage.setItem("cablesync_theme", nextDark ? "dark" : "light");
    addToast(`Dark mode ${nextDark ? "enabled" : "disabled"}`, "success");
  };

  const handleReset = async () => {
    setIsBusy(true);
    try {
      const response = await api.post("/customers/reset");
      addToast(response.data.message || "Demo customers restored", "success");
      setShowConfirm(false);
    } catch (error) {
      addToast(error.response?.data?.message || "Failed to reset customers", "error");
    } finally {
      setIsBusy(false);
    }
  };

  function handleAddPlan() {
    if (!planName || !planAmount) return addToast("Enter name and amount", "error");
    const amount = Number(planAmount);
    if (Number.isNaN(amount) || amount < 0) return addToast("Enter valid amount", "error");
    const newPlan = { id: Date.now().toString(), name: planName.trim(), amount };
    const next = [...plans, newPlan];
    setPlans(next);
    writePlans(next);
    setPlanName("");
    setPlanAmount("");
    addToast("Plan saved", "success");
  }

  function handleDeletePlan(id) {
    const next = plans.filter((p) => p.id !== id);
    setPlans(next);
    writePlans(next);
    addToast("Plan removed", "success");
  }

  return (
    <div className="app-page">
      <TopBar title="Settings & Utilities" backTo="/customers" />
      <div className="mx-auto max-w-3xl px-4 py-6 sm:px-6 lg:px-8">
        <div className="mb-8">
          <p className="text-sm font-semibold text-brass-dark">Workspace</p>
          <h2 className="font-display text-3xl font-semibold text-ink">Settings & Utilities</h2>
          <p className="mt-1 text-sm text-ink-soft">Toggle theme, factory reset demo data and manage monthly plans.</p>
        </div>

        <div className="rounded-2xl border border-hairline bg-card p-6 shadow-ledger">
          <div className="utility-panel-section">
            <div className="utility-panel-row">
              <div className="utility-panel-row-icon">
                <Moon className="h-5 w-5" />
              </div>
              <div>
                <p className="utility-panel-row-label">Dark Mode</p>
                <p className="utility-panel-row-subtitle">Toggle theme</p>
              </div>
              <button
                type="button"
                className={`theme-toggle ${isDarkMode ? "enabled" : "disabled"}`}
                onClick={handleToggleTheme}
              >
                <span className="theme-toggle-knob" />
              </button>
            </div>
          </div>

          <div className="utility-panel-divider" />

          <div className="utility-panel-section">
            <div className="utility-panel-row">
              <div className="utility-panel-row-icon">
                <RefreshCw className="h-5 w-5" />
              </div>
              <div>
                <p className="utility-panel-row-label">Factory Reset</p>
                <p className="utility-panel-row-subtitle">Restore demo customers</p>
              </div>
            </div>
            <button
              type="button"
              className="utility-panel-action"
              onClick={() => setShowConfirm(true)}
            >
              Reset Customers
            </button>

            {showConfirm && (
              <div className="utility-panel-confirm">
                <p className="utility-panel-confirm-title">⚠ Factory Reset</p>
                <p className="utility-panel-confirm-copy">This will:</p>
                <ul className="utility-panel-confirm-list">
                  <li>• Delete all payments</li>
                  <li>• Restore original customers</li>
                  <li>• Restore original billing</li>
                </ul>
                <div className="utility-panel-confirm-actions">
                  <button
                    type="button"
                    className="utility-panel-cancel"
                    onClick={() => setShowConfirm(false)}
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    className="utility-panel-reset"
                    onClick={handleReset}
                    disabled={isBusy}
                  >
                    {isBusy ? "Resetting…" : "Reset"}
                  </button>
                </div>
              </div>
            )}
          </div>

          <div className="utility-panel-divider" />

          <div className="utility-plan-section">
            <p className="utility-panel-title">Monthly Plans</p>
            <p className="utility-panel-row-subtitle">Create and manage saved monthly plans</p>

            <div className="utility-plan-form">
              <input
                type="text"
                placeholder="Plan name (e.g., Basic)"
                value={planName}
                onChange={(e) => setPlanName(e.target.value)}
                className="plan-input"
              />
              <input
                type="number"
                placeholder="Amount (₹)"
                value={planAmount}
                onChange={(e) => setPlanAmount(e.target.value)}
                className="plan-input"
              />
              <button type="button" className="utility-panel-action" onClick={handleAddPlan}>
                <Plus className="h-4 w-4 inline -mt-0.5 mr-2" /> Save Plan
              </button>
            </div>

            <div className="utility-plan-list">
              {plans.length === 0 && <p className="muted">No saved plans</p>}
              {plans.map((p) => (
                <div key={p.id} className="utility-plan-item">
                  <div>
                    <div className="utility-plan-name">{p.name}</div>
                    <div className="utility-plan-amount">₹{p.amount.toFixed(2)}</div>
                  </div>
                  <button type="button" className="utility-plan-delete" onClick={() => handleDeletePlan(p.id)} aria-label="Delete plan">
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
