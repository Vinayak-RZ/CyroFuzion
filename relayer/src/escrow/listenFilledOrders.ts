import { ethers } from "ethers";
import dotenv from "dotenv";
dotenv.config({ path: "../../.env" });

console.log("ETH_RPC_URL:", process.env.ETH_RPC_URL);
console.log("LAP_CONTRACT_ADDRESS:", process.env.LAP_CONTRACT_ADDRESS);

import { Log, EventLog } from "ethers";
import { createEscrow } from "./createEscrow.ts";
import { initEscrowDb, initDb } from "../sqlite-db/db.ts";

import { saveOrderFilled, saveOrderVerified } from "../escrow/informFrontend.ts";

function isEventLog(log: Log | EventLog): log is EventLog {
    return "args" in log;
}

const fusionAbi = [
    "event OrderFilled(bytes32 orderHash, uint256 remainingAmount)",
    "event OrderVerified(bytes32 suiAsset, bytes32 crossChainRecipient, address maker, address takerAsset, uint256 makingAmount, uint256 takingAmount)"
];

const provider = new ethers.JsonRpcProvider(process.env.ETH_RPC_URL); // ✅ still HTTP
const fusionAddress = process.env.LAP_CONTRACT_ADDRESS!;

const fusionContract = new ethers.Contract(fusionAddress, fusionAbi, provider);

// Store the last block checked
let lastBlock = 0;
let initialized = false;

async function pollEvents() {
    if (!initialized) {
        await initDb();
        await initEscrowDb();
        initialized = true;
    }

    const currentBlock = await provider.getBlockNumber();
    if (lastBlock === 0) {
        lastBlock = currentBlock - 1;
    }

    const filledLogs = await fusionContract.queryFilter("OrderFilled", lastBlock + 1, currentBlock);
    for (const log of filledLogs) {
        if (!isEventLog(log)) continue;
        const { orderHash, remainingAmount } = log.args;
        console.log("🟢 OrderFilled:", orderHash);
        await saveOrderFilled({
            orderHash,
            remainingAmount: remainingAmount.toString(),
            txHash: log.transactionHash,
            createdAt: Date.now()
        });
    }

    const verifiedLogs = await fusionContract.queryFilter("OrderVerified", lastBlock + 1, currentBlock);
    for (const log of verifiedLogs) {
        if (!isEventLog(log)) continue;
        const {
            suiAsset,
            crossChainRecipient,
            maker,
            takerAsset,
            makingAmount,
            takingAmount,
        } = log.args!;
        console.log("🔵 OrderVerified:", maker);
        await createEscrow({
            maker,
            asset: takerAsset,
            amount: makingAmount,
            hashlock: ethers.keccak256("0x1234abcd"),
            timelock: Math.floor(Date.now() / 1000) + 3600,
        });
        await saveOrderVerified({
            suiAsset,
            crossChainRecipient,
            maker,
            takerAsset,
            makingAmount: makingAmount.toString(),
            takingAmount: takingAmount.toString(),
            txHash: log.transactionHash,
            createdAt: Date.now()
        });
    }

    lastBlock = currentBlock;
}

// ✅ Call once, then set interval
pollEvents()
    .then(() => {
        console.log("📡 Polling for events using HTTP every 10s...");
        setInterval(() => pollEvents().catch(console.error), 10_000);
    })
    .catch(console.error);
