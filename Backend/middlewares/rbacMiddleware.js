import { prisma } from "../config/db.js";

/**
 * Middleware to enforce granular role-based permissions (Native Prisma)
 */
const requirePermission = (...requiredPermissions) => {
  return async (req, res, next) => {
    try {
      if (!req.user) {
        return res.status(401).json({ message: "Authentication required" });
      }

      const userId = req.user.user_id || req.user.userId;
      const roles = req.user.roles || [];

      // 1. Super Admin or HR bypasses all authorization checks
      if (roles.includes("ROLE_SUPER_ADMIN") || (req.user.role || "").toLowerCase() === "hr") {
        return next();
      }

      // 2. Fetch fresh user permissions from PostgreSQL database
      const user = await prisma.user.findFirst({
        where: {
          OR: [
            { userId: String(userId) },
            { id: String(userId) },
          ],
        },
        select: {
          roles: true,
          cachedPermissions: true,
          isActive: true,
        },
      });

      if (!user || user.isActive === false) {
        return res.status(403).json({ message: "Account is inactive or unauthorized" });
      }

      // Check for Super Admin in fresh DB record
      if (Array.isArray(user.roles) && user.roles.includes("ROLE_SUPER_ADMIN")) {
        return next();
      }

      const userPermissions = new Set(user.cachedPermissions || []);

      // Check if user satisfies the required permission(s)
      const hasPermission = requiredPermissions.some((perm) => userPermissions.has(perm));

      if (!hasPermission) {
        return res.status(403).json({
          message: "Forbidden: You lack the required permissions for this action.",
          required: requiredPermissions,
        });
      }

      next();
    } catch (err) {
      console.error("RBAC Middleware Error:", err);
      res.status(500).json({ message: "Internal server error during authorization evaluation" });
    }
  };
};

export { requirePermission };
export default { requirePermission };
