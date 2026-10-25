import express from 'express';
import { getProfile, addUser, alluser, userByitsId, updateProfile } from './userController.js';
import authenticateToken from '../../middlewares/authMiddleware.js';
import { requirePermission } from '../../middlewares/rbacMiddleware.js';

const router = express.Router();

router.get('/profile', authenticateToken, getProfile);
router.put('/update/:userId', authenticateToken, updateProfile);
router.post('/add', authenticateToken, requirePermission("employees:create"), addUser);
router.get('/all', authenticateToken, alluser);
router.get('/users/:userid', authenticateToken, userByitsId);

export default router;
