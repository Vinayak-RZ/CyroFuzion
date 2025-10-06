import { ethers, Contract, Wallet, JsonRpcProvider, parseUnits } from "ethers";
import * as dotenv from "dotenv";
import FusionDutchAuction from "../abi/FusionDutchAuction.json" with { type: "json" };

dotenv.config();

export async function submitDutchOrderToEthereum(order: any): Promise<string> {
    const provider = new JsonRpcProvider(process.env.ETH_RPC_URL!);
    const wallet = new Wallet(process.env.ETH_PRIVATE_KEY!, provider);

    const contract = new Contract(
        process.env.ETH_AUCTION_CONTRACT_ADDRESS!,
        FusionDutchAuction,
        wallet
    );

    // Parse inputs
    const srcToken = order.srcToken;
    const amount = BigInt(order.amount); // e.g., "1000000000000000000"
    const auctionStart = Number(order.auctionStart); // Unix timestamp
    const startrate = BigInt(order.startrate);       // e.g., "1000"
    const minReturnAmount = BigInt(order.minReturnAmount);
    const decreaseRates = (order.decrease_rates || []).map((r: any) => BigInt(r));

    const tx = await contract.createOrder(
        srcToken,
        amount,
        auctionStart,
        startrate,
        minReturnAmount,
        decreaseRates
    );

    console.log("✅ Dutch order submitted:", tx.hash);
    return tx.hash;
}