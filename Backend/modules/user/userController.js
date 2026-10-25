import jwt from "jsonwebtoken";
import { prisma } from '../../config/db.js';
import transporter from "../mail/mailtransporter.js";

const formatUserResponse = (u) => {
  if (!u) return null;
  return {
    ...u,
    user_id: u.userId,
    joigningDate: u.joiningDate,
    IFSC: u.ifsc,
    emergencyContactname: u.emergencyContactName,
  };
};

const getProfile = async (req, res) => {
  try {
    if (!req.user || !req.user.userId) {
      return res.status(400).json({ message: 'Invalid user' });
    }

    const targetId = String(req.user.user_id || req.user.userId);
    const user = await prisma.user.findFirst({
      where: {
        OR: [
          { userId: targetId },
          { id: targetId },
        ],
      },
      select: {
        id: true,
        userId: true,
        username: true,
        email: true,
        role: true,
        roles: true,
        department: true,
        designation: true,
        gender: true,
        mobile: true,
        address: true,
        bankAccount: true,
        ifsc: true,
        emergencyContact: true,
        emergencyContactName: true,
        employmentType: true,
        attendanceType: true,
        salary: true,
        joiningDate: true,
        reportingTo: true,
        createdAt: true,
      },
    });

    if (!user) return res.status(404).json({ message: 'User not found' });

    res.json({ user: formatUserResponse(user) });
  } catch (error) {
    console.error("Error fetching profile:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
};

const updateProfile = async (req, res) => {
  const { userId } = req.params;
  if (!userId) return res.status(400).json({ message: 'Invalid user' });

  const {
    username,
    email,
    mobile,
    address,
    bankAccount,
    gender,
    IFSC,
    ifsc,
    emergencyContact,
    emergencyContactname,
    emergencyContactName,
  } = req.body;

  const data = {};
  if (username !== undefined) data.username = String(username).trim();
  if (email !== undefined) data.email = String(email).trim();
  if (mobile !== undefined) data.mobile = String(mobile).trim();
  if (address !== undefined) data.address = String(address).trim();
  if (bankAccount !== undefined) data.bankAccount = String(bankAccount).trim();
  if (gender !== undefined) data.gender = String(gender).trim();
  if (ifsc !== undefined || IFSC !== undefined) data.ifsc = String(ifsc || IFSC).trim();
  if (emergencyContact !== undefined) data.emergencyContact = String(emergencyContact).trim();
  if (emergencyContactName !== undefined || emergencyContactname !== undefined) {
    data.emergencyContactName = String(emergencyContactName || emergencyContactname).trim();
  }

  try {
    if (Object.keys(data).length === 0) {
      return res.status(400).json({ message: 'No fields to update' });
    }

    const existing = await prisma.user.findFirst({
      where: {
        OR: [
          { userId: String(userId) },
          { id: String(userId) },
        ],
      },
    });

    if (!existing) {
      return res.status(404).json({ message: 'User not found' });
    }

    await prisma.user.update({
      where: { id: existing.id },
      data,
    });

    res.json({ message: 'Profile updated successfully' });
  } catch (error) {
    console.error('Error updating profile:', error);
    res.status(500).json({ message: 'Internal Server Error' });
  }
};

const addUser = async (req, res) => {
  try {
    const {
      name,
      gender,
      id,
      joigningDate,
      joiningDate,
      designation,
      address,
      bankAccount,
      mobile,
      email,
      role,
      salary,
      employmentType,
      attendanceType,
      emergencyContact,
      emergencyContactname,
      emergencyContactName,
      IFSC,
      ifsc,
    } = req.body;

    // ✅ Required Fields Check
    if (!name || !id || !email || !role) {
      return res.status(400).json({ message: "Missing required fields (name, id, email, role)" });
    }

    const cleanId = String(id).trim();
    const cleanEmail = String(email).trim().toLowerCase();

    // ✅ Check for duplicate email or ID natively
    const existingUser = await prisma.user.findFirst({
      where: {
        OR: [{ email: cleanEmail }, { userId: cleanId }],
      },
    });

    if (existingUser) {
      return res.status(400).json({ message: "User with this ID or Email already exists" });
    }

    // ✅ Generate token for setting password (valid for 1 hour)
    const token = jwt.sign(
      { email: cleanEmail },
      process.env.JWT_SECRET || "dutyledger_jwt_super_secret_key_2026",
      { expiresIn: "1h" }
    );

    const tokenExpiry = new Date(Date.now() + 60 * 60 * 1000);

    // ✅ Insert user natively in PostgreSQL
    const createdUser = await prisma.user.create({
      data: {
        username: String(name).trim(),
        userId: cleanId,
        gender: gender ? String(gender) : null,
        joiningDate: joiningDate || joigningDate ? String(joiningDate || joigningDate) : null,
        designation: designation ? String(designation) : null,
        address: address ? String(address) : null,
        bankAccount: bankAccount ? String(bankAccount) : null,
        mobile: mobile ? String(mobile) : null,
        email: cleanEmail,
        role: String(role).toLowerCase(),
        salary: salary ? Number(salary) : 0,
        employmentType: employmentType ? String(employmentType) : "On Roll",
        attendanceType: attendanceType ? String(attendanceType) : "Office",
        emergencyContact: emergencyContact ? String(emergencyContact) : null,
        emergencyContactName: emergencyContactName || emergencyContactname ? String(emergencyContactName || emergencyContactname) : null,
        ifsc: ifsc || IFSC ? String(ifsc || IFSC) : null,
        password: null,
        passwordSetToken: token,
        tokenExpiry,
      },
    });

    // Also initialize base salary record if salary provided
    if (salary && !isNaN(Number(salary))) {
      const baseSalary = Number(salary);
      await prisma.salaryInfo.create({
        data: {
          employeeId: cleanId,
          employeeName: String(name).trim(),
          baseSalary: baseSalary,
          hra: Math.round(baseSalary * 0.4),
          bonus: 0,
          taxPercent: 10,
          pfPercent: 12,
          paidLeavesAllowed: 2,
          joiningDate: joiningDate || joigningDate || new Date().toISOString().split("T")[0],
          updatedBy: "System Onboarding",
        },
      }).catch((e) => console.warn("Notice: could not initialize salaryInfo:", e.message));
    }

    // ✅ Send welcome mail
    const frontendUrl = process.env.FRONTEND_URL || "http://localhost:3100";
    const setPasswordLink = `${frontendUrl}/${cleanId}/set-password?token=${token}`;

    try {
      await transporter.sendMail({
        from: `"Lucent PolySystems Pvt. Ltd." <${process.env.SMTP_EMAIL || "hr@lucentpolysystems.com"}>`,
        to: cleanEmail,
        subject: "Welcome to Lucent PolySystems – Set Your Password",
        html: `
          <p>Hello <strong>${name}</strong>,</p>
          <p>Welcome to <strong>Lucent PolySystems Pvt. Ltd.</strong>! Your account has been created in DutyLedger.</p>
          <p>Click the link below to set your password (valid for 1 hour):</p>
          <a href="${setPasswordLink}">${setPasswordLink}</a>
          <br /><br />
          <p>Best regards,<br><strong>Lucent PolySystems Pvt. Ltd. HR Team</strong></p>
        `,
      });
    } catch (mailErr) {
      console.warn("Notice: Welcome email could not be sent (SMTP not configured):", mailErr.message);
    }

    res.status(201).json({
      message: "User created successfully",
      userId: createdUser.userId,
    });
  } catch (error) {
    console.error("❌ Error adding user:", error);
    res.status(500).json({ message: "Internal Server Error", error: error.message });
  }
};

const alluser = async (req, res) => {
  try {
    const where = {};

    // Data-level scoping if user has department or team level permissions
    if (req.user) {
      const perms = new Set(req.user.permissions || []);
      const userRoles = req.user.roles || [];
      const userRole = (req.user.role || "").toLowerCase();
      const hasFullAccess =
        perms.has("employees:read:all") ||
        perms.has("users:read:all") ||
        userRoles.includes("ROLE_SUPER_ADMIN") ||
        userRoles.includes("ROLE_HR") ||
        userRole === "hr" ||
        userRole === "admin" ||
        userRole === "super_admin";

      if (!hasFullAccess) {
        if (perms.has("employees:read:dept") && req.user.department) {
          where.department = req.user.department;
        } else if (perms.has("employees:read:team") && req.user.user_id) {
          where.OR = [
            { reportingTo: req.user.user_id },
            { userId: req.user.user_id },
          ];
        }
      }
    }

    const users = await prisma.user.findMany({
      where,
      select: {
        id: true,
        userId: true,
        username: true,
        email: true,
        role: true,
        roles: true,
        department: true,
        designation: true,
        gender: true,
        mobile: true,
        address: true,
        bankAccount: true,
        ifsc: true,
        emergencyContact: true,
        emergencyContactName: true,
        employmentType: true,
        attendanceType: true,
        salary: true,
        joiningDate: true,
        reportingTo: true,
        createdAt: true,
      },
      orderBy: { createdAt: "desc" },
    });

    const mappedUsers = users.map(formatUserResponse);

    res.status(200).json({
      message: "Users fetched successfully",
      users: mappedUsers,
    });
  } catch (error) {
    console.error("Error fetching users:", error);
    res.status(500).json({ message: "Internal Server Error", error: error.message });
  }
};

const userByitsId = async (req, res) => {
  const { userid } = req.params;
  try {
    const user = await prisma.user.findFirst({
      where: {
        OR: [
          { userId: String(userid) },
          { id: String(userid) },
        ],
      },
      select: {
        id: true,
        userId: true,
        username: true,
        email: true,
        role: true,
        roles: true,
        department: true,
        designation: true,
        gender: true,
        mobile: true,
        address: true,
        bankAccount: true,
        ifsc: true,
        emergencyContact: true,
        emergencyContactName: true,
        employmentType: true,
        attendanceType: true,
        salary: true,
        joiningDate: true,
        reportingTo: true,
        createdAt: true,
      },
    });

    if (!user) return res.status(404).json({ message: 'User not found' });
    res.status(200).json({ message: 'User fetched successfully', user: formatUserResponse(user) });
  } catch (error) {
    console.error('Error fetching user by ID:', error);
    res.status(500).json({ message: 'Internal Server Error' });
  }
};

export { getProfile, addUser, alluser, userByitsId, updateProfile };
export default { getProfile, addUser, alluser, userByitsId, updateProfile };