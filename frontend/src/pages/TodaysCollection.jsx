import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import api from '../services/api';
import TopBar from '../components/TopBar';
import { formatCurrency, formatDate } from '../utils/format';
import { AlertTriangle } from 'lucide-react';

export default function TodaysCollection() {
  const { data, error, isLoading } = useQuery({
    queryKey: ['todaysCollection'],
    queryFn: () => api.get('/payments/today').then((res) => res.data),
  });

  return (
    <div className="min-h-screen bg-paper">
      <TopBar title="Today's Collection" backTo="/reports" />
      <div className="max-w-3xl mx-auto px-5 py-5">
        {isLoading && <p className="text-ink-soft text-center">Loading...</p>}
        {error && (
          <div className="text-center text-due">
            <AlertTriangle className="mx-auto h-8 w-8" />
            <p className="mt-2 text-sm font-semibold">
              {error.message || "Could not load today's collection"}
            </p>
          </div>
        )}

        {data && (
          <>
            <div className="bg-card border border-hairline rounded-xl shadow-ledger px-5 py-4 mb-5 flex items-center justify-between">
              <div>
                <p className="text-xs uppercase tracking-wide text-ink-soft">Total collected</p>
                <p className="font-mono tabular text-3xl text-brass-dark">
                  {formatCurrency(data.total)}
                </p>
              </div>
              <div className="text-right">
                <p className="text-xs uppercase tracking-wide text-ink-soft">Payments</p>
                <p className="font-mono tabular text-3xl text-ink">{data.count}</p>
              </div>
            </div>

            {data.payments.length === 0 ? (
              <p className="text-ink-soft text-sm">No payments recorded yet today.</p>
            ) : (
              <div className="flex flex-col gap-2">
                {data.payments.map((p) => (
                  <Link
                    key={p._id}
                    to={p.customerId ? `/customers/${p.customerId._id}` : '#'}
                    className="flex items-center justify-between bg-card border border-hairline rounded-xl px-4 py-3 shadow-ledger hover:border-ink-soft transition-colors"
                  >
                    <div>
                      <p className="text-ink font-medium">
                        {p.customerId?.name || 'Unknown customer'}
                      </p>
                      <p className="text-xs text-ink-soft font-mono tabular">
                        {formatDate(p.paymentDate)} · {p.paymentMode}
                      </p>
                    </div>
                    <span className="font-mono tabular text-paid">
                      {formatCurrency(p.amount)}
                    </span>
                  </Link>
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
