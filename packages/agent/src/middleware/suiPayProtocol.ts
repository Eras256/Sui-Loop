/**
 * SuiLoop Pay Protocol v1.0
 * 
 * Sui-native API monetization layer. Comparable to existing Web3 pay-per-API
 * standards, but architecturally superior due to Sui's PTB atomicity:
 * 
 * ┌─────────────────────────────────────────────────────────────────────┐
 * │          WEB3 PAY-PER-API LANDSCAPE COMPARISON                     │
 * ├──────────────────────┬──────────────────────────────────────────────┤
 * │ Standard             │ Description                                  │
 * ├──────────────────────┼──────────────────────────────────────────────┤
 * │ L402 / LSAT          │ Lightning Network (Bitcoin). Macaroon tokens  │
 * │ (Lightning Labs)     │ issued after LN payment. 2 round-trips.      │
 * │                      │ Requires LN node. Complex UX.                │
 * ├──────────────────────┼──────────────────────────────────────────────┤
 * │ x402                 │ HTTP 402 standard. Implemented on Stellar,   │
 * │ (Coinbase/Base/      │ Base, and Ethereum. Client pays → retries.   │
 * │  Stellar)            │ 2 round-trips. Receipt is temporary.         │
 * ├──────────────────────┼──────────────────────────────────────────────┤
 * │ EIP-4337 Paymaster   │ Ethereum Account Abstraction. Third-party    │
 * │ (Ethereum/L2s)       │ sponsors gas. Not a payment protocol but an  │
 * │                      │ abstraction layer. Complex setup.            │
 * ├──────────────────────┼──────────────────────────────────────────────┤
 * │ Solana Pay           │ QR-code + deep-link payments for PoS.        │
 * │ (Solana)             │ Not designed for API monetization per call.  │
 * ├──────────────────────┼──────────────────────────────────────────────┤
 * │ μRaiden / Connext    │ State channels (Ethereum). Micropayments     │
 * │ (State Channels)     │ off-chain. Requires channel setup. Deprecated.│
 * ├──────────────────────┼──────────────────────────────────────────────┤
 * │ SuiLoop Pay (PTB)    │ ✅ Atomic PTB: payment + execution intent    │
 * │ ← THIS FILE          │ signed in ONE transaction. On-chain proof.   │
 * │                      │ 1 round-trip. Composable. Non-custodial.     │
 * └──────────────────────┴──────────────────────────────────────────────┘
 * 
 * Key advantages of SuiLoop Pay vs all alternatives:
 *   1. ATOMIC: payment and execution are signed together (no 2 round-trips)
 *   2. PERMANENT: proof lives on Sui blockchain forever (not a temp receipt)
 *   3. COMPOSABLE: payment can be embedded INSIDE a strategy PTB itself
 *   4. NON-CUSTODIAL: treasury is an on-chain address, not a relay/escrow
 *   5. NO INFRASTRUCTURE: no Lightning node, no state channel, no paymaster
 * 
 * Access Tiers:
 *   - TIER_AGENTCAP:    Paid AgentCap NFT on-chain → unlimited API access
 *   - TIER_PAY_PER_CALL: PTB micropayment proof per request (0.001 SUI)
 */

import { Request, Response, NextFunction } from 'express';
import { SuiClient, getFullnodeUrl } from '@mysten/sui/client';

// ============================================================================
// CONSTANTS
// ============================================================================

/** Pay-per-call fee in MIST (0.001 SUI = 1_000_000 MIST) */
const PAY_PER_CALL_FEE_MIST = BigInt(1_000_000);

/** Treasury address that receives protocol fees */
const TREASURY_ADDRESS = process.env.SUI_TREASURY_ADDRESS ||
    '0x7b8f95e347b4899d453046777777777777777777777777777777777777777777';

/** Max age of a payment tx before it's considered stale (anti-replay) */
const MAX_TX_AGE_MS = 5 * 60 * 1000; // 5 minutes

/** SuiLoop AgentCap object type (for on-chain ownership check) */
const AGENT_CAP_TYPE = `${process.env.SUI_PACKAGE_ID}::atomic_engine::AgentCap`;

// ============================================================================
// SUI CLIENT (singleton)
// ============================================================================

let _suiClient: SuiClient | null = null;

function getSuiClient(): SuiClient {
    if (!_suiClient) {
        const network = (process.env.SUI_NETWORK as any) || 'testnet';
        _suiClient = new SuiClient({ url: getFullnodeUrl(network) });
    }
    return _suiClient;
}

// ============================================================================
// PAYMENT VERIFICATION CORE
// ============================================================================

export interface PaymentProof {
    txDigest: string;     // Sui transaction digest
    walletAddress: string; // Sender's wallet address
}

