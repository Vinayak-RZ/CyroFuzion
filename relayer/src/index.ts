import express from "express";
import fusionRouter from "./router.ts"; // Assuming the code you pasted is in router.ts
import dotenv from "dotenv";

dotenv.config();

const app = express();
app.use(express.json());

// Attach all routes
app.use(fusionRouter);

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`✅ Relayer listening on http://localhost:${PORT}`);
});

// // entry point for our backend relayer service
// // its job is to listen for the new fusion+ orders on the ethereum side (via event logs or polling)
// // verify and track them (check hashlock, timelock, etc)
// // trigger actions on cardano side (submit the matching txn to a plutus script)

// import { startEthereumWatcher } from "./ethereumWatcher.js";

// // callback function for new orders
// function onNewFusionOrder(order: any) {
//     console.log("New Fusion+ order detected: ")
//     console.log(order);

//     // TODO:
//     // - check if dstChainId ===  CARDANO_CHAIN_ID
//     // - prepare cardano escrow script with lucid
//     // - submit transaction
// }

// startEthereumWatcher(onNewFusionOrder);