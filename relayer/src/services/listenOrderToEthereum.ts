import { ethers } from "ethers";
import CoreOrderFactoryABI from "../abi/CoreOrderFactory.json" with { type: "json" };
import { storeBaseOrderInfo, updateOrderFilled } from "../sqlite-db/orderStore.ts";

const provider = new ethers.JsonRpcProvider(process.env.ETH_RPC_URL);
const contract = new ethers.Contract(process.env.ETH_ORDER_FACTORY!, CoreOrderFactoryABI, provider);

export function listenToEthereumOrders() {
    contract.on("OrderVerified", async (
        suiAsset,
        crossChainRecipient,
        maker,
        takerAsset,
        makingAmount,
        takingAmount,
        event
    ) => {
        const orderId = event.transactionHash;

        await storeBaseOrderInfo({
            orderId,
            maker,
            resolverAddress: crossChainRecipient,
            suiAsset,
            takerAsset,
            makingAmount: makingAmount.toString(),
            takingAmount: takingAmount.toString(),
            verified: true,
        });
    });

    contract.on("OrderFilled", async (
        orderId,
        filledAmount,
        event
    ) => {
        try {
            await updateOrderFilled(orderId); // no resolverAddress needed here
        } catch (err) {
            console.error(`❌ Error updating order:`, err);
        }
    });

}

export async function startListening() {
    console.log("🔊 Listening for Ethereum orders...");
    listenToEthereumOrders();
}
