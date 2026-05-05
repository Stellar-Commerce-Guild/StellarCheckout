import axios from 'axios';

const api = axios.create({ baseURL: '/api' });

// Attach API key from localStorage if present
api.interceptors.request.use((config) => {
  const key = localStorage.getItem('sc_api_key');
  if (key) config.headers.Authorization = `Bearer ${key}`;
  return config;
});

export interface Payment {
  id: string;
  merchant_id: string;
  amount: string;
  asset: 'XLM' | 'USDC';
  description?: string;
  memo: string;
  destination: string;
  status: 'pending' | 'completed' | 'failed' | 'expired';
  tx_hash?: string;
  ledger?: number;
  expires_at: string;
  created_at: string;
}

export interface FiatAmounts {
  USD: string;
  NGN: string;
  EUR: string;
}

export const paymentsApi = {
  get: (id: string) =>
    api.get<{ payment: Payment; fiat: FiatAmounts }>(`/payments/${id}`),

  list: (params?: { status?: string; limit?: number; offset?: number }) =>
    api.get<{ payments: Payment[]; total: number }>('/payments', { params }),

  create: (data: {
    amount: string;
    asset: 'XLM' | 'USDC';
    description?: string;
    destination: string;
    expires_in_hours?: number;
  }) => api.post<{ payment: Payment; fiat: FiatAmounts; checkout_url: string }>('/payments', data),

  buildTx: (id: string, senderPublicKey: string) =>
    api.post<{ xdr: string }>(`/payments/${id}/build-tx`, { sender_public_key: senderPublicKey }),

  submit: (id: string, signedXdr: string) =>
    api.post<{ success: boolean; tx_hash: string }>(`/payments/${id}/submit`, { signed_xdr: signedXdr }),
};
