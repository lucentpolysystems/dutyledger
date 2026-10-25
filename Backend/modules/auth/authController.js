import jwt from 'jsonwebtoken';
import bcrypt from 'bcrypt';
import { prisma } from '../../config/db.js';

const JWT_SECRET = process.env.JWT_SECRET || "dutyledger_jwt_super_secret_key_2026";
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '7d';

// ✅ LOGIN CONTROLLER (Native Prisma)
const login = async (req, res) => {
  try {
    const { username, password, id } = req.body;

    if (!username || !password || !id) {
      return res.status(400).json({ message: 'All fields required' });
    }

    // Direct, indexed Prisma lookup by username or userId
    const user = await prisma.user.findFirst({
      where: {
        OR: [
          { username: String(username).trim() },
          { email: String(username).trim() },
        ],
      },
    });

    if (!user) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    const isMatch = await bcrypt.compare(password, user.password || "");
    if (!isMatch || user.userId !== id.trim()) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    const userRoles = Array.isArray(user.roles) && user.roles.length > 0
      ? user.roles
      : (user.role || "").toLowerCase() === "hr"
        ? ["ROLE_SUPER_ADMIN", "ROLE_HR_ADMIN"]
        : ["ROLE_EMPLOYEE"];

    const userPermissions = Array.isArray(user.cachedPermissions)
      ? user.cachedPermissions
      : [];

    // ✅ Generate JWT token with RBAC roles
    const token = jwt.sign(
      {
        userId: user.id.toString(),
        user_id: user.userId,
        username: user.username,
        email: user.email,
        role: user.role,
        roles: userRoles,
        department: user.department || "General",
        reporting_to: user.reportingTo || null,
        designation: user.designation || "Staff",
        pv: user.permissionVersion || 1,
      },
      JWT_SECRET,
      { expiresIn: JWT_EXPIRES_IN }
    );

    res.json({
      message: '✅ Login successful',
      token,
      user: {
        id: user.userId,
        username: user.username,
        email: user.email,
        role: (user.role || "").toLowerCase(),
        roles: userRoles,
        department: user.department || "General",
        reporting_to: user.reportingTo || null,
        designation: user.designation || "Staff",
        permissions: userPermissions,
      },
    });
  } catch (error) {
    console.error("❌ Login error:", error);
    res.status(500).json({ message: "Server error during login" });
  }
};

// ✅ CHANGE PASSWORD CONTROLLER (Native Prisma)
const changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    const lookupId = req.user?.user_id || req.user?.userId;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({ message: '⚠️ All fields required' });
    }

    const user = await prisma.user.findFirst({
      where: {
        OR: [
          { userId: String(lookupId) },
          { id: String(lookupId) },
        ],
      },
    });

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

    // ✅ Update password natively in PostgreSQL
    await prisma.user.update({
      where: { id: user.id },
      data: { password: hashedPassword },
    });

    res.status(200).json({ message: '✅ Password updated successfully' });
  } catch (error) {
    console.error('❌ Password change error:', error);
    res.status(500).json({ message: '❌ Server error while changing password' });
  }
};

export { login, changePassword };
export default { login, changePassword };
