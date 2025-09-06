import express from 'express';
import authenticate from '../middlewares/authMiddleware.js';
import { getPriceDataByAuctionId } from '../controllers/chartController.js';

const router = express.Router();

router.get('/prices/:auctionId', authenticate, getPriceDataByAuctionId);

export default router;
