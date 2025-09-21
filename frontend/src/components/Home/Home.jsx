import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { useWallet } from '../../context/walletContext';
import { useNavigate } from 'react-router-dom';
import "./Home.css";

const Home = () => {
    const { walletAddress, connectWallet, isConnected } = useWallet();
    const [error, setError] = useState('');
    const [hasConnectedToBackend, setHasConnectedToBackend] = useState(false);
    const navigate = useNavigate();

    useEffect(() => {
        const token = localStorage.getItem('token');
        if (!token) {
            navigate('/login');
        }
    }, [navigate]);

    const handleConnectWallet = async () => {
        try {
        
            const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });

            if (!accounts || accounts.length === 0) {
                setError('No wallet selected or MetaMask denied connection.');
                return;
            }

            const address = accounts[0];

            if (hasConnectedToBackend) {
                setError('Wallet already synced with backend.');
                return;
            }

            const token = localStorage.getItem('token');
            const response = await axios.post(
                `${import.meta.env.VITE_API_BASE_URL}/auth/connect-wallet`,
                { walletAddress: address },
                {
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                }
            );

            alert('Wallet connected successfully!');
            setHasConnectedToBackend(true);
        } catch (err) {
            console.error(err);
            setError(err.response?.data?.error || err.message || 'Something went wrong');
        }
    };



    return (
        <div className="home-container">
            <div className="home-card">
                <h1 className="home-title">Welcome to CryoFuzion</h1>

                {isConnected ? (
                    <>
                        <p className="wallet-address">Connected wallet: {walletAddress}</p>
                        {hasConnectedToBackend ? (
                            <p className="status-message">Wallet synced with backend.</p>
                        ) : (
                            <button className="connect-button" onClick={handleConnectWallet}>
                                Send wallet to backend
                            </button>
                        )}
                    </>
                ) : (
                    <button className="connect-button" onClick={handleConnectWallet}>
                        Connect Wallet
                    </button>
                )}

                {error && <p className="error-message">{error}</p>}
            </div>
        </div>
    );
};

export default Home;