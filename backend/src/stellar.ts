import * as StellarSdk from '@stellar/stellar-sdk';
import { db } from './db';
import { Payment } from './types';

const HORIZON_URL = process.env.STELLAR_HORIZON_URL || 'https://horizon-testnet.stellar.org';
const NETWORK = process.env.STELLAR_NETWORK || 'testnet';

export const server = new StellarSdk.Horizon.Server(HORIZON_URL);
export const networkPassphrase =
  NETWORK === 'mainnet'
    ? StellarSdk.Networks.PUBLIC
    : StellarSdk.Networks.TESTNET;

// USDC issuer on Stellar (Circle's issuer)
const USDC_ISSUER =
  NETWORK === 'mainnet'
    ? 'GA5ZSEJYB37JRC5AVCIA5MOP4RHTM335X2KGX3IHOJAPP5RE34K4KZVN'
    : 'GBBD47IF6LWK7P7MDEVSCWR7DPUWV3NY3DTQEVFL4NAT4AQH3ZLLFLA5'; // testnet USDC

export const USDC = new StellarSdk.Asset('USDC', USDC_ISSUER);
export const XLM = StellarSdk.Asset.native();

export function generateMemo(paymentId: string): string {
  // Use first 28 chars of UUID (memo text limit is 28 bytes)
  return paymentId.replace(/-/g, '').substring(0, 28);
}

export async function getAccountInfo(publicKey: string) {
  try {
    return await server.loadAccount(publicKey);
  } catch {
    return null;
  }
}

export async function verifyPayment(payment: Payment): Promise<{
  verified: boolean;
  txHash?: string;
  ledger?: number;
}> {
  const { destination, amount, asset, memo } = payment;

  try {
    const payments = await server
      .payments()
      .forAccount(destination)
      .order('desc')
      .limit(50)
      .call();

    for (const record of payments.records) {
      if (record.type !== 'payment') continue;

      const p = record as StellarSdk.Horizon.ServerApi.PaymentOperationRecord;

      // Match asset
      const assetMatch =
        asset === 'XLM'
          ? p.asset_type === 'native'
          : p.asset_code === 'USDC' && p.asset_issuer === USDC_ISSUER;

      if (!assetMatch) continue;

      // Match amount (within 0.01% tolerance for rounding)
      const paidAmount = parseFloat(p.amount);
      const expectedAmount = parseFloat(amount);
      if (Math.abs(paidAmount - expectedAmount) / expectedAmount > 0.0001) continue;

      // Match memo
      const tx = await p.transaction();
      const txMemo = tx.memo?.toString() || '';
      if (txMemo !== memo) continue;

      return {
        verified: true,
        txHash: tx.hash,
        ledger: tx.ledger_attr,
      };
    }
  } catch (err) {
    console.error('Stellar verify error:', err);
  }

  return { verified: false };
}

// Poll pending payments and update their status
export async function pollPendingPayments() {
  const { rows } = await db.query<Payment>(
    `SELECT * FROM payments WHERE status = 'pending' AND expires_at > NOW()`
  );

  for (const payment of rows) {
    const result = await verifyPayment(payment);
    if (result.verified) {
      await db.query(
        `UPDATE payments SET status='completed', tx_hash=$1, ledger=$2, updated_at=NOW() WHERE id=$3`,
        [result.txHash, result.ledger, payment.id]
      );
      console.log(`Payment ${payment.id} completed: ${result.txHash}`);
    }
  }

  // Expire overdue payments
  await db.query(
    `UPDATE payments SET status='expired', updated_at=NOW()
     WHERE status='pending' AND expires_at <= NOW()`
  );
}

export async function buildPaymentTransaction(
  senderPublicKey: string,
  destinationPublicKey: string,
  amount: string,
  asset: 'XLM' | 'USDC',
  memo: string
): Promise<string> {
  const senderAccount = await server.loadAccount(senderPublicKey);
  const stellarAsset = asset === 'XLM' ? XLM : USDC;

  const tx = new StellarSdk.TransactionBuilder(senderAccount, {
    fee: StellarSdk.BASE_FEE,
    networkPassphrase,
  })
    .addOperation(
      StellarSdk.Operation.payment({
        destination: destinationPublicKey,
        asset: stellarAsset,
        amount,
      })
    )
    .addMemo(StellarSdk.Memo.text(memo))
    .setTimeout(300)
    .build();

  return tx.toXDR();
}
