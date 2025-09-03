import { isAddress } from "ethers";
import { supportedChainIds } from "../constants.ts";

export function validateDutchAuctionOrder(order: any) {
    if (!order) throw new Error("Missing order payload.");

    const requiredFields = [
        "orderId",
        "srcChainId",
        "destChainId",
        "srcToken",
        "amount",
        "auctionStart",
        "startrate",
        "minReturnAmount",
        "decreaseRates",
        "secret",
        "secretHash",
        "makerAddress"
    ];

    for (const field of requiredFields) {
        if (!(field in order)) {
            throw new Error(`Missing required field: ${field}`);
        }
    }

    if (typeof order.orderId !== "string" || order.orderId.length < 6) {
        throw new Error("Invalid orderId.");
    }

    if (!Number.isInteger(order.srcChainId) || !Number.isInteger(order.destChainId)) {
        throw new Error("Invalid chain IDs.");
    }

    if (!supportedChainIds.includes(Number(order.srcChainId)) || !supportedChainIds.includes(Number(order.destChainId))) {
        throw new Error("Unsupported chain IDs.");
    }

    if (order.srcChainId === order.destChainId) {
        throw new Error("Source and destination chains must be different.");
    }

    if (!isAddress(order.srcToken)) {
        throw new Error("Invalid srcToken address.");
    }

    if (!isAddress(order.makerAddress)) {
        throw new Error("Invalid maker address.");
    }

    if (typeof order.secretHash !== "string" || !/^0x[0-9a-fA-F]{64}$/.test(order.secretHash)) {
        throw new Error("Invalid secret hash (must be 32-byte hex string).");
    }

    if (!/^\d+$/.test(order.amount) || BigInt(order.amount) <= 0n) {
        throw new Error("Amount must be a positive integer string.");
    }

    if (!Number.isInteger(order.auctionStart) || order.auctionStart <= 0) {
        throw new Error("Invalid auction start time.");
    }

    if (!/^\d+$/.test(order.startrate) || BigInt(order.startrate) <= 0n) {
        throw new Error("Invalid starting rate.");
    }

    if (!/^\d+$/.test(order.minReturnAmount) || BigInt(order.minReturnAmount) <= 0n) {
        throw new Error("Invalid minReturnAmount.");
    }

    if (!Array.isArray(order.decreaseRates) || order.decreaseRates.length === 0) {
        throw new Error("decreaseRates must be a non-empty array.");
    }

    for (const rate of order.decreaseRates) {
        if (!/^\d+$/.test(rate) || BigInt(rate) < 0n) {
            throw new Error("All decrease rates must be non-negative integer strings.");
        }
    }
}
