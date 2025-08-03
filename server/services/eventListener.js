import { Contract } from '../utils/ethersProvider.js';
import { addPricePoint } from '../utils/priceStore.js';

let pollingInterval;

export function startPollingRate(orderId) {
  if (pollingInterval) {
    clearInterval(pollingInterval); // Avoid duplicate intervals
  }

  pollingInterval = setInterval(async () => {
    try {
      const currentRate = await Contract.getCurrentRate(orderId);
      const timestamp = Date.now();

      const data = {
        timestamp,
        price: Number(currentRate),
        isAuction: true,  // Assuming always in auction mode during polling
        resolverId: "poller",  // Identifier to differentiate event-based data
      };

      console.log("Polled Current Rate:", data);

      addPricePoint(data);  // Store/update chart or database
    } catch (error) {
      console.error("Polling failed:", error);
    }
  }, 1000); // Poll every second
}

export function stopPollingRate() {
  if (pollingInterval) {
    clearInterval(pollingInterval);
    pollingInterval = null;
  }
}
