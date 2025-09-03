export const supportedChains = {
    1: {
        name: "Ethereum Mainnet",
        rpcUrl: process.env.ETH_RPC_URL!,
        nativeSymbol: "ETH",
    },
    9004: {
        name: "Starknet Mainnet",
        rpcUrl: process.env.STRK_RPC_URL!,
        nativeSymbol: "STRK",
    },
} as const;

// Convert object keys (which are strings) into number[]
export const supportedChainIds = Object.keys(supportedChains).map(Number);
