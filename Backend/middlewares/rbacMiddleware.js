import { getDB } from "../config/db.js";

/**
 * Middleware to enforce granular role-based permissions.
 */
const requirePermission = (...requiredPermissions) => {
  return async (req, res, next) => {
    try {
      if (!req.user) {
        return res.status(401).json({ message: "Authentication required" });
      }

      const { user_id, roles } = req.user;

      // 1. Super Admin bypasses all authorization checks
      if (Array.isArray(roles) && roles.includes("ROLE_SUPER_ADMIN")) {
        return next();
      }

      // 2. Fetch fresh user permissions from database
      const db = getDB();
      const user = await db.collection("users").findOne(
        { user_id },
        { projection: { cached_permissions: 1, roles: 1, is_active: 1 } }
      );

      if (!user || user.is_active === false) {
        return res.status(403).json({ message: "Account is inactive or unauthorized" });
      }

      // Check for Super Admin in fresh DB record
      if (Array.isArray(user.roles) && user.roles.includes("ROLE_SUPER_ADMIN")) {
        return next();
      }

      const userPermissions = new Set(user.cached_permissions || []);

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
