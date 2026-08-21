import { useNavigate, useParams } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import api from '../services/api';
import TopBar from '../components/TopBar';
import CustomerForm from '../components/CustomerForm';
import CustomerFormModal from '../components/CustomerFormModal';
import { useToasts } from '../hooks/useToasts';

export default function EditCustomer() {
  const { id } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { addToast } = useToasts();

  const { data: customer, error } = useQuery({
    queryKey: ['customer', id],
    queryFn: () => api.get(`/customers/${id}`).then((res) => res.data.data),
  });

  async function handleSubmit(values) {
    await api.put(`/customers/${id}`, values);

    // Record a lightweight local activity entry describing changed fields so
    // edits appear immediately in the activity stream even if the backend
    // doesn't emit field-level messages.
    try {
      const changes = [];
      const tracked = ['name', 'phone', 'cafNumber', 'address', 'area', 'pon', 'monthlyFee'];
      const labels = {
        name: 'Name',
        phone: 'Phone',
        cafNumber: 'CAF Number',
        address: 'Address',
        area: 'Area',
        pon: 'PON',
        monthlyFee: 'Monthly Fee',
      };
      tracked.forEach((k) => {
        const oldVal = (customer?.[k] ?? '') + '';
        const newVal = (values?.[k] ?? '') + '';
        if (oldVal !== newVal) {
          changes.push({ field: k, from: oldVal, to: newVal });
        }
      });

      if (changes.length) {
        const message = changes
          .map((c) => `${labels[c.field] || c.field} changed from ${c.from || '—'} to ${c.to || '—'}`)
          .join('; ');
        const localEntry = {
          _id: `local-${Date.now()}`,
          action: 'CUSTOMER_UPDATED',
          message,
          createdAt: new Date().toISOString(),
        };

        const key = 'cablesync_local_activities';
        const storeRaw = localStorage.getItem(key) || '{}';
        const store = JSON.parse(storeRaw);
        store[id] = store[id] || [];
        // add to the front so it appears first
        store[id].unshift(localEntry);
        localStorage.setItem(key, JSON.stringify(store));
      }
    } catch (err) {
      // swallow local-storage errors — non-critical
      // console.warn('Could not save local activity', err);
    }

    queryClient.invalidateQueries({ queryKey: ['customers'] });
    queryClient.invalidateQueries({ queryKey: ['customer', id] });
    queryClient.invalidateQueries({ queryKey: ['dashboardSummary'] });
    addToast("Customer updated successfully", "success");
    navigate(`/customers/${id}`);
  }

  return (
  <CustomerFormModal
    title="Edit customer"
    subtitle="Update subscriber information"
    onClose={() => navigate(`/customers/${id}`)}
    footer={
      <>
        <button
          type="button"
          className="customer-form-cancel"
          onClick={() => navigate(`/customers/${id}`)}
        >
          Cancel
        </button>

        <button
          type="button"
          className="customer-form-save"
          onClick={() => {
            const formEl = document.getElementById(
              `edit-customer-form-${id}`
            );

            if (formEl?.requestSubmit) {
              formEl.requestSubmit();
            }
          }}
        >
          Save changes
        </button>
      </>
    }
  >
    {error && (
      <p className="text-due text-sm mb-4">
        {error.message || 'Could not load customer'}
      </p>
    )}

    {customer && (
      <CustomerForm
        initialValues={customer}
        onSubmit={handleSubmit}
        submitLabel="Save Changes"
        formId={`edit-customer-form-${id}`}
        hideSubmitButton={true}
      />
    )}
  </CustomerFormModal>
);
}
