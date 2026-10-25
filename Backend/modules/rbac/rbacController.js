import { getDB, prisma } from "../../config/db.js";
import {
  compileUserPermissions,
  recomputeAndSaveUserPermissions,
  logAuditEvent,
} from "./rbacService.js";

// 1. GET ALL ROLES
const getAllRoles = async (req, res) => {
  try {
    const db = getDB();
    const roles = await db.collection("roles").find({}).toArray();
    res.status(200).json({ success: true, roles });
  } catch (err) {
    console.error("Error fetching roles:", err);
    res.status(500).json({ message: "Failed to fetch roles" });
  }
};

// 2. CREATE CUSTOM ROLE
const createRole = async (req, res) => {
  try {
    const db = getDB();
    const { role_id, name, description, permissions, inherits_from } = req.body;

    if (!role_id || !name) {
      return res.status(400).json({ message: "Role ID and Name are required" });
    }

    const formattedRoleId = role_id.toUpperCase().startsWith("ROLE_")
      ? role_id.toUpperCase()
      : `ROLE_${role_id.toUpperCase().replace(/\s+/g, "_")}`;

    const existing = await db.collection("roles").findOne({ role_id: formattedRoleId });
    if (existing) {
      return res.status(400).json({ message: "Role ID already exists" });
    }

    const newRole = {
      role_id: formattedRoleId,
      name,
      description: description || "",
      is_system_role: false,
      inherits_from: Array.isArray(inherits_from) ? inherits_from : [],
      permissions: Array.isArray(permissions) ? permissions : [],
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    await db.collection("roles").insertOne(newRole);

    await logAuditEvent(db, {
      actor_id: req.user?.user_id,
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

// 3. UPDATE ROLE PERMISSIONS
const updateRole = async (req, res) => {
  try {
    const db = getDB();
    const { roleId } = req.params;
    const { name, description, permissions, inherits_from } = req.body;

    const role = await db.collection("roles").findOne({ role_id: roleId });
    if (!role) {
      return res.status(404).json({ message: "Role not found" });
    }

    const updateFields = { updatedAt: new Date() };
    if (name) updateFields.name = name;
    if (description !== undefined) updateFields.description = description;
    if (Array.isArray(permissions)) updateFields.permissions = permissions;
    if (Array.isArray(inherits_from)) updateFields.inherits_from = inherits_from;

    await db.collection("roles").updateOne({ role_id: roleId }, { $set: updateFields });

    // Invalidate and recompute permissions for all users assigned this role
    const affectedUsers = await db.collection("users").find({ roles: roleId }).toArray();
    for (const user of affectedUsers) {
      await recomputeAndSaveUserPermissions(db, user.user_id);
    }

    await logAuditEvent(db, {
      actor_id: req.user?.user_id,
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

// 4. DELETE CUSTOM ROLE
const deleteRole = async (req, res) => {
  try {
    const db = getDB();
    const { roleId } = req.params;

    const role = await db.collection("roles").findOne({ role_id: roleId });
    if (!role) {
      return res.status(404).json({ message: "Role not found" });
    }

    if (role.is_system_role) {
      return res.status(403).json({ message: "Core system roles cannot be deleted" });
    }

    // Remove this role from any users who had it
    await db.collection("users").updateMany({ roles: roleId }, { $pull: { roles: roleId } });

    await db.collection("roles").deleteOne({ role_id: roleId });

    await logAuditEvent(db, {
      actor_id: req.user?.user_id,
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

// 5. GET ALL ATOMIC PERMISSIONS GROUPED
const getAllPermissions = async (req, res) => {
  try {
    const db = getDB();
    const permissions = await db.collection("permissions").find({}).toArray();

    // Group by module
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

// 6. GET USERS AND ASSIGNED ROLES
const getUsersWithRoles = async (req, res) => {
  try {
    const db = getDB();
    const users = await db
      .collection("users")
      .find(
        {},
        {
          projection: {
            user_id: 1,
            username: 1,
            email: 1,
            role: 1,
            roles: 1,
            cached_permissions: 1,
            designation: 1,
            is_active: 1,
          },
        }
      )
      .toArray();

    res.status(200).json({ success: true, users });
  } catch (err) {
    console.error("Error fetching users with roles:", err);
    res.status(500).json({ message: "Failed to fetch users" });
  }
};

// 7. ASSIGN ROLES TO USER
const assignUserRoles = async (req, res) => {
  try {
    const db = getDB();
    const { userId } = req.params;
    const { roles } = req.body;

    if (!Array.isArray(roles) || roles.length === 0) {
      return res.status(400).json({ message: "At least one role must be assigned" });
    }

    const user = await db.collection("users").findOne({ user_id: userId });
    if (!user) {
      return res.status(404).json({ message: "Employee user not found" });
    }

    // Set updated roles
    await db.collection("users").updateOne(
      { user_id: userId },
      {
        $set: {
          roles,
          role: roles.includes("ROLE_SUPER_ADMIN")
            ? "super_admin"
            : roles.includes("ROLE_ADMIN")
            ? "admin"
            : roles.includes("ROLE_HR") || roles.includes("ROLE_HR_ADMIN")
            ? "hr"
            : roles.includes("ROLE_MANAGER")
            ? "manager"
            : roles.includes("ROLE_TEAM_LEADER")
            ? "team_leader"
            : "employee",
        },
      }
    );

    // Recompute cached permissions
    const newPermissions = await recomputeAndSaveUserPermissions(db, userId);

    await logAuditEvent(db, {
      actor_id: req.user?.user_id,
      actor_name: req.user?.username,
      action: "USER_ROLES_ASSIGNED",
      resource: "users",
      target_id: userId,
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

// 8. GET AUDIT LOGS
const getAuditLogs = async (req, res) => {
  try {
    const db = getDB();
    const limit = parseInt(req.query.limit) || 50;
    const logs = await db
      .collection("audit_logs")
      .find({})
      .sort({ timestamp: -1 })
      .limit(limit)
      .toArray();

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
