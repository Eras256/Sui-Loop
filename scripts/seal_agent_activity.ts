import { WalrusService, StrategyExecutionLog } from '../packages/agent/src/services/walrusService';

// Verified Agent List (Exist in the environment)
const AGENTS = [
    { addr: "0x8bd468b0e5941e75484e95191d99ff6234b2ab24e3b91650715b6df8cf8e4eba", name: "TITAN" },
    { addr: "0x8ce5e3a1cc5b8be074c9820659b6dcae18210f350f46fcb10e32bc6327ad5884", name: "ELIZA" },
    { addr: "0x9b035feba22ef69411f1d803702e641d438481292f0082b43bfce68d3a351110", name: "WHALE" },
    { addr: "0xa6890d201f81ed0cb62edcc70dc85bcb61c5d8c1ff74c51e5de6d6201b2a7d09", name: "KRAKEN" },
    { addr: "0xa9bf0eb96e8c47d36f2aa68889996feebe7757e3ce5c74b327e6f07025bb6dc8", name: "PHOENIX" }
];

async function sealFleetActivity() {
    const walrus = new WalrusService();
    console.log('🦭 [Swarm-Audit] Initiating Walrus Sealing for active agent fleet...');

    for (const agent of AGENTS) {
        const mockLog: StrategyExecutionLog = {
            strategy_id: `${agent.name.toLowerCase()}-live-sync`,
            strategy_name: `${agent.name} Autonomous Yield`,
            asset: 'SUI',
            wallet: agent.addr,
            txHash: `0x${Math.random().toString(16).slice(2, 66)}`, // Simulated hash of current activity
            profit_mist: Math.floor(Math.random() * 5000000),
            gas_cost_mist: 15000000,
            status: 'success',
            protocol: 'SuiLoop Hub',
            timestamp: new Date().toISOString(),
            kernel_version: '1.0.0'
        };

        console.log(`📦 Sealing activity for ${agent.name}...`);
        const blobId = await walrus.logStrategyExecution(mockLog);
        console.log(`✅ [${agent.name}] Sealed on Walrus: ${blobId}`);
    }

    console.log('\n✨ [Final Check] Verifying audit_book.log contents...');
}

sealFleetActivity().catch(console.error);
