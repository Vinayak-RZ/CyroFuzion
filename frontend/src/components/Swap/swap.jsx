import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './swap.css';

const SwapPage = () => {
    const [sourceChain, setSourceChain] = useState('ethereum');
    const [destinationChain, setDestinationChain] = useState('starknet');
    const [amount, setAmount] = useState('');
    const [minAmount, setminAmount] = useState('');
    const [error, setError] = useState('');
    const navigate = useNavigate();

    const handleSwap = () => {
        if (!amount || isNaN(amount) || Number(amount) <= 0) {
            setError('Please enter a valid amount.');
            return;
        }

        if (sourceChain === destinationChain) {
            setError('Source and Destination chains cannot be the same.');
            return;
        }

        setError('');

        alert(`Swapping ${amount} from ${sourceChain} to ${destinationChain}`);

    };

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
                        onChange={(e) => setminAmount(e.target.value)}
                        placeholder="Enter amount"
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

                <button className="swap-button" onClick={handleSwap}>
                    Swap
                </button>
            </div>

            <button className="back-button" onClick={() => navigate('/home')}>
                Back to Home
            </button>
        </div>
    );
};

export default SwapPage;
