import jsPDF from "jspdf";
import { registerNotoSans } from "../Pages/NotoSansVariable.react";

// Cached Base64 Data URL for the corporate logo
let cachedLogoDataUrl = null;

async function getLogoDataUrl() {
  if (cachedLogoDataUrl) return cachedLogoDataUrl;
  try {
    const res = await fetch("/logo.jpg");
    if (!res.ok) return null;
    const blob = await res.blob();
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        cachedLogoDataUrl = reader.result;
        resolve(cachedLogoDataUrl);
      };
      reader.onerror = () => resolve(null);
      reader.readAsDataURL(blob);
    });
  } catch (err) {
    console.warn("Logo loading failed:", err);
    return null;
  }
}

/**
 * Downloads a professionally formatted, branded, and watermarked
 * salary slip PDF for Lucent Polysystems.
 *
 * @param {Object} item - Payroll slip data (attendance_summary, salary_breakdown, deductions, etc.)
 * @param {Object} user - Optional current user / employee object
 */
export async function downloadSalarySlipPDF(item, user = {}) {
  const doc = new jsPDF({
    orientation: "portrait",
    unit: "mm",
    format: "a4",
  });

  registerNotoSans(doc);
  doc.setFont("NotoSansVariable");

  const rupee = String.fromCharCode(8377);
  const logoDataUrl = await getLogoDataUrl();

  // ==========================================
  // 1. PAGE BORDERS (Executive Double Frame)
  // ==========================================
  // Outer subtle frame (8mm margin)
  doc.setDrawColor(203, 213, 225); // Slate-300
  doc.setLineWidth(0.6);
  doc.rect(8, 8, 194, 281);

  // Inner navy frame (9.5mm margin)
  doc.setDrawColor(30, 58, 138); // Deep Navy (#1e3a8a)
  doc.setLineWidth(0.25);
  doc.rect(9.5, 9.5, 191, 278);

  // Top header accent line
  doc.setFillColor(30, 58, 138);
  doc.rect(9.5, 9.5, 191, 3, "F");

  // ==========================================
  // 2. WATERMARK (Centered soft logo + text)
  // ==========================================
  if (typeof doc.saveGraphicsState === "function" && typeof doc.setGState === "function") {
    doc.saveGraphicsState();
    doc.setGState(new doc.GState({ opacity: 0.065 }));

    // Center Logo Watermark
    if (logoDataUrl) {
      doc.addImage(logoDataUrl, "JPEG", 55, 105, 100, 68);
    }

    // Diagonal Company Name Watermark
    doc.setFontSize(32);
    doc.setTextColor(30, 58, 138);
    doc.text("LUCENT POLYSYSTEMS", 105, 168, { align: "center", angle: 32 });

    doc.restoreGraphicsState();
  } else {
    // Fallback watermark without GState
    doc.setFontSize(30);
    doc.setTextColor(243, 244, 246);
    doc.text("LUCENT POLYSYSTEMS", 105, 168, { align: "center", angle: 32 });
  }

  // ==========================================
  // 3. CORPORATE HEADER (Logo + Company Details)
  // ==========================================
  // Corporate Logo on the left
  if (logoDataUrl) {
    try {
      doc.addImage(logoDataUrl, "JPEG", 13, 16, 32, 22);
    } catch (e) {
      console.warn("Could not render logo in header:", e);
    }
  }

  // Company Details (Right of logo)
  const headerTextX = logoDataUrl ? 49 : 14;

  doc.setFontSize(15);
  doc.setTextColor(15, 23, 42); // Slate-900 (Bold)
  doc.text("LUCENT POLYSYSTEMS", headerTextX, 19);

  doc.setFontSize(7.5);
  doc.setTextColor(71, 85, 105); // Slate-600
  doc.text("C-35, Phase I, MIDC Chakan, Village: Mahalunge, Taluka: Khed,", headerTextX, 24);
  doc.text("District: Pune – 410501, Maharashtra, India", headerTextX, 28);

  doc.setFontSize(8);
  doc.setTextColor(30, 58, 138); // Corporate Navy
  doc.text("GST: 27AACCL1694A1ZR", headerTextX, 33);

  doc.setTextColor(51, 65, 85);
  doc.text("Tel: +91 98506 29842   |   Email: lucentpolysystems.md@gmail.com", headerTextX + 44, 33);

  // Separator bar with orange accent
  doc.setFillColor(30, 58, 138);
  doc.rect(12, 40, 186, 0.8, "F");
  doc.setFillColor(249, 115, 22); // Orange #f97316 (Lucent logo orange)
  doc.rect(12, 40, 36, 0.8, "F");

  // ==========================================
  // 4. PAYSLIP TITLE & PERIOD BANNER
  // ==========================================
  doc.setFillColor(241, 245, 249); // Slate-100
  doc.rect(12, 42.5, 186, 8.5, "F");
  doc.setDrawColor(203, 213, 225);
  doc.setLineWidth(0.2);
  doc.rect(12, 42.5, 186, 8.5);

  doc.setFontSize(10.5);
  doc.setTextColor(15, 23, 42);
  doc.text(`CONFIDENTIAL SALARY PAYSLIP`, 16, 48);

  doc.setTextColor(30, 58, 138);
  doc.text(`MONTH: ${item?.month || ""}`, 100, 48);

  doc.setFontSize(8);
  doc.setTextColor(100, 116, 139);
  doc.text(
    `Issue Date: ${item?.generated_on || new Date().toISOString().split("T")[0]}`,
    194,
    48,
    { align: "right" }
  );

  // ==========================================
  // 5. EMPLOYEE PROFILE & BANK DETAILS
  // ==========================================
  let y = 53.5;
  const infoBoxHeight = 25;

  doc.setFillColor(248, 250, 252); // Slate-50
  doc.rect(12, y, 186, infoBoxHeight, "F");
  doc.setDrawColor(226, 232, 240);
  doc.rect(12, y, 186, infoBoxHeight);

  // Vertical Divider in info box
  doc.line(105, y, 105, y + infoBoxHeight);

  doc.setFontSize(8.5);
  doc.setTextColor(71, 85, 105);

  // Left Column
  doc.text("Employee ID:", 16, y + 6);
  doc.setTextColor(15, 23, 42);
  doc.text(`${item?.employee_id || item?.user_id || user?.id || "--"}`, 50, y + 6);

  doc.setTextColor(71, 85, 105);
  doc.text("Employee Name:", 16, y + 12);
  doc.setTextColor(15, 23, 42);
  doc.text(`${item?.employee_name || item?.username || user?.name || user?.username || "--"}`, 50, y + 12);

  doc.setTextColor(71, 85, 105);
  doc.text("Designation:", 16, y + 18);
  doc.setTextColor(15, 23, 42);
  doc.text(`${item?.designation || user?.designation || "Executive Staff"}`, 50, y + 18);

  // Right Column
  doc.setTextColor(71, 85, 105);
  doc.text("Department:", 109, y + 6);
  doc.setTextColor(15, 23, 42);
  doc.text(`${item?.department || user?.department || "Operations & Manufacturing"}`, 145, y + 6);

  doc.setTextColor(71, 85, 105);
  doc.text("Bank Account:", 109, y + 12);
  doc.setTextColor(15, 23, 42);
  doc.text(`${item?.bankAccount || user?.bankAccount || "Verified Salary Account"}`, 145, y + 12);

  doc.setTextColor(71, 85, 105);
  doc.text("Payment Mode:", 109, y + 18);
  doc.setTextColor(15, 23, 42);
  doc.text("Electronic Direct Credit (NEFT)", 145, y + 18);

  y += infoBoxHeight + 3;

  // ==========================================
  // 6. ATTENDANCE & LEAVES SUMMARY
  // ==========================================
  doc.setFillColor(241, 245, 249);
  doc.rect(12, y, 186, 6, "F");
  doc.setDrawColor(203, 213, 225);
  doc.rect(12, y, 186, 6);

  doc.setFontSize(8);
  doc.setTextColor(30, 58, 138);
  doc.text("ATTENDANCE & LEAVES SUMMARY (MONTHLY RECORD)", 16, y + 4.3);

  y += 6;
  doc.setFillColor(255, 255, 255);
  doc.rect(12, y, 186, 9, "F");
  doc.rect(12, y, 186, 9);

  const colW = 186 / 5;
  doc.line(12 + colW, y, 12 + colW, y + 9);
  doc.line(12 + colW * 2, y, 12 + colW * 2, y + 9);
  doc.line(12 + colW * 3, y, 12 + colW * 3, y + 9);
  doc.line(12 + colW * 4, y, 12 + colW * 4, y + 9);

  doc.setFontSize(8);
  doc.setTextColor(51, 65, 85);
  doc.text(`Working Days: ${item?.attendance_summary?.total_working_days ?? 26}`, 14, y + 5.8);
  doc.text(`Present: ${item?.attendance_summary?.present_days ?? "--"}`, 12 + colW + 4, y + 5.8);
  doc.text(`Absent: ${item?.attendance_summary?.absent_days ?? 0}`, 12 + colW * 2 + 4, y + 5.8);
  doc.text(`Paid Leaves: ${item?.attendance_summary?.paid_leave_allowance ?? 2}`, 12 + colW * 3 + 4, y + 5.8);
  doc.text(`Unpaid Leaves: ${item?.attendance_summary?.unpaid_leave_days ?? 0}`, 12 + colW * 4 + 4, y + 5.8);

  y += 12;

  // ==========================================
  // 7. EARNINGS VS DEDUCTIONS TABLE
  // ==========================================
  // Table Header
  doc.setFillColor(30, 58, 138); // Deep Navy
  doc.rect(12, y, 93, 7.5, "F");
  doc.rect(105, y, 93, 7.5, "F");
  doc.setDrawColor(30, 58, 138);
  doc.rect(12, y, 186, 7.5);

  doc.setTextColor(255, 255, 255);
  doc.setFontSize(8.5);
  doc.text("EARNINGS", 16, y + 5.2);
  doc.text(`AMOUNT (${rupee})`, 76, y + 5.2);
  doc.text("DEDUCTIONS", 109, y + 5.2);
  doc.text(`AMOUNT (${rupee})`, 172, y + 5.2);

  y += 7.5;
  const rowHeight = 7;

  const drawRow = (labelLeft, valLeft, labelRight, valRight, isSubtotal = false) => {
    if (isSubtotal) {
      doc.setFillColor(248, 250, 252);
      doc.rect(12, y, 93, rowHeight, "F");
      doc.rect(105, y, 93, rowHeight, "F");
    }
    doc.setDrawColor(226, 232, 240);
    doc.rect(12, y, 93, rowHeight);
    doc.rect(105, y, 93, rowHeight);

    doc.setTextColor(isSubtotal ? 15 : 51, isSubtotal ? 23 : 65, isSubtotal ? 42 : 85);
    doc.setFontSize(8);
    doc.text(labelLeft || "", 16, y + 4.8);
    doc.text(valLeft || "", 76, y + 4.8);
    doc.text(labelRight || "", 109, y + 4.8);
    doc.text(valRight || "", 172, y + 4.8);
    y += rowHeight;
  };

  const basicSalary = Number(item?.basic_salary) || 0;
  const grossSalary = Number(item?.salary_breakdown?.gross_salary) || basicSalary;
  const hra = Math.round(basicSalary * 0.4);
  const specialAllowance = Math.max(0, grossSalary - (basicSalary + hra));

  const taxAmount = Number(item?.deductions?.tax_amount) || 0;
  const pfAmount = Number(item?.deductions?.pf_amount) || 0;
  const leaveDeduction = Number(item?.deductions?.leave_deduction) || 0;
  const totalDeduction = Number(item?.deductions?.total_deduction) || (taxAmount + pfAmount + leaveDeduction);
  const netSalary = Number(item?.salary_breakdown?.net_salary) || Math.max(0, grossSalary - totalDeduction);

  drawRow("Basic Salary", `${rupee}${basicSalary.toLocaleString("en-IN")}`, "Provident Fund (PF)", `${rupee}${pfAmount.toLocaleString("en-IN")}`);
  drawRow("House Rent Allowance (HRA)", `${rupee}${hra.toLocaleString("en-IN")}`, "Income Tax (TDS Slab)", `${rupee}${taxAmount.toLocaleString("en-IN")}`);
  drawRow("Special Production Bonus", `${rupee}${specialAllowance.toLocaleString("en-IN")}`, "Unpaid Leave Deductions", `${rupee}${leaveDeduction.toFixed(2)}`);
  drawRow("Gross Earnings", `${rupee}${grossSalary.toLocaleString("en-IN")}`, "Total Deductions", `${rupee}${totalDeduction.toFixed(2)}`, true);

  y += 4;

  // ==========================================
  // 8. NET SALARY PAYABLE HIGHLIGHT BOX
  // ==========================================
  doc.setFillColor(236, 253, 245); // Emerald-50
  doc.rect(12, y, 186, 12, "F");
  doc.setDrawColor(16, 185, 129); // Emerald-500
  doc.setLineWidth(0.4);
  doc.rect(12, y, 186, 12);
  doc.setLineWidth(0.2);

  doc.setTextColor(6, 95, 70); // Emerald-800
  doc.setFontSize(10.5);
  doc.text(`NET PAYABLE SALARY:  ${rupee}${netSalary.toFixed(2)}`, 16, y + 7.8);

  doc.setFontSize(7.8);
  doc.setTextColor(5, 150, 105);
  doc.text("Disbursed to Employee Salary Account via Electronic Direct Credit", 194, y + 7.8, {
    align: "right",
  });

  y += 16;

  // ==========================================
  // 9. STATUTORY & LOCATION NOTICE BOX
  // ==========================================
  doc.setFillColor(248, 250, 252);
  doc.rect(12, y, 186, 14, "F");
  doc.setDrawColor(226, 232, 240);
  doc.rect(12, y, 186, 14);

  doc.setFontSize(7);
  doc.setTextColor(71, 85, 105);
  doc.text("STATUTORY & DISBURSEMENT RECORD:", 16, y + 4.5);
  doc.setTextColor(100, 116, 139);
  doc.text(
    "• Facility: C-35, Phase I, MIDC Chakan, Mahalunge, Khed, Pune – 410501, Maharashtra  |  GST: 27AACCL1694A1ZR",
    16,
    y + 8.5
  );
  doc.text(
    "• This compensation statement is verified against biometric/geofenced attendance logs. PF & TDS remitted as per statutory rules.",
    16,
    y + 12
  );

  y += 24;

  // ==========================================
  // 10. SIGNATURES & AUTHORIZATION
  // ==========================================
  doc.setDrawColor(203, 213, 225);
  doc.line(12, y, 198, y);

  y += 5;
  doc.setFontSize(8);
  doc.setTextColor(71, 85, 105);
  doc.text("Prepared By:", 22, y);
  doc.text("Checked & Verified By:", 90, y);
  doc.text("Authorized Signatory:", 156, y);

  y += 5;
  doc.setFontSize(8.5);
  doc.setTextColor(15, 23, 42);
  doc.text("HR & Personnel Dept.", 22, y);
  doc.text("Accounts & Payroll", 90, y);
  doc.text("Director / Management", 156, y);

  y += 4;
  doc.setFontSize(7.2);
  doc.setTextColor(100, 116, 139);
  doc.text("Lucent Polysystems", 22, y);
  doc.text("Lucent Polysystems", 90, y);
  doc.text("Lucent Polysystems", 156, y);

  // Bottom seal / authentication text
  doc.setFontSize(6.8);
  doc.setTextColor(148, 163, 184);
  doc.text(
    "* Official computer-generated payslip of Lucent Polysystems • Chakan, Pune – 410501 • GST: 27AACCL1694A1ZR • Confidential",
    105,
    284,
    { align: "center" }
  );

  // Save the PDF file
  const safeEmpId = item?.employee_id || item?.user_id || user?.id || "EMP";
  const filename = `LucentPolysystems-SalarySlip-${item?.month || "Month"}-${safeEmpId}.pdf`;
  doc.save(filename);
}
