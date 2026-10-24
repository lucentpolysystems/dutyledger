import React, { useState, useEffect } from "react";
import { useSelector } from "react-redux";
import {
  ChevronDown,
  ChevronUp,
  Download,
  IndianRupee,
  Banknote,
  Gift,
  Minus,
  Building2,
  Calendar,
  FileText,
  CheckCircle2,
} from "lucide-react";
import { Transition } from "@headlessui/react";
import { apiUrl, authHeaders } from "../../utils/api";
import { downloadSalarySlipPDF } from "../../utils/salarySlipPdf";

const Salary = () => {
  const [openIndex, setOpenIndex] = useState(null);
  const now = new Date();
  const [selectedMonth, setSelectedMonth] = useState(String(now.getMonth() + 1).padStart(2, "0"));
  const [selectedYear, setSelectedYear] = useState(String(now.getFullYear())); 
  const [data, setData] = useState([]);

  const user = useSelector((state) => state.auth.user);
  const token = useSelector((state) => state.auth.token);

  const user_id = user?.id;

  useEffect(() => {
    const fetchSalary = async () => {
      if (!selectedMonth || !selectedYear || !user_id) {
        console.warn("Missing month/year/user_id");
        return;
      }

      try {
        const res = await fetch(apiUrl("/api/Generate"), {
          method: "POST",
          headers: authHeaders(token),
          body: JSON.stringify({
            month: `${selectedYear}-${selectedMonth}`,
            user_id,
          }),
        });

        const result = await res.json();
        if (res.ok && result && (result.salary_breakdown || result.deductions)) {
          setData([result]);
        } else {
          setData([]);
        }
      } catch (err) {
        console.error("Error fetching salary data:", err);
        setData([]);
      }
    };

    fetchSalary();
  }, [selectedMonth, selectedYear, user_id, token]);

  const toggleOpen = (index) => {
    setOpenIndex(openIndex === index ? null : index);
  };

  const months = [
    "01", "02", "03", "04", "05", "06",
    "07", "08", "09", "10", "11", "12",
  ];

  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: 10 }, (_, i) => currentYear - i);

  const downloadPDF = (item) => {
    downloadSalarySlipPDF(item, user);
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-50">
      <div className="flex-1 p-4 md:p-8 max-w-7xl w-full mx-auto">
        {/* Company Header Banner */}
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs p-6 mb-6">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1 bg-indigo-50 border border-indigo-200 text-indigo-700 text-xs font-bold rounded-full mb-2">
                <img src="/logo.jpg" alt="Logo" className="w-4 h-4 object-contain rounded-xs" />
                <Building2 className="w-3.5 h-3.5" /> Lucent Polysystems
              </div>
              <h1 className="text-2xl lg:text-3xl font-extrabold text-slate-900 tracking-tight">
                Employee Salary & Payslips
              </h1>
              <p className="text-sm text-slate-500 mt-1">
                C-35, Phase I, MIDC Chakan, Mahalunge, Khed, Pune – 410501, Maharashtra • GST: 27AACCL1694A1ZR
              </p>
              <div className="text-xs text-slate-400 mt-0.5">
                +91 98506 29842 • lucentpolysystems.md@gmail.com
              </div>
            </div>

            {/* Filter Section */}
            <div className="flex flex-wrap items-center gap-3">
              <div className="flex items-center gap-2 bg-slate-50 border border-slate-300 rounded-xl px-3 py-1.5 shadow-2xs">
                <Calendar className="w-4 h-4 text-slate-400" />
                <select
                  value={selectedMonth}
                  onChange={(e) => setSelectedMonth(e.target.value)}
                  className="bg-transparent text-sm font-semibold text-slate-700 focus:outline-none cursor-pointer"
                >
                  <option value="">Month</option>
                  {months.map((m) => (
                    <option key={m} value={m}>
                      {new Date(2026, parseInt(m, 10) - 1).toLocaleString("en-US", { month: "long" })} ({m})
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex items-center gap-2 bg-slate-50 border border-slate-300 rounded-xl px-3 py-1.5 shadow-2xs">
                <select
                  value={selectedYear}
                  onChange={(e) => setSelectedYear(e.target.value)}
                  className="bg-transparent text-sm font-semibold text-slate-700 focus:outline-none cursor-pointer"
                >
                  <option value="">Year</option>
                  {years.map((y) => (
                    <option key={y} value={y}>
                      {y}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>
        </div>

        {/* Salary Slips */}
        <div className="space-y-6">
          {data.length > 0 ? (
            data.map((item, index) => (
              <div
                key={index}
                className="bg-white rounded-2xl border border-slate-200 shadow-sm transition hover:shadow-md overflow-hidden"
              >
                {/* Header row */}
                <div
                  className="flex flex-col sm:flex-row justify-between items-start sm:items-center px-6 py-5 cursor-pointer bg-gradient-to-r from-slate-50 to-white border-b border-slate-100 gap-4"
                  onClick={() => toggleOpen(index)}
                >
                  <div className="flex items-center space-x-4">
                    <div className="bg-indigo-600 text-white p-3 rounded-xl shadow-md">
                      <Banknote className="w-6 h-6" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-lg font-bold text-slate-900">
                          {item.month}
                        </span>
                        <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800 border border-emerald-200">
                          Verified Paid
                        </span>
                      </div>
                      <div className="text-xs text-slate-500 font-medium mt-0.5">
                        Lucent Polysystem Pvt. Ltd. • Employee ID: {item?.employee_id || item?.user_id || user?.id}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center space-x-3 w-full sm:w-auto justify-between sm:justify-end">
                    <div className="text-right">
                      <div className="text-xs text-slate-400 font-medium">Net Disbursed</div>
                      <div className="text-xl font-extrabold text-slate-900">
                        ₹{(Number(item.salary_breakdown?.net_salary) || 0).toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        downloadPDF(item);
                      }}
                      className="bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold px-4 py-2.5 rounded-xl shadow-xs hover:shadow transition flex items-center gap-2 cursor-pointer"
                    >
                      <Download className="w-4 h-4" />
                      <span>Download PDF</span>
                    </button>

                    <div className="p-2 text-slate-400 hover:text-slate-600">
                      {openIndex === index ? (
                        <ChevronUp className="w-5 h-5" />
                      ) : (
                        <ChevronDown className="w-5 h-5" />
                      )}
                    </div>
                  </div>
                </div>

                {/* Collapsible Content */}
                <Transition
                  show={openIndex === index}
                  enter="transition-all duration-300 ease-out"
                  enterFrom="max-h-0 opacity-0"
                  enterTo="max-h-screen opacity-100"
                  leave="transition-all duration-200 ease-in"
                  leaveFrom="max-h-screen opacity-100"
                  leaveTo="max-h-0 opacity-0"
                >
                  <div className="p-6 bg-slate-50/60 border-t border-slate-100 space-y-6">
                    {/* Attendance summary pill strip */}
                    <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
                      <div className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">
                        Attendance Record ({item.month})
                      </div>
                      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 text-center">
                        <div className="p-2.5 bg-slate-50 rounded-lg border border-slate-100">
                          <div className="text-xs text-slate-500">Working Days</div>
                          <div className="text-base font-bold text-slate-800">{item?.attendance_summary?.total_working_days ?? 26}</div>
                        </div>
                        <div className="p-2.5 bg-emerald-50 rounded-lg border border-emerald-100">
                          <div className="text-xs text-emerald-600 font-medium">Present Days</div>
                          <div className="text-base font-bold text-emerald-700">{item?.attendance_summary?.present_days ?? "--"}</div>
                        </div>
                        <div className="p-2.5 bg-rose-50 rounded-lg border border-rose-100">
                          <div className="text-xs text-rose-600 font-medium">Absent Days</div>
                          <div className="text-base font-bold text-rose-700">{item?.attendance_summary?.absent_days ?? 0}</div>
                        </div>
                        <div className="p-2.5 bg-sky-50 rounded-lg border border-sky-100">
                          <div className="text-xs text-sky-600 font-medium">Paid Leaves</div>
                          <div className="text-base font-bold text-sky-700">{item?.attendance_summary?.paid_leave_allowance ?? 2}</div>
                        </div>
                        <div className="p-2.5 bg-amber-50 rounded-lg border border-amber-100">
                          <div className="text-xs text-amber-600 font-medium">Unpaid Leaves</div>
                          <div className="text-base font-bold text-amber-700">{item?.attendance_summary?.unpaid_leave_days ?? 0}</div>
                        </div>
                      </div>
                    </div>

                    {/* Earnings vs Deductions Breakdown */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {/* Earnings */}
                      <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-2xs">
                        <h3 className="text-sm font-bold text-emerald-700 uppercase tracking-wider mb-3 flex items-center gap-1.5">
                          <Banknote className="w-4 h-4" /> Earnings Breakdown
                        </h3>
                        <div className="space-y-2.5 text-sm">
                          <div className="flex justify-between text-slate-600">
                            <span>Basic Pay</span>
                            <span className="font-semibold text-slate-800">
                              ₹{(Number(item?.basic_salary) || 0).toLocaleString("en-IN")}
                            </span>
                          </div>
                          <div className="flex justify-between text-slate-600">
                            <span>House Rent Allowance (HRA 40%)</span>
                            <span className="font-semibold text-slate-800">
                              ₹{Math.round((Number(item?.basic_salary) || 0) * 0.4).toLocaleString("en-IN")}
                            </span>
                          </div>
                          <div className="flex justify-between text-slate-600">
                            <span>Special Production Allowance</span>
                            <span className="font-semibold text-slate-800">
                              ₹{(
                                Math.max(0, (Number(item?.salary_breakdown?.gross_salary) || 0) - ((Number(item?.basic_salary) || 0) + Math.round((Number(item?.basic_salary) || 0) * 0.4)))
                              ).toLocaleString("en-IN")}
                            </span>
                          </div>
                          <div className="pt-2 border-t border-slate-200 flex justify-between font-bold text-slate-900">
                            <span>Gross Earnings</span>
                            <span className="text-emerald-700">
                              ₹{(Number(item?.salary_breakdown?.gross_salary) || Number(item?.basic_salary) || 0).toLocaleString("en-IN")}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Deductions */}
                      <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-2xs">
                        <h3 className="text-sm font-bold text-rose-700 uppercase tracking-wider mb-3 flex items-center gap-1.5">
                          <Minus className="w-4 h-4" /> Deductions & Taxes
                        </h3>
                        <div className="space-y-2.5 text-sm">
                          <div className="flex justify-between text-slate-600">
                            <span>Provident Fund (PF)</span>
                            <span className="font-semibold text-slate-800">
                              ₹{(Number(item?.deductions?.pf_amount) || 0).toLocaleString("en-IN")}
                            </span>
                          </div>
                          <div className="flex justify-between text-slate-600">
                            <span>Income Tax (TDS Slab)</span>
                            <span className="font-semibold text-slate-800">
                              ₹{(Number(item?.deductions?.tax_amount) || 0).toLocaleString("en-IN")}
                            </span>
                          </div>
                          <div className="flex justify-between text-slate-600">
                            <span>Unpaid Leave Deductions</span>
                            <span className="font-semibold text-slate-800">
                              ₹{(Number(item?.deductions?.leave_deduction) || 0).toFixed(2)}
                            </span>
                          </div>
                          <div className="pt-2 border-t border-slate-200 flex justify-between font-bold text-slate-900">
                            <span>Total Deductions</span>
                            <span className="text-rose-700">
                              ₹{(Number(item?.deductions?.total_deduction) || 0).toFixed(2)}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Net Payout Banner */}
                    <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-xl p-4 flex flex-col sm:flex-row items-center justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <div className="p-2.5 bg-emerald-600 text-white rounded-lg">
                          <CheckCircle2 className="w-5 h-5" />
                        </div>
                        <div>
                          <div className="text-xs text-emerald-800 font-bold uppercase tracking-wider">
                            Official Net Payable (Lucent Polysystem Pvt. Ltd.)
                          </div>
                          <div className="text-xs text-slate-500">
                            Direct Credit into verified salary account
                          </div>
                        </div>
                      </div>
                      <div className="text-2xl font-black text-emerald-800">
                        ₹{(Number(item?.salary_breakdown?.net_salary) || 0).toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </div>
                    </div>
                  </div>
                </Transition>
              </div>
            ))
          ) : (
            <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center shadow-xs">
              <FileText className="w-12 h-12 text-slate-300 mx-auto mb-3" />
              <h3 className="text-base font-bold text-slate-700">No Salary Statement Available</h3>
              <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
                No salary slip has been generated for {selectedMonth}/{selectedYear} for this employee account. Please select another month or contact Lucent HR.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Salary;

