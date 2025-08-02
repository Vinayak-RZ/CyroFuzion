import express from "express";
import { submitOrderToStarknet, FusionOrder } from "../../services/submitOrderToStarknet";
import { validateOrder } from "../../utils/validateOrder";

const router = express.Router();

router.post("/", async (req, res) => {
    try {
        const order: FusionOrder = req.body;
        validateOrder(order);

        const txHash = await submitOrderToStarknet(order);

        res.status(200).json({ message: "Order submitted to Starknet", txHash });
    } catch (error: any) {
        console.error("❌ Failed to submit ETH→STRK order:", error);
        res.status(500).json({ error: error.message });
    }
});

export default router;