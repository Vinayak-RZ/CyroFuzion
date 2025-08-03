<<<<<<< HEAD
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
=======
import express from "express";
import fusionRoutes from "./routes/fusionRoutes.ts";
import cors from "cors";
import dotenv from "dotenv";
import { initDb } from "./sqlite-db/db.ts"; // 👈 import your DB init function
import dutchAuctionRoute from './routes/fusion/strkToEthDutch.ts'; // adjust the path if needed
import getCurrentRate from './routes/get-rate/getCurrentRate.ts';
// import { pollOrderCreated } from "./services/listenDutchOrder.ts";
import orderRoutes from "./routes/index.ts";
// websocket server for real-time updates
import { createRateWebSocketServer } from "./ws/rateStreamer.ts"; // adjust the path if needed

dotenv.config();

async function main() {
    // initializing the database
    await initDb();

    // set up express app
    const app = express();
    const port = process.env.PORT || 4000;

    app.use(cors());
    app.use(express.json());

    // two main functions that will be called depending on which way the swap is initiated

    // get all orders for a specific wallet address
    app.use("/api", fusionRoutes);
    // MAIN API for handling order submissions
    app.use("/orders", orderRoutes);
    // dutch auction route
    app.use('/submit-dutch-auction', dutchAuctionRoute);
    // get current rate for a specific order
    app.use('/onchain/currentRate', getCurrentRate);

    app.listen(port, () => {
        console.log(`🚀 Fusion Relayer API running at http://localhost:${port}`);
    });

    // start the WebSocket server for real-time rate updates
    createRateWebSocketServer(8080);
    // pollOrderCreated();
}

main().catch((err) => {
    console.error("❌ Failed to start server:", err);
    process.exit(1);
});
>>>>>>> main
