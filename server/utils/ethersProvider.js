import { ethers } from 'ethers';
import dotenv from 'dotenv';

import fs from 'fs';
import path from 'path';

const abiPath = path.resolve('../server/abi/Contract.json');
const abiJSON = JSON.parse(fs.readFileSync(abiPath, 'utf8'));
const contractABI = abiJSON.abi;
dotenv.config();

const provider = new ethers.JsonRpcProvider(process.env.RPC_URL); 
const contractAddress = process.env.CONTRACT_ADDRESS;

const Contract = new ethers.Contract(
  contractAddress,
  contractABI,
  provider
);

export { provider, Contract };
