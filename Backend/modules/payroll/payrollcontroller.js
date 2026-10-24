const { getDB } = require("../../config/db");
const transporter = require("../mail/mailtransporter");

// ✅ 1. GET USER SALARY INFO BY ID (Self-Healing Fallback from users collection)
const usersalarybyitsid = async (req, res) => {
  const db = getDB();
  const { id } = req.params;
  console.log("Salary info requested for ID:", id);

  try {
    let salaryDoc = await db.collection("SalaryInfo").findOne({ employee_id: id });

    // If salary info is already present, return it
    if (salaryDoc) {
      return res.status(200).json(salaryDoc);
    }

    // Fallback: Check if user exists in `users` collection
    const user = await db.collection("users").findOne({ user_id: id });
    if (!user) {
      return res.status(404).json({ message: "Employee user not found." });
    }

    // Auto-generate standard salary structure from user profile
    const nowIST = new Date(new Date().getTime() + 5.5 * 60 * 60 * 1000);
    const baseSalary = Number(user.salary) || 75000;
    const hra = Math.round(baseSalary * 0.4);
    const bonus = 5000;
    const taxPercent = 10;
    const pfPercent = 12;
    const paidLeavesAllowed = 2;
    const joiningDate = user.joigningDate || nowIST.toISOString().split("T")[0];

    const autoSalaryInfo = {
      employee_id: user.user_id,
      employee_name: user.username,
      base_salary: baseSalary,
      hra,
      bonus,
      tax_percent: taxPercent,
      pf_percent: pfPercent,
      paid_leaves_allowed: paidLeavesAllowed,
      joining_date: joiningDate,
      last_update: nowIST,
      updated_by: "System Initialization",
    };

    // Upsert into SalaryInfo
    await db.collection("SalaryInfo").updateOne(
      { employee_id: id },
      { $setOnInsert: autoSalaryInfo },
      { upsert: true }
    );

    console.log(`✅ Auto-initialized SalaryInfo record for user: ${id}`);
    return res.status(200).json(autoSalaryInfo);
  } catch (error) {
    console.error("Error fetching user salary by ID:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
};

// ✅ 2. GENERATE / FETCH SALARY SLIP
const GenerateSlip = async (req, res) => {
  const db = getDB();
  const { user_id, month } = req.body;

  try {
    let user = await db.collection("SalaryInfo").findOne({ employee_id: user_id });

    // If not found in SalaryInfo, auto-initialize from users
    if (!user) {
      const userDoc = await db.collection("users").findOne({ user_id });
      if (!userDoc) {
        return res.status(400).json({ error: "Employee record not found" });
      }
      const nowIST = new Date(new Date().getTime() + 5.5 * 60 * 60 * 1000);
      const baseSalary = Number(userDoc.salary) || 75000;
      user = {
        employee_id: userDoc.user_id,
        employee_name: userDoc.username,
        base_salary: baseSalary,
        hra: Math.round(baseSalary * 0.4),
        bonus: 5000,
        tax_percent: 10,
        pf_percent: 12,
        paid_leaves_allowed: 2,
        joining_date: userDoc.joigningDate || nowIST.toISOString().split("T")[0],
        last_update: nowIST,
        updated_by: "System Initialization",
      };
      await db.collection("SalaryInfo").updateOne(
        { employee_id: user_id },
        { $setOnInsert: user },
        { upsert: true }
      );
    }

    // Check if slip for this month was already generated
    const salaryslip = await db.collection("Payrolls").findOne({
      employee_id: user_id,
      month,
    });

    if (salaryslip) {
      return res.json(salaryslip);
    }

    // Calculate from attendance
    const attendance = await db
      .collection("Attendance")
      .find({
        user_id,
        date: { $regex: `^${month}` },
      })
      .toArray();

    const presentDays = attendance.filter((a) => a.status === "Present" || a.status === "Late").length;
    const basicSalary = Number(user.base_salary) || 75000;
    const workingDays = 26;
    const paidLeaves = Number(user.paid_leaves_allowed) || 2;
    const absentDays = Math.max(0, workingDays - presentDays);

    const tax = basicSalary * ((Number(user.tax_percent) || 10) / 100);
    const pf = basicSalary * ((Number(user.pf_percent) || 12) / 100);
    const unpaidLeaves = Math.max(0, absentDays - paidLeaves);
    const leaveDeduction = unpaidLeaves * (basicSalary / workingDays);
    const totalDeduction = tax + pf + leaveDeduction;
    const netSalary = Math.max(0, basicSalary - totalDeduction);

    const payrollDoc = {
      employee_id: user_id,
      employee_name: user.employee_name,
      month,
      basic_salary: basicSalary,
      attendance_summary: {
        total_working_days: workingDays,
        present_days: presentDays,
        absent_days: absentDays,
        paid_leave_allowance: paidLeaves,
        unpaid_leave_days: unpaidLeaves,
      },
      deductions: {
        tax_amount: Math.round(tax),
        pf_amount: Math.round(pf),
        leave_deduction: Math.round(leaveDeduction),
        total_deduction: Math.round(totalDeduction),
      },
      salary_breakdown: {
        gross_salary: basicSalary,
        net_salary: Math.round(netSalary),
      },
      status: "Processed",
      generated_on: new Date().toISOString().slice(0, 10),
    };

    await db.collection("Payrolls").insertOne(payrollDoc);
    return res.json(payrollDoc);
  } catch (error) {
    console.error("Salary generation error:", error);
    return res.status(500).json({ error: error.message });
  }
};

// ✅ 3. ADD / UPSERT SALARY INFO
const Addsalaryinfo = async (req, res) => {
  const db = getDB();
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
    updated_by,
  } = req.body;

  if (!employee_id) {
    return res.status(400).json({ message: "Employee ID is required." });
  }

  try {
    const userDoc = await db.collection("users").findOne({ user_id: employee_id });
    const name = employee_name || userDoc?.username || `Employee ${employee_id}`;
    const base = Number(base_salary) || Number(userDoc?.salary) || 75000;
    const joinDate = joining_date || userDoc?.joigningDate || new Date().toISOString().split("T")[0];
    const updater = updated_by || req.user?.username || "Admin";

    const nowIST = new Date(new Date().getTime() + 5.5 * 60 * 60 * 1000);

    const docToSave = {
      employee_id,
      employee_name: name,
      base_salary: base,
      hra: hra !== undefined && hra !== "" ? Number(hra) : Math.round(base * 0.4),
      bonus: bonus !== undefined && bonus !== "" ? Number(bonus) : 5000,
      tax_percent: tax_percent !== undefined && tax_percent !== "" ? Number(tax_percent) : 10,
      pf_percent: pf_percent !== undefined && pf_percent !== "" ? Number(pf_percent) : 12,
      paid_leaves_allowed: Number(paid_leaves_allowed) || 2,
      joining_date: joinDate,
      last_update: nowIST,
      updated_by: updater,
    };

    const result = await db.collection("SalaryInfo").updateOne(
      { employee_id },
      { $set: docToSave },
      { upsert: true }
    );

    // Also update base salary in `users` collection to keep in sync
    await db.collection("users").updateOne(
      { user_id: employee_id },
      { $set: { salary: base } }
    );

    return res.status(200).json({
      message: "Salary info saved successfully.",
      data: docToSave,
      result,
    });
  } catch (error) {
    console.error("Error adding salary info:", error);
    return res.status(500).json({ message: "Server error while saving salary info." });
  }
};

// ✅ 4. UPDATE SALARY INFO
const Updatesalaryinfo = async (req, res) => {
  const db = getDB();
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
    updated_by,
  } = req.body;

  if (!employee_id) {
    return res.status(400).json({ message: "Employee ID is required." });
  }

  try {
    const nowIST = new Date(new Date().getTime() + 5.5 * 60 * 60 * 1000);
    const olddata = (await db.collection("SalaryInfo").findOne({ employee_id })) || {};
    const user = await db.collection("users").findOne({ user_id: employee_id });

    const base = Number(base_salary) || Number(olddata.base_salary) || 75000;

    const updateFields = {
      employee_id,
      employee_name: employee_name || olddata.employee_name || user?.username || `Employee ${employee_id}`,
      base_salary: base,
      hra: hra !== undefined && hra !== "" ? Number(hra) : (olddata.hra ?? Math.round(base * 0.4)),
      bonus: bonus !== undefined && bonus !== "" ? Number(bonus) : (olddata.bonus ?? 5000),
      tax_percent: tax_percent !== undefined && tax_percent !== "" ? Number(tax_percent) : (olddata.tax_percent ?? 10),
      pf_percent: pf_percent !== undefined && pf_percent !== "" ? Number(pf_percent) : (olddata.pf_percent ?? 12),
      paid_leaves_allowed: Number(paid_leaves_allowed) || olddata.paid_leaves_allowed || 2,
      joining_date: joining_date || olddata.joining_date || user?.joigningDate || nowIST.toISOString().split("T")[0],
      last_update: nowIST,
      updated_by: updated_by || req.user?.username || "Admin",
    };

    await db.collection("SalaryInfo").updateOne(
      { employee_id },
      { $set: updateFields },
      { upsert: true }
    );

    // Sync base salary to user
    await db.collection("users").updateOne(
      { user_id: employee_id },
      { $set: { salary: base } }
    );

    // Send email notification safely in background
    if (user?.email && transporter) {
      try {
        transporter.sendMail({
          from: `"Lucent Polysystem Pvt. Ltd." <${process.env.SMTP_EMAIL || "hr@lucentpolysystem.com"}>`,
          to: user.email,
          subject: "Lucent Polysystem – Salary Update Notification",
          html: `
            <p>Dear <strong>${updateFields.employee_name}</strong>,</p>
            <p>Your salary record has been successfully updated on ${new Date().toLocaleDateString()}.</p>
            <ul>
              <li><strong>Base Salary:</strong> ₹${updateFields.base_salary}</li>
              <li><strong>HRA:</strong> ₹${updateFields.hra}</li>
              <li><strong>Bonus:</strong> ₹${updateFields.bonus}</li>
              <li><strong>Tax:</strong> ${updateFields.tax_percent}%</li>
              <li><strong>PF:</strong> ${updateFields.pf_percent}%</li>
            </ul>
            <p>Best regards,<br><strong>Lucent Polysystem Pvt. Ltd. HR Team</strong></p>
          `,
        }).catch((e) => console.log("Salary update email notice skipped:", e.message));
      } catch (err) {
        console.log("Email dispatch caught:", err.message);
      }
    }

    res.status(200).json({
      message: "Salary info updated successfully.",
      updatedFields: updateFields,
    });
  } catch (error) {
    console.error("Error updating salary info:", error);
    res.status(500).json({ message: "Server error while updating salary info." });
  }
};

module.exports = {
  GenerateSlip,
  Addsalaryinfo,
  Updatesalaryinfo,
  usersalarybyitsid,
};