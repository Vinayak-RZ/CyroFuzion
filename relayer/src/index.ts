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
