const { MongoClient } = require("mongodb");
const bcrypt = require("bcrypt");
const path = require("path");
require("dotenv").config({ path: path.join(__dirname, "../../auth.env") });

const mongoURI = process.env.MONGO_URI || "mongodb://localhost:27017/Attendance";
const dbName = "Attendance";

// 1. ATOMIC PERMISSIONS CATALOG (35 Granular Permissions across 9 Business Modules)
const standardPermissions = [
  // RBAC & Access Control
  { code: "rbac:roles:manage", module: "rbac", resource: "roles", action: "manage", description: "Create, modify, and delete custom roles" },
  { code: "rbac:permissions:assign", module: "rbac", resource: "roles", action: "assign", description: "Assign and revoke roles & permissions for users" },

  // System User Accounts
  { code: "users:read:all", module: "users", resource: "accounts", action: "read_all", description: "View system user credentials and account states" },
  { code: "users:create", module: "users", resource: "accounts", action: "create", description: "Provision new user login accounts" },
  { code: "users:status:toggle", module: "users", resource: "accounts", action: "toggle", description: "Activate, suspend, or unlock user accounts" },

  // System Settings
  { code: "settings:manage", module: "settings", resource: "system", action: "manage", description: "Configure system-wide parameters, geofence, and policies" },

  // Employee Directory
  { code: "employees:read:self", module: "employees", resource: "directory", action: "read_self", description: "View own employee dossier" },
  { code: "employees:read:team", module: "employees", resource: "directory", action: "read_team", description: "View team / shift member profiles" },
  { code: "employees:read:dept", module: "employees", resource: "directory", action: "read_dept", description: "View department employee rosters" },
  { code: "employees:read:all", module: "employees", resource: "directory", action: "read_all", description: "View corporate-wide employee directory" },
  { code: "employees:create", module: "employees", resource: "directory", action: "create", description: "Onboard and register new employees" },
  { code: "employees:update", module: "employees", resource: "directory", action: "update", description: "Modify employment records, designations, and addresses" },
  { code: "employees:delete", module: "employees", resource: "directory", action: "delete", description: "Terminate or archive employee records" },

  // Attendance & Shifts
  { code: "attendance:mark:self", module: "attendance", resource: "records", action: "mark_self", description: "Geofenced daily punch-in and punch-out" },
  { code: "attendance:read:self", module: "attendance", resource: "records", action: "read_self", description: "View personal monthly attendance calendar & time logs" },
  { code: "attendance:read:team", module: "attendance", resource: "records", action: "read_team", description: "View line worker shift attendance" },
  { code: "attendance:read:dept", module: "attendance", resource: "records", action: "read_dept", description: "View department attendance summaries" },
  { code: "attendance:read:all", module: "attendance", resource: "records", action: "read_all", description: "View company-wide attendance and anomalies" },
  { code: "attendance:adjust", module: "attendance", resource: "records", action: "adjust", description: "Regularize missing punches or adjust shifts" },
  { code: "attendance:export", module: "attendance", resource: "records", action: "export", description: "Export attendance registers to Excel/CSV" },

  // Payroll & Compensation
  { code: "payroll:read:self", module: "payroll", resource: "slips", action: "read_self", description: "View and download personal monthly payslips" },
  { code: "payroll:read:dept_summary", module: "payroll", resource: "summary", action: "read_dept", description: "View department total compensation aggregates" },
  { code: "payroll:read:all", module: "payroll", resource: "slips", action: "read_all", description: "View corporate payroll registers and salary data" },
  { code: "payroll:structure:manage", module: "payroll", resource: "structure", action: "manage", description: "Configure base salary, HRA, PF, tax, and bonus structure" },
  { code: "payroll:slip:generate", module: "payroll", resource: "slips", action: "generate", description: "Calculate monthly attendance deductions and generate slips" },
  { code: "payroll:disburse", module: "payroll", resource: "disbursement", action: "disburse", description: "Approve and disburse monthly employee salaries" },

  // Queries & Helpdesk
  { code: "queries:create", module: "queries", resource: "tickets", action: "create", description: "Submit HR grievances, queries, or requests" },
  { code: "queries:read:team", module: "queries", resource: "tickets", action: "read_team", description: "View support queries submitted by team members" },
  { code: "queries:resolve", module: "queries", resource: "tickets", action: "resolve", description: "Respond to, escalate, and resolve employee queries" },

  // Announcements
  { code: "announcements:read", module: "announcements", resource: "notices", action: "read", description: "Read company notices, circulars, and events" },
  { code: "announcements:publish", module: "announcements", resource: "notices", action: "publish", description: "Draft and broadcast company-wide announcements" },
  { code: "announcements:delete", module: "announcements", resource: "notices", action: "delete", description: "Remove announcements" },

  // Security Audit
  { code: "audit:read:all", module: "audit", resource: "logs", action: "read_all", description: "Inspect administrative, auth, and security audit logs" },
  { code: "audit:export", module: "audit", resource: "logs", action: "export", description: "Export audit trails for external compliance" },
];

