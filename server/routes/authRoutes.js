import { Router } from 'express';
import authController from '../controllers/authController.js';
import authenticate from '../middlewares/authMiddleware.js';

const router = Router();

router.post('/signup', authController.signup);
router.post('/login/send-otp', authController.sendOtpAfterPasswordCheck);
router.post('/login/verify-otp', authController.verifyOtpAndLogin);
router.post('/connect-wallet', authenticate, authController.connectWallet);

export default router;