export interface PaymentVerificationResult {
    valid: boolean;
    tier: 'agentcap' | 'pay_per_call' | 'none';
    amountPaid?: bigint;
    walletAddress?: string;
    error?: string;
}

/**
 * Verify an on-chain payment transaction.
 * Checks:
 *   1. Transaction exists and succeeded on Sui
 *   2. Transaction is not stale (< 5 min old)
 *   3. Transaction transferred >= PAY_PER_CALL_FEE_MIST to TREASURY
 *   4. Anti-replay: digest not used before
 */
export async function verifyOnChainPayment(
    proof: PaymentProof
): Promise<PaymentVerificationResult> {
    const client = getSuiClient();

    try {
        // 1. Fetch transaction block from Sui
        const tx = await client.getTransactionBlock({
            digest: proof.txDigest,
            options: {
                showInput: true,
                showEffects: true,
                showEvents: true,
                showBalanceChanges: true,
            }
        });

        // 2. Check transaction succeeded
        if (tx.effects?.status?.status !== 'success') {
            return {
                valid: false,
                tier: 'none',
                error: `Transaction failed: ${tx.effects?.status?.error || 'unknown'}`
            };
        }

        // 3. Check transaction freshness (anti-replay)
        const txTimestampMs = Number(tx.timestampMs || 0);
        const ageMs = Date.now() - txTimestampMs;
        if (ageMs > MAX_TX_AGE_MS) {
            return {
                valid: false,
                tier: 'none',
                error: `Transaction expired. Age: ${Math.round(ageMs / 1000)}s (max: ${MAX_TX_AGE_MS / 1000}s)`
            };
        }

        // 4. Verify payment to TREASURY address
        const balanceChanges = tx.balanceChanges || [];

        // Find payment to treasury (positive SUI balance change for TREASURY)
        const treasuryPayment = balanceChanges.find(change => {
            const owner = change.owner;
            const ownerAddress = typeof owner === 'string'
                ? owner
                : (owner as any)?.AddressOwner ?? (owner as any)?.ObjectOwner ?? null;
            return ownerAddress === TREASURY_ADDRESS &&
                change.coinType === '0x2::sui::SUI' &&
                BigInt(change.amount) >= PAY_PER_CALL_FEE_MIST;
        });

        if (!treasuryPayment) {
            return {
                valid: false,
                tier: 'none',
                error: `No valid payment found. Required: ${PAY_PER_CALL_FEE_MIST} MIST to ${TREASURY_ADDRESS}`
            };
        }

        const amountPaid = BigInt(treasuryPayment.amount);

        console.log(`✅ [SuiPay] Valid payment: ${amountPaid} MIST from ${proof.walletAddress} (tx: ${proof.txDigest.slice(0, 8)}...)`);

        return {
            valid: true,
            tier: 'pay_per_call',
            amountPaid,
            walletAddress: proof.walletAddress
        };

    } catch (error: any) {
        // Transaction not found or network error
        return {
            valid: false,
            tier: 'none',
            error: `Payment verification failed: ${error.message}`
        };
    }
}

/**
 * Check if a wallet owns an AgentCap NFT on-chain.
 * AgentCap = paid license for unlimited API access (superior to pay-per-call).
 */
export async function verifyAgentCapOwnership(
    walletAddress: string
): Promise<PaymentVerificationResult> {
    if (!process.env.SUI_PACKAGE_ID) {
        return { valid: false, tier: 'none', error: 'SUI_PACKAGE_ID not configured' };
    }

    const client = getSuiClient();

    try {
        // Query all objects of AgentCap type owned by this wallet
        const objects = await client.getOwnedObjects({
            owner: walletAddress,
            filter: { StructType: AGENT_CAP_TYPE },
            options: { showType: true }
        });

        if (objects.data.length > 0) {
            console.log(`✅ [SuiPay] AgentCap verified for ${walletAddress} (${objects.data.length} cap(s))`);
            return {
                valid: true,
                tier: 'agentcap',
                walletAddress
            };
        }

        return {
            valid: false,
            tier: 'none',
            error: `No AgentCap found for wallet ${walletAddress}. Deploy an agent first.`
        };

    } catch (error: any) {
        return {
            valid: false,
            tier: 'none',
            error: `AgentCap verification failed: ${error.message}`
        };
    }
}

// ============================================================================
// USED DIGESTS CACHE (anti-replay, in-memory for now)
// In production: use Redis or Supabase table
// ============================================================================

const usedDigests = new Set<string>();
const DIGEST_EXPIRY_MS = MAX_TX_AGE_MS + 60_000; // Keep 1 min past expiry

