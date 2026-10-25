import { prisma } from "../../config/db.js";
import {
  compileUserPermissions,
  recomputeAndSaveUserPermissions,
  logAuditEvent,
} from "./rbacService.js";

// 1. GET ALL ROLES (Native Prisma)
const getAllRoles = async (req, res) => {
  try {
    const roles = await prisma.role.findMany({
      orderBy: { createdAt: "asc" },
    });
    res.status(200).json({ success: true, roles });
  } catch (err) {
    console.error("Error fetching roles:", err);
    res.status(500).json({ message: "Failed to fetch roles" });
  }
};

// 2. CREATE CUSTOM ROLE (Native Prisma)
const createRole = async (req, res) => {
  try {
    const { role_id, name, description, permissions, inherits_from } = req.body;

    if (!role_id || !name) {
      return res.status(400).json({ message: "Role ID and Name are required" });
    }

    const formattedRoleId = role_id.toUpperCase().startsWith("ROLE_")
      ? role_id.toUpperCase()
      : `ROLE_${role_id.toUpperCase().replace(/\s+/g, "_")}`;

    const existing = await prisma.role.findFirst({ where: { roleId: formattedRoleId } });
    if (existing) {
      return res.status(400).json({ message: "Role ID already exists" });
    }

    const newRole = await prisma.role.create({
      data: {
        roleId: formattedRoleId,
        name,
        description: description || "",
        isSystemRole: false,
        inheritsFrom: Array.isArray(inherits_from) ? inherits_from : [],
        permissions: Array.isArray(permissions) ? permissions : [],
      },
    });

    await logAuditEvent(null, {
      actor_id: req.user?.user_id || req.user?.userId,
      actor_name: req.user?.username,
      action: "ROLE_CREATED",
      resource: "roles",
      target_id: formattedRoleId,
      details: { name, permissionsCount: newRole.permissions.length },
      ip: req.ip,
    });

    res.status(201).json({ success: true, message: "Role created successfully", role: newRole });
  } catch (err) {
    console.error("Error creating role:", err);
    res.status(500).json({ message: "Failed to create role" });
  }
};

// 3. UPDATE ROLE PERMISSIONS (Native Prisma)
const updateRole = async (req, res) => {
  try {
    const { roleId } = req.params;
    const { name, description, permissions, inherits_from } = req.body;

    const role = await prisma.role.findFirst({ where: { roleId } });
    if (!role) {
      return res.status(404).json({ message: "Role not found" });
    }

    const data = {};
    if (name) data.name = name;
    if (description !== undefined) data.description = description;
    if (Array.isArray(permissions)) data.permissions = permissions;
    if (Array.isArray(inherits_from)) data.inheritsFrom = inherits_from;

    await prisma.role.update({
      where: { id: role.id },
      data,
    });

    // Recompute permissions for all users assigned this role
    const affectedUsers = await prisma.user.findMany({
      where: { roles: { has: roleId } },
    });
    for (const user of affectedUsers) {
      await recomputeAndSaveUserPermissions(null, user.userId);
    }

    await logAuditEvent(null, {
      actor_id: req.user?.user_id || req.user?.userId,
      actor_name: req.user?.username,
      action: "ROLE_UPDATED",
      resource: "roles",
      target_id: roleId,
      details: { affectedUsersCount: affectedUsers.length, newPermissionsCount: permissions?.length },
      ip: req.ip,
    });

    res.status(200).json({ success: true, message: "Role updated and user permissions recompiled" });
  } catch (err) {
    console.error("Error updating role:", err);
    res.status(500).json({ message: "Failed to update role" });
  }
};

// 4. DELETE CUSTOM ROLE (Native Prisma)
const deleteRole = async (req, res) => {
  try {
    const { roleId } = req.params;

    const role = await prisma.role.findFirst({ where: { roleId } });
    if (!role) {
      return res.status(404).json({ message: "Role not found" });
    }

    if (role.isSystemRole) {
      return res.status(403).json({ message: "Core system roles cannot be deleted" });
    }

    // Remove role from users
    const affectedUsers = await prisma.user.findMany({
      where: { roles: { has: roleId } },
    });
    for (const user of affectedUsers) {
      const filteredRoles = (user.roles || []).filter((r) => r !== roleId);
      await prisma.user.update({
        where: { id: user.id },
        data: { roles: filteredRoles },
      });
      await recomputeAndSaveUserPermissions(null, user.userId);
    }

    await prisma.role.delete({ where: { id: role.id } });

    await logAuditEvent(null, {
      actor_id: req.user?.user_id || req.user?.userId,
      actor_name: req.user?.username,
      action: "ROLE_DELETED",
      resource: "roles",
      target_id: roleId,
      details: { roleName: role.name },
      ip: req.ip,
    });

    res.status(200).json({ success: true, message: "Role deleted successfully" });
  } catch (err) {
    console.error("Error deleting role:", err);
    res.status(500).json({ message: "Failed to delete role" });
  }
};

