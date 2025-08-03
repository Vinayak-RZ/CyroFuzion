import express from 'express';
import { getDb } from '../sqlite-db/db.ts';
import { ethers } from 'ethers';

const router = express.Router();

router.get('/latest-events', async (req, res) => {
    try {
        const db = getDb();

        const [escrow] = await db.all(`SELECT * FROM escrows ORDER BY createdAt DESC LIMIT 1`);
        const [verified] = await db.all(`SELECT * FROM order_verified ORDER BY createdAt DESC LIMIT 1`);
        const [filled] = await db.all(`SELECT * FROM order_filled ORDER BY createdAt DESC LIMIT 1`);

        const response = {
            escrow: escrow
                ? {
                    id: escrow.id,
                    escrowAddress: escrow.escrowAddress,
                    maker: escrow.maker,
                    asset: escrow.asset,
                    amount: escrow.amount,
                    hashlock: escrow.hashlock,
                    timelock: escrow.timelock,
                    timelockDate: new Date(escrow.timelock * 1000).toISOString(),
                    txHash: escrow.txHash,
                    createdAt: escrow.createdAt,
                }
                : null,

            order_verified: verified
                ? {
                    id: verified.id,
                    suiAsset: verified.suiAsset,
                    crossChainRecipient: verified.crossChainRecipient,
                    maker: verified.maker,
                    takerAsset: verified.takerAsset,
                    makingAmount: ethers.formatUnits(verified.makingAmount, 18),
                    takingAmount: ethers.formatUnits(verified.takingAmount, 18),
                    txHash: verified.txHash,
                    createdAt: verified.createdAt,
                }
                : null,

            order_filled: filled
                ? {
                    id: filled.id,
                    orderHash: filled.orderHash,
                    remainingAmount: ethers.formatUnits(filled.remainingAmount, 18),
                    txHash: filled.txHash,
                    createdAt: filled.createdAt,
                }
                : null,
        };

        res.json(response);
    } catch (err) {
        console.error('❌ Error fetching latest events:', err);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

export default router;