// 2. STANDARD SYSTEM ROLES (Strict Separation of Admin vs HR vs Manager vs TL vs Employee)
const standardRoles = [
  {
    role_id: "ROLE_SUPER_ADMIN",
    name: "Super Administrator",
    description: "Enterprise root authority. Break-glass override, platform settings, security, and role delegation.",
    is_system_role: true,
    inherits_from: [],
    permissions: standardPermissions.map((p) => p.code),
  },
  {
    role_id: "ROLE_ADMIN",
    name: "System Administrator",
    description: "IT & System Administration. Manages users, roles, permissions, system settings, and audit logs. (Separated from HR/Payroll operations)",
    is_system_role: true,
    inherits_from: ["ROLE_EMPLOYEE"],
    permissions: [
      "rbac:roles:manage",
      "rbac:permissions:assign",
      "users:read:all",
      "users:create",
      "users:status:toggle",
      "settings:manage",
      "audit:read:all",
      "audit:export",
      "attendance:read:all",
      "attendance:export",
    ],
  },
  {
    role_id: "ROLE_HR",
    name: "HR Manager",
    description: "Human Resources operations. Manages employee onboarding, directory, attendance regularization, payroll, leaves, and announcements.",
    is_system_role: true,
    inherits_from: ["ROLE_EMPLOYEE"],
    permissions: [
      "employees:read:all",
      "employees:create",
      "employees:update",
      "employees:delete",
      "attendance:read:all",
      "attendance:adjust",
      "attendance:export",
      "payroll:read:all",
      "payroll:structure:manage",
      "payroll:slip:generate",
      "payroll:disburse",
      "queries:resolve",
      "announcements:publish",
      "announcements:delete",
    ],
  },
  {
    role_id: "ROLE_MANAGER",
    name: "Department Manager",
    description: "Operations / Plant Manager. Scoped department oversight for shifts, employee reviews, and department attendance.",
    is_system_role: true,
    inherits_from: ["ROLE_EMPLOYEE"],
    permissions: [
      "employees:read:dept",
      "attendance:read:dept",
      "attendance:adjust",
      "payroll:read:dept_summary",
      "queries:read:team",
    ],
  },
  {
    role_id: "ROLE_TEAM_LEADER",
    name: "Team Leader / Line Supervisor",
    description: "Shift In-Charge. Line worker daily punch verification, shift management, and first-line team guidance.",
    is_system_role: true,
    inherits_from: ["ROLE_EMPLOYEE"],
    permissions: [
      "employees:read:team",
      "attendance:read:team",
      "queries:read:team",
    ],
  },
  {
    role_id: "ROLE_EMPLOYEE",
    name: "Standard Employee",
    description: "Self-service portal: Geofenced punch-in/out, personal attendance & calendar, monthly payslips, and queries.",
    is_system_role: true,
    inherits_from: [],
    permissions: [
      "employees:read:self",
      "attendance:mark:self",
      "attendance:read:self",
      "payroll:read:self",
      "queries:create",
      "announcements:read",
    ],
  },
];

// Helper to compile role permissions with inheritance
function resolveRolePermissions(roleId) {
  const permSet = new Set();
  const role = standardRoles.find((r) => r.role_id === roleId);
  if (!role) return [];

  role.permissions.forEach((p) => permSet.add(p));
  if (Array.isArray(role.inherits_from)) {
    role.inherits_from.forEach((parentId) => {
      const parentPerms = resolveRolePermissions(parentId);
      parentPerms.forEach((p) => permSet.add(p));
    });
  }
  return Array.from(permSet);
}

