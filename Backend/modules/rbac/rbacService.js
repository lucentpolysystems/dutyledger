/**
 * Compiles a flat Set of permission codes given an array of role IDs and direct permissions.
 * Traverses role inheritance (inherits_from) recursively.
 */
async function compileUserPermissions(db, roleIds = [], directPermissions = []) {
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

    const roleDoc = await db.collection("roles").findOne({ role_id: currentRoleId });
    if (!roleDoc) continue;

    if (Array.isArray(roleDoc.permissions)) {
      roleDoc.permissions.forEach((p) => permissionSet.add(p));
    }

    if (Array.isArray(roleDoc.inheritsFrom || roleDoc.inherits_from)) {
      (roleDoc.inheritsFrom || roleDoc.inherits_from).forEach((inheritedId) => {
        if (!visitedRoles.has(inheritedId)) {
          queue.push(inheritedId);
        }
      });
    }
  }

  return Array.from(permissionSet);
}

/**
 * Recomputes and updates a user's cached_permissions and bumps permission_version.
 */
async function recomputeAndSaveUserPermissions(db, userId) {
  const user = await db.collection("users").findOne({ user_id: userId });
  if (!user) return null;

  const compiled = await compileUserPermissions(db, user.roles || [], user.directPermissions || user.direct_permissions || []);

  await db.collection("users").updateOne(
    { user_id: user.userId || user.user_id },
    {
      $set: {
        cached_permissions: compiled,
        updatedAt: new Date(),
      },
      $inc: { permission_version: 1 },
    }
  );

  return compiled;
}

/**
 * Records an immutable audit log entry.
 */
async function logAuditEvent(db, { actor_id, actor_name, action, resource, target_id, details, ip }) {
  try {
    await db.collection("audit_logs").insertOne({
      timestamp: new Date(),
      actor_id: actor_id || "SYSTEM",
      actor_name: actor_name || "System Automated",
      action,
      resource,
      target_id: target_id || null,
      details: details || {},
      ip: ip || "127.0.0.1",
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
