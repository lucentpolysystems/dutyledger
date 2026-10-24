import React, { useState, useEffect } from "react";
import { useSelector } from "react-redux";
import { apiUrl } from "../../utils/api";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import {
  ShieldCheck,
  Users,
  KeyRound,
  FileText,
  Plus,
  Save,
  Trash2,
  CheckCircle2,
  Search,
  Lock,
  Building2,
  Calendar,
  DollarSign,
  Radio,
  Eye,
  AlertCircle,
} from "lucide-react";

const RbacManagement = () => {
  const token = useSelector((state) => state.auth.token);
  const currentUser = useSelector((state) => state.auth.user);

  const [activeTab, setActiveTab] = useState("roles"); // "roles" | "users" | "audit"
  const [loading, setLoading] = useState(false);

  // Data states
  const [roles, setRoles] = useState([]);
  const [permissions, setPermissions] = useState([]);
  const [groupedPermissions, setGroupedPermissions] = useState({});
  const [users, setUsers] = useState([]);
  const [auditLogs, setAuditLogs] = useState([]);

  // Selected role for editing permissions
  const [selectedRole, setSelectedRole] = useState(null);
  const [selectedRolePerms, setSelectedRolePerms] = useState([]);

  // Create role modal state
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newRoleData, setNewRoleData] = useState({
    role_id: "",
    name: "",
    description: "",
    permissions: [],
  });

  // User search
  const [userSearchTerm, setUserSearchTerm] = useState("");

  // Edit user roles modal state
  const [editingUser, setEditingUser] = useState(null);
  const [selectedUserRoles, setSelectedUserRoles] = useState([]);

  // 1. Fetch Roles and Permissions
  const fetchRbacData = async () => {
    try {
      setLoading(true);
      const [rolesRes, permsRes] = await Promise.all([
        fetch(apiUrl("/api/rbac/roles"), {
          headers: { Authorization: `Bearer ${token}` },
        }),
        fetch(apiUrl("/api/rbac/permissions"), {
          headers: { Authorization: `Bearer ${token}` },
        }),
      ]);

      const rolesData = await rolesRes.json();
      const permsData = await permsRes.json();

      if (rolesRes.ok && rolesData.roles) {
        setRoles(rolesData.roles);
        if (!selectedRole && rolesData.roles.length > 0) {
          setSelectedRole(rolesData.roles[0]);
          setSelectedRolePerms(rolesData.roles[0].permissions || []);
        }
      }

      if (permsRes.ok && permsData.permissions) {
        setPermissions(permsData.permissions);
        setGroupedPermissions(permsData.grouped || {});
      }
    } catch (err) {
      console.error("Error loading RBAC definitions:", err);
      toast.error("Failed to load roles and permissions");
    } finally {
      setLoading(false);
    }
  };

  // 2. Fetch Users
  const fetchUsers = async () => {
    try {
      const res = await fetch(apiUrl("/api/rbac/users"), {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (res.ok && data.users) {
        setUsers(data.users);
      }
    } catch (err) {
      console.error("Error loading users:", err);
    }
  };

  // 3. Fetch Audit Logs
  const fetchAuditLogs = async () => {
    try {
      const res = await fetch(apiUrl("/api/rbac/audit-logs?limit=40"), {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (res.ok && data.logs) {
        setAuditLogs(data.logs);
      }
    } catch (err) {
      console.error("Error loading audit logs:", err);
    }
  };

  useEffect(() => {
    fetchRbacData();
    fetchUsers();
    fetchAuditLogs();
  }, [token]);

  // Handle Role Selection
  const handleSelectRole = (role) => {
    setSelectedRole(role);
    setSelectedRolePerms(role.permissions || []);
  };

  // Toggle permission checkbox for selected role
  const handleTogglePermission = (code) => {
    if (selectedRolePerms.includes(code)) {
      setSelectedRolePerms(selectedRolePerms.filter((p) => p !== code));
    } else {
      setSelectedRolePerms([...selectedRolePerms, code]);
    }
  };

  // Save Permissions to Selected Role
  const handleSaveRolePermissions = async () => {
    if (!selectedRole) return;
    try {
      setLoading(true);
      const res = await fetch(apiUrl(`/api/rbac/roles/${selectedRole.role_id}`), {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          permissions: selectedRolePerms,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        toast.error(data.message || "Failed to update role permissions");
        return;
      }

      toast.success(`Permissions for ${selectedRole.name} updated!`);
      // Update local state
      setRoles(
        roles.map((r) =>
          r.role_id === selectedRole.role_id ? { ...r, permissions: selectedRolePerms } : r
        )
      );
      fetchAuditLogs();
    } catch (err) {
      console.error("Error updating role permissions:", err);
      toast.error("Failed to save role permissions");
    } finally {
      setLoading(false);
    }
  };

  // Create New Role
  const handleCreateRole = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);
      const res = await fetch(apiUrl("/api/rbac/roles"), {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(newRoleData),
      });

      const data = await res.json();
      if (!res.ok) {
        toast.error(data.message || "Failed to create role");
        return;
      }

      toast.success("New role registered successfully!");
      setShowCreateModal(false);
      setNewRoleData({ role_id: "", name: "", description: "", permissions: [] });
      fetchRbacData();
      fetchAuditLogs();
    } catch (err) {
      console.error("Error creating role:", err);
      toast.error("Error creating role");
    } finally {
      setLoading(false);
    }
  };

  // Delete Custom Role
  const handleDeleteRole = async (roleId) => {
    if (!window.confirm("Are you sure you want to delete this custom role?")) return;
    try {
      setLoading(true);
      const res = await fetch(apiUrl(`/api/rbac/roles/${roleId}`), {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });

      const data = await res.json();
      if (!res.ok) {
        toast.error(data.message || "Failed to delete role");
        return;
      }

      toast.success("Role deleted successfully");
      fetchRbacData();
      fetchAuditLogs();
    } catch (err) {
      console.error("Error deleting role:", err);
      toast.error("Failed to delete role");
    } finally {
      setLoading(false);
    }
  };

  // Open User Role Assignment Modal
  const handleOpenAssignModal = (user) => {
    setEditingUser(user);
    setSelectedUserRoles(user.roles || (user.role?.toLowerCase() === "hr" ? ["ROLE_HR_ADMIN"] : ["ROLE_EMPLOYEE"]));
  };

  // Save Assigned Roles for User
  const handleSaveUserRoles = async () => {
    if (!editingUser) return;
    try {
      setLoading(true);
      const res = await fetch(apiUrl(`/api/rbac/users/${editingUser.user_id}/roles`), {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ roles: selectedUserRoles }),
      });

      const data = await res.json();
      if (!res.ok) {
        toast.error(data.message || "Failed to assign roles");
        return;
      }

      toast.success(`Roles updated for ${editingUser.username}!`);
      setEditingUser(null);
      fetchUsers();
      fetchAuditLogs();
    } catch (err) {
      console.error("Error assigning roles:", err);
      toast.error("Error assigning roles");
    } finally {
      setLoading(false);
    }
  };

  // Filtered Users for Assignment Tab
  const filteredUsers = users.filter((u) => {
    const q = userSearchTerm.toLowerCase();
    return (
      (u.username || "").toLowerCase().includes(q) ||
      (u.user_id || "").toLowerCase().includes(q) ||
      (u.email || "").toLowerCase().includes(q)
    );
  });

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-6">
      
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-slate-200">
        <div>
          <div className="flex items-center gap-2 text-xs font-bold text-sky-600 uppercase tracking-wider mb-1">
            <ShieldCheck className="w-4 h-4" /> Security & Governance • Lucent Polysystem Pvt. Ltd.
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            Role-Based Access Control (RBAC)
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Configure system roles, granular permissions, employee privileges, and inspect compliance audit logs.
          </p>
        </div>

        {/* Top Actions */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowCreateModal(true)}
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-sky-600 hover:bg-sky-700 text-white rounded-xl text-xs font-bold shadow-md transition cursor-pointer"
          >
            <Plus className="w-4 h-4" /> Create Custom Role
          </button>
        </div>
      </div>

      {/* Stats Counter Bar */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-xs">
          <div className="text-xs font-bold text-slate-500 uppercase">Configured Roles</div>
          <div className="text-2xl font-black text-slate-900 mt-1">{roles.length}</div>
        </div>
        <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-xs">
          <div className="text-xs font-bold text-slate-500 uppercase">Atomic Permissions</div>
          <div className="text-2xl font-black text-sky-600 mt-1">{permissions.length}</div>
        </div>
        <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-xs">
          <div className="text-xs font-bold text-slate-500 uppercase">Managed Employees</div>
          <div className="text-2xl font-black text-emerald-600 mt-1">{users.length}</div>
        </div>
        <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-xs">
          <div className="text-xs font-bold text-slate-500 uppercase">Audit Ledger Records</div>
          <div className="text-2xl font-black text-indigo-600 mt-1">{auditLogs.length}</div>
        </div>
      </div>

      {/* Main Tabs */}
      <div className="flex border-b border-slate-200 space-x-6 text-sm font-bold">
        <button
          onClick={() => setActiveTab("roles")}
          className={`pb-3 border-b-2 flex items-center gap-2 transition cursor-pointer ${
            activeTab === "roles"
              ? "border-sky-600 text-sky-600"
              : "border-transparent text-slate-500 hover:text-slate-800"
          }`}
        >
          <KeyRound className="w-4 h-4" /> Role Catalog & Permission Matrix
        </button>

        <button
          onClick={() => setActiveTab("users")}
          className={`pb-3 border-b-2 flex items-center gap-2 transition cursor-pointer ${
            activeTab === "users"
              ? "border-sky-600 text-sky-600"
              : "border-transparent text-slate-500 hover:text-slate-800"
          }`}
        >
          <Users className="w-4 h-4" /> Employee Role Assignments
        </button>

        <button
          onClick={() => setActiveTab("audit")}
          className={`pb-3 border-b-2 flex items-center gap-2 transition cursor-pointer ${
            activeTab === "audit"
              ? "border-sky-600 text-sky-600"
              : "border-transparent text-slate-500 hover:text-slate-800"
          }`}
        >
          <FileText className="w-4 h-4" /> Compliance & Audit Logs
        </button>
      </div>

      {/* ============================================================== */}
      {/* TAB 1: ROLE CATALOG & PERMISSION MATRIX                        */}
      {/* ============================================================== */}
      {activeTab === "roles" && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          
          {/* Roles Selector List (Left 4 cols) */}
          <div className="lg:col-span-4 bg-white rounded-2xl border border-slate-200 p-4 space-y-3">
            <div className="text-xs font-extrabold uppercase text-slate-400 tracking-wider">
              System & Custom Roles
            </div>

            <div className="space-y-2">
              {roles.map((role) => {
                const isSelected = selectedRole?.role_id === role.role_id;
                return (
                  <div
                    key={role.role_id}
                    onClick={() => handleSelectRole(role)}
                    className={`p-3.5 rounded-xl border transition-all cursor-pointer flex items-center justify-between ${
                      isSelected
                        ? "bg-sky-50 border-sky-300 shadow-xs"
                        : "bg-white border-slate-200/80 hover:bg-slate-50"
                    }`}
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-sm text-slate-900">{role.name}</span>
                        {role.is_system_role && (
                          <span className="text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded bg-slate-100 text-slate-600">
                            Core
                          </span>
                        )}
                      </div>
                      <div className="text-xs text-slate-500 font-mono mt-0.5">{role.role_id}</div>
                      <div className="text-[11px] text-sky-700 font-semibold mt-1">
                        {role.permissions?.length || 0} permissions granted
                      </div>
                    </div>

                    {!role.is_system_role && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteRole(role.role_id);
                        }}
                        className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition"
                        title="Delete Role"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Permission Matrix Editor (Right 8 cols) */}
          <div className="lg:col-span-8 bg-white rounded-2xl border border-slate-200 p-6 space-y-6">
            {selectedRole ? (
              <>
                <div className="pb-4 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <h2 className="text-xl font-black text-slate-900">{selectedRole.name}</h2>
                      <span className="text-xs font-mono font-bold px-2 py-0.5 bg-slate-100 text-slate-700 rounded">
                        {selectedRole.role_id}
                      </span>
                    </div>
                    <p className="text-xs text-slate-500 mt-1">{selectedRole.description}</p>
                  </div>

                  <button
                    onClick={handleSaveRolePermissions}
                    disabled={loading || selectedRole.role_id === "ROLE_SUPER_ADMIN"}
                    className="inline-flex items-center gap-2 px-5 py-2.5 bg-sky-600 hover:bg-sky-700 disabled:bg-slate-300 text-white rounded-xl text-xs font-bold shadow-md transition cursor-pointer"
                  >
                    <Save className="w-4 h-4" /> Save Permission Changes
                  </button>
                </div>

                {selectedRole.role_id === "ROLE_SUPER_ADMIN" && (
                  <div className="p-3.5 rounded-xl bg-amber-50 border border-amber-200 text-xs text-amber-800 flex items-center gap-2">
                    <ShieldCheck className="w-4 h-4 text-amber-600 shrink-0" />
                    <strong>Notice:</strong> The Super Administrator role holds unconditional sovereignty over all system modules.
                  </div>
                )}

                {/* Module-Wise Permission Accordion / Checkboxes */}
                <div className="space-y-5">
                  {Object.entries(groupedPermissions).map(([moduleName, perms]) => (
                    <div key={moduleName} className="p-4 rounded-xl bg-slate-50/70 border border-slate-200/90 space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="font-extrabold text-xs uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
                          <Lock className="w-3.5 h-3.5 text-sky-600" />
                          Module: {moduleName}
                        </span>
                        <span className="text-[11px] text-slate-500 font-semibold">
                          {perms.filter((p) => selectedRolePerms.includes(p.code)).length} of {perms.length} selected
                        </span>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                        {perms.map((perm) => {
                          const isChecked = selectedRolePerms.includes(perm.code);
                          const isSuper = selectedRole.role_id === "ROLE_SUPER_ADMIN";
                          return (
                            <label
                              key={perm.code}
                              className={`p-2.5 rounded-lg border text-xs flex items-start gap-2.5 transition cursor-pointer ${
                                isChecked
                                  ? "bg-white border-sky-300 shadow-2xs"
                                  : "bg-slate-100/50 border-slate-200 text-slate-500"
                              }`}
                            >
                              <input
                                type="checkbox"
                                disabled={isSuper}
                                checked={isChecked}
                                onChange={() => handleTogglePermission(perm.code)}
                                className="w-4 h-4 mt-0.5 accent-sky-600 rounded cursor-pointer"
                              />
                              <div>
                                <div className="font-mono font-bold text-slate-800 text-[11px]">
                                  {perm.code}
                                </div>
                                <div className="text-[11px] text-slate-500 mt-0.5">
                                  {perm.description}
                                </div>
                              </div>
                            </label>
                          );
                        })}
                      </div>
                    </div>
                  ))}
                </div>
              </>
            ) : (
              <div className="text-center py-12 text-slate-400 text-sm">
                Select a role from the left to inspect and configure permissions.
              </div>
            )}
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* TAB 2: USER ROLE ASSIGNMENTS                                  */}
      {/* ============================================================== */}
      {activeTab === "users" && (
        <div className="bg-white rounded-2xl border border-slate-200 p-6 space-y-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h2 className="text-xl font-bold text-slate-900">Employee Role Delegation</h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Assign single or multiple operational roles to individual staff members.
              </p>
            </div>

            {/* Search Input */}
            <div className="relative w-full sm:w-72">
              <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
              <input
                type="text"
                placeholder="Search by ID, Name, Email..."
                className="w-full pl-9 pr-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:ring-2 focus:ring-sky-500"
                value={userSearchTerm}
                onChange={(e) => setUserSearchTerm(e.target.value)}
              />
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-500 uppercase tracking-wider font-extrabold border-y border-slate-200">
                <tr>
                  <th className="py-3 px-4">User ID</th>
                  <th className="py-3 px-4">Employee Name</th>
                  <th className="py-3 px-4">Official Designation</th>
                  <th className="py-3 px-4">Assigned Roles</th>
                  <th className="py-3 px-4">Permissions</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredUsers.map((user) => {
                  const userRoleList = user.roles && user.roles.length > 0
                    ? user.roles
                    : (user.role?.toLowerCase() === "hr" ? ["ROLE_HR_ADMIN"] : ["ROLE_EMPLOYEE"]);

                  return (
                    <tr key={user.user_id} className="hover:bg-slate-50/80 transition">
                      <td className="py-3 px-4 font-mono font-bold text-slate-800">{user.user_id}</td>
                      <td className="py-3 px-4">
                        <div className="font-bold text-slate-900">{user.username}</div>
                        <div className="text-[11px] text-slate-400">{user.email}</div>
                      </td>
                      <td className="py-3 px-4 text-slate-600">{user.designation || "Staff Member"}</td>
                      <td className="py-3 px-4">
                        <div className="flex flex-wrap gap-1">
                          {userRoleList.map((rId) => (
                            <span
                              key={rId}
                              className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded ${
                                rId.includes("SUPER")
                                  ? "bg-purple-100 text-purple-800"
                                  : rId.includes("HR")
                                  ? "bg-sky-100 text-sky-800"
                                  : rId.includes("PAYROLL")
                                  ? "bg-emerald-100 text-emerald-800"
                                  : "bg-slate-100 text-slate-700"
                              }`}
                            >
                              {rId.replace("ROLE_", "")}
                            </span>
                          ))}
                        </div>
                      </td>
                      <td className="py-3 px-4 text-slate-500 font-mono text-[11px]">
                        {user.cached_permissions?.length || 0} active
                      </td>
                      <td className="py-3 px-4 text-right">
                        <button
                          onClick={() => handleOpenAssignModal(user)}
                          className="px-3 py-1.5 bg-slate-100 hover:bg-sky-50 hover:text-sky-700 text-slate-700 font-bold rounded-lg transition cursor-pointer"
                        >
                          Modify Roles
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* TAB 3: COMPLIANCE & AUDIT LOGS                                 */}
      {/* ============================================================== */}
      {activeTab === "audit" && (
        <div className="bg-white rounded-2xl border border-slate-200 p-6 space-y-4">
          <div className="flex items-center justify-between pb-4 border-b border-slate-100">
            <div>
              <h2 className="text-xl font-bold text-slate-900">System Security Audit Ledger</h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Immutable historical records of role creation, permission edits, and user delegations.
              </p>
            </div>
            <button
              onClick={fetchAuditLogs}
              className="text-xs font-bold text-sky-600 hover:text-sky-700 transition"
            >
              Refresh Logs
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-500 uppercase tracking-wider font-extrabold border-y border-slate-200">
                <tr>
                  <th className="py-3 px-4">Timestamp</th>
                  <th className="py-3 px-4">Actor</th>
                  <th className="py-3 px-4">Action</th>
                  <th className="py-3 px-4">Target Resource</th>
                  <th className="py-3 px-4">Details</th>
                  <th className="py-3 px-4 font-mono text-slate-400">IP</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-mono">
                {auditLogs.map((log) => (
                  <tr key={log._id} className="hover:bg-slate-50/70">
                    <td className="py-2.5 px-4 text-slate-500 text-[11px]">
                      {new Date(log.timestamp).toLocaleString()}
                    </td>
                    <td className="py-2.5 px-4 font-bold text-slate-800">
                      {log.actor_name} ({log.actor_id})
                    </td>
                    <td className="py-2.5 px-4">
                      <span className="font-bold text-sky-700 bg-sky-50 px-2 py-0.5 rounded text-[10px]">
                        {log.action}
                      </span>
                    </td>
                    <td className="py-2.5 px-4 text-slate-700">{log.target_id || log.resource}</td>
                    <td className="py-2.5 px-4 text-slate-500 text-[10px] max-w-xs truncate">
                      {JSON.stringify(log.details)}
                    </td>
                    <td className="py-2.5 px-4 text-slate-400 text-[10px]">{log.ip}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* MODAL: CREATE CUSTOM ROLE                                      */}
      {/* ============================================================== */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 space-y-4 shadow-2xl animate-fadeIn">
            <h3 className="text-lg font-bold text-slate-900">Create New System / Operational Role</h3>
            <form onSubmit={handleCreateRole} className="space-y-3.5 text-xs">
              <div>
                <label className="block font-bold text-slate-600 uppercase mb-1">Role Identifier Code</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. ROLE_QUALITY_INSPECTOR"
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg font-mono uppercase"
                  value={newRoleData.role_id}
                  onChange={(e) => setNewRoleData({ ...newRoleData, role_id: e.target.value })}
                />
              </div>

              <div>
                <label className="block font-bold text-slate-600 uppercase mb-1">Role Display Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Quality & Plant Inspector"
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                  value={newRoleData.name}
                  onChange={(e) => setNewRoleData({ ...newRoleData, name: e.target.value })}
                />
              </div>

              <div>
                <label className="block font-bold text-slate-600 uppercase mb-1">Description</label>
                <textarea
                  rows="2"
                  placeholder="Brief summary of duties and operational bounds"
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                  value={newRoleData.description}
                  onChange={(e) => setNewRoleData({ ...newRoleData, description: e.target.value })}
                />
              </div>

              <div className="pt-3 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 border border-slate-300 rounded-lg font-bold text-slate-600 hover:bg-slate-50 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-4 py-2 bg-sky-600 hover:bg-sky-700 text-white rounded-lg font-bold shadow-md cursor-pointer"
                >
                  Register Role
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* MODAL: EDIT USER ROLES                                         */}
      {/* ============================================================== */}
      {editingUser && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 space-y-4 shadow-2xl animate-fadeIn">
            <div>
              <h3 className="text-lg font-bold text-slate-900">Assign Roles to Employee</h3>
              <p className="text-xs text-slate-500 mt-0.5">
                {editingUser.username} ({editingUser.user_id}) • {editingUser.email}
              </p>
            </div>

            <div className="space-y-2 max-h-72 overflow-y-auto p-1">
              {roles.map((role) => {
                const isAssigned = selectedUserRoles.includes(role.role_id);
                return (
                  <label
                    key={role.role_id}
                    className={`p-3 rounded-xl border text-xs flex items-center justify-between cursor-pointer transition ${
                      isAssigned ? "bg-sky-50 border-sky-300" : "bg-slate-50 border-slate-200"
                    }`}
                  >
                    <div>
                      <div className="font-bold text-slate-800">{role.name}</div>
                      <div className="text-[10px] text-slate-500 font-mono">{role.role_id}</div>
                    </div>
                    <input
                      type="checkbox"
                      checked={isAssigned}
                      onChange={() => {
                        if (isAssigned) {
                          setSelectedUserRoles(selectedUserRoles.filter((r) => r !== role.role_id));
                        } else {
                          setSelectedUserRoles([...selectedUserRoles, role.role_id]);
                        }
                      }}
                      className="w-4 h-4 accent-sky-600 rounded cursor-pointer"
                    />
                  </label>
                );
              })}
            </div>

            <div className="pt-2 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setEditingUser(null)}
                className="px-4 py-2 border border-slate-300 rounded-lg text-xs font-bold text-slate-600 hover:bg-slate-50 cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSaveUserRoles}
                disabled={loading || selectedUserRoles.length === 0}
                className="px-5 py-2 bg-sky-600 hover:bg-sky-700 disabled:bg-slate-300 text-white rounded-lg text-xs font-bold shadow-md cursor-pointer"
              >
                Apply & Save Roles
              </button>
            </div>
          </div>
        </div>
      )}

      <ToastContainer />
    </div>
  );
};

export default RbacManagement;
