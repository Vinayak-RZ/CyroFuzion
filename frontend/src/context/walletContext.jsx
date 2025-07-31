import React, { createContext, useContext, useState, useEffect } from 'react';
import { BrowserProvider } from 'ethers';

const WalletContext = createContext();

export const useWallet = () => useContext(WalletContext);

export const WalletProvider = ({ children }) => {
  const [walletAddress, setWalletAddress] = useState(null);
  const [provider, setProvider] = useState(null);
  const [chainId, setChainId] = useState(null);
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    const checkExistingConnection = async () => {
      if (window.ethereum) {
        try {
          const accounts = await window.ethereum.request({ method: 'eth_accounts' });

          if (accounts.length > 0) {
            const chainId = await window.ethereum.request({ method: 'eth_chainId' });
            const _provider = new BrowserProvider(window.ethereum);

            setProvider(_provider);
            setWalletAddress(accounts[0]);
            setChainId(parseInt(chainId, 16));
            setIsConnected(true);
          }
        } catch (err) {
          console.error('Error checking wallet connection:', err);
        }
      }
    };

    checkExistingConnection();

    if (window.ethereum) {
      window.ethereum.on('accountsChanged', handleAccountsChanged);
      window.ethereum.on('chainChanged', handleChainChanged);
    }

    return () => {
      if (window.ethereum) {
        window.ethereum.removeListener('accountsChanged', handleAccountsChanged);
        window.ethereum.removeListener('chainChanged', handleChainChanged);
      }
    };
  }, []);

  const handleAccountsChanged = (accounts) => {
    if (accounts.length > 0) {
      setWalletAddress(accounts[0]);
      setIsConnected(true);
    } else {
      resetWallet();
    }
  };

  const handleChainChanged = (_chainId) => {
    setChainId(parseInt(_chainId, 16));
  };

  const connectWallet = async () => {
    if (!window.ethereum) {
      alert('MetaMask is required.');
      return;
    }

    try {
      const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
      const chainId = await window.ethereum.request({ method: 'eth_chainId' });

      const _provider = new BrowserProvider(window.ethereum);

      setProvider(_provider);
      setWalletAddress(accounts[0]);
      setChainId(parseInt(chainId, 16));
      setIsConnected(true);
    } catch (err) {
      console.error('Wallet connection failed:', err);
      setIsConnected(false);
    }
  };

  const disconnectWallet = () => {
    resetWallet();
  };

  const resetWallet = () => {
    setProvider(null);
    setWalletAddress(null);
    setChainId(null);
    setIsConnected(false);
  };

  return (
    <WalletContext.Provider
      value={{
        walletAddress,
        provider,
        chainId,
        isConnected,
        connectWallet,
        disconnectWallet,
        resetWallet, 
      }}
    >
      {children}
    </WalletContext.Provider>
  );
};
