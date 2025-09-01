import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { useWallet } from '../../context/walletContext';
import { useNavigate } from 'react-router-dom';
import "./Home.css";

const Home = () => {
    const { walletAddress, connectWallet, disconnectWallet, isConnected } = useWallet();
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
            await connectWallet();

            // Once wallet is connected, send to backend
            const token = localStorage.getItem('token');
            const response = await axios.post(
                `${import.meta.env.VITE_API_BASE_URL}/auth/connect-wallet`,
                { walletAddress: window.ethereum.selectedAddress },
                {
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                }
            );

            alert('Wallet connected and synced with backend!');
            setHasConnectedToBackend(true);

        } catch (err) {
            console.error(err);
            setError(err.response?.data?.error || err.message || 'Failed to connect/sync wallet');
        }
    };

    const handleDisconnect = () => {
        disconnectWallet();
        setHasConnectedToBackend(false);
        setError('');
    };

    return (
        <div className="home-container">
            <div className="home-card">
                <h1 className="home-title">Welcome to CryoFuzion</h1>

                {!isConnected ? (
                    <button className="connect-button" onClick={handleConnectWallet}>
                        Connect Wallet
                    </button>
                ) : (
                    <>
                        <p className="wallet-address">Connected: {walletAddress}</p>

                        <button className="disconnect-button" onClick={handleDisconnect}>
                            Disconnect
                        </button>

                        <button
                            className="swap-button"
                            disabled={!hasConnectedToBackend}
                            onClick={() => navigate('/swap')}
                        >
                            Swap
                        </button>
                    </>
                )}

                {error && <p className="error-message">{error}</p>}
            </div>
        </div>
    );
};

export default Home;
