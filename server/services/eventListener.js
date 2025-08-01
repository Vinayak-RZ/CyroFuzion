import { swapContract } from '../utils/ethersProvider.js';
import { addPricePoint } from '../utils/priceStore.js'; 

export function startListeningToEvents() {
  swapContract.on("PriceUpdated", (timestamp, price, isAuction, resolverId) => {
    const data = {
      timestamp: Number(timestamp) * 1000, 
      price: Number(price),
      isAuction,
      resolverId
    };

    console.log("New Price Event:", data);

    addPricePoint(data);
  });
}
