import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

const initialUsers = [
  {
    username: "Admin User",
    userId: "ADMIN001",
    gender: "Male",
    joiningDate: "2022-01-01",
    designation: "HR Manager",
    department: "Human Resources",
    address: "Lucent PolySystems Pvt. Ltd., Corporate Office",
    bankAccount: "123456789012",
    mobile: "9876543210",
    email: "admin@example.com",
    role: "HR",
    roles: ["ROLE_SUPER_ADMIN", "ROLE_HR"],
    salary: 100000,
    employmentType: "On Roll",
    attendanceType: "Office",
    emergencyContact: "9876543211",
    emergencyContactName: "Emergency Contact",
    ifsc: "SBIN0001234",
    plainPassword: "admin123",
  },
  {
    username: "LISSY KURUVILLA THOTTUPURATHE",
    userId: "1212",
    gender: "Female",
    joiningDate: "2024-01-01",
    designation: "Inspector",
    department: "Quality",
    address: "Lucent PolySystems Pvt. Ltd. Staff",
    bankAccount: "12120001212",
    mobile: "9820011212",
    email: "lissy.1212@lucentpolysystems.com",
    role: "Employee",
    roles: ["ROLE_EMPLOYEE"],
    salary: 17328,
    employmentType: "On Roll",
    attendanceType: "Office",
    emergencyContact: "9820011213",
    emergencyContactName: "Family",
    ifsc: "HDFC0001212",
    plainPassword: "password123",
  },
  {
    username: "BABITA MANOHAR KAMBLE",
    userId: "1380",
    gender: "Female",
    joiningDate: "2024-01-01",
    designation: "Finishing",
    department: "Quality",
    address: "Lucent PolySystems Pvt. Ltd. Staff",
    bankAccount: "13800001380",
    mobile: "9820011380",
    email: "babita.1380@lucentpolysystems.com",
    role: "Employee",
    roles: ["ROLE_EMPLOYEE"],
    salary: 17104,
    employmentType: "On Roll",
    attendanceType: "Office",
    emergencyContact: "9820011381",
    emergencyContactName: "Family",
    ifsc: "HDFC0001380",
    plainPassword: "password123",
  },
  {
    username: "HARSHAL ULHAS SHEP",
    userId: "0001",
    gender: "Male",
    joiningDate: "2023-01-01",
    designation: "Account & Mktg",
    department: "Account & Mktg",
    address: "Lucent PolySystems Pvt. Ltd. Corporate",
    bankAccount: "00010000001",
    mobile: "9820010001",
    email: "harshal.0001@lucentpolysystems.com",
    role: "Employee",
    roles: ["ROLE_EMPLOYEE", "ROLE_MANAGER"],
    salary: 57830,
    employmentType: "On Roll",
    attendanceType: "Office",
    emergencyContact: "9820010002",
    emergencyContactName: "Family",
    ifsc: "SBIN0000001",
    plainPassword: "password123",
  },
  {
    username: "SHOBHA DIPAK KANADE",
    userId: "1211",
    gender: "Female",
    joiningDate: "2024-01-01",
    designation: "Finishing",
    department: "Quality",
    address: "Lucent PolySystems Pvt. Ltd. Staff",
    bankAccount: "12110001211",
    mobile: "9820011211",
    email: "shobha.1211@lucentpolysystems.com",
    role: "Employee",
    roles: ["ROLE_EMPLOYEE"],
    salary: 17104,
    employmentType: "On Roll",
    attendanceType: "Office",
    emergencyContact: "9820011214",
    emergencyContactName: "Family",
    ifsc: "HDFC0001211",
    plainPassword: "password123",
  },
  {
    username: "SIDDHESHWAR TULSHIRAM PHAD",
    userId: "1010",
    gender: "Male",
    joiningDate: "2022-01-01",
    designation: "Plant Head",
    department: "Production",
    address: "Lucent PolySystems Pvt. Ltd. Executive",
    bankAccount: "10100001010",
    mobile: "9820011010",
    email: "siddheshwar.1010@lucentpolysystems.com",
    role: "Employee",
    roles: ["ROLE_EMPLOYEE", "ROLE_MANAGER"],
    salary: 66472,
    employmentType: "On Roll",
    attendanceType: "Office",
    emergencyContact: "9820011011",
    emergencyContactName: "Family",
    ifsc: "SBIN0001010",
    plainPassword: "password123",
  },
  {
    username: "SAVITA NARAYAN KAMBLE",
    userId: "1209",
    gender: "Female",
    joiningDate: "2024-01-01",
    designation: "Inspector",
    department: "Quality",
    address: "Lucent PolySystems Pvt. Ltd. Staff",
    bankAccount: "12090001209",
    mobile: "9820011209",
    email: "savita.1209@lucentpolysystems.com",
    role: "Employee",
    roles: ["ROLE_EMPLOYEE"],
    salary: 18824,
    employmentType: "On Roll",
    attendanceType: "Office",
    emergencyContact: "9820011210",
    emergencyContactName: "Family",
    ifsc: "HDFC0001209",
    plainPassword: "password123",
  },
  {
    username: "JITENDRA BALU SONAR",
    userId: "1029",
    gender: "Male",
    joiningDate: "2023-01-01",
    designation: "Store Despatch Head",
    department: "Store & Despatch",
    address: "Lucent PolySystems Pvt. Ltd. Staff",
    bankAccount: "10290001029",
    mobile: "9820011029",
    email: "jitendra.1029@lucentpolysystems.com",
    role: "Employee",
    roles: ["ROLE_EMPLOYEE", "ROLE_TEAM_LEADER"],
    salary: 33444,
    employmentType: "On Roll",
    attendanceType: "Office",
    emergencyContact: "9820011030",
    emergencyContactName: "Family",
    ifsc: "HDFC0001029",
    plainPassword: "password123",
  },
  {
    username: "AMOL SHRIRAM MULE",
    userId: "1015",
    gender: "Male",
    joiningDate: "2023-01-01",
    designation: "Despatched",
    department: "Store",
    address: "Lucent PolySystems Pvt. Ltd. Staff",
    bankAccount: "10150001015",
    mobile: "9820011015",
    email: "amol.1015@lucentpolysystems.com",
    role: "Employee",
    roles: ["ROLE_EMPLOYEE"],
    salary: 40000,
    employmentType: "On Roll",
    attendanceType: "Office",
    emergencyContact: "9820011016",
    emergencyContactName: "Family",
    ifsc: "HDFC0001015",
    plainPassword: "password123",
  },
  {
    username: "TUSHAR GOVINDA KOSHTI",
    userId: "1013",
    gender: "Male",
    joiningDate: "2023-01-01",
    designation: "QA",
    department: "Quality",
    address: "Lucent PolySystems Pvt. Ltd. Staff",
    bankAccount: "10130001013",
    mobile: "9820011013",
    email: "tushar.1013@lucentpolysystems.com",
    role: "Employee",
    roles: ["ROLE_EMPLOYEE"],
    salary: 33000,
    employmentType: "On Roll",
    attendanceType: "Office",
    emergencyContact: "9820011014",
    emergencyContactName: "Family",
    ifsc: "HDFC0001013",
    plainPassword: "password123",
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
      "attendance:read:all",
      "attendance:update",
      "attendance:export",
      "payroll:read:all",
      "payroll:generate",
      "payroll:publish",
      "announcements:write",
      "announcements:read",
      "holidays:manage",
      "holidays:read",
    ],
  },
  {
    roleId: "ROLE_MANAGER",
    name: "Department Manager",
    description: "Department-level management. Approves leaves and tracks team attendance",
    isSystemRole: true,
    inheritsFrom: ["ROLE_EMPLOYEE"],
    permissions: [
      "employees:read:dept",
      "attendance:read:dept",
      "attendance:approve:dept",
      "announcements:read",
      "holidays:read",
    ],
  },
  {
    roleId: "ROLE_TEAM_LEADER",
    name: "Team Leader",
    description: "Direct reports tracking and day-to-day team shift management",
    isSystemRole: true,
    inheritsFrom: ["ROLE_EMPLOYEE"],
    permissions: [
      "employees:read:team",
      "attendance:read:team",
      "announcements:read",
      "holidays:read",
    ],
  },
  {
    roleId: "ROLE_EMPLOYEE",
    name: "Employee Staff",
    description: "Standard employee self-service portal access",
    isSystemRole: true,
    inheritsFrom: [],
    permissions: [
      "attendance:read:self",
      "attendance:punch",
      "payroll:read:self",
      "announcements:read",
      "holidays:read",
      "hr:query:create",
    ],
  },
];

