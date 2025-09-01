async function pollCurrentRate(
    contractAddress: string,
    orderId: string,
    onRateUpdate: (rate: string, second: number) => void
) {
    const durationSeconds = 10;

    for (let second = 0; second < durationSeconds; second++) {
        try {
            const response = await fetch(
                `http://localhost:4000/onchain/currentRate/${contractAddress}/${orderId}`
            );
            const data = await response.json();

            console.log(`📈 [${second + 1}s] Current Rate:`, data.rate);
            onRateUpdate(data.rate, second + 1); // Call your frontend update logic

        } catch (err) {
            console.error(`❌ Error at ${second + 1}s:`, err);
            onRateUpdate("error", second + 1); // Optional error callback
        }

        await new Promise((resolve) => setTimeout(resolve, 1000)); // wait 1 second
    }
}
