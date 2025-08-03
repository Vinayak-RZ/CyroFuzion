import { WebSocketServer, WebSocket } from 'ws';
import { ethers } from 'ethers';
import dotenv from 'dotenv';

dotenv.config();

const auctionAbi = [
    "function getCurrentRate(bytes32 orderId) view returns (uint256)"
];

const provider = new ethers.JsonRpcProvider(process.env.ETH_RPC_URL);
const contract = new ethers.Contract(process.env.ETH_AUCTION_CONTRACT_ADDRESS!, auctionAbi, provider);

// Set up WebSocket server
export function createRateWebSocketServer(port: number = 8080) {
    const wss = new WebSocketServer({ port });

    console.log(`🌐 WebSocket server running at ws://localhost:${port}`);

    wss.on('connection', (ws: WebSocket) => {
        console.log('📡 Frontend connected to WebSocket');

        ws.on('message', async (msg) => {
            try {
                const { orderId } = JSON.parse(msg.toString());

                console.log(`📨 Received subscription for orderId: ${orderId}`);

                let count = 0;
                const interval = setInterval(async () => {
                    if (count >= 10 || ws.readyState !== WebSocket.OPEN) {
                        clearInterval(interval);
                        return;
                    }

                    try {
                        const rate = await contract.getCurrentRate(orderId);
                        ws.send(JSON.stringify({
                            orderId,
                            second: count,
                            rate: rate.toString(),
                        }));

                        count++;
                    } catch (err) {
                        console.error("❌ Failed to fetch rate:", err);
                        ws.send(JSON.stringify({ error: "Failed to fetch rate" }));
                    }
                }, 1000);
            } catch (err) {
                console.error("❌ Invalid message:", err);
                ws.send(JSON.stringify({ error: "Invalid message format" }));
            }
        });
    });
}
