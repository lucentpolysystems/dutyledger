import express from 'express';
import rateLimit from 'express-rate-limit';
import { login, changePassword } from './authController.js';
import authenticateToken from '../../middlewares/authMiddleware.js';
import { validateRequest, loginSchema, changePasswordSchema } from '../../middlewares/validateRequest.js';

const router = express.Router();

// Strict login rate-limiter: max 10 failed attempts per 15 minutes per IP
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 15,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: "Too many login attempts from this IP. Please try again after 15 minutes.",
  },
});

router.post('/login', loginLimiter, validateRequest(loginSchema), login);
router.post('/change-password', authenticateToken, validateRequest(changePasswordSchema), changePassword);

export default router;
