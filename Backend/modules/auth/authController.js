import jwt from 'jsonwebtoken';
import bcrypt from 'bcrypt';
import { getDB, prisma } from '../../config/db.js';

const JWT_SECRET = process.env.JWT_SECRET || "defaultSecret";
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

  const isMatch = await bcrypt.compare(password, user.password || "");
  const uid = user.userId || user.user_id;
  if (!isMatch || uid !== id) {
    return res.status(401).json({ message: 'Invalid credentials' });
  }

  const userRoles = Array.isArray(user.roles) && user.roles.length > 0
    ? user.roles
    : (user.role || "").toLowerCase() === "hr"
      ? ["ROLE_SUPER_ADMIN", "ROLE_HR_ADMIN"]
      : ["ROLE_EMPLOYEE"];

  const userPermissions = Array.isArray(user.cachedPermissions || user.cached_permissions)
    ? (user.cachedPermissions || user.cached_permissions)
    : [];

  // ✅ Generate JWT token with RBAC roles
  const token = jwt.sign(
    {
      userId: (user.id || user._id || "").toString(),
      user_id: uid,
      username: user.username,
      email: user.email,
      role: user.role,
      roles: userRoles,
      department: user.department || "General",
      reporting_to: user.reportingTo || user.reporting_to || null,
      designation: user.designation || "Staff",
      pv: user.permissionVersion || user.permission_version || 1,
    },
    JWT_SECRET,
    { expiresIn: JWT_EXPIRES_IN }
  );

  res.json({
    message: '✅ Login successful',
    token,
    user: {
      id: uid,
      username: user.username,
      email: user.email,
      role: (user.role || "").toLowerCase(),
      roles: userRoles,
      department: user.department || "General",
      reporting_to: user.reportingTo || user.reporting_to || null,
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
    const userId = req.user?.userId || req.user?.user_id;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({ message: '⚠️ All fields required' });
    }

    const user = await db.collection('users').findOne({ user_id: req.user?.user_id || userId });

    if (!user) {
      return res.status(404).json({ message: '❌ User not found' });
    }

    // ✅ Check if current password matches
    const isMatch = await bcrypt.compare(currentPassword, user.password || "");
    if (!isMatch) {
      return res.status(400).json({ message: '❌ Current password is incorrect' });
    }

    // ✅ Hash the new password
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    // ✅ Update password in DB
    await db.collection('users').updateOne(
      { user_id: user.userId || user.user_id },
      { $set: { password: hashedPassword } }
    );

    res.status(200).json({ message: '✅ Password updated successfully' });
  } catch (error) {
    console.error('❌ Password change error:', error);
    res.status(500).json({ message: '❌ Server error while changing password' });
  }
};

export { login, changePassword };
export default { login, changePassword };
