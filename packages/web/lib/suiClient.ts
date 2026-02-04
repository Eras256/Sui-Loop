import { SuiClient } from "@mysten/sui/client";

export const suiClient = new SuiClient({
    url: process.env.NEXT_PUBLIC_SUI_RPC || "https://fullnode.testnet.sui.io:443"
});
