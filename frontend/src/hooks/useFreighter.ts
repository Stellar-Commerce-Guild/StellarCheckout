import { useState, useCallback } from 'react';
import {
  isConnected,
  getPublicKey,
  signTransaction,
} from '@stellar/freighter-api';

export function useFreighter() {
  const [publicKey, setPublicKey] = useState<string | null>(null);
  const [connecting, setConnecting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const connect = useCallback(async () => {
    setConnecting(true);
    setError(null);
    try {
      const connected = await isConnected();
      if (!connected) {
        setError('Freighter wallet not installed. Please install it from freighter.app');
        return null;
      }
      const key = await getPublicKey();
      setPublicKey(key);
      return key;
    } catch (e: any) {
      setError(e.message || 'Failed to connect wallet');
      return null;
    } finally {
      setConnecting(false);
    }
  }, []);

  const sign = useCallback(async (xdr: string, network: string) => {
    try {
      const result = await signTransaction(xdr, { network });
      return result;
    } catch (e: any) {
      setError(e.message || 'Transaction signing failed');
      return null;
    }
  }, []);

  return { publicKey, connecting, error, connect, sign };
}
