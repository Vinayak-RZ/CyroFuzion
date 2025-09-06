import fetch from 'node-fetch';

export async function fetchEthToStarkRate(): Promise<number> {
    const ONE_INCH_API = 'https://api.1inch.dev/swap/v5.2/1/quote';
    const ETH_ADDRESS = '0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE'; // 1inch ETH pseudo-address
    const STARK_ADDRESS = '0xB548762210f6d242C8584C0A8c60f0165f37bDdF'; // Replace this with real STARK ERC-20 address on Ethereum
    const AMOUNT_IN_WEI = BigInt(1e18).toString(); // 1 ETH in wei

    const url = `${ONE_INCH_API}?fromTokenAddress=${ETH_ADDRESS}&toTokenAddress=${STARK_ADDRESS}&amount=${AMOUNT_IN_WEI}`;

    const res = await fetch(url, {
        headers: {
            'Authorization': `Bearer ${process.env.ONE_INCH_API_KEY}`,
        },
    });

    if (!res.ok) {
        const errorText = await res.text();
        throw new Error(`Failed to fetch exchange rate: ${res.status} ${errorText}`);
    }

    const data = await res.json();

    // toTokenAmount is in STARK's smallest unit; convert back using decimals
    const toTokenAmount = parseFloat(data.toTokenAmount);
    const decimals = data.toToken.decimals;

    const rate = toTokenAmount / Math.pow(10, decimals); // STARK received for 1 ETH

    return rate;
}

export async function generateAuctionParams({
    minReturnAmountStr,
    ethToStarkRate,
    ethAmountStr,
}: {
    minReturnAmountStr: string;
    ethToStarkRate: number;
    ethAmountStr: string;
}) {
    const ethAmount = parseFloat(ethAmountStr);
    const minReturnAmount = parseFloat(minReturnAmountStr);

    if (
        typeof ethToStarkRate !== "number" ||
        isNaN(ethToStarkRate) ||
        isNaN(ethAmount) ||
        isNaN(minReturnAmount) ||
        ethAmount <= 0 ||
        minReturnAmount <= 0
    ) {
        throw new Error("Invalid input values for auction parameter generation");
    }

    const startRate = ethToStarkRate;
    const endRate = minReturnAmount / ethAmount;

    if (endRate > startRate) {
        throw new Error("minReturnAmount is too high compared to current exchange rate");
    }

    const step = (startRate - endRate) / 10;
    const decreaseRates: string[] = [];

    for (let i = 1; i <= 10; i++) {
        const rate = startRate - step * i;
        decreaseRates.push(rate.toFixed(8));
    }

    return {
        startRate: startRate.toFixed(8),
        decreaseRates,
        minReturnAmount: minReturnAmountStr,
    };
}
