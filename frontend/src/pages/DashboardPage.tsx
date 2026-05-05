import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { paymentsApi, Payment } from '../api';
import { StatusBadge } from '../components/StatusBadge';

const FILTERS = ['all', 'pending', 'completed', 'failed', 'expired'] as const;

export default function DashboardPage() {
  const [payments, setPayments] = useState<Payment[]>([]);
  const [total, setTotal] = useState(0);
  const [filter, setFilter] = useState<string>('all');
  const [loading, setLoading] = useState(true);
  const [apiKey, setApiKey] = useState(localStorage.getItem('sc_api_key') || '');

  useEffect(() => {
    if (apiKey) localStorage.setItem('sc_api_key', apiKey);
  }, [apiKey]);

  useEffect(() => {
    setLoading(true);
    paymentsApi
      .list({ status: filter === 'all' ? undefined : filter, limit: 50 })
      .then(({ data }) => {
        setPayments(data.payments);
        setTotal(data.total);
      })
      .catch(() => setPayments([]))
      .finally(() => setLoading(false));
  }, [filter, apiKey]);

  const revenue = {
    XLM: payments.filter(p => p.status === 'completed' && p.asset === 'XLM')
      .reduce((s, p) => s + parseFloat(p.amount), 0).toFixed(2),
    USDC: payments.filter(p => p.status === 'completed' && p.asset === 'USDC')
      .reduce((s, p) => s + parseFloat(p.amount), 0).toFixed(2),
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Nav */}
      <nav className="bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-stellar-600 font-bold text-lg">⚡ StellarCheckout</span>
          <span className="text-gray-400 text-sm">Dashboard</span>
        </div>
        <Link
          to="/dashboard/new"
          className="bg-stellar-600 hover:bg-stellar-700 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors"
        >
          + New Payment
        </Link>
      </nav>

      <div className="max-w-5xl mx-auto px-4 py-8">
        {/* API Key input */}
        <div className="bg-white rounded-xl border border-gray-200 p-4 mb-6 flex items-center gap-3">
          <span className="text-sm text-gray-500 shrink-0">API Key:</span>
          <input
            type="password"
            value={apiKey}
            onChange={e => setApiKey(e.target.value)}
            placeholder="Enter your API key"
            className="flex-1 text-sm border border-gray-200 rounded-lg px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-stellar-500"
          />
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <StatCard label="Total Payments" value={String(total)} />
          <StatCard label="Completed" value={String(payments.filter(p => p.status === 'completed').length)} color="text-green-600" />
          <StatCard label="Revenue (XLM)" value={revenue.XLM} />
          <StatCard label="Revenue (USDC)" value={revenue.USDC} />
        </div>

        {/* Filter tabs */}
        <div className="flex gap-2 mb-4 overflow-x-auto">
          {FILTERS.map(f => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium capitalize transition-colors ${
                filter === f
                  ? 'bg-stellar-600 text-white'
                  : 'bg-white text-gray-600 border border-gray-200 hover:border-stellar-500'
              }`}
            >
              {f}
            </button>
          ))}
        </div>

        {/* Payments table */}
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          {loading ? (
            <div className="flex items-center justify-center py-16">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-stellar-500" />
            </div>
          ) : payments.length === 0 ? (
            <div className="text-center py-16 text-gray-400">
              <p className="text-lg">No payments yet</p>
              <Link to="/dashboard/new" className="text-stellar-600 text-sm mt-2 inline-block hover:underline">
                Create your first payment →
              </Link>
            </div>
          ) : (
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  {['ID', 'Amount', 'Description', 'Status', 'Created', 'Link'].map(h => (
                    <th key={h} className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wide">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {payments.map(p => (
                  <tr key={p.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-3 font-mono text-xs text-gray-400">{p.id.substring(0, 8)}…</td>
                    <td className="px-4 py-3 font-semibold">{p.amount} <span className="text-gray-400 font-normal">{p.asset}</span></td>
                    <td className="px-4 py-3 text-gray-600 max-w-[160px] truncate">{p.description || '—'}</td>
                    <td className="px-4 py-3"><StatusBadge status={p.status} /></td>
                    <td className="px-4 py-3 text-gray-400">{new Date(p.created_at).toLocaleDateString()}</td>
                    <td className="px-4 py-3">
                      <a
                        href={`/pay/${p.id}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-stellar-600 hover:underline"
                      >
                        Open ↗
                      </a>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}

function StatCard({ label, value, color = 'text-gray-900' }: { label: string; value: string; color?: string }) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-4">
      <p className="text-xs text-gray-500 mb-1">{label}</p>
      <p className={`text-2xl font-bold ${color}`}>{value}</p>
    </div>
  );
}
