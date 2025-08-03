export type OrderInfo = {
  orderId: string;
  secret?: string;
  secretHash?: string;
  resolverAddress?: string;
  auctionStart?: number;
  amount?: string;
  status?: string;
  createdAt?: string;
  maker?: string;
  suiAsset?: string;
  takerAsset?: string;
  minReturnAmount?: string;
  makingAmount?: string;
  takingAmount?: string;
  verified?: boolean;
};

export type DutchAuctionParams = {
  orderId: string;
  auctionOrderId: string;
  startRate: string;
  amount: string;
  minReturnAmount: string;
  decreaseRates: string;
};


import { getDb } from './db.ts';

export async function storeBaseOrderInfo(order: OrderInfo) {
  const db = getDb();

  await db.run(
    `
    INSERT OR REPLACE INTO orders (
      orderId, secret, secretHash, resolverAddress, auctionStart, amount, status, minReturnAmount,
      maker, suiAsset, takerAsset, makingAmount, takingAmount, verified
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `,
    [
      order.orderId,
      order.secret,
      order.secretHash,
      order.resolverAddress, // later
      order.auctionStart, // now
      order.amount, // from frontend
      order.status,
      order.minReturnAmount,
      order.maker, // wallet address
      order.suiAsset, // later
      order.takerAsset, // later
      order.makingAmount, // later
      order.takingAmount, // later
      order.verified ?? true,
    ]
  );

  console.log(`📦 Stored base order ${order.orderId}`);
}

export async function storeDutchAuctionParams(
  auction: DutchAuctionParams
) {
  const db = getDb();

  // Store auction params
  await db.run(
    `
    INSERT OR REPLACE INTO dutch_auctions (
      orderId, auctionOrderId, amount, startRate, minReturnAmount, decreaseRates
    ) VALUES (?, ?, ?, ?, ?, ?)
    `,
    [
      auction.orderId,
      auction.auctionOrderId,
      auction.amount,
      auction.startRate,
      auction.minReturnAmount,
      auction.decreaseRates,
    ]
  );

  // Update order status to 'auctioned'
  const result = await db.run(
    `
    UPDATE orders
    SET status = ?
    WHERE orderId = ?
    `,
    ['auctioned', auction.orderId]
  );

  if (result.changes === 0) {
    throw new Error(`Order ${auction.orderId} not found to update status`);
  }

  console.log(`📉 Stored Dutch auction params and marked order ${auction.orderId} as auctioned`);
}

export async function updateOrderFilled(orderId: string) {
  const db = getDb();

  const result = await db.run(
    `
    UPDATE orders
    SET status = ?
    WHERE orderId = ?
    `,
    ['filled', orderId]
  );

  if (result.changes === 0) {
    throw new Error(`Order ${orderId} not found to update`);
  }

  console.log(`✅ Order ${orderId} marked as filled`);
}

export async function updateAuctionOrderId(orderId: string, auctionOrderId: string) {
  const db = getDb();

  const result = await db.run(
    `
    UPDATE dutch_auctions
    SET auctionOrderId = ?
    WHERE orderId = ?
    `,
    [auctionOrderId, orderId]
  );

  if (result.changes === 0) {
    throw new Error(`Order ${orderId} not found to update auctionOrderId`);
  }

  console.log(`🔗 Stored auctionOrderId ${auctionOrderId} for orderId ${orderId}`);
}