async function main() {
  console.log("🌱 Seeding production PostgreSQL database for Lucent PolySystems...");

  // 1. Seed RBAC Roles
  for (const role of standardRoles) {
    await prisma.role.upsert({
      where: { roleId: role.roleId },
      update: {
        name: role.name,
        description: role.description,
        isSystemRole: role.isSystemRole,
        inheritsFrom: role.inheritsFrom,
        permissions: role.permissions,
      },
      create: role,
    });
  }
  console.log(`✅ Seeded ${standardRoles.length} RBAC roles.`);

  // 2. Seed Users & Salary Structures
  for (const user of initialUsers) {
    const { plainPassword, ...userData } = user;
    const hashedPassword = await bcrypt.hash(plainPassword, 10);

    await prisma.user.upsert({
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
        employmentType: user.employmentType,
        attendanceType: user.attendanceType,
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
        employeeName: user.username,
        baseSalary: user.salary,
        hra: Math.round(user.salary * 0.4),
      },
      create: {
        employeeId: user.userId,
        employeeName: user.username,
        baseSalary: user.salary,
        hra: Math.round(user.salary * 0.4),
        bonus: 0,
        taxPercent: 10,
        pfPercent: 12,
        paidLeavesAllowed: 2,
        joiningDate: user.joiningDate,
        updatedBy: "System Seed",
      },
    });

    console.log(`✅ Seeded: [Ticket ${user.userId}] ${user.username} - ${user.designation} (${user.department}) - ₹${user.salary}`);
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
  console.log(" 🔑 ALL SEEDED USERS & DEFAULT PASSWORDS");
  console.log("=======================================================");
  console.log(" Default Employee Password: password123");
  console.log(" Default HR Admin Password : admin123 (ADMIN001)\n");
  for (const u of initialUsers) {
    console.log(` - Ticket/ID: ${u.userId.padEnd(8)} | Name: ${u.username.padEnd(32)} | Dept: ${u.department.padEnd(18)} | Pass: ${u.plainPassword}`);
  }
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
