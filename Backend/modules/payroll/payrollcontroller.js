import { prisma } from "../../config/db.js";
import transporter from "../mail/mailtransporter.js";

// ✅ 1. GET USER SALARY INFO BY ID (Native Prisma)
const usersalarybyitsid = async (req, res) => {
  const { id } = req.params;
  const employeeId = String(id).trim();

  try {
    let salaryDoc = await prisma.salaryInfo.findFirst({
      where: {
        OR: [
          { userId: employeeId },
          { employeeId: employeeId },
        ],
      },
    });

    // If salary info is already present, return it
    if (salaryDoc) {
      return res.status(200).json({
        ...salaryDoc,
        employee_id: salaryDoc.userId || salaryDoc.employeeId,
        base_salary: salaryDoc.basicSalary,
        tax_percent: salaryDoc.taxDeduction,
        pf_percent: salaryDoc.pf,
      });
    }

    // Fallback: Check if user exists in `user` table
    const user = await prisma.user.findFirst({
      where: {
        OR: [
          { userId: employeeId },
          { id: employeeId },
        ],
      },
    });

    if (!user) {
      return res.status(404).json({ message: "Employee user not found." });
    }

    // Auto-generate standard salary structure from user profile
    const baseSalary = Number(user.salary) || 75000;
    const hra = Math.round(baseSalary * 0.3);
    const allowance = Math.round(baseSalary * 0.2);
    const bonus = 5000;
    const pf = Math.round(baseSalary * 0.12);
    const tax = Math.round(baseSalary * 0.05);
    const netSalary = baseSalary - (pf + tax);

    const autoSalaryInfo = await prisma.salaryInfo.create({
      data: {
        userId: user.userId,
        employeeId: user.userId,
        employeeName: user.username,
        basicSalary: baseSalary,
        hra,
        allowance,
        bonus,
        pf,
        taxDeduction: tax,
        netSalary,
        paidLeavesAllowed: 2,
        joiningDate: user.joigningDate || new Date().toISOString().split("T")[0],
      },
    });

    return res.status(200).json({
      ...autoSalaryInfo,
      employee_id: autoSalaryInfo.userId,
      base_salary: autoSalaryInfo.basicSalary,
      tax_percent: 10,
      pf_percent: 12,
    });
  } catch (error) {
    console.error("Error fetching user salary by ID:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
};

// ✅ 2. GENERATE / FETCH SALARY SLIP (Native Prisma)
const GenerateSlip = async (req, res) => {
  const { user_id, month } = req.body;
  const employeeId = String(user_id).trim();

  try {
    let salaryInfo = await prisma.salaryInfo.findFirst({
      where: {
        OR: [{ userId: employeeId }, { employeeId }],
      },
    });

    // If not found in SalaryInfo, find or create from User
    if (!salaryInfo) {
      const userDoc = await prisma.user.findFirst({
        where: {
          OR: [{ userId: employeeId }, { id: employeeId }],
        },
      });

      if (!userDoc) {
        return res.status(400).json({ error: "Employee record not found" });
      }

      const baseSalary = Number(userDoc.salary) || 75000;
      salaryInfo = await prisma.salaryInfo.create({
        data: {
          userId: userDoc.userId,
          employeeId: userDoc.userId,
          employeeName: userDoc.username,
          basicSalary: baseSalary,
          hra: Math.round(baseSalary * 0.3),
          allowance: Math.round(baseSalary * 0.2),
          bonus: 5000,
          pf: Math.round(baseSalary * 0.12),
          taxDeduction: Math.round(baseSalary * 0.05),
          netSalary: baseSalary - Math.round(baseSalary * 0.17),
          paidLeavesAllowed: 2,
          joiningDate: userDoc.joigningDate || new Date().toISOString().split("T")[0],
        },
      });
    }

    // Check if payroll slip for this month was already generated
    const existingSlip = await prisma.payrollRecord.findFirst({
      where: {
        userId: employeeId,
        month: String(month),
      },
    });

    if (existingSlip) {
      return res.json({
        ...existingSlip,
        employee_id: existingSlip.userId,
        employee_name: existingSlip.employeeName,
        basic_salary: existingSlip.basicSalary,
        attendance_summary: {
          total_working_days: existingSlip.totalWorkingDays,
          present_days: existingSlip.presentDays,
          absent_days: existingSlip.absentDays,
          paid_leave_allowance: existingSlip.paidLeaveAllowance,
          unpaid_leave_days: existingSlip.unpaidLeaveDays,
        },
        deductions: {
          tax_amount: existingSlip.taxAmount,
          pf_amount: existingSlip.pfAmount,
          leave_deduction: existingSlip.leaveDeduction,
          total_deduction: existingSlip.totalDeductions,
        },
        salary_breakdown: {
          gross_salary: existingSlip.basicSalary,
          net_salary: existingSlip.netSalary,
        },
      });
    }

    // Calculate from attendance
    const attendance = await prisma.attendance.findMany({
      where: {
        userId: employeeId,
        date: { startsWith: String(month) },
      },
    });

    const presentDays = attendance.filter((a) => a.status === "Present" || a.status === "Late").length;
    const basicSalary = Number(salaryInfo.basicSalary) || 75000;
    const workingDays = 26;
    const paidLeaves = Number(salaryInfo.paidLeavesAllowed) || 2;
    const absentDays = Math.max(0, workingDays - presentDays);

    const tax = Math.round(basicSalary * 0.10);
    const pf = Math.round(basicSalary * 0.12);
    const unpaidLeaves = Math.max(0, absentDays - paidLeaves);
    const leaveDeduction = Math.round(unpaidLeaves * (basicSalary / workingDays));
    const totalDeductions = tax + pf + leaveDeduction;
    const netSalary = Math.max(0, basicSalary - totalDeductions);

    const createdRecord = await prisma.payrollRecord.create({
      data: {
        userId: employeeId,
        employeeName: salaryInfo.employeeName || `Employee ${employeeId}`,
        month: String(month),
        year: Number(String(month).split("-")[0]) || new Date().getFullYear(),
        basicSalary,
        totalWorkingDays: workingDays,
        presentDays,
        absentDays,
        paidLeaveAllowance: paidLeaves,
        unpaidLeaveDays: unpaidLeaves,
        taxAmount: tax,
        pfAmount: pf,
        leaveDeduction,
        totalDeductions,
        netSalary,
        status: "Processed",
      },
    });

    return res.json({
      ...createdRecord,
      employee_id: employeeId,
      employee_name: createdRecord.employeeName,
      basic_salary: basicSalary,
      attendance_summary: {
        total_working_days: workingDays,
        present_days: presentDays,
        absent_days: absentDays,
        paid_leave_allowance: paidLeaves,
        unpaid_leave_days: unpaidLeaves,
      },
      deductions: {
        tax_amount: tax,
        pf_amount: pf,
        leave_deduction: leaveDeduction,
        total_deduction: totalDeductions,
      },
      salary_breakdown: {
        gross_salary: basicSalary,
        net_salary: netSalary,
      },
    });
  } catch (error) {
    console.error("Salary generation error:", error);
    return res.status(500).json({ error: error.message });
  }
};

// ✅ 3. ADD / UPSERT SALARY INFO WITH TRANSACTION
const Addsalaryinfo = async (req, res) => {
  const {
    employee_id,
    employee_name,
    base_salary,
    hra,
    bonus,
    tax_percent,
    pf_percent,
    paid_leaves_allowed,
    joining_date,
  } = req.body;

  if (!employee_id) {
    return res.status(400).json({ message: "Employee ID is required." });
  }

  const cleanId = String(employee_id).trim();

  try {
    const userDoc = await prisma.user.findFirst({
      where: {
        OR: [{ userId: cleanId }, { id: cleanId }],
      },
    });

    const name = employee_name || userDoc?.username || `Employee ${cleanId}`;
    const base = Number(base_salary) || Number(userDoc?.salary) || 75000;
    const hraVal = hra !== undefined && hra !== "" ? Number(hra) : Math.round(base * 0.3);
    const bonusVal = bonus !== undefined && bonus !== "" ? Number(bonus) : 5000;
    const pfVal = pf_percent !== undefined && pf_percent !== "" ? Math.round(base * (Number(pf_percent) / 100)) : Math.round(base * 0.12);
    const taxVal = tax_percent !== undefined && tax_percent !== "" ? Math.round(base * (Number(tax_percent) / 100)) : Math.round(base * 0.05);
    const net = base - (pfVal + taxVal);
    const joinDate = joining_date || userDoc?.joigningDate || new Date().toISOString().split("T")[0];

    // Atomic transaction: update salary structure and user salary simultaneously
    const [savedSalary] = await prisma.$transaction([
      prisma.salaryInfo.upsert({
        where: { userId: cleanId },
        update: {
          employeeName: name,
          basicSalary: base,
          hra: hraVal,
          bonus: bonusVal,
          pf: pfVal,
          taxDeduction: taxVal,
          netSalary: net,
          paidLeavesAllowed: Number(paid_leaves_allowed) || 2,
          joiningDate: joinDate,
        },
        create: {
          userId: cleanId,
          employeeId: cleanId,
          employeeName: name,
          basicSalary: base,
          hra: hraVal,
          allowance: Math.round(base * 0.2),
          bonus: bonusVal,
          pf: pfVal,
          taxDeduction: taxVal,
          netSalary: net,
          paidLeavesAllowed: Number(paid_leaves_allowed) || 2,
          joiningDate: joinDate,
        },
      }),
      prisma.user.updateMany({
        where: {
          OR: [{ userId: cleanId }, { id: cleanId }],
        },
        data: { salary: base },
      }),
    ]);

    return res.status(200).json({
      message: "Salary info saved successfully.",
      data: savedSalary,
    });
  } catch (error) {
    console.error("Error adding salary info:", error);
    return res.status(500).json({ message: "Server error while saving salary info." });
  }
};

// ✅ 4. UPDATE SALARY INFO WITH TRANSACTION
const Updatesalaryinfo = async (req, res) => {
  const {
    employee_id,
    employee_name,
    base_salary,
    hra,
    bonus,
    tax_percent,
    pf_percent,
    paid_leaves_allowed,
    joining_date,
  } = req.body;

  if (!employee_id) {
    return res.status(400).json({ message: "Employee ID is required." });
  }

  const cleanId = String(employee_id).trim();

  try {
    const user = await prisma.user.findFirst({
      where: {
        OR: [{ userId: cleanId }, { id: cleanId }],
      },
    });

    const oldSalary = await prisma.salaryInfo.findFirst({
      where: {
        OR: [{ userId: cleanId }, { employeeId: cleanId }],
      },
    });

    const base = Number(base_salary) || Number(oldSalary?.basicSalary) || Number(user?.salary) || 75000;
    const name = employee_name || oldSalary?.employeeName || user?.username || `Employee ${cleanId}`;
    const hraVal = hra !== undefined && hra !== "" ? Number(hra) : (oldSalary?.hra ?? Math.round(base * 0.3));
    const bonusVal = bonus !== undefined && bonus !== "" ? Number(bonus) : (oldSalary?.bonus ?? 5000);
    const pfVal = pf_percent !== undefined && pf_percent !== "" ? Math.round(base * (Number(pf_percent) / 100)) : (oldSalary?.pf ?? Math.round(base * 0.12));
    const taxVal = tax_percent !== undefined && tax_percent !== "" ? Math.round(base * (Number(tax_percent) / 100)) : (oldSalary?.taxDeduction ?? Math.round(base * 0.05));
    const net = base - (pfVal + taxVal);
    const joinDate = joining_date || oldSalary?.joiningDate || user?.joigningDate || new Date().toISOString().split("T")[0];

    // Atomic transaction
    const [updatedSalary] = await prisma.$transaction([
      prisma.salaryInfo.upsert({
        where: { userId: cleanId },
        update: {
          employeeName: name,
          basicSalary: base,
          hra: hraVal,
          bonus: bonusVal,
          pf: pfVal,
          taxDeduction: taxVal,
          netSalary: net,
          paidLeavesAllowed: Number(paid_leaves_allowed) || oldSalary?.paidLeavesAllowed || 2,
          joiningDate: joinDate,
        },
        create: {
          userId: cleanId,
          employeeId: cleanId,
          employeeName: name,
          basicSalary: base,
          hra: hraVal,
          allowance: Math.round(base * 0.2),
          bonus: bonusVal,
          pf: pfVal,
          taxDeduction: taxVal,
          netSalary: net,
          paidLeavesAllowed: Number(paid_leaves_allowed) || 2,
          joiningDate: joinDate,
        },
      }),
      prisma.user.updateMany({
        where: {
          OR: [{ userId: cleanId }, { id: cleanId }],
        },
        data: { salary: base },
      }),
    ]);

    // Send email notification safely in background
    if (user?.email && transporter) {
      transporter.sendMail({
        from: `"Lucent PolySystems Pvt. Ltd." <${process.env.SMTP_EMAIL || "hr@lucentpolysystems.com"}>`,
        to: user.email,
        subject: "Lucent PolySystems – Salary Update Notification",
        html: `
          <p>Dear <strong>${name}</strong>,</p>
          <p>Your salary record has been successfully updated.</p>
          <ul>
            <li><strong>Base Salary:</strong> ₹${base}</li>
            <li><strong>HRA:</strong> ₹${hraVal}</li>
            <li><strong>Bonus:</strong> ₹${bonusVal}</li>
            <li><strong>Estimated Net Salary:</strong> ₹${net}</li>
          </ul>
          <p>Best regards,<br><strong>Lucent PolySystems Pvt. Ltd. HR Team</strong></p>
        `,
      }).catch((e) => console.log("Notice: Salary update email skipped:", e.message));
    }

    res.status(200).json({
      message: "Salary info updated successfully.",
      updatedFields: updatedSalary,
    });
  } catch (error) {
    console.error("Error updating salary info:", error);
    res.status(500).json({ message: "Server error while updating salary info." });
  }
};

export {
  GenerateSlip,
  Addsalaryinfo,
  Updatesalaryinfo,
  usersalarybyitsid,
};

export default {
  GenerateSlip,
  Addsalaryinfo,
  Updatesalaryinfo,
  usersalarybyitsid,
};