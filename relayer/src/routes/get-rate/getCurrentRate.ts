// routes/fusion/getCurrentRate.ts
import express from "express";
import { ethers } from "ethers";

const router = express.Router();

const abi = [
    "function getCurrentRate(bytes32 orderId) view returns (uint256)"
];

router.get("/:contractAddress/:orderId", async (req, res) => {
    const { contractAddress, orderId } = req.params;

    try {
        const provider = new ethers.JsonRpcProvider(process.env.ETH_RPC_URL);
        const contract = new ethers.Contract(contractAddress, abi, provider);

        const rate = await contract.getCurrentRate(orderId);
        res.json({ rate: rate.toString() });
    } catch (error: any) {
        console.error("❌ Failed to fetch rate:", error);
        res.status(500).json({ error: error.message });
    }
});

export default router;
