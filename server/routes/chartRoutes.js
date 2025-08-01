import express from 'express';
import { getPriceDataByAuctionId } from '../controllers/chartController.js';

const router = express.Router();

router.get('/prices/:auctionId', getPriceDataByAuctionId);

export default router;
