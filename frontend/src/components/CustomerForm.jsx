import { useState, useEffect, forwardRef } from 'react';

const emptyForm = {
  name: '',
  phone: '',
  cafNumber: '',
  address: '',
  area: '',
  pon: '',
  monthlyFee: '',
};

function readPlans() {
  try {
    const raw = localStorage.getItem('cablesync_monthly_plans');
    return raw ? JSON.parse(raw) : [];
  } catch (e) {
    return [];
  }
}

const CustomerForm = forwardRef(function CustomerForm({ initialValues, onSubmit, submitLabel = 'Save', formId, hideSubmitButton = false }, ref) {
  const [form, setForm] = useState({ ...emptyForm, ...initialValues });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [plans, setPlans] = useState(() => readPlans());
  const [selectedPlanId, setSelectedPlanId] = useState('');

  useEffect(() => {
    const handler = () => setPlans(readPlans());
    window.addEventListener('cablesync:plans-updated', handler);
    return () => window.removeEventListener('cablesync:plans-updated', handler);
  }, []);

  useEffect(() => {
    // if initialValues has monthlyFee, keep it; otherwise clear selection
    if (initialValues?.monthlyFee) setForm((f) => ({ ...f, monthlyFee: initialValues.monthlyFee }));
  }, [initialValues]);

  function handleChange(field) {
    return (e) => setForm((f) => ({ ...f, [field]: e.target.value }));
  }

  function handlePlanChange(e) {
    const id = e.target.value;
    setSelectedPlanId(id);
    if (!id) return setForm((f) => ({ ...f, monthlyFee: '' }));
    const plan = plans.find((p) => p.id === id);
    if (plan) setForm((f) => ({ ...f, monthlyFee: String(plan.amount) }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');

    if (!form.cafNumber || !form.name || !form.phone || !form.monthlyFee) {
      setError('Serial number, name, phone, and monthly fee are required.');
      return;
    }

    setSaving(true);
    try {
      await onSubmit({ ...form, monthlyFee: Number(form.monthlyFee) });
    } catch (err) {
      setError(
        err.response?.data?.message ||
        err.response?.data?.error ||
        err.response?.data?.errors?.map((e) => e.msg).join('; ') ||
        'Could not save customer.'
      );
    } finally {
      setSaving(false);
    }
  }

  const fields = [
    { key: 'name', label: 'Name', required: true },
    { key: 'phone', label: 'Phone', required: true, type: 'tel' },
    { key: 'cafNumber', label: 'CAF Number', required: true },
    { key: 'address', label: 'Address' },
    { key: 'area', label: 'Area' },
    { key: 'pon', label: 'PON' },
  ];

  return (
    <form ref={ref} id={formId} data-saving={saving ? '1' : '0'} onSubmit={handleSubmit} className="customer-form-grid">
      {fields.map(({ key, label, required, type }) => (
        <label key={key} className="flex flex-col gap-1">
          <span className="text-xs uppercase tracking-wide text-ink-soft">
            {label} {required && <span className="text-due">*</span>}
          </span>
          <input
            type={type || 'text'}
            value={form[key]}
            onChange={handleChange(key)}
            className="bg-paper border border-hairline rounded-lg px-3 py-2 text-ink focus:outline-none focus:ring-2 focus:ring-brass/40 focus:border-brass"
          />
        </label>
      ))}

      {/* Plan selector */}
      <label className="flex flex-col gap-1">
        <span className="text-xs uppercase tracking-wide text-ink-soft">Saved Plan</span>
        <select
          value={selectedPlanId}
          onChange={handlePlanChange}
          className="bg-paper border border-hairline rounded-lg px-3 py-2 text-ink focus:outline-none focus:ring-2 focus:ring-brass/40 focus:border-brass"
        >
          <option value="">-- Custom / No plan --</option>
          {plans.map((p) => (
            <option key={p.id} value={p.id}>{p.name} — ₹{Number(p.amount).toFixed(2)}</option>
          ))}
        </select>
      </label>

      {/* Monthly fee field (auto-filled from plan selection) */}
      <label className="flex flex-col gap-1">
        <span className="text-xs uppercase tracking-wide text-ink-soft">Monthly Fee (₹) <span className="text-due">*</span></span>
        <input
          type="number"
          value={form.monthlyFee}
          onChange={handleChange('monthlyFee')}
          className="bg-paper border border-hairline rounded-lg px-3 py-2 text-ink focus:outline-none focus:ring-2 focus:ring-brass/40 focus:border-brass"
        />
        {form.monthlyFee !== '' && (
          <div className="text-sm text-ink-soft mt-1">Monthly amount: ₹{Number(form.monthlyFee).toFixed(2)}</div>
        )}
      </label>

      {error && <p className="text-due text-sm">{error}</p>}

      {!hideSubmitButton && (
        <button
          type="submit"
          disabled={saving}
          className="bg-brass text-white font-medium rounded-lg py-2.5 mt-2 hover:bg-brass-dark transition-colors disabled:opacity-60"
        >
          {saving ? 'Saving…' : submitLabel}
        </button>
      )}
    </form>
  );
});

export default CustomerForm;
