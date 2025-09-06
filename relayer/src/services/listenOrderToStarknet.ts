import { RpcProvider } from "starknet";

const provider = new RpcProvider({ nodeUrl: process.env.STARKNET_RPC_URL });
const STARKNET_ORDER_FACTORY = process.env.STRK_ORDER_FACTORY;

export async function pollStarknetOrders() {
    const latestBlock = await provider.getBlockLatestAccepted();

    const result = await provider.getEvents({
        address: STARKNET_ORDER_FACTORY!,
        from_block: { block_number: latestBlock.block_number - 20 },
        to_block: { block_number: latestBlock.block_number },
        keys: [],
        chunk_size: 100,
    });

    const events = result.events;
    for (const event of events) {
        console.log("📦 Event:", event);
    }
}
