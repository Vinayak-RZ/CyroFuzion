import express from "express";
import fusionRoutes from "./routes/fusionRoutes.ts";
import cors from "cors";
import dotenv from "dotenv";
import { initDb } from "./db.ts"; // 👈 import your DB init function
import dutchAuctionRoute from './routes/fusion/strkToEthDutch.ts'; // adjust the path if needed
import getCurrentRate from './routes/get-rate/getCurrentRate.ts';
import { pollOrderCreated } from "./services/listenOrderCreated.ts";

dotenv.config();

async function main() {
    // 🔹 Initialize the database first
    await initDb();

    // 🔹 Set up Express app
    const app = express();
    const port = process.env.PORT || 4000;

    app.use(cors());
    app.use(express.json());
    app.use("/api", fusionRoutes);

    app.use('/dutch-auction', dutchAuctionRoute);

    app.use('/onchain/currentRate', getCurrentRate);


    app.listen(port, () => {
        console.log(`🚀 Fusion Relayer API running at http://localhost:${port}`);
    });

    pollOrderCreated();
}

main().catch((err) => {
    console.error("❌ Failed to start server:", err);
    process.exit(1);
});
