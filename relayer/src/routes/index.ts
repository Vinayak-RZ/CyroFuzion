import express from "express";
import ethToStrk from "./fusion/ethToStrk.ts";
import strkToEth from "./fusion/strkToEth.ts";
import strkToEthDutch from "./fusion/strkToEthDutch.ts";
const router = express.Router();

router.use("/fusion/eth-to-strk", ethToStrk);
router.use("/fusion/strk-to-eth", strkToEth);
router.use("/fusion/strk-to-eth-dutch", strkToEthDutch);

export default router;