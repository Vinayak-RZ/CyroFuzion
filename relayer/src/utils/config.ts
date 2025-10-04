
export interface FusionOrder {
    orderId: string;
    secretHash: string;
    srcToken: string;
    dstChainId: string;
    amount: string;
    auctionStart: string;
    startRate: string;
    minReturn: string;
    decreaseRate: string;
}
