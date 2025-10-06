import { ethers } from "ethers";
import * as dotenv from "dotenv";
import FusionEscrow from "../abi/FusionDutchAuction.json" with { type: "json" };

dotenv.config();

export async function submitOrderToEthereum(order: any): Promise<string> {
    const provider = new ethers.JsonRpcProvider(process.env.ETH_RPC_URL!);
    const wallet = new ethers.Wallet(process.env.ETH_PRIVATE_KEY!, provider);

    const contract = new ethers.Contract(
        process.env.ETH_ESCROW_CONTRACT_ADDRESS!,
        FusionEscrow,
        wallet
    );

    const tx = await contract.createOrder(
        order.orderId,
        order.secretHash,
        order.auctionStart,
        order.amount
    );

    console.log("✅ ETH order submitted:", tx.hash);
    return tx.hash;
}
