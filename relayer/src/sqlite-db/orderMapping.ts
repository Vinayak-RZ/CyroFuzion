import { getDb } from './db.ts'; // or wherever you init DB

export async function getAuctionOrderId(orderId: string): Promise<string> {
    const db = getDb();
    const result = await db.get('SELECT auctionOrderId FROM dutch_auctions WHERE orderId = ?', orderId);

    if (!result || !result.auctionOrderId) {
        throw new Error(`Auction orderId not found for orderId: ${orderId}`);
    }

    return result.auctionOrderId;
}
