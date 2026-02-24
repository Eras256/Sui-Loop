import { SuiClient, getFullnodeUrl } from '@mysten/sui/client';
import { Transaction } from '@mysten/sui/transactions';
import { Ed25519Keypair } from '@mysten/sui/keypairs/ed25519';
import { bcs } from '@mysten/sui/bcs';
import { broadcastLog } from './subscriptionService.js';

// Configuration
const SUI_NETWORK = process.env.SUI_NETWORK || 'testnet';
const suiClient = new SuiClient({ url: getFullnodeUrl(SUI_NETWORK as any) });

// Contract addresses (update to your deployed package ID)
const PACKAGE_ID = process.env.CONTRACT_PACKAGE_ID || '0x_YOUR_PACKAGE_ID';
const REGISTRY_ID = process.env.AGENT_REGISTRY_ID || '0x_YOUR_REGISTRY_ID';

export const agentRegistryService = {
    /**
     * Listen to on-chain SignalPublished events from other agents
     */
    subscribeToNetworkSignals: (onSignalReceived: (signal: any) => void) => {
        try {
            if (PACKAGE_ID === '0x_YOUR_PACKAGE_ID') {
                broadcastLog('info', 'Agent Registry sync skipped - missing PACKAGE_ID', { module: 'Registry' });
                return;
            }

            broadcastLog('system', 'Neural Matrix Sync Initialized — Subscribing to Agent Network Signals...', { module: 'Registry' });

            // We use the event subscription on the SuiClient
            suiClient.subscribeEvent({
                filter: {
                    MoveEventType: `${PACKAGE_ID}::agent_registry::SignalPublished`
                },
                onMessage: (event) => {
                    const parsedJson = event.parsedJson as any;
                    const agentId = parsedJson.agent_id;
                    const signalBytes = parsedJson.signal_data;
                    const timestamp = parsedJson.timestamp;

                    let decodedSignal = "Unknown";
                    try {
                        // Convert byte array to string
                        decodedSignal = new TextDecoder().decode(new Uint8Array(signalBytes));
                    } catch (e) { }

                    broadcastLog('system', `Neural Signal Intercepted [Agent ${agentId.slice(0, 8)}]: ${decodedSignal}`, {
                        module: 'Registry',
                        timestamp
                    });

                    onSignalReceived({
                        agentId,
                        signal: decodedSignal,
                        timestamp
                    });
                }
            });

        } catch (error) {
            console.error("Error subscribing to events", error);
        }
    },

    /**
     * Publish a signal to the on-chain agent network
     */
    publishSignalOnChain: async (signalData: string) => {
        try {
            const privateKeyHex = process.env.AGENT_PRIVATE_KEY;
            if (!privateKeyHex || PACKAGE_ID === '0x_YOUR_PACKAGE_ID') {
                broadcastLog('warn', 'Agent private key or PACKAGE_ID missing. Cannot publish signal on-chain.', { module: 'Registry' });
                return;
            }

            const keypair = Ed25519Keypair.fromSecretKey(privateKeyHex);
            const agentAddress = keypair.toSuiAddress();

            broadcastLog('info', `Publishing signal to network: ${signalData}`, { module: 'Registry' });

            const tx = new Transaction();

            // Convert string to bytes
            const signalBytes = new TextEncoder().encode(signalData);

            tx.moveCall({
                target: `${PACKAGE_ID}::agent_registry::publish_signal`,
                arguments: [
                    tx.object(REGISTRY_ID),
                    tx.pure.address(agentAddress),
                    tx.pure.vector('u8', Array.from(signalBytes)),
                    tx.object('0x6') // Clock object
                ]
            });

            const result = await suiClient.signAndExecuteTransaction({
                signer: keypair,
                transaction: tx,
                options: {
                    showEffects: true,
                }
            });

            if (result.effects?.status.status === 'success') {
                broadcastLog('success', `Signal published to blockchain! TX: ${result.digest}`, { module: 'Registry' });
                return result.digest;
            } else {
                throw new Error(result.effects?.status.error || 'Transaction failed');
            }

        } catch (error: any) {
            broadcastLog('error', `Failed to publish signal: ${error.message}`, { module: 'Registry' });
            return null;
        }
    }
};
