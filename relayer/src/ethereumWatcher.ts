// detect when a new fusion+ order (escrow contract) has been created on ethereum
// connect to ethereum via web3
// track fusion+ escrow deployments or events
// filter only relevant events
// extract key order details : hashlock, timelock, amount, token, user address, etc
// pass that order to our callback in index.ts
// can use log polling or subscriptions
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';

// Web3 v4 imports
import { Web3 } from 'web3';
import { HttpProvider } from 'web3-providers-http';
import type { EventLog } from 'web3';

dotenv.config();

// Constants
const ETH_RPC_URL = process.env.ETH_RPC_URL!;
const CONTRACT_ADDRESS = process.env.FUSION_CONTRACT_ADDRESS!;

// Load ABI from JSON file
const ABI_PATH = path.join(__dirname, 'abi', 'FusionPlus.json');
const FUSION_ABI = JSON.parse(fs.readFileSync(ABI_PATH, 'utf8'));

// Initialize Web3
const provider = new HttpProvider(ETH_RPC_URL);
const web3 = new Web3(provider);

// Load contract instance
const fusionContract = new web3.eth.Contract(FUSION_ABI, CONTRACT_ADDRESS);
// creates a js object that lets your app interact with a smart contract deployed on ethereum

let lastBlockScanned: bigint = 0n;

async function watchFusionOrders() {
    const latestBlock = await web3.eth.getBlockNumber();

    const fromBlock = lastBlockScanned ? lastBlockScanned + 1n : latestBlock - 5n;

    console.log(`Check blocks ${fromBlock} to ${latestBlock}`);

    // OrderCreated is an event defined by the fusion+ contract our team is working with
    const events = await fusionContract.getPastEvents('OrderCreated', {
        fromBlock: fromBlock,
        toBlock: 'latest',
    });

    for (const event of events) {
        if (typeof event === 'object' && 'returnValues' in event) {
            const e = event as EventLog;
            // so that we can parse key order details
            const { orderId, secretHash, srcToken, dstChainId, amount } = e.returnValues;

            console.log(`New Order:, `, {
                orderId, secretHash, srcToken, dstChainId, amount
            });

            // (TODO) validate dstChain is cardano
            // (TODO) trigger cardano escrow logic
        }
    }

    // store last scanned block
    lastBlockScanned = latestBlock;
}

// poll loop every 5 seconds
// polling is still needed because smart contracts cant push data to our backend -- our backend must pull it
// also the .on('data') live subscription only works when we're using websockets, not a typical http rpc endpoint
setInterval(watchFusionOrders, 5000);

// if we want real time event listening instead of polling, we can use websocket provider
// dutch auction - orderfilled / ordercancelled, timelock not passed, , trigger equivalent logic on cardano side uxto escrow
// try-catch 
// deduplication?
// connect to index.ts