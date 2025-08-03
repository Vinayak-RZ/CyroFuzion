// // submitOrderToStarknet.ts

// import { RpcProvider, Account, Contract, num, hash } from "starknet";
// import * as dotenv from "dotenv";
// dotenv.config();

// export type FusionOrder = {
//     orderId: string;          // e.g., '0xabc123'
//     secretHash: string;       // e.g., '0xdeadbeef...'
//     auctionStart: number;     // Unix timestamp
//     amount: string;           // In smallest unit (e.g., wei or raw tokens)
// };

// export async function submitOrderToStarknet(order: FusionOrder): Promise<string> {
//     console.log("🟣 Submitting order to Starknet:", order);

//     // Connect to provider (testnet or mainnet)
//     const provider = new RpcProvider({
//         nodeUrl: process.env.STARKNET_RPC_URL!,
//     });

//     // Relayer account (wallet)
//     const privateKey = process.env.STARKNET_PRIVATE_KEY!;
//     const accountAddress = process.env.STARKNET_ACCOUNT_ADDRESS!;

//     const account = new Account(provider, accountAddress, privateKey);

//     // Load escrow contract
//     const contractAddress = process.env.ESCROW_CONTRACT_ADDRESS!;
//     const abi = (await import("./abi/FusionDutchAuction.json")).default; // Cairo 1 contract ABI
//     const contract = new Contract(abi, contractAddress, account);

//     // Prepare calldata
//     const tx = await contract.create_order(
//         num.toHex(order.orderId),
//         num.toHex(order.secretHash),
//         order.auctionStart,
//         order.amount
//     );

//     console.log("✅ Starknet order submitted. TX Hash:", tx.transaction_hash);
//     return tx.transaction_hash;
// }
