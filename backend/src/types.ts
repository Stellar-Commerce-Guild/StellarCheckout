export type PaymentStatus = 'pending' | 'completed' | 'failed' | 'expired';
export type AssetCode = 'XLM' | 'USDC';

export interface Payment {
  id: string;
  merchant_id: string;
  amount: string;
  asset: AssetCode;
  description?: string;
  memo: string;
  destination: string;
  status: PaymentStatus;
  tx_hash?: string;
  ledger?: number;
  expires_at: string;
  created_at: string;
  updated_at: string;
}

export interface Webhook {
  id: string;
  merchant_id: string;
  url: string;
  secret: string;
  events: string[];
  active: boolean;
  created_at: string;
}

export interface FxRates {
  XLM: { USD: number; NGN: number; EUR: number };
  USDC: { USD: number; NGN: number; EUR: number };
}
