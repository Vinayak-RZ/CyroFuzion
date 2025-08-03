import { WebSocketServer, WebSocket } from 'ws';
import dotenv from 'dotenv';
import { getAuctionOrderId } from '../sqlite-db/orderMapping.ts';
import { getDb } from '../sqlite-db/db.ts';
import { formatUnits } from 'ethers';

dotenv.config();

export async function getOrderMetadata(orderId: string): Promise<{
    amount: bigint;
    minReturnAmount: bigint;
}> {
    const db = getDb();

    const row = await db.get(`
        SELECT amount, minReturnAmount
        FROM dutch_auctions
        WHERE orderId = ?
    `, orderId);

    if (!row) {
        throw new Error(`Order not found in DB: ${orderId}`);
    }

    return {
        amount: BigInt(row.amount),
        minReturnAmount: BigInt(row.minReturnAmount),
    };
}

export function createRateWebSocketServer(port: number = 8080) {
    const wss = new WebSocketServer({ port });

    console.log(`🌐 WebSocket server running at ws://localhost:${port}`);

    wss.on('connection', (ws: WebSocket) => {
        console.log('📡 Frontend connected to WebSocket');

        ws.on('message', async (msg) => {
            try {
                const { orderId } = JSON.parse(msg.toString());
                console.log(`📨 Received subscription for orderId: ${orderId}`);

                // You can still look up auctionOrderId if needed for logging
                const auctionOrderId = await getAuctionOrderId(orderId);
                console.log(`🔎 Matched auctionOrderId: ${auctionOrderId}`);

                const { amount, minReturnAmount } = await getOrderMetadata(orderId);
                const startRate = amount * 25000n; // base start rate (hardcoded logic)

                const steps = 10n;
                const rateStep = (startRate - minReturnAmount) / steps;

                let count = 0n;
                const interval = setInterval(() => {
                    if (count >= steps || ws.readyState !== WebSocket.OPEN) {
                        clearInterval(interval);
                        return;
                    }

                    const simulatedRate = startRate - rateStep * count;
                    const finalRate = simulatedRate > minReturnAmount ? simulatedRate : minReturnAmount;

                    ws.send(JSON.stringify({
                        orderId,
                        second: Number(count),
                        rate: formatUnits(finalRate, 0),
                    }));


                    count++;
                }, 1000);

            } catch (err) {
                console.error("❌ Error handling message:", err);
                ws.send(JSON.stringify({ error: "Invalid message or orderId" }));
            }
        });
    });
}
