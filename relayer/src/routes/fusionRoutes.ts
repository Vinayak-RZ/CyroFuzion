// routes/fusionRoutes.ts
import express from 'express';
import { getDb } from '../sqlite-db/db.ts'; // Import your DB connection

const router = express.Router();

// fetch all dutch orders for a specific wallet address
router.get('/orders/:walletAddress', async (req, res) => {
    const walletAddress = req.params.walletAddress;
    const db = getDb();

    try {
        const orders = await db.all(
            `SELECT * FROM orders WHERE walletAddress = ? ORDER BY createdAt DESC`,
            [walletAddress]
        );
        res.json(orders);
    } catch (error) {
        console.error("Error fetching orders:", error);
        res.status(500).json({ error: "Internal Server Error" });
    }
});

export default router;