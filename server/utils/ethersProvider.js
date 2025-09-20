import { ethers } from 'ethers';
import dotenv from 'dotenv';
import contractABI from '../abi/Contract.json' assert { type: 'json' }; 

dotenv.config();

const provider = new ethers.JsonRpcProvider(process.env.RPC_URL); 
const contractAddress = process.env.CONTRACT_ADDRESS;

const Contract = new ethers.Contract(
  contractAddress,
  contractABI,
  provider
);

export { provider, Contract };
