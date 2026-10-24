const express = require('express');
const { getProfile, addUser, alluser, userByitsId, updateProfile } = require('./userController');
const authenticateToken = require('../../middlewares/authMiddleware');
const { requirePermission } = require('../../middlewares/rbacMiddleware');

const router = express.Router();

router.get('/profile', authenticateToken, getProfile);
router.put('/update/:userId', authenticateToken, updateProfile);
router.post('/add', authenticateToken, requirePermission("employees:create"), addUser);
router.get('/all', authenticateToken, alluser);
router.get('/users/:userid', authenticateToken, userByitsId);

module.exports = router;
