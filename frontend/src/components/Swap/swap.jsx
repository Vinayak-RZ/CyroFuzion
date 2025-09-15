import React, { useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import './swap.css';

const SwapPage = () => {
    const [sourceChain, setSourceChain] = useState('ethereum');
    const [destinationChain, setDestinationChain] = useState('starknet');
    const [amount, setAmount] = useState('');
    const [minAmount, setMinAmount] = useState('');
    const [error, setError] = useState('');
    const [isSwapping, setIsSwapping] = useState(false);
    const [swapStatus, setSwapStatus] = useState('');
    const navigate = useNavigate();

    const handleSwap = async () => {
        if (!amount || isNaN(amount) || Number(amount) <= 0) {
            setError('Please enter a valid amount.');
            return;
        }

        if (sourceChain === destinationChain) {
            setError('Source and Destination chains cannot be the same.');
            return;
        }

        setError('');
        setIsSwapping(true);
        setSwapStatus('Initiating swap...');

        try {
            // 1. Call Relayer Backend
            const relayerResponse = await axios.post(
                `${import.meta.env.VITE_RELAYER_BACKEND_URL}/fusion/eth-to-strk`,
                {
                    amount,
                    srcToken: sourceChain  
                }
            );

            const { orderId } = relayerResponse.data;

            if (!orderId) {
                throw new Error('Order ID not returned by relayer.');
            }

            console.log('Order created with ID:', orderId);

            // 2. Call Express Backend to start polling
            await axios.post(
                `${import.meta.env.VITE_EXPRESS_BACKEND_URL}/polling/start`,
                { orderId }
            );

            console.log('Polling started for orderId:', orderId);

            // 3. Simulate UI progress updates (No manual timeouts; we’ll simulate based on backend success)
            const timeouts = [
                setTimeout(() => setSwapStatus('Processing on source chain...'), 1500),
                setTimeout(() => setSwapStatus('Bridging tokens across chains...'), 3000),
                setTimeout(() => setSwapStatus('Confirming on destination chain...'), 5000),
                setTimeout(() => setSwapStatus('Finalizing transaction...'), 6500),
                setTimeout(() => {
                    setSwapStatus('Swap completed successfully!');
                    // Navigate to chart after short delay
                    setTimeout(() => {
                        navigate('/chart');
                    }, 1500);
                }, 8000)
            ];

            window.swapTimeouts = timeouts;

        } catch (err) {
            console.error(err);
            setError(err.response?.data?.error || err.message || 'Swap failed.');
            setIsSwapping(false);
        }
    };

    const handleCancel = () => {
        if (window.swapTimeouts) {
            window.swapTimeouts.forEach(timeout => clearTimeout(timeout));
            window.swapTimeouts = null;
        }
        setIsSwapping(false);
        setSwapStatus('');
        setError('Swap cancelled by user.');
    };

    const getChainIcon = (chain) => {
        if (chain === 'ethereum') {
            return (
                <div className="chain-icon ethereum">
                    <svg width="32" height="32" viewBox="0 0 32 32" fill="none">
                        <circle cx="16" cy="16" r="16" fill="#627EEA" />
                        <path d="M16.498 4v8.87l7.497 3.35-7.497-12.22z" fill="#FFF" fillOpacity=".602" />
                        <path d="M16.498 4L9 16.22l7.498-3.35V4z" fill="#FFF" />
                        <path d="M16.498 21.968v6.027L24 17.616l-7.502 4.352z" fill="#FFF" fillOpacity=".602" />
                        <path d="M16.498 27.995v-6.028L9 17.616l7.498 10.38z" fill="#FFF" />
                        <path d="M16.498 20.573l7.497-4.353-7.497-3.348v7.701z" fill="#FFF" fillOpacity=".2" />
                        <path d="M9 16.22l7.498 4.353v-7.701L9 16.22z" fill="#FFF" fillOpacity=".602" />
                    </svg>
                </div>
            );
        } else {
            return (
                <div className="chain-icon starknet">
                    <svg width="32" height="32" viewBox="0 0 32 32" fill="none">
                        <circle cx="16" cy="16" r="16" fill="#0C0C4F" />
                        <path d="M8 24L16 8L24 24H8Z" fill="#FFF" />
                        <path d="M12 20L16 12L20 20H12Z" fill="#0C0C4F" />
                    </svg>
                </div>
            );
        }
    };

    const getChainName = (chain) => {
        return chain.charAt(0).toUpperCase() + chain.slice(1);
    };

    const getProcessingIcon = () => (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
            <circle cx="12" cy="12" r="10" stroke="#4F46E5" strokeWidth="2" />
            <path d="M12 6v6l4 2" stroke="#4F46E5" strokeWidth="2" strokeLinecap="round" />
        </svg>
    );

    // Swapping UI Animation
    if (isSwapping) {
        return (
            <div className="swap-container">
                <h2 className="swap-title">CryoFuzion</h2>

                <div className="processing-container">
                    <div className="chain-card source-card">
                        {getChainIcon(sourceChain)}
                        <h3>{getChainName(sourceChain)}</h3>
                        <div className="amount-display">-{amount} ETH</div>
                        <div className="status-indicator sending">Sending</div>
                    </div>

                    <div className="processing-bridge">
                        <div className="bridge-line">
                            <div className="bridge-progress"></div>
                        </div>
                        <div className="processing-icon">
                            {getProcessingIcon()}
                        </div>
                        <div className="status-text">{swapStatus}</div>
                    </div>

                    <div className="chain-card destination-card">
                        {getChainIcon(destinationChain)}
                        <h3>{getChainName(destinationChain)}</h3>
                        <div className="amount-display">+{amount} ETH</div>
                        <div className="status-indicator receiving">Receiving</div>
                    </div>
                </div>

                <button className="cancel-button" onClick={handleCancel}>
                    Cancel Swap
                </button>
            </div>
        );
    }

    // Main Swap Form UI
    return (
        <div className="swap-container">
            <h2 className="swap-title">CryoFuzion</h2>

            <div className="swap-form">
                <div className="form-group">
                    <label>Source Chain</label>
                    <select
                        value={sourceChain}
                        onChange={(e) => setSourceChain(e.target.value)}
                    >
                        <option value="ethereum">Ethereum</option>
                        <option value="starknet">Starknet</option>
                    </select>
                </div>

                <div className="form-group">
                    <label>Destination Chain</label>
                    <select
                        value={destinationChain}
                        onChange={(e) => setDestinationChain(e.target.value)}
                    >
                        <option value="ethereum">Ethereum</option>
                        <option value="starknet">Starknet</option>
                    </select>
                </div>

                <div className="form-group">
                    <label>Minimum Amount</label>
                    <input
                        type="number"
                        value={minAmount}
                        onChange={(e) => setMinAmount(e.target.value)}
                        placeholder="Enter minimum amount"
                    />
                </div>

                <div className="form-group">
                    <label>Token Amount</label>
                    <input
                        type="number"
                        value={amount}
                        onChange={(e) => setAmount(e.target.value)}
                        placeholder="Enter amount"
                    />
                </div>

                {error && <p className="error-message">{error}</p>}

                <button className="swap-button" onClick={handleSwap} disabled={isSwapping}>
                    Initiate Cross-Chain Swap
                </button>
            </div>

            <button className="back-button" onClick={() => navigate('/home')}>
                Back to Home
            </button>
        </div>
    );
};

export default SwapPage;
