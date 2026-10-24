const jwt = require('jsonwebtoken');
require('dotenv').config({ path: './auth.env' });
const { getDB } = require('../../config/db');
const bcrypt = require('bcrypt');
const { ObjectId } = require('mongodb');

const JWT_SECRET = process.env.JWT_SECRET;
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '7d';

// ✅ LOGIN CONTROLLER
const login = async (req, res) => {
  const db = getDB();
  const { username, password, id } = req.body;

  if (!username || !password || !id) {
    return res.status(400).json({ message: 'All fields required' });
  }

  const user = await db.collection('users').findOne({ username });
  if (!user) return res.status(401).json({ message: 'Invalid credentials' });

  const isMatch = await bcrypt.compare(password, user.password);
  if (!isMatch || user.user_id !== id) {
    return res.status(401).json({ message: 'Invalid credentials' });
  }

  const userRoles = Array.isArray(user.roles) && user.roles.length > 0
    ? user.roles
    : (user.role || "").toLowerCase() === "hr"
      ? ["ROLE_SUPER_ADMIN", "ROLE_HR_ADMIN"]
      : ["ROLE_EMPLOYEE"];

  const userPermissions = Array.isArray(user.cached_permissions)
    ? user.cached_permissions
    : [];

  // ✅ Generate JWT token with RBAC roles
  const token = jwt.sign(
    {
      userId: user._id.toString(),
      user_id: user.user_id,
      username: user.username,
      email: user.email,
      role: user.role,
      roles: userRoles,
      department: user.department || "General",
      reporting_to: user.reporting_to || null,
      designation: user.designation || "Staff",
      pv: user.permission_version || 1,
    },
    JWT_SECRET,
    { expiresIn: JWT_EXPIRES_IN }
  );

  res.json({
    message: '✅ Login successful',
    token,
    user: {
      id: user.user_id,
      username: user.username,
      email: user.email,
      role: (user.role || "").toLowerCase(),
      roles: userRoles,
      department: user.department || "General",
      reporting_to: user.reporting_to || null,
      designation: user.designation || "Staff",
      permissions: userPermissions,
    },
  });
};

// ✅ CHANGE PASSWORD CONTROLLER
const changePassword = async (req, res) => {
  try {
    const db = getDB();
    const { currentPassword, newPassword } = req.body;
    const userId = req.user?.userId; // comes from JWT

    if (!currentPassword || !newPassword) {
      return res.status(400).json({ message: '⚠️ All fields required' });
    }

    console.log("🔍 JWT payload:", req.user);

    const objectId = new ObjectId(userId); // ✅ Create ObjectId ONCE
    const user = await db.collection('users').findOne({ _id: objectId });

    if (!user) {
      return res.status(404).json({ message: '❌ User not found' });
    }

    // ✅ Check if current password matches
    const isMatch = await bcrypt.compare(currentPassword, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: '❌ Current password is incorrect' });
    }

    // ✅ Hash the new password
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    // ✅ Update password in DB
    await db.collection('users').updateOne(
      { _id: objectId },
      { $set: { password: hashedPassword } }
    );

    res.status(200).json({ message: '✅ Password updated successfully' });
  } catch (error) {
    console.error('❌ Password change error:', error);
    res.status(500).json({ message: '❌ Server error while changing password' });
  }
};

module.exports = { login, changePassword };
