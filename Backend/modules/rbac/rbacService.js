import { prisma } from "../../config/db.js";

/**
 * Compiles a flat Set of permission codes given an array of role IDs and direct permissions.
 * Traverses role inheritance (inheritsFrom) recursively using native Prisma.
 */
async function compileUserPermissions(ignoredDb, roleIds = [], directPermissions = []) {
  const permissionSet = new Set(directPermissions || []);

  if (!roleIds || roleIds.length === 0) {
    return Array.from(permissionSet);
  }

  const visitedRoles = new Set();
  const queue = [...roleIds];

  while (queue.length > 0) {
    const currentRoleId = queue.shift();
    if (visitedRoles.has(currentRoleId)) continue;
    visitedRoles.add(currentRoleId);

    const roleDoc = await prisma.role.findFirst({
      where: { roleId: currentRoleId },
    });
    if (!roleDoc) continue;

    if (Array.isArray(roleDoc.permissions)) {
      roleDoc.permissions.forEach((p) => permissionSet.add(p));
    }

    if (Array.isArray(roleDoc.inheritsFrom)) {
      roleDoc.inheritsFrom.forEach((inheritedId) => {
        if (!visitedRoles.has(inheritedId)) {
          queue.push(inheritedId);
        }
      });
    }
  }

  return Array.from(permissionSet);
}

/**
 * Recomputes and updates a user's cachedPermissions and bumps permissionVersion.
 */
async function recomputeAndSaveUserPermissions(ignoredDb, userId) {
  const user = await prisma.user.findFirst({
    where: {
      OR: [{ userId: String(userId) }, { id: String(userId) }],
    },
  });
  if (!user) return null;

  const compiled = await compileUserPermissions(null, user.roles || [], user.directPermissions || []);

  await prisma.user.update({
    where: { id: user.id },
    data: {
      cachedPermissions: compiled,
      permissionVersion: (user.permissionVersion || 1) + 1,
    },
  });

  return compiled;
}

/**
 * Records an immutable audit log entry via native Prisma.
 */
async function logAuditEvent(ignoredDb, { actor_id, actor_name, action, resource, target_id, details, ip }) {
  try {
    await prisma.auditEvent.create({
      data: {
        actorId: actor_id || "SYSTEM",
        actorName: actor_name || "System Automated",
        action,
        resource,
        targetId: target_id || null,
        details: details || {},
        ip: ip || "127.0.0.1",
      },
    });
  } catch (err) {
    console.error("Failed to write audit log:", err.message);
  }
}

export {
  compileUserPermissions,
  recomputeAndSaveUserPermissions,
  logAuditEvent,
};

export default {
  compileUserPermissions,
  recomputeAndSaveUserPermissions,
  logAuditEvent,
};