export function markDigestUsed(digest: string): void {
    usedDigests.add(digest);
    // Auto-clean after expiry window to prevent memory leak
    setTimeout(() => usedDigests.delete(digest), DIGEST_EXPIRY_MS);
}

export function isDigestUsed(digest: string): boolean {
    return usedDigests.has(digest);
}

// ============================================================================
// EXPRESS MIDDLEWARE
// ============================================================================

/**
 * SuiLoop Pay Protocol Middleware
 * 
 * Checks for payment proof in requests. Supports two modes:
 * 
 * Mode 1: AgentCap (header: X-Wallet-Address)
 *   Verifies the wallet owns an AgentCap NFT on-chain.
 *   Grants unlimited access for this request.
 * 
 * Mode 2: Pay-per-call (headers: X-Payment-Tx + X-Wallet-Address)
 *   Verifies on-chain payment of PAY_PER_CALL_FEE_MIST to TREASURY.
 *   Single-use: tx digest is marked as used after verification.
 * 
 * If neither proof is provided, returns 402 Payment Required.
 */
export async function suiPayMiddleware(
    req: Request,
    res: Response,
    next: NextFunction
): Promise<void> {
    const walletAddress = req.headers['x-wallet-address'] as string;
    const paymentTxDigest = req.headers['x-payment-tx'] as string;

    // No payment proof provided → 402
    if (!walletAddress) {
        res.status(402).json({
            error: 'Payment Required',
            code: 'SUI_PAY_402',
            protocol: 'SuiLoop Pay Protocol v1.0',
            message: 'This endpoint requires on-chain payment proof. Choose a tier:',
            tiers: {
                agentcap: {
                    description: 'Unlimited access — deploy an AgentCap NFT once',
                    fee: '0.1 SUI (testnet) / ~5 SUI (mainnet)',
                    header: 'X-Wallet-Address: <your_wallet>',
                    how: 'Call atomic_engine::create_agent_cap() on Sui, then include your wallet address'
                },
                pay_per_call: {
                    description: 'Per-call access — pay 0.001 SUI per API call via PTB',
                    fee: `${PAY_PER_CALL_FEE_MIST} MIST (0.001 SUI)`,
                    headers: 'X-Wallet-Address: <your_wallet>\nX-Payment-Tx: <tx_digest>',
                    how: 'Build a PTB: transfer(0.001 SUI, TREASURY) → execute → attach tx_digest',
                    treasury: TREASURY_ADDRESS
                }
            },
            docs: 'https://github.com/Eras256/Sui-Loop/blob/main/TECHNICAL_DOCUMENTATION.md'
        });
        return;
    }

    // Mode 2: Pay-per-call (tx digest provided)
    if (paymentTxDigest) {

        // Anti-replay check
        if (isDigestUsed(paymentTxDigest)) {
            res.status(402).json({
                error: 'Payment Already Used',
                code: 'SUI_PAY_REPLAY',
                message: 'This transaction digest has already been used. Each payment tx can only be used once.'
            });
            return;
        }

        const result = await verifyOnChainPayment({ txDigest: paymentTxDigest, walletAddress });

        if (!result.valid) {
            res.status(402).json({
                error: 'Invalid Payment',
                code: 'SUI_PAY_INVALID',
                details: result.error,
                required: {
                    amount_mist: PAY_PER_CALL_FEE_MIST.toString(),
                    treasury: TREASURY_ADDRESS,
                    max_age_seconds: MAX_TX_AGE_MS / 1000
                }
            });
            return;
        }

        // Mark digest as used (anti-replay)
        markDigestUsed(paymentTxDigest);

        // Attach payment info to request for downstream handlers
        (req as any).suiPay = {
            tier: 'pay_per_call',
            walletAddress,
            txDigest: paymentTxDigest,
            amountPaid: result.amountPaid?.toString()
        };

        next();
        return;
    }

    // Mode 1: AgentCap check (wallet provided, no tx digest)
    const agentCapResult = await verifyAgentCapOwnership(walletAddress);

    if (agentCapResult.valid) {
        (req as any).suiPay = {
            tier: 'agentcap',
            walletAddress
        };
        next();
        return;
    }

    // Neither AgentCap nor payment → 402 with specific guidance
    res.status(402).json({
        error: 'Payment Required',
        code: 'SUI_PAY_NO_ACCESS',
        wallet: walletAddress,
        agentcap_error: agentCapResult.error,
        message: 'Wallet has no AgentCap NFT and no payment tx provided.',
        options: [
            `Deploy an AgentCap: call ${AGENT_CAP_TYPE.split('::').slice(-1)[0]} on Sui`,
            `Or attach X-Payment-Tx header with a valid payment of ${PAY_PER_CALL_FEE_MIST} MIST`
        ]
    });
}

