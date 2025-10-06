import { useState } from "react";
import { connect, disconnect } from "starknetkit";
import { InjectedConnector } from "starknetkit/injected";

export function useStarknetWallet() {
    const [wallet, setWallet] = useState<any>(null);
    const [address, setAddress] = useState<string>("");

    const handleConnect = async () => {
        const { wallet, connectorData } = await connect({
            modalMode: 'alwaysAsk',
            modalTheme: 'system',
            connectors: [
                new InjectedConnector({
                    options: { id: "argentX", name: "Ready Wallet (formerly Argent)" },
                }),
                new InjectedConnector({
                    options: { id: "braavos", name: "Braavos" },
                }),
            ],
        });

        if (wallet && connectorData) {
            setWallet(wallet);
            setAddress(connectorData.account || "");
        }
    };

    const disconnectWallet = async () => {
        await disconnect();
        setWallet(null);
        setAddress("");
    };

    return {
        wallet,
        address,
        handleConnect,
        disconnectWallet,
        isConnected: !!wallet,
    };
}
