import { useNavigate } from 'react-router-dom';
import { useRef } from 'react';
import api from '../services/api';
import CustomerForm from '../components/CustomerForm';
import CustomerFormModal from '../components/CustomerFormModal';

export default function AddCustomer() {
  const navigate = useNavigate();
  const formRef = useRef(null);

  async function handleSubmit(values) {
    try {
      const res = await api.post('/customers', values);

      const id =
        res?.data?.data?._id ||
        res?.data?._id ||
        res?.data?.id;

      if (!id) {
        throw new Error(
          'Unexpected server response: missing customer id'
        );
      }

      navigate(`/customers/${id}`);
    } catch (err) {
      const message =
        err?.response?.data?.message ||
        err?.response?.data?.error ||
        err.message ||
        'Could not create customer.';

      const e = new Error(message);
      e.response = err.response;
      throw e;
    }
  }

  function submitForm() {
    const form = formRef.current;

    if (!form) return;

    if (typeof form.requestSubmit === 'function') {
      form.requestSubmit();
    } else {
      form.submit();
    }
  }

  return (
    <CustomerFormModal
      title="Add customer"
      subtitle="Create a new subscriber record"
      onClose={() => navigate('/customers')}
      footer={
        <>
          <button
            type="button"
            className="customer-form-cancel"
            onClick={() => navigate('/customers')}
          >
            Cancel
          </button>

          <button
            type="button"
            className="customer-form-save"
            onClick={submitForm}
          >
            Add customer
          </button>
        </>
      }
    >
      <CustomerForm
        ref={formRef}
        onSubmit={handleSubmit}
        submitLabel="Add Customer"
        hideSubmitButton={true}
        formId="add-customer-form"
      />
    </CustomerFormModal>
  );
}