import axios from 'axios';
import { FxRates } from './types';

let cache: { rates: FxRates; fetchedAt: number } | null = null;
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

const FALLBACK: FxRates = {
  XLM: { USD: 0.11, NGN: 170, EUR: 0.10 },
  USDC: { USD: 1.0, NGN: 1580, EUR: 0.92 },
};

export async function getFxRates(): Promise<FxRates> {
  if (cache && Date.now() - cache.fetchedAt < CACHE_TTL) return cache.rates;

  try {
    const { data } = await axios.get(
      'https://api.coingecko.com/api/v3/simple/price?ids=stellar,usd-coin&vs_currencies=usd,ngn,eur',
      { timeout: 3000 }
    );
    const rates: FxRates = {
      XLM: {
        USD: data.stellar?.usd ?? FALLBACK.XLM.USD,
        NGN: data.stellar?.ngn ?? FALLBACK.XLM.NGN,
        EUR: data.stellar?.eur ?? FALLBACK.XLM.EUR,
      },
      USDC: {
        USD: data['usd-coin']?.usd ?? FALLBACK.USDC.USD,
        NGN: data['usd-coin']?.ngn ?? FALLBACK.USDC.NGN,
        EUR: data['usd-coin']?.eur ?? FALLBACK.USDC.EUR,
      },
    };
    cache = { rates, fetchedAt: Date.now() };
    return rates;
  } catch {
    return FALLBACK;
  }
}

export function convertAmount(amount: string, asset: 'XLM' | 'USDC', rates: FxRates) {
  const n = parseFloat(amount);
  const r = rates[asset];
  return {
    USD: (n * r.USD).toFixed(2),
    NGN: (n * r.NGN).toFixed(2),
    EUR: (n * r.EUR).toFixed(2),
  };
}
