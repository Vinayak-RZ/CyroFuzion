// authRoutes.js
import { Router } from 'express';
import authController from '../controllers/authController.js';
import authenticate from '../middlewares/authMiddleware.js';

const router = Router();

router.post('/signup', authController.signup);
router.post('/login', authController.login);
router.post('/connect-wallet', authenticate, authController.connectWallet); 

export default router;
