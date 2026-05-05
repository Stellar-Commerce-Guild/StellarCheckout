import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { paymentsApi } from '../api';

export default function CreatePaymentPage() {
  const navigate = useNavigate();
  const [form, setForm] = useState({
    amount: '',
    asset: 'XLM' as 'XLM' | 'USDC',
    description: '',
    destination: '',
    expires_in_hours: 24,
  });
  const [result, setResult] = useState<{ checkout_url: string; payment_id: string } | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const { data } = await paymentsApi.create(form);
      setResult({ checkout_url: data.checkout_url, payment_id: data.payment.id });
    } catch (e: any) {
      setError(e.response?.data?.error?.formErrors?.[0] || e.response?.data?.error || 'Failed to create payment');
    } finally {
      setLoading(false);
    }
  }

  if (result) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-lg p-8 max-w-md w-full text-center">
          <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-6 h-6 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h2 className="text-xl font-bold mb-2">Payment Created!</h2>
          <p className="text-gray-500 text-sm mb-4">Share this link with your customer:</p>
          <div className="bg-gray-50 rounded-lg p-3 mb-4">
            <a
              href={result.checkout_url}
              target="_blank"
              rel="noopener noreferrer"
              className="text-stellar-600 text-sm break-all hover:underline"
            >
              {result.checkout_url}
            </a>
          </div>
          <div className="flex gap-3">
            <button
              onClick={() => navigator.clipboard.writeText(result.checkout_url)}
              className="flex-1 border border-gray-200 text-gray-700 py-2 rounded-lg text-sm hover:bg-gray-50"
            >
              Copy Link
            </button>
            <Link
              to="/dashboard"
              className="flex-1 bg-stellar-600 text-white py-2 rounded-lg text-sm text-center hover:bg-stellar-700"
            >
              Dashboard
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-lg p-8 max-w-md w-full">
        <div className="flex items-center gap-3 mb-6">
          <Link to="/dashboard" className="text-gray-400 hover:text-gray-600">←</Link>
          <h1 className="text-xl font-bold">New Payment</h1>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="flex gap-3">
            <div className="flex-1">
              <label className="block text-sm font-medium text-gray-700 mb-1">Amount</label>
              <input
                type="text"
                required
                value={form.amount}
                onChange={e => setForm(f => ({ ...f, amount: e.target.value }))}
                placeholder="10.00"
                className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-stellar-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Asset</label>
              <select
                value={form.asset}
                onChange={e => setForm(f => ({ ...f, asset: e.target.value as 'XLM' | 'USDC' }))}
                className="border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-stellar-500"
              >
                <option value="XLM">XLM</option>
                <option value="USDC">USDC</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
            <input
              type="text"
              value={form.description}
              onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
              placeholder="Order #1234, SaaS subscription…"
              className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-stellar-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Destination Address</label>
            <input
              type="text"
              required
              value={form.destination}
              onChange={e => setForm(f => ({ ...f, destination: e.target.value }))}
              placeholder="G..."
              className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-stellar-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Expires in (hours)</label>
            <select
              value={form.expires_in_hours}
              onChange={e => setForm(f => ({ ...f, expires_in_hours: parseInt(e.target.value) }))}
              className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-stellar-500"
            >
              {[1, 6, 12, 24, 48, 72, 168].map(h => (
                <option key={h} value={h}>{h}h</option>
              ))}
            </select>
          </div>

          {error && <p className="text-red-500 text-sm">{error}</p>}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-stellar-600 hover:bg-stellar-700 disabled:opacity-60 text-white font-semibold py-3 rounded-xl transition-colors"
          >
            {loading ? 'Creating…' : 'Create Payment Link'}
          </button>
        </form>
      </div>
    </div>
  );
}
