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
    roles: ["ROLE_SUPER_ADMIN", "ROLE_HR_ADMIN"],
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

async function main() {
  console.log("🌱 Seeding initial PostgreSQL data for Lucent PolySystems...");

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
      },
      create: {
        ...userData,
        password: hashedPassword,
      },
    });

    console.log(`✅ Seeded/Updated user: [${user.role}] ${user.userId} (${user.email})`);
  }

  // Create default roles if not exist
  const roles = [
    {
      roleId: "ROLE_SUPER_ADMIN",
      name: "Super Administrator",
      description: "Full system administration access",
      isSystemRole: true,
      permissions: ["*"],
    },
    {
      roleId: "ROLE_HR_ADMIN",
      name: "HR Administrator",
      description: "HR operations and employee management",
      isSystemRole: true,
      permissions: ["employees:*", "attendance:*", "payroll:*", "announcements:*"],
    },
    {
      roleId: "ROLE_EMPLOYEE",
      name: "Standard Employee",
      description: "Employee self-service portal access",
      isSystemRole: true,
      permissions: ["attendance:self", "payroll:self", "profile:self"],
    },
  ];

  for (const r of roles) {
    await prisma.role.upsert({
      where: { roleId: r.roleId },
      update: {},
      create: r,
    });
  }

  console.log("\n=======================================================");
  console.log(" 🔑 DUMMY LOGIN CREDENTIALS");
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
