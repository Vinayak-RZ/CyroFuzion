import express from "express";
import { submitOrderToEthereum } from "../../services/submitOrderToEthereum";
import { validateOrder } from "../../utils/validateOrder";

const router = express.Router();

router.post("/", async (req, res) => {
    try {
        const order = req.body;
        validateOrder(order);

        const txHash = await submitOrderToEthereum(order);

        res.status(200).json({ message: "Order submitted to Ethereum", txHash });
    } catch (error: any) {
        console.error("❌ Failed to submit STRK→ETH order:", error);
        res.status(500).json({ error: error.message });
    }
});

export default router;
