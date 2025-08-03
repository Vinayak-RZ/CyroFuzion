import { Contract, Wallet, JsonRpcProvider } from "ethers";
import * as dotenv from "dotenv";
import FusionDutchAuction from "../abi/FusionDutchAuction.json" with { type: "json" };

dotenv.config();

export async function submitDutchOrder(order: {
    srcToken: string;
    amount: bigint;
    auctionStart: number;
    startRate: bigint;
    minReturnAmount: bigint;
    decreaseRates: bigint[];
}): Promise<string> {
    const provider = new JsonRpcProvider(process.env.ETH_RPC_URL!);
    const wallet = new Wallet(process.env.ETH_PRIVATE_KEY!, provider);

    const contract = new Contract(
        process.env.ETH_AUCTION_CONTRACT_ADDRESS!,
        FusionDutchAuction,
        wallet
    );

    const tx = await contract.createOrder(
        order.srcToken,
        order.amount,
        order.auctionStart,
        order.startRate,
        order.minReturnAmount,
        order.decreaseRates
    );

    console.log("✅ Dutch order submitted:", tx.hash);
    return tx.hash;
}