// 3. SAMPLE HIERARCHICAL USERS (Lucent Polysystem Pvt. Ltd.)
const initialUsers = [
  {
    user_id: "SUPER001",
    username: "Super Admin",
    email: "superadmin@lucentpolysystem.com",
    role: "super_admin",
    roles: ["ROLE_SUPER_ADMIN"],
    department: "Executive",
    designation: "Chief Information Security Officer",
    salary: 150000,
    plainPassword: "superadmin123",
  },
  {
    user_id: "ADMIN001",
    username: "Admin User",
    email: "admin@lucentpolysystem.com",
    role: "admin",
    roles: ["ROLE_ADMIN"],
    department: "Information Technology",
    designation: "Systems & Security Administrator",
    salary: 100000,
    plainPassword: "admin123",
  },
  {
    user_id: "HR001",
    username: "Priya Sharma",
    email: "hr@lucentpolysystem.com",
    role: "hr",
    roles: ["ROLE_HR"],
    department: "Human Resources",
    designation: "HR Manager",
    salary: 95000,
    plainPassword: "hr123",
  },
  {
    user_id: "MGR001",
    username: "Rajesh Verma",
    email: "rajesh.verma@lucentpolysystem.com",
    role: "manager",
    roles: ["ROLE_MANAGER"],
    department: "Production",
    designation: "Plant Operations Manager",
    salary: 85000,
    plainPassword: "manager123",
  },
  {
    user_id: "TL001",
    username: "Amit Patel",
    email: "amit.patel@lucentpolysystem.com",
    role: "team_leader",
    roles: ["ROLE_TEAM_LEADER"],
    department: "Production",
    reporting_to: "MGR001",
    designation: "Extrusion Line Supervisor",
    salary: 60000,
    plainPassword: "leader123",
  },
  {
    user_id: "EMP001",
    username: "John Doe",
    email: "john.doe@lucentpolysystem.com",
    role: "employee",
    roles: ["ROLE_EMPLOYEE"],
    department: "Production",
    reporting_to: "TL001",
    designation: "Polymer Production Operator",
    salary: 45000,
    plainPassword: "employee123",
  },
];

async function seedRBAC() {
  const client = new MongoClient(mongoURI);

  try {
    await client.connect();
    const db = client.db(dbName);
    console.log("Connected to MongoDB for Multi-Role RBAC Seeding:", dbName);

    // 1. Seed Permissions Catalog
    const permCollection = db.collection("permissions");
    await permCollection.createIndex({ code: 1 }, { unique: true });
    await permCollection.createIndex({ module: 1 });
    for (const perm of standardPermissions) {
      await permCollection.updateOne(
        { code: perm.code },
        { $set: { ...perm, updatedAt: new Date() } },
        { upsert: true }
      );
    }
    console.log(`✅ Seeded ${standardPermissions.length} atomic permissions across 9 modules.`);

    // 2. Seed Roles Catalog
    const rolesCollection = db.collection("roles");
    await rolesCollection.createIndex({ role_id: 1 }, { unique: true });
    for (const role of standardRoles) {
      await rolesCollection.updateOne(
        { role_id: role.role_id },
        { $set: { ...role, updatedAt: new Date() } },
        { upsert: true }
      );
    }
    console.log(`✅ Seeded ${standardRoles.length} standard organizational roles.`);

    // 3. Configure Audit Logs Indexes
    const auditCollection = db.collection("audit_logs");
    await auditCollection.createIndex({ timestamp: -1 });
    await auditCollection.createIndex({ actor_id: 1 });
    await auditCollection.createIndex({ action: 1 });
    await auditCollection.createIndex({ resource: 1 });
    console.log("✅ Configured audit_logs collection & indices.");

    // 4. Provision & Migrate Users
    const usersCollection = db.collection("users");
    await usersCollection.createIndex({ user_id: 1 }, { unique: true });

    for (const u of initialUsers) {
      const hashedPassword = await bcrypt.hash(u.plainPassword, 10);
      const userPermissions = u.roles.flatMap(resolveRolePermissions);
      const uniquePermissions = Array.from(new Set(userPermissions));

      const userDoc = {
        user_id: u.user_id,
        username: u.username,
        email: u.email,
        password: hashedPassword,
        role: u.role,
        roles: u.roles,
        department: u.department,
        reporting_to: u.reporting_to || null,
        designation: u.designation,
        salary: u.salary,
        joigningDate: "2026-01-15",
        employmentType: "Full-time",
        attendanceType: "Office",
        is_active: true,
        cached_permissions: uniquePermissions,
        permission_version: 1,
        updatedAt: new Date(),
      };

      await usersCollection.updateOne(
        { user_id: u.user_id },
        { $set: userDoc },
        { upsert: true }
      );

      console.log(`   User Provisioned: [${u.user_id}] ${u.username} -> Role: ${u.role} (${u.roles.join(", ")}) [${uniquePermissions.length} perms]`);
    }

    console.log("🎉 Multi-Role RBAC initialization completed successfully!");
  } catch (err) {
    console.error("❌ RBAC seed failed:", err);
  } finally {
    await client.close();
  }
}

seedRBAC();
