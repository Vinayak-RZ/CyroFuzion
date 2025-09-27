// utils/computeAuctionOrderId.ts
import { ethers } from "ethers";
import * as dotenv from "dotenv";
import FusionDutchAuction from "../abi/FusionDutchAuction.json" with { type: "json" };

dotenv.config();

const ETH_AUCTION_CONTRACT_ADDRESS = process.env.ETH_AUCTION_CONTRACT_ADDRESS!;
if (!ETH_AUCTION_CONTRACT_ADDRESS) {
    throw new Error("Missing ETH_AUCTION_CONTRACT_ADDRESS in .env");
}

export async function computeAuctionOrderId({
    srcToken,
    amount,
    auctionStart,
    startrate,
    minReturnAmount,
    decrease_rates,
}: {
    srcToken: string;
    amount: bigint;
    auctionStart: number;
    startrate: bigint;
    minReturnAmount: bigint;
    decrease_rates: bigint[];
}): Promise<string> {
    const provider = new ethers.JsonRpcProvider(process.env.ETH_RPC_URL!);
    const wallet = new ethers.Wallet(process.env.ETH_PRIVATE_KEY!, provider);

    const contract = new ethers.Contract(
        process.env.ETH_AUCTION_CONTRACT_ADDRESS!,
        FusionDutchAuction,
        wallet
    );

    // ✅ Correct callStatic usage in Ethers v6
    const createOrderFn = contract.getFunction("createOrder");
    const orderId = await createOrderFn.staticCall(
        srcToken,
        amount,
        auctionStart,
        startrate,
        minReturnAmount,
        decrease_rates
    );

    return orderId; // Should be a bytes32 string
}
