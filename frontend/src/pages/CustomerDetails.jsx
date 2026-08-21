import { useEffect, useState } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Edit,
  Plus,
  User,
  Phone,
  FileText,
  Hash,
  MapPin,
  Home,
  IndianRupee,
  CalendarPlus,
  CalendarCheck2,
  CalendarClock,
  AlertTriangle,
  Trash2,
  MessageCircle,
} from "lucide-react";

import api from "../services/api";
import TopBar from "../components/TopBar";
import StatusStamp from "../components/StatusStamp";
import PaymentHistory from "../components/PaymentHistory";
import NewPaymentModal from "../components/NewPaymentModal";
import PaymentReceiptModal from "../components/PaymentReceiptModal";
import ActivityLog from "../components/ActivityLog";
import Modal from "../components/Modal";
import { formatCurrency, formatDate, monthName } from "../utils/format";
import { buildReminderMessage, buildWhatsAppLink } from "../utils/whatsapp";
import { useToasts } from "../hooks/useToasts";

export default function CustomerDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const queryClient = useQueryClient();

  const { addToast } = useToasts();
  const [showNewPayment, setShowNewPayment] = useState(false);
  const [receipt, setReceipt] = useState(null); // { payment, paidThroughDate } | null
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState("");

  useEffect(() => {
    if (location.state?.openPayment) {
      setShowNewPayment(true);
      window.history.replaceState({}, document.title, location.pathname);
    }
  }, [location.pathname, location.state]);

  const { data: customer, error: customerError } = useQuery({
    queryKey: ["customer", id],
    queryFn: () => api.get(`/customers/${id}`).then((res) => res.data.data),
  });

  const { data: dueInfo, error: dueInfoError } = useQuery({
    queryKey: ["dueStatus", id],
    queryFn: () => api.get(`/customers/${id}/due-status`).then((res) => res.data.data),
  });

  const isLoading = (!customer && !customerError) || (!dueInfo && !dueInfoError);
  const error = customerError || dueInfoError;

  function handlePaymentSaved(data) {
    setShowNewPayment(false);
    // The API now returns the updated billing status. We can use this
    // to immediately update the cache for a faster UI response.
    queryClient.setQueryData(["dueStatus", id], data.updatedBilling);
    // Invalidate the activity log to refetch it in the background.
    queryClient.invalidateQueries(["payments", id]);
    addToast("Payment saved successfully", "success");
    queryClient.invalidateQueries(["activityLog", id]);
    queryClient.invalidateQueries("dashboardSummary");
    setReceipt({ payment: data.payment, paidThroughDate: data.updatedBilling.paidThroughDate });
  }

  async function handleDelete() {
    setIsDeleting(true);
    setDeleteError("");
    try {
      const res = await api.delete(`/customers/${id}`);
      queryClient.invalidateQueries({ queryKey: ['customers'] });
      queryClient.invalidateQueries({ queryKey: ['customer', id] });
      queryClient.invalidateQueries({ queryKey: ['dashboardSummary'] });

      if (res.data.deletedType === "soft") {
        // Soft-deleted (has payment history) — give a 5s window to undo.
        addToast(
          "Customer deleted",
          "success",
          5000,
          {
            label: "Undo",
            onClick: async () => {
              try {
                await api.patch(`/customers/${id}/restore`);
                queryClient.invalidateQueries({ queryKey: ['customers'] });
                queryClient.invalidateQueries({ queryKey: ['customer', id] });
                queryClient.invalidateQueries({ queryKey: ['dashboardSummary'] });
                addToast("Customer restored", "success");
                navigate(`/customers/${id}`);
              } catch (err) {
                addToast(err.response?.data?.message || "Could not restore customer.", "error");
              }
            },
          },
        );
      } else {
        addToast("Customer permanently deleted", "success");
      }
      navigate("/customers");
    } catch (err) {
      addToast(err.response?.data?.message || "Could not delete customer.", "error");
      setIsDeleting(false);
      // Close the confirmation modal on error to show the message
      setShowDeleteConfirm(false);
    }
  }

  if (error) {
    return (
      <div className="app-page">
        <TopBar title="Customer" backTo="/customers" />
        <div className="flex h-[60vh] flex-col items-center justify-center text-center">
          <AlertTriangle className="mb-4 h-16 w-16 text-due" />
          <h2 className="mb-2 text-2xl font-bold text-ink">
            Could Not Load Customer
          </h2>
          <p className="max-w-md text-ink-soft">{error.message}</p>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="app-page">
        <TopBar title="Customer" backTo="/customers" />
        <p className="mx-auto max-w-3xl px-5 py-5 text-center text-ink-soft">
          Loading...
        </p>
      </div>
    );
  }

  const DetailItem = ({ icon: Icon, label, children, className = "" }) => (
    <div className={className}>
      <dt className="flex items-center gap-2 text-xs uppercase tracking-wide text-ink-soft">
        <Icon className="h-4 w-4" />
        <span>{label}</span>
      </dt>
      <dd className="mt-1 truncate font-medium text-ink">{children}</dd>
    </div>
  );

  return (
    <div className="app-page">
      <TopBar title={customer.name} backTo="/customers" />

      <div className="mx-auto max-w-5xl px-4 py-6 sm:px-6 lg:px-8">
        {/* Profile card */}
        <div className="mb-6 rounded-2xl border border-hairline bg-card p-5 shadow-ledger sm:p-6">
          <div className="flex flex-col items-start justify-between gap-4 sm:flex-row">
            <div className="flex items-center gap-4">
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-brass to-brass-dark text-xl font-bold text-white shadow-lg shadow-brass/20">
                {customer.name.charAt(0)}
              </div>
              <div>
                <h2 className="font-display text-2xl font-semibold text-ink">
                  {customer.name}
                </h2>
                <p className="font-mono text-ink-soft">{customer.phone}</p>
              </div>
            </div>
            <StatusStamp status={dueInfo.status} />
          </div>

          {/* Ledger balance strip - the concrete numbers behind the stamp */}
          <div className="my-5 flex flex-wrap items-center gap-x-6 gap-y-2 rounded-xl bg-paper p-4 text-sm">
            {dueInfo.status === "DUE" && (
              <span className="font-semibold text-due">
                Owes {formatCurrency(dueInfo.arrears)}
              </span>
            )}
            {dueInfo.status === "PARTIAL" && (
              <span className="font-semibold text-partial">
                Short {formatCurrency(dueInfo.arrears)} this month
              </span>
            )}
            {dueInfo.status === "PAID" && dueInfo.monthsAdvance > 0 && (
              <span className="font-semibold text-paid">
                {dueInfo.monthsAdvance} month
                {dueInfo.monthsAdvance === 1 ? "" : "s"} paid in advance
              </span>
            )}
            {dueInfo.status === "PAID" && dueInfo.monthsAdvance === 0 && (
              <span className="text-paid">Fully settled for this month</span>
            )}
            <span className="ml-auto text-ink-soft">
              Paid till {formatDate(dueInfo.paidThroughDate, "dd MMM yyyy")}
            </span>
          </div>

          <dl className="grid grid-cols-1 gap-x-6 gap-y-4 text-sm sm:grid-cols-2 lg:grid-cols-3">
            <DetailItem icon={Hash} label="Serial No.">
              {customer.serialNumber}
            </DetailItem>
            <DetailItem icon={FileText} label="CAF Number">
              {customer.cafNumber || "—"}
            </DetailItem>
            <DetailItem icon={IndianRupee} label="Monthly Plan">
              {formatCurrency(customer.monthlyFee)}
            </DetailItem>
            <DetailItem icon={Home} label="Area">
              {customer.area || "—"}
            </DetailItem>
            <DetailItem icon={MapPin} label="Address" className="lg:col-span-2">
              {customer.address || "—"}
            </DetailItem>
            <DetailItem icon={CalendarPlus} label="Connection Date">
              {formatDate(customer.createdAt, "dd MMM yyyy")}
            </DetailItem>
            <DetailItem icon={CalendarCheck2} label="Paid Till">
              {formatDate(dueInfo.paidThroughDate, "dd MMM yyyy")}
            </DetailItem>
            <DetailItem icon={CalendarClock} label="Next Due">
              {formatDate(new Date(dueInfo.nextDueDate), "dd MMM yyyy")}
            </DetailItem>
          </dl>

          <div className="mt-7 flex flex-col gap-3 border-t border-hairline pt-5 sm:flex-row">
            <button
              onClick={() => navigate(`/customers/${id}/edit`)}
              className="btn-orbit flex-1 px-4 py-2.5 text-sm"
            >
              <Edit className="h-4 w-4" />
              Edit
            </button>
            {(dueInfo.status === "DUE" || dueInfo.status === "PARTIAL") && dueInfo.arrears > 0 && customer.phone && (
              <a
                href={buildWhatsAppLink(customer.phone, buildReminderMessage(customer, dueInfo))}
                target="_blank"
                rel="noreferrer"
                className="flex flex-1 items-center justify-center gap-2 rounded-lg border border-hairline bg-paper px-4 py-2.5 text-sm font-semibold text-ink shadow-sm transition-colors hover:border-brass/40"
              >
                <MessageCircle className="h-4 w-4" />
                Remind
              </a>
            )}
            <button
              onClick={() => setShowDeleteConfirm(true)}
              className="flex flex-1 items-center justify-center gap-2 rounded-lg border border-due-soft bg-due-soft px-4 py-2.5 text-sm font-semibold text-due shadow-sm transition-colors hover:bg-due-soft/80"
            >
              <Trash2 className="h-4 w-4" />
              Delete
            </button>
            <button
              onClick={() => setShowNewPayment(true)}
              className="btn-prism flex-1 px-4 py-2.5 text-sm"
            >
              <Plus className="h-4 w-4" />
              New Payment
            </button>
          </div>
        </div>

        {deleteError && <p className="mb-4 rounded-md bg-due-soft p-3 text-center text-sm font-medium text-due">{deleteError}</p>}

        <div className="space-y-8">
          <PaymentHistory customerId={id} />
          <ActivityLog customerId={id} />
        </div>
      </div>

      {showNewPayment && (
        <NewPaymentModal
          customer={customer}
          dueInfo={dueInfo}
          onClose={() => setShowNewPayment(false)}
          onSaved={handlePaymentSaved}
        />
      )}

      {receipt && (
        <PaymentReceiptModal
          customer={customer}
          payment={receipt.payment}
          paidThroughDate={receipt.paidThroughDate}
          onClose={() => setReceipt(null)}
        />
      )}

      {showDeleteConfirm && (
        <Modal title="Delete Customer" onClose={() => setShowDeleteConfirm(false)}>
          <div className="flex flex-col gap-4">
            <p className="text-ink-soft">
              Are you sure you want to delete this customer? This action may not be
              undone.
            </p>
            <div className="rounded-lg bg-paper p-3 text-sm">
              <p>
                <span className="font-semibold text-ink">{customer.name}</span>
              </p>
              <p className="text-ink-soft">CAF: {customer.cafNumber}</p>
              <p className="text-ink-soft">Phone: {customer.phone}</p>
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => setShowDeleteConfirm(false)}
                disabled={isDeleting}
                className="flex-1 rounded-lg border border-hairline bg-paper py-2.5 font-semibold text-ink shadow-sm transition-colors hover:border-ink-soft disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                disabled={isDeleting}
                className="flex-1 rounded-lg bg-due py-2.5 font-semibold text-white shadow-sm transition-colors hover:bg-due/90 disabled:opacity-50"
              >
                {isDeleting ? "Deleting..." : "Delete"}
              </button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
