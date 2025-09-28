import { ethers } from 'ethers';
import { SqliteDB } from './db'; // your SQLite setup
// import { FusionDutchAuction__factory } from './types'; // if using typechain

const provider = new ethers.JsonRpcProvider(process.env.ETH_RPC_URL);
const signer = new ethers.Wallet(process.env.RELAYER_PK!, provider);

const auction = new ethers.Contract(
    process.env.ETH_AUCTION_CONTRACT_ADDRESS!,
    [
        "event OrderCreated(bytes32 indexed orderId, address indexed user, address indexed srcToken, uint256 amount, uint256 auctionStart, uint256 startrate, uint256 minReturnAmount, uint256[] decrease_rates)",
        "function createOrder(address,uint256,uint256,uint256,uint256,uint256[])"
    ],
    signer
);

// args from your backend
const tx = await auction.createOrder(
    srcToken,
    amount,
    auctionStart,
    startrate,
    minReturnAmount,
    decreaseRates
);

console.log("📤 Transaction sent:", tx.hash);

const receipt = await tx.wait();
console.log("📬 Mined in block:", receipt.blockNumber);

// Extract OrderCreated event
const event = receipt.logs
    .map(log => {
        try {
            return auction.interface.parseLog(log);
        } catch (err) {
            return null;
        }
    })
    .find(log => log && log.name === "OrderCreated");

if (!event) {
    throw new Error("OrderCreated event not found");
}

const auctionOrderId = event.args.orderId;
console.log("🆔 Order ID:", auctionOrderId);

// Save to SQLite
await db.insertOrder({
    ...yourExistingFields,
    auctionOrderId: auctionOrderId
});
