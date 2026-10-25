import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

const initialUsers = [
  {
    username: "Admin User",
    userId: "ADMIN001",
    gender: "Male",
    joiningDate: new Date().toISOString().split("T")[0],
    designation: "HR Manager",
    department: "Human Resources",
    address: "Lucent PolySystems Pvt. Ltd., Corporate Office",
    bankAccount: "123456789012",
    mobile: "9876543210",
    email: "admin@example.com",
    role: "HR",
    roles: ["ROLE_SUPER_ADMIN", "ROLE_HR"],
    salary: 100000,
    employmentType: "Full-time",
    attendanceType: "Office",
    emergencyContact: "9876543211",
    emergencyContactName: "Emergency Contact",
    ifsc: "SBIN0001234",
    plainPassword: "admin123",
  },
  {
    username: "John Doe",
    userId: "EMP001",
    gender: "Male",
    joiningDate: new Date().toISOString().split("T")[0],
    designation: "Polymer Production Engineer",
    department: "Engineering",
    address: "Lucent PolySystems Pvt. Ltd., Plant Staff Quarters",
    bankAccount: "987654321098",
    mobile: "9123456780",
    email: "employee@example.com",
    role: "Employee",
    roles: ["ROLE_EMPLOYEE"],
    salary: 75000,
    employmentType: "Full-time",
    attendanceType: "Office",
    emergencyContact: "9123456781",
    emergencyContactName: "Jane Doe",
    ifsc: "HDFC0001234",
    plainPassword: "employee123",
  },
];

const holidays2026 = [
  { date: "2026-01-01", reason: "New Year's Day" },
  { date: "2026-01-26", reason: "Republic Day" },
  { date: "2026-03-03", reason: "Holi Festival" },
  { date: "2026-04-03", reason: "Good Friday" },
  { date: "2026-05-01", reason: "Maharashtra Day / Labour Day" },
  { date: "2026-08-15", reason: "Independence Day" },
  { date: "2026-08-28", reason: "Raksha Bandhan" },
  { date: "2026-10-02", reason: "Mahatma Gandhi Jayanti" },
  { date: "2026-10-20", reason: "Dussehra (Vijayadashami)" },
  { date: "2026-11-08", reason: "Diwali (Deepawali)" },
  { date: "2026-11-09", reason: "Govardhan Puja" },
  { date: "2026-12-25", reason: "Christmas Day" },
];

const standardRoles = [
  {
    roleId: "ROLE_SUPER_ADMIN",
    name: "Super Administrator",
    description: "Complete unrestricted access across all system modules",
    isSystemRole: true,
    inheritsFrom: [],
    permissions: ["*"],
  },
  {
    roleId: "ROLE_ADMIN",
    name: "System Administrator",
    description: "IT & System Administration. Manages users, roles, and audit logs",
    isSystemRole: true,
    inheritsFrom: ["ROLE_EMPLOYEE"],
    permissions: [
      "rbac:roles:manage",
      "rbac:permissions:assign",
      "users:read:all",
      "users:create",
      "users:status:toggle",
      "settings:manage",
      "audit:read:all",
      "attendance:read:all",
    ],
  },
  {
    roleId: "ROLE_HR",
    name: "HR Manager",
    description: "Human Resources operations. Manages employee onboarding, directory, attendance, payroll, and leaves",
    isSystemRole: true,
    inheritsFrom: ["ROLE_EMPLOYEE"],
    permissions: [
      "employees:read:all",
      "employees:create",
      "employees:update",
      "employees:delete",
      "attendance:read:all",
      "attendance:adjust",
      "payroll:read:all",
      "payroll:structure:manage",
      "payroll:slip:generate",
      "queries:resolve",
      "announcements:publish",
    ],
  },
  {
    roleId: "ROLE_MANAGER",
    name: "Department Manager",
    description: "Operations / Plant Manager with scoped department oversight",
    isSystemRole: true,
    inheritsFrom: ["ROLE_EMPLOYEE"],
    permissions: [
      "employees:read:dept",
      "attendance:read:dept",
      "attendance:adjust",
      "queries:read:team",
    ],
  },
  {
    roleId: "ROLE_TEAM_LEADER",
    name: "Team Leader / Supervisor",
    description: "Shift In-Charge for shift attendance and team management",
    isSystemRole: true,
    inheritsFrom: ["ROLE_EMPLOYEE"],
    permissions: [
      "employees:read:team",
      "attendance:read:team",
      "queries:read:team",
    ],
  },
  {
    roleId: "ROLE_EMPLOYEE",
    name: "Standard Employee",
    description: "Employee self-service portal access",
    isSystemRole: true,
    inheritsFrom: [],
    permissions: [
      "employees:read:self",
      "attendance:mark:self",
      "attendance:read:self",
      "payroll:read:self",
      "queries:create",
    ],
  },
];

async function main() {
  console.log("🌱 Seeding production PostgreSQL database for Lucent PolySystems...");

  // 1. Seed Roles
  for (const r of standardRoles) {
    await prisma.role.upsert({
      where: { roleId: r.roleId },
      update: {
        name: r.name,
        description: r.description,
        permissions: r.permissions,
        inheritsFrom: r.inheritsFrom,
      },
      create: r,
    });
  }
  console.log(`✅ Seeded ${standardRoles.length} RBAC roles.`);

  // 2. Seed Users
  for (const user of initialUsers) {
    const { plainPassword, ...userData } = user;
    const hashedPassword = await bcrypt.hash(plainPassword, 10);

    const seededUser = await prisma.user.upsert({
      where: { userId: user.userId },
      update: {
        username: user.username,
        email: user.email,
        password: hashedPassword,
        role: user.role,
        roles: user.roles,
        department: user.department,
        designation: user.designation,
        salary: user.salary,
      },
      create: {
        ...userData,
        password: hashedPassword,
      },
    });

    // 3. Seed Default SalaryInfo
    await prisma.salaryInfo.upsert({
      where: { employeeId: user.userId },
      update: {
        baseSalary: user.salary,
        hra: Math.round(user.salary * 0.4),
      },
      create: {
        employeeId: user.userId,
        employeeName: user.username,
        baseSalary: user.salary,
        hra: Math.round(user.salary * 0.4),
        bonus: 5000,
        taxPercent: 10,
        pfPercent: 12,
        paidLeavesAllowed: 2,
        joiningDate: user.joiningDate,
        updatedBy: "System Seed",
      },
    });

    console.log(`✅ Seeded user & salary structure: [${user.role}] ${user.userId} (${user.email})`);
  }

  // 4. Seed 2026 Holidays
  for (const h of holidays2026) {
    await prisma.holiday.upsert({
      where: { date: h.date },
      update: { reason: h.reason },
      create: h,
    });
  }
  console.log(`✅ Seeded ${holidays2026.length} company holidays.`);

  console.log("\n=======================================================");
  console.log(" 🔑 DEFAULT LOGIN CREDENTIALS");
  console.log("=======================================================");
  console.log(" 1. HR ADMIN USER:");
  console.log("    User ID : ADMIN001");
  console.log("    Username: Admin User");
  console.log("    Email   : admin@example.com");
  console.log("    Password: admin123");
  console.log("-------------------------------------------------------");
  console.log(" 2. EMPLOYEE USER:");
  console.log("    User ID : EMP001");
  console.log("    Username: John Doe");
  console.log("    Email   : employee@example.com");
  console.log("    Password: employee123");
  console.log("=======================================================\n");
}

main()
  .catch((e) => {
    console.error("❌ Seed error:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
