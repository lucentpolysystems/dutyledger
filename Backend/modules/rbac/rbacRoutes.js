const express = require("express");
const authenticateToken = require("../../middlewares/authMiddleware");
const { requirePermission } = require("../../middlewares/rbacMiddleware");
const {
  getAllRoles,
  createRole,
  updateRole,
  deleteRole,
  getAllPermissions,
  getUsersWithRoles,
  assignUserRoles,
  getAuditLogs,
} = require("./rbacController");

const router = express.Router();

// Role Management Routes
router.get("/roles", authenticateToken, requirePermission("rbac:roles:manage"), getAllRoles);
router.post("/roles", authenticateToken, requirePermission("rbac:roles:manage"), createRole);
router.put("/roles/:roleId", authenticateToken, requirePermission("rbac:roles:manage"), updateRole);
router.delete("/roles/:roleId", authenticateToken, requirePermission("rbac:roles:manage"), deleteRole);

// Permissions Catalog
router.get("/permissions", authenticateToken, requirePermission("rbac:roles:manage"), getAllPermissions);

// User Role Assignments
router.get("/users", authenticateToken, requirePermission("rbac:users:assign"), getUsersWithRoles);
router.put("/users/:userId/roles", authenticateToken, requirePermission("rbac:users:assign"), assignUserRoles);

// Audit Logs
router.get("/audit-logs", authenticateToken, requirePermission("audit:read:all", "audit:logs:read"), getAuditLogs);

module.exports = router;
