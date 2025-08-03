// poll-and-fund.ts
import { ethers } from "ethers";
import dotenv from "dotenv";
import EscrowAbi from "../abi/EscrowAbi.json" with { type: "json" }; // ⬅️ Ensure you have the correct ABI for your Escrow contract
import ERC20Abi from "../abi/erc20Abi.json" with { type: "json" }; // ⬅️ Ensure you have the correct ERC20 ABI

dotenv.config({ path: "../../.env" });
import { saveEscrowCreated } from "./informFrontend.ts";

const provider = new ethers.JsonRpcProvider(process.env.ETH_RPC_URL);
const signer = new ethers.Wallet(process.env.ESCROW_PRIVATE_KEY!, provider);

const escrowFactoryAddress = process.env.ESCROW_FACTORY_ADDRESS!;
const escrowAbi = [
    "event EscrowCreated(address indexed escrowAddress, address maker, address asset, uint256 amount, bytes32 hashlock, uint256 timelock)"
];
const escrowFactory = new ethers.Contract(escrowFactoryAddress, escrowAbi, provider);

// Helper to detect event logs
function isEventLog(log: ethers.Log | ethers.EventLog): log is ethers.EventLog {
    return "args" in log;
}

// Store last checked block
let lastBlock = 0;

async function pollEscrowEvents() {
    try {
        // const signerAddress = await signer.getAddress();
        // console.log(signerAddress, "signer address");
        const currentBlock = await provider.getBlockNumber();
        if (lastBlock === 0) lastBlock = currentBlock;

        console.log(`🧪 Checking blocks ${lastBlock} → ${currentBlock}`);
        const logs = await escrowFactory.queryFilter("EscrowCreated", lastBlock, currentBlock);
        lastBlock = currentBlock + 1;

        for (const log of logs) {
            if (!isEventLog(log)) continue;
            const { escrowAddress, maker, asset, amount, hashlock, timelock } = log.args!;

            // 🟢 Define token instance here before using it
            const token = new ethers.Contract(asset, ERC20Abi, signer);
            const allowance = await token.allowance(maker, escrowAddress); // maker is already an address
            console.log("Allowance given to escrow:", allowance.toString());

            console.log("🟣 EscrowCreated:");
            console.log("  escrowAddress:", escrowAddress);
            console.log("  maker:", maker);
            console.log("  asset:", asset);
            console.log("  amount:", amount.toString());
            console.log("  hashlock:", hashlock);
            console.log("  timelock:", timelock.toString());
            console.log("  txHash:", log.transactionHash);

            await saveEscrowCreated({
                orderId: log.transactionHash, // your generated order ID
                amount: amount.toString(),
                status: 'created', // or 'pending', depending on your flow
                createdAt: Date.now(),
            });

            const signerAddress = await signer.getAddress();
            console.log(signerAddress, maker, "signer address and maker address");
            if (signerAddress.toLowerCase() !== maker.toLowerCase()) {
                console.log("⏭️ Not the maker, skipping fund step");
                continue;
            }

            await approveAndFund(escrowAddress, asset, amount);
        }

    } catch (err: any) {
        console.error("⚠️ Error polling:", err.message);
    }
}

async function approveAndFund(escrowAddress: string, assetAddress: string, amount: bigint) {
    try {
        console.log("🔐 Approving tokens...");
        const token = new ethers.Contract(assetAddress, ERC20Abi, signer);
        const approveTx = await token.approve(escrowAddress, amount);
        await approveTx.wait();
        console.log("✅ Tokens approved");

        console.log("💰 Funding escrow...");
        const escrow = new ethers.Contract(escrowAddress, EscrowAbi, signer);
        const fundTx = await escrow.fund();
        await fundTx.wait();
        console.log("✅ Escrow funded!");
    } catch (err: any) {
        console.error("❌ Error funding escrow:", err.message);
    }
}

setInterval(pollEscrowEvents, 10_000);
console.log("📡 Polling for EscrowCreated events...");
