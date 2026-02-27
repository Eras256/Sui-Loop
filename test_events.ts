import { SuiClient, getFullnodeUrl } from '@mysten/sui/client';
import * as dotenv from 'dotenv';
dotenv.config({ path: 'packages/agent/.env' });

async function main() {
    const client = new SuiClient({ url: getFullnodeUrl('testnet') });
    const PACKAGE_ID = process.env.VITE_PACKAGE_ID || process.env.SUI_PACKAGE_ID || "0x945163568d75adf1cb3c1f7d1a197e4a903fd6ba3f807a4421cfa9f563f0dcb0";
    console.log("Using package", PACKAGE_ID);
    const regEvents = await client.queryEvents({
        query: { MoveEventType: `${PACKAGE_ID}::agent_registry::AgentRegistered` },
        limit: 100
    }).catch((e) => { console.error(e); return { data: [] }});
    console.log("Found", regEvents.data.length, "registered agents on chain");
}
main();