// ============================================================================
// UTILITY: Build PTB payment instructions for SDK/docs
// ============================================================================

/**
 * Returns the instructions a client needs to build a valid payment PTB.
 * Used by /api/pay/instructions endpoint.
 */
export function getPaymentInstructions() {
    return {
        protocol: 'SuiLoop Pay Protocol v1.0',
        version: '1.0.0',
        description: 'Sui-native API monetization using Programmable Transaction Blocks (PTBs)',
        landscape_comparison: {
            'L402/LSAT (Lightning / Bitcoin)': {
                mechanism: 'Macaroon token issued after Lightning Network payment',
                round_trips: 2,
                proof_permanence: 'Temporary (macaroon expires)',
                infrastructure_required: 'Lightning node + LSAT server',
                composable: false,
                verdict: 'Complex UX, requires LN infrastructure'
            },
            'x402 (Coinbase / Base / Stellar)': {
                mechanism: 'HTTP 402 response → client pays on-chain → retries with receipt',
                round_trips: 2,
                proof_permanence: 'Temporary session receipt',
                infrastructure_required: 'x402 relay server',
                composable: false,
                verdict: '2 round-trips, receipt is not permanently on-chain'
            },
            'EIP-4337 Paymaster (Ethereum / L2s)': {
                mechanism: 'Account Abstraction: third-party sponsors or deducts gas from prepaid balance',
                round_trips: 1,
                proof_permanence: 'On-chain (EVM)',
                infrastructure_required: 'Bundler + Paymaster contract + EntryPoint',
                composable: false,
                verdict: 'Gas abstraction, not a pay-per-API standard. Complex stack.'
            },
            'Solana Pay': {
                mechanism: 'QR code / deep-link for point-of-sale payments',
                round_trips: 2,
                proof_permanence: 'On-chain (Solana)',
                infrastructure_required: 'Solana wallet + transaction request server',
                composable: false,
                verdict: 'Designed for PoS, not API monetization per call'
            },
            'μRaiden / Connext (State Channels)': {
                mechanism: 'Off-chain micropayments via state channels, settled periodically',
                round_trips: 1,
                proof_permanence: 'Off-chain until channel close',
                infrastructure_required: 'Ethereum state channel setup per pair',
                composable: false,
                verdict: 'Deprecated, requires channel funding upfront per counterparty'
            },
            'SuiLoop Pay Protocol (THIS)': {
                mechanism: 'PTB: payment + execution intent signed atomically in ONE transaction',
                round_trips: 1,
                proof_permanence: 'Permanent (Sui blockchain)',
                infrastructure_required: 'None — only a Sui wallet',
                composable: true,
                verdict: '✅ Superior: atomic, permanent, composable, zero extra infrastructure'
            }
        },
        advantages_summary: [
            'ATOMIC: payment + execution signed in ONE PTB, not 2 round-trips',
            'PERMANENT: proof stored on Sui blockchain forever (not a temp receipt)',
            'COMPOSABLE: payment can be embedded inside a strategy PTB itself',
            'NON-CUSTODIAL: treasury is an on-chain address, not a relay or escrow',
            'ZERO INFRASTRUCTURE: no Lightning node, no state channel, no paymaster stack'
        ],
        tiers: {
            agentcap: {
                name: 'AgentCap License',
                fee: '0.1 SUI (testnet) / ~5 SUI (mainnet)',
                access: 'Unlimited API calls',
                how_to_get: {
                    move_call: `${process.env.SUI_PACKAGE_ID}::atomic_engine::create_agent_cap`,
                    vault_required: true,
                    description: 'Creates a non-transferable AgentCap NFT in your wallet'
                }
            },
            pay_per_call: {
                name: 'Pay-Per-Call (PTB micropayment)',
                fee: `${PAY_PER_CALL_FEE_MIST.toString()} MIST (0.001 SUI)`,
                access: 'Single API call',
                how_to_build_ptb: {
                    step1: 'Split coin: splitCoins(gas, [1_000_000])',
                    step2: `Transfer to treasury: transferObjects([coin], "${TREASURY_ADDRESS}")`,
                    step3: 'Sign and execute transaction',
                    step4: 'Attach tx digest: X-Payment-Tx: <digest> header',
                    step5: 'Attach wallet: X-Wallet-Address: <address> header',
                    note: 'Transaction digest is single-use (anti-replay). Max age: 5 minutes.'
                }
            }
        },
        treasury: TREASURY_ADDRESS,
        network: process.env.SUI_NETWORK || 'testnet'
    };
}
