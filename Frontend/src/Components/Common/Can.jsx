import React from "react";
import { useSelector } from "react-redux";

/**
 * Declarative component for permission-based UI rendering.
 * Usage:
 *   <Can perform="payroll:update" fallback={<span className="text-gray-400">Read-only</span>}>
 *     <button onClick={handleEdit}>Edit Salary</button>
 *   </Can>
 * 
 *   <Can performAny={["attendance:adjust", "attendance:read:all"]}>
 *     <AdminAttendanceControl />
 *   </Can>
 */
export const Can = ({ perform, performAny, children, fallback = null }) => {
  const roles = useSelector((state) => state.auth.roles || []);
  const permissions = useSelector((state) => state.auth.permissions || []);

  // Super Admin bypasses all checks
  if (roles.includes("ROLE_SUPER_ADMIN")) {
    return <>{children}</>;
  }

  let isAuthorized = false;

  if (perform) {
    isAuthorized = permissions.includes(perform);
  } else if (Array.isArray(performAny)) {
    isAuthorized = performAny.some((p) => permissions.includes(p));
  }

  return isAuthorized ? <>{children}</> : fallback;
};

export default Can;
