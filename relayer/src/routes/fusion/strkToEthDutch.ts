import express from "express";
import { submitDutchOrderToEthereum } from "../../services/submitDutchOrderToEthereum.ts";

const router = express.Router();

router.post("/", async (req, res) => {
    try {
        const order = req.body;
        const txHash = await submitDutchOrderToEthereum(order);

        res.status(200).json({ message: "Dutch order submitted", txHash });
    } catch (error: any) {
        console.error("❌ Failed to submit Dutch order:", error);
        res.status(500).json({ error: error.message });
    }
});

export default router;