// db/saveOrderVerified.ts
import { getDb } from '../sqlite-db/db.ts';

export async function saveOrderVerified(data: {
    suiAsset: string;
    crossChainRecipient: string;
    maker: string;
    takerAsset: string;
    makingAmount: string;
    takingAmount: string;
    txHash: string;
    createdAt: number;
}) {
    const db = getDb();

    await db.run(
        `
    INSERT INTO order_verified (
      suiAsset,
      crossChainRecipient,
      maker,
      takerAsset,
      makingAmount,
      takingAmount,
      txHash,
      createdAt
    )
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `,
        [
            data.suiAsset,
            data.crossChainRecipient,
            data.maker,
            data.takerAsset,
            data.makingAmount,
            data.takingAmount,
            data.txHash,
            data.createdAt,
        ]
    );

    console.log('✅ Saved OrderVerified to DB');
}

export async function saveOrderFilled(data: {
    orderHash: string;
    remainingAmount: string;
    txHash: string;
    createdAt: number;
}) {
    const db = getDb();

    await db.run(
        `
    INSERT INTO order_filled (
      orderHash,
      remainingAmount,
      txHash,
      createdAt
    )
    VALUES (?, ?, ?, ?)
  `,
        [
            data.orderHash,
            data.remainingAmount,
            data.txHash,
            data.createdAt,
        ]
    );

    console.log('✅ Saved OrderFilled to DB');
}

export async function saveEscrowCreated(data: {
    orderId: string;
    amount: string;
    status: string;
    createdAt: number;
}) {
    const db = getDb();

    await db.run(
        `
    INSERT INTO escrow (
      orderId,
      amount,
      status,
      createdAt
    )
    VALUES (?, ?, ?, ?)
  `,
        [
            data.orderId,
            data.amount,
            data.status,
            data.createdAt,
        ]
    );

    console.log('✅ Saved EscrowCreated to DB');
}