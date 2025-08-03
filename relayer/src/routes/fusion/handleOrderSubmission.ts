// controllers/orderController.ts
import { Request, Response } from "express";
import { computeAuctionOrderId } from "../../utils/getAuctionOrderId.ts";
import { storeBaseOrderInfo, storeDutchAuctionParams } from "../../sqlite-db/orderStore.ts";
import { randomBytes } from "crypto";
import { keccak256, concat } from "ethers";
import { submitDutchOrder } from "../../services/submitDutchOrder.ts";
import { generateAuctionParams, fetchEthToStarkRate } from "../../utils/auctionParams.ts";

// the very first instance of storing data, happens right after the user submits the request to swap tokens
export async function handleEthToStrkOrder(req: Request, res: Response) {
    const { walletAddress, minReturnAmount, ethAmount } = req.body;
    if (!walletAddress || !minReturnAmount || !ethAmount) {
        return res.status(400).json({ error: "Missing required fields" });
    }

    // Derive order data internally
    const secret = randomBytes(32);
    const secretHash = keccak256(secret);

    // Generate a consistent order ID based on the secret hash and wallet address
    const orderId = keccak256(concat([secretHash, walletAddress])); // consistent ID
    const auctionStart = Math.floor(Date.now() / 1000);
    // Generate auction parameters
    // Fetch current 1 ETH → STARK rate
    const ethToStarkRate = 25000;

    const { startRate, decreaseRates } = await generateAuctionParams({
        minReturnAmountStr: minReturnAmount,
        ethToStarkRate,
        ethAmountStr: ethAmount,
    });


    // Create the order object
    const order = {
        orderId: orderId,
        secretHash: secretHash,
        secret: secret.toString('hex'),
        maker: walletAddress,
        auctionStart: auctionStart,
        amount: ethAmount,
        status: "created",
        minReturnAmount: minReturnAmount,
    };

    // Store the order in the database (1st)
    await storeBaseOrderInfo(order);

    // Compute the auctionOrderId
    const auctionOrderId = await computeAuctionOrderId({
        srcToken: "0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee",
        amount: ethAmount,
        auctionStart: auctionStart,
        startrate: BigInt(Math.floor(parseFloat(startRate) * 1e18)),
        minReturnAmount: BigInt(Math.floor(parseFloat(minReturnAmount) * 1e18)),
        decrease_rates: decreaseRates.map((r) =>
            BigInt(Math.floor(parseFloat(r) * 1e8))
        ),
    });

    const auctionParams = {
        orderId: orderId,
        auctionOrderId: auctionOrderId,
        amount: ethAmount,
        startRate: startRate,
        minReturnAmount: minReturnAmount,
        decreaseRates: decreaseRates.join(','),
    };

    // Store the auction parameters in the database (2nd)
    await storeDutchAuctionParams(auctionParams);
    console.log(`📦 Order ${orderId} created and stored successfully`);

    const payload = {
        orderId: order.orderId,
        auctionOrderId: auctionParams.auctionOrderId,
        srcToken: "0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee",
        amount: auctionParams.amount,
        auctionStart: order.auctionStart,
        startrate: auctionParams.startRate,
        minReturnAmount: auctionParams.minReturnAmount,
        decrease_rates: auctionParams.decreaseRates.split(',').map((r) => r.trim()),
    };

    // Submit the Dutch auction order to Ethereum
    try {
        const txHash = await submitDutchOrder({
            srcToken: "0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee",
            amount: auctionParams.amount,
            auctionStart: order.auctionStart,
            startRate: BigInt(Math.floor(parseFloat(auctionParams.startRate) * 1e18)), // Convert to wei
            minReturnAmount: BigInt(Math.floor(parseFloat(auctionParams.minReturnAmount) * 1e18)), // Convert to wei
            decreaseRates: auctionParams.decreaseRates.split(',').map((r) =>
                BigInt(Math.floor(parseFloat(r) * 1e8))),
        });

        console.log(`🎯 Dutch order tx submitted: ${txHash}`);
    } catch (err) {
        if (err instanceof Error) {
            console.error("❌ Failed to submit Dutch order:", err.message);
        } else {
            console.error("❌ Failed to submit Dutch order:", err);
        }
    }
    return res.json({ orderId, secret: secret.toString("hex") });
}

export async function handleStrkToEthOrder(req: Request, res: Response) {
    // identical logic, different handling later
    // return handleEthToStrkOrder(req, res); // or a distinct handler if logic diverges
}
