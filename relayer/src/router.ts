// src/router.ts
import express from "express";
import strkToEthDutch from "./strkToEthDutch.ts";

const router = express.Router();

router.use("/fusion/strk-to-eth-dutch", strkToEthDutch);

export default router;