// 5. GET ALL ATOMIC PERMISSIONS GROUPED (System default matrix)
const getAllPermissions = async (req, res) => {
  try {
    const permissions = [
      { code: "attendance:read:self", name: "View Own Attendance", module: "attendance" },
      { code: "attendance:write:self", name: "Mark Own Attendance", module: "attendance" },
      { code: "attendance:read:all", name: "View All Attendance", module: "attendance" },
      { code: "attendance:write:all", name: "Manage All Attendance", module: "attendance" },
      { code: "payroll:read:self", name: "View Own Payslips", module: "payroll" },
      { code: "payroll:read:all", name: "View All Payroll Records", module: "payroll" },
      { code: "payroll:write:all", name: "Generate & Manage Payroll", module: "payroll" },
      { code: "employees:read:all", name: "View Employees Directory", module: "employees" },
      { code: "employees:write:all", name: "Create & Update Employees", module: "employees" },
      { code: "holidays:read:all", name: "View Holiday Calendar", module: "calendar" },
      { code: "holidays:write:all", name: "Manage Holidays", module: "calendar" },
      { code: "announcements:read", name: "Read Announcements", module: "announcements" },
      { code: "announcements:write", name: "Publish Announcements", module: "announcements" },
      { code: "rbac:admin", name: "Manage Roles & Permissions", module: "rbac" },
    ];

    const grouped = permissions.reduce((acc, perm) => {
      acc[perm.module] = acc[perm.module] || [];
      acc[perm.module].push(perm);
      return acc;
    }, {});

    res.status(200).json({ success: true, permissions, grouped });
  } catch (err) {
    console.error("Error fetching permissions:", err);
    res.status(500).json({ message: "Failed to fetch permissions" });
  }
};

// 6. GET USERS AND ASSIGNED ROLES (Native Prisma)
const getUsersWithRoles = async (req, res) => {
  try {
    const users = await prisma.user.findMany({
      select: {
        id: true,
        userId: true,
        username: true,
        email: true,
        role: true,
        roles: true,
        cachedPermissions: true,
        designation: true,
        isActive: true,
      },
      orderBy: { createdAt: "desc" },
    });

    const mapped = users.map((u) => ({
      ...u,
      user_id: u.userId,
      cached_permissions: u.cachedPermissions,
      is_active: u.isActive,
    }));

    res.status(200).json({ success: true, users: mapped });
  } catch (err) {
    console.error("Error fetching users with roles:", err);
    res.status(500).json({ message: "Failed to fetch users" });
  }
};

// 7. ASSIGN ROLES TO USER (Native Prisma)
const assignUserRoles = async (req, res) => {
  try {
    const { userId } = req.params;
    const { roles } = req.body;

    if (!Array.isArray(roles) || roles.length === 0) {
      return res.status(400).json({ message: "At least one role must be assigned" });
    }

    const user = await prisma.user.findFirst({
      where: {
        OR: [{ userId: String(userId) }, { id: String(userId) }],
      },
    });

    if (!user) {
      return res.status(404).json({ message: "Employee user not found" });
    }

    const roleName = roles.includes("ROLE_SUPER_ADMIN")
      ? "super_admin"
      : roles.includes("ROLE_ADMIN")
      ? "admin"
      : roles.includes("ROLE_HR") || roles.includes("ROLE_HR_ADMIN")
      ? "hr"
      : roles.includes("ROLE_MANAGER")
      ? "manager"
      : roles.includes("ROLE_TEAM_LEADER")
      ? "team_leader"
      : "employee";

    await prisma.user.update({
      where: { id: user.id },
      data: {
        roles,
        role: roleName,
      },
    });

    // Recompute cached permissions
    const newPermissions = await recomputeAndSaveUserPermissions(null, user.userId);

    await logAuditEvent(null, {
      actor_id: req.user?.user_id || req.user?.userId,
      actor_name: req.user?.username,
      action: "USER_ROLES_ASSIGNED",
      resource: "users",
      target_id: user.userId,
      details: { previousRoles: user.roles, assignedRoles: roles, newPermissionsCount: newPermissions?.length },
      ip: req.ip,
    });

    res.status(200).json({
      success: true,
      message: "Roles assigned and permissions compiled successfully",
      roles,
      permissions: newPermissions,
    });
  } catch (err) {
    console.error("Error assigning roles:", err);
    res.status(500).json({ message: "Failed to assign roles" });
  }
};

// 8. GET AUDIT LOGS (Native Prisma)
const getAuditLogs = async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 50;
    const logs = await prisma.auditEvent.findMany({
      orderBy: { timestamp: "desc" },
      take: limit,
    });

    res.status(200).json({ success: true, logs });
  } catch (err) {
    console.error("Error fetching audit logs:", err);
    res.status(500).json({ message: "Failed to fetch audit logs" });
  }
};

export {
  getAllRoles,
  createRole,
  updateRole,
  deleteRole,
  getAllPermissions,
  getUsersWithRoles,
  assignUserRoles,
  getAuditLogs,
};

export default {
  getAllRoles,
  createRole,
  updateRole,
  deleteRole,
  getAllPermissions,
  getUsersWithRoles,
  assignUserRoles,
  getAuditLogs,
};
