// src/services/createEscrow.ts

import { ethers, Log, LogDescription } from "ethers";
import dotenv from "dotenv";
dotenv.config({ path: "../../.env" });

// Load provider and signer
const provider = new ethers.JsonRpcProvider(process.env.ETH_RPC_URL);
const privateKey = process.env.ETH_PRIVATE_KEY!;
const signer = new ethers.Wallet(privateKey, provider);

// EscrowFactorySrc ABI
const escrowFactoryAbi = [
    "event EscrowCreated(address indexed escrowAddress, address maker, address asset, uint256 amount, bytes32 hashlock, uint256 timelock)",
    "function createEscrow(address maker, address asset, uint256 amount, bytes32 hashlock, uint256 timelock) external returns (address)"
];

// EscrowFactory contract address
const factoryAddress = process.env.ESCROW_FACTORY_ADDRESS!;

const escrowFactory = new ethers.Contract(factoryAddress, escrowFactoryAbi, signer);

/**
 * Calls EscrowFactorySrc.createEscrow() and returns the new Escrow contract address
 */
export async function createEscrow({
    maker,
    asset,
    amount,
    hashlock,
    timelock,
}: {
    maker: string;
    asset: string;
    amount: bigint;
    hashlock: string; // hex string
    timelock: number; // unix timestamp
}): Promise<string> {
    console.log("🚀 Creating Escrow:");
    console.log("  maker:", maker);
    console.log("  asset:", asset);
    console.log("  amount:", amount.toString());
    console.log("  hashlock:", hashlock);
    console.log("  timelock:", timelock);

    const tx = await escrowFactory.createEscrow(maker, asset, amount, hashlock, timelock);
    const receipt = await tx.wait();


    // Parse the EscrowCreated event
    const event = receipt.logs
        .map((log: Log) => {
            try {
                return escrowFactory.interface.parseLog(log);
            } catch {
                return null;
            }
        })
        .find((e: LogDescription) => e?.name === "EscrowCreated");

    if (!event) throw new Error("EscrowCreated event not found");

    const escrowAddress = event.args.escrowAddress;
    console.log("✅ Escrow Created at:", escrowAddress);
    return escrowAddress;
}
