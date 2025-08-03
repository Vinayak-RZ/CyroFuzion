// routes/index.ts
import express from "express";
import { handleEthToStrkOrder, handleStrkToEthOrder } from "./fusion/handleOrderSubmission.ts";

const router = express.Router();

router.post("/eth-to-strk", handleEthToStrkOrder);
router.post("/strk-to-eth", handleStrkToEthOrder);

export default router;
