// src/events/pollOrderCreated.ts
import { ethers } from "ethers";
import dotenv from "dotenv";

dotenv.config();

export async function pollOrderCreated() {
    const auctionAbi = [
        "event OrderCreated(bytes32 indexed orderId, address indexed user, address indexed srcToken, uint256 amount, uint256 auctionStart, uint256 startrate, uint256 minReturnAmount, uint256[] decrease_rates)"
    ];

    const contractAddress = process.env.ETH_AUCTION_CONTRACT_ADDRESS!;
    const provider = new ethers.JsonRpcProvider(process.env.ETH_RPC_URL);
    const contract = new ethers.Contract(contractAddress, auctionAbi, provider);

    let lastBlock = await provider.getBlockNumber();

    console.log("🔁 Polling for OrderCreated events every 10s...");

    setInterval(async () => {
        try {
            const currentBlock = await provider.getBlockNumber();
            const events = await contract.queryFilter("OrderCreated", lastBlock + 1, currentBlock);
            lastBlock = currentBlock;
            for (const event of events) {
                if (!('args' in event) || !event.args) continue; // type guard for EventLog

                const {
                    orderId,
                    user,
                    srcToken,
                    amount,
                    auctionStart,
                    startrate,
                    minReturnAmount,
                    decrease_rates
                } = event.args;

                console.log("🎉 New OrderCreated:");
                console.log("🆔 Order ID:", orderId);
                console.log("📨 User:", user);

                const relayerURL = `http://localhost:4000/onchain/currentRate/${contractAddress}/${orderId}`;
                console.log("🌐 Fetching current rate from:", relayerURL);

                try {
                    const response = await fetch(relayerURL);
                    const data = await response.json();
                    console.log("📈 Current Rate:", data.rate);
                } catch (err) {
                    console.error("❌ Error fetching current rate:", err);
                }
            }

        } catch (err) {
            console.error("❌ Polling error:", err);
        }
    }, 10_000); // every 10 seconds
}
