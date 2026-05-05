import { useEffect, useState, useCallback } from 'react';
import { useParams } from 'react-router-dom';
import { QRCodeSVG } from 'qrcode.react';
import { paymentsApi, Payment, FiatAmounts } from '../api';
import { useFreighter } from '../hooks/useFreighter';
import { StatusBadge } from '../components/StatusBadge';

type Step = 'loading' | 'ready' | 'connecting' | 'signing' | 'submitting' | 'success' | 'error' | 'expired';

export default function CheckoutPage() {
  const { id } = useParams<{ id: string }>();
  const [payment, setPayment] = useState<Payment | null>(null);
  const [fiat, setFiat] = useState<FiatAmounts | null>(null);
  const [step, setStep] = useState<Step>('loading');
  const [txHash, setTxHash] = useState<string | null>(null);
  const [errMsg, setErrMsg] = useState<string>('');
  const { publicKey, connecting, error: walletError, connect, sign } = useFreighter();

  const network = import.meta.env.VITE_STELLAR_NETWORK || 'TESTNET';

  const load = useCallback(async () => {
    if (!id) return;
    try {
      const { data } = await paymentsApi.get(id);
      setPayment(data.payment);
      setFiat(data.fiat);
      if (data.payment.status === 'expired') setStep('expired');
      else if (data.payment.status === 'completed') {
        setTxHash(data.payment.tx_hash || null);
        setStep('success');
      } else setStep('ready');
    } catch {
      setStep('error');
      setErrMsg('Payment not found');
    }
  }, [id]);

  useEffect(() => { load(); }, [load]);

  // Poll for status updates every 10s while pending
  useEffect(() => {
    if (step !== 'ready') return;
    const t = setInterval(load, 10_000);
    return () => clearInterval(t);
  }, [step, load]);

  async function handlePay() {
    if (!payment || !id) return;
    setStep('connecting');

    const key = publicKey || await connect();
    if (!key) { setStep('ready'); return; }

    setStep('signing');
    try {
      const { data: { xdr } } = await paymentsApi.buildTx(id, key);
      const signed = await sign(xdr, network);
      if (!signed) { setStep('ready'); return; }

      setStep('submitting');
      const { data } = await paymentsApi.submit(id, signed);
      setTxHash(data.tx_hash);
      setStep('success');
    } catch (e: any) {
      setErrMsg(e.response?.data?.error || e.message || 'Payment failed');
      setStep('error');
    }
  }

  if (step === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-stellar-500" />
      </div>
    );
  }

  if (step === 'error') {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-600 font-medium">{errMsg}</p>
          <button onClick={() => { setStep('ready'); setErrMsg(''); }} className="mt-4 text-stellar-600 underline">Try again</button>
        </div>
      </div>
    );
  }

  if (step === 'success') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="bg-white rounded-2xl shadow-lg p-8 max-w-md w-full mx-4 text-center">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Payment Complete</h2>
          <p className="text-gray-500 mb-4">
            {payment?.amount} {payment?.asset} sent successfully
          </p>
          {txHash && (
            <a
              href={`https://stellar.expert/explorer/${network.toLowerCase()}/tx/${txHash}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-stellar-600 text-sm break-all hover:underline"
            >
              View on Stellar Expert →
            </a>
          )}
        </div>
      </div>
    );
  }

  if (step === 'expired') {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-500 text-lg">This payment link has expired.</p>
        </div>
      </div>
    );
  }

  const checkoutUrl = window.location.href;
  const isProcessing = ['connecting', 'signing', 'submitting'].includes(step);

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-lg max-w-md w-full overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-stellar-600 to-stellar-700 px-6 py-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-stellar-50 text-sm font-medium">StellarCheckout</p>
              <h1 className="text-white text-xl font-bold mt-0.5">
                {payment?.description || 'Payment Request'}
              </h1>
            </div>
            <StatusBadge status={payment?.status || 'pending'} />
          </div>
        </div>

        {/* Amount */}
        <div className="px-6 py-5 border-b border-gray-100">
          <div className="flex items-baseline gap-2">
            <span className="text-4xl font-bold text-gray-900">{payment?.amount}</span>
            <span className="text-xl font-semibold text-gray-500">{payment?.asset}</span>
          </div>
          {fiat && (
            <p className="text-gray-400 text-sm mt-1">
              ≈ ${fiat.USD} USD · ₦{fiat.NGN} NGN · €{fiat.EUR} EUR
            </p>
          )}
        </div>

        {/* QR Code */}
        <div className="px-6 py-5 flex flex-col items-center border-b border-gray-100">
          <p className="text-xs text-gray-400 mb-3 uppercase tracking-wide">Scan to pay on mobile</p>
          <QRCodeSVG
            value={checkoutUrl}
            size={160}
            level="M"
            includeMargin
            className="rounded-lg"
          />
          <p className="text-xs text-gray-400 mt-3 font-mono break-all text-center">
            Memo: {payment?.memo}
          </p>
        </div>

        {/* Wallet connect & pay */}
        <div className="px-6 py-5">
          {publicKey ? (
            <div className="mb-3 flex items-center gap-2 bg-gray-50 rounded-lg px-3 py-2">
              <div className="w-2 h-2 rounded-full bg-green-500" />
              <span className="text-xs text-gray-600 font-mono truncate">{publicKey}</span>
            </div>
          ) : null}

          {walletError && (
            <p className="text-red-500 text-sm mb-3">{walletError}</p>
          )}

          <button
            onClick={handlePay}
            disabled={isProcessing}
            className="w-full bg-stellar-600 hover:bg-stellar-700 disabled:opacity-60 disabled:cursor-not-allowed text-white font-semibold py-3.5 rounded-xl transition-colors flex items-center justify-center gap-2"
          >
            {isProcessing ? (
              <>
                <span className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" />
                {step === 'connecting' && 'Connecting wallet…'}
                {step === 'signing' && 'Sign in Freighter…'}
                {step === 'submitting' && 'Submitting…'}
              </>
            ) : (
              <>
                {publicKey ? '⚡ Pay Now' : '🔗 Connect Freighter & Pay'}
              </>
            )}
          </button>

          <p className="text-center text-xs text-gray-400 mt-3">
            Powered by{' '}
            <a href="https://stellar.org" target="_blank" rel="noopener noreferrer" className="text-stellar-600">
              Stellar
            </a>
            {' '}· Instant · Low fees · Global
          </p>
        </div>
      </div>
    </div>
  );
}
