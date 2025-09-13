// hooks/useEthereumWallet.ts
import { useState, useEffect } from "react";
import { ethers } from "ethers";

export function useEthereumWallet() {
    const [provider, setProvider] = useState<ethers.BrowserProvider | null>(null);
    const [signer, setSigner] = useState<ethers.Signer | null>(null);
    const [address, setAddress] = useState<string>("");

    const handleConnect = async () => {
        const ethereum = window.ethereum as ethers.Eip1193Provider | undefined;


        if (!ethereum) {
            alert("MetaMask is not installed");
            return;
        }

        try {
            const ethProvider = new ethers.BrowserProvider(ethereum);
            const accounts = await ethProvider.send("eth_requestAccounts", []);
            const userSigner = await ethProvider.getSigner();

            setProvider(ethProvider);
            setSigner(userSigner);
            setAddress(accounts[0]);
        } catch (error) {
            console.error("Failed to connect wallet", error);
        }
    };

    const disconnectWallet = async () => {
        setProvider(null);
        setSigner(null);
        setAddress("");
    };

    return {
        provider,
        signer,
        address,
        handleConnect,
        disconnectWallet,
        isConnected: !!signer,
    };
}
