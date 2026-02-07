import { SuiClient } from "@mysten/sui/client";

export const suiClient = new SuiClient({
    // Using Alchemy as requested for high stability
    url: process.env.NEXT_PUBLIC_SUI_RPC || "https://sui-testnet.g.alchemy.com/v2/Qe-5Lnujo25_nTzFwXwor"
});
