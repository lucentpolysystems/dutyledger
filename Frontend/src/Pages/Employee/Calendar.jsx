import React, { useState, useEffect } from "react";
import { useSelector } from "react-redux";
import {
  ChevronLeft,
  ChevronRight,
  Clock,
  LogIn,
  LogOut,
  Calendar as CalendarIcon,
  CheckCircle2,
  AlertCircle,
  X,
  MapPin,
  Sparkles,
  TrendingUp,
} from "lucide-react";
import dayjs from "dayjs";
import { apiUrl } from "../../utils/api";

const Calendar = () => {
  const user = useSelector((state) => state.auth.user);
  const userId = user?.id || "EMP001";

  const [currentDate, setCurrentDate] = useState(dayjs());
  const [holidays, setHolidays] = useState({});
  const [attendanceMap, setAttendanceMap] = useState({});
  const [selectedDayData, setSelectedDayData] = useState(null);
  const [loading, setLoading] = useState(false);

  // 1. Fetch Company Holidays
  useEffect(() => {
    fetch(apiUrl("/api/holidays"))
      .then((res) => res.json())
      .then((data) => {
        const map = {};
        if (Array.isArray(data)) {
          data.forEach((h) => {
            map[h.date] = h.reason;
          });
        }
        setHolidays(map);
      })
      .catch((err) => console.error("Error loading holidays:", err));
  }, []);

  // 2. Fetch Employee Attendance Records for Current Month
  useEffect(() => {
    const fetchMonthlyAttendance = async () => {
      try {
        setLoading(true);
        const yearMonth = currentDate.format("YYYY-MM");
        const res = await fetch(
          apiUrl(`/api/getAllAttendanceByMonthofuser/${userId}/${yearMonth}`)
        );
        const data = await res.json();

        const map = {};
        if (Array.isArray(data)) {
          data.forEach((rec) => {
            map[rec.date] = rec;
          });
        }
        setAttendanceMap(map);
      } catch (err) {
        console.error("Error loading monthly attendance:", err);
      } finally {
        setLoading(false);
      }
    };

    if (userId) {
      fetchMonthlyAttendance();
    }
  }, [userId, currentDate]);

  const startOfMonth = currentDate.startOf("month");
  const startDay = startOfMonth.day(); // Sunday = 0
  const daysInMonth = currentDate.daysInMonth();

  const prevMonth = () => setCurrentDate(currentDate.subtract(1, "month"));
  const nextMonth = () => setCurrentDate(currentDate.add(1, "month"));
  const resetToToday = () => setCurrentDate(dayjs());

  const days = [];
  for (let i = 0; i < startDay; i++) days.push(null);
  for (let i = 1; i <= daysInMonth; i++) days.push(i);

  // Statistics calculation for the month
  const totalPresent = Object.values(attendanceMap).filter(
    (a) => a.status === "Present"
  ).length;
  const totalLate = Object.values(attendanceMap).filter(
    (a) => a.status === "Late"
  ).length;
  const totalHalfDay = Object.values(attendanceMap).filter(
    (a) => a.status === "Half Day"
  ).length;
  const totalHoursLogged = Object.values(attendanceMap).reduce((acc, curr) => {
    return acc + (parseFloat(curr.total_hours) || 0);
  }, 0);

  const handleDayClick = (day) => {
    if (!day) return;
    const dateStr = currentDate.date(day).format("YYYY-MM-DD");
    const att = attendanceMap[dateStr];
    const holidayReason = holidays[dateStr];
    const dayOfWeek = currentDate.date(day).day();
    const isSunday = dayOfWeek === 0;

    setSelectedDayData({
      day,
      dateStr,
      formattedDate: currentDate.date(day).format("dddd, D MMMM YYYY"),
      attendance: att,
      isHoliday: !!holidayReason,
      holidayReason,
      isSunday,
    });
  };

  return (
    <div className="min-h-screen bg-slate-50 p-4 md:p-6 space-y-6">
      {/* Top Header & Branding */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-2 border-b border-slate-200">
        <div>
          <h1 className="text-2xl font-black text-slate-800 flex items-center gap-2">
            <CalendarIcon className="text-indigo-600" size={24} />
            My Attendance & Shift Calendar
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Lucent Polysystem Pvt. Ltd. • Daily punch-in, punch-out, and biometric tracking
          </p>
        </div>

        {/* Month Navigation */}
        <div className="flex items-center gap-2 bg-white px-3 py-1.5 rounded-xl border border-slate-200 shadow-sm self-start sm:self-auto">
          <button
            onClick={prevMonth}
            className="p-1.5 hover:bg-slate-100 rounded-lg text-slate-600 transition"
            title="Previous Month"
          >
            <ChevronLeft size={18} />
          </button>
          <span className="text-sm font-bold text-slate-800 min-w-[130px] text-center">
            {currentDate.format("MMMM YYYY")}
          </span>
          <button
            onClick={nextMonth}
            className="p-1.5 hover:bg-slate-100 rounded-lg text-slate-600 transition"
            title="Next Month"
          >
            <ChevronRight size={18} />
          </button>
          <button
            onClick={resetToToday}
            className="text-[11px] font-bold text-indigo-600 bg-indigo-50 hover:bg-indigo-100 px-2.5 py-1 rounded-md ml-1 transition"
          >
            Today
          </button>
        </div>
      </div>

      {/* Monthly KPI Stats Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 md:gap-4">
        <div className="bg-white rounded-xl p-4 border border-slate-200/80 shadow-sm flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">
            <CheckCircle2 size={20} />
          </div>
          <div>
            <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
              Days Present
            </div>
            <div className="text-xl font-black text-slate-800">{totalPresent}</div>
          </div>
        </div>

        <div className="bg-white rounded-xl p-4 border border-slate-200/80 shadow-sm flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center font-bold">
            <Clock size={20} />
          </div>
          <div>
            <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
              Late Arrivals
            </div>
            <div className="text-xl font-black text-slate-800">{totalLate}</div>
          </div>
        </div>

        <div className="bg-white rounded-xl p-4 border border-slate-200/80 shadow-sm flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold">
            <TrendingUp size={20} />
          </div>
          <div>
            <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
              Total Hours
            </div>
            <div className="text-xl font-black text-slate-800">
              {totalHoursLogged.toFixed(1)} hrs
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl p-4 border border-slate-200/80 shadow-sm flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-purple-50 text-purple-600 flex items-center justify-center font-bold">
            <Sparkles size={20} />
          </div>
          <div>
            <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
              Holidays / Half Days
            </div>
            <div className="text-xl font-black text-slate-800">
              {Object.keys(holidays).filter((d) => d.startsWith(currentDate.format("YYYY-MM"))).length +
                totalHalfDay}
            </div>
          </div>
        </div>
      </div>

      {/* Visual Legend */}
      <div className="flex flex-wrap items-center gap-4 text-xs font-semibold text-slate-600 bg-white p-3 rounded-xl border border-slate-200">
        <span className="text-slate-400 font-bold uppercase text-[10px] tracking-wider">
          Legend:
        </span>
        <div className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span>
          <span>Present (In & Out)</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-amber-500"></span>
          <span>Late In</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-orange-500"></span>
          <span>Half Day</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-purple-500"></span>
          <span>Company Holiday</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-rose-400"></span>
          <span>Sunday (Weekly Off)</span>
        </div>
      </div>

      {/* Calendar Grid Card */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
        {/* Days of week header */}
        <div className="grid grid-cols-7 text-center py-3 bg-slate-50 border-b border-slate-200 text-xs font-bold text-slate-600 uppercase tracking-wider">
          <div className="text-rose-600">Sun</div>
          <div>Mon</div>
          <div>Tue</div>
          <div>Wed</div>
          <div>Thu</div>
          <div>Fri</div>
          <div className="text-slate-700">Sat</div>
        </div>

        {/* Days Grid */}
        <div className="grid grid-cols-7 border-collapse divide-x divide-y divide-slate-100">
          {days.map((day, idx) => {
            if (!day) {
              return <div key={`empty-${idx}`} className="min-h-[115px] bg-slate-50/50"></div>;
            }

            const dateStr = currentDate.date(day).format("YYYY-MM-DD");
            const dayOfWeek = currentDate.date(day).day();
            const isSunday = dayOfWeek === 0;
            const isHoliday = holidays[dateStr];
            const attendance = attendanceMap[dateStr];

            const isToday =
              day === dayjs().date() &&
              currentDate.month() === dayjs().month() &&
              currentDate.year() === dayjs().year();

            return (
              <div
                key={dateStr}
                onClick={() => handleDayClick(day)}
                className={`min-h-[115px] p-2 flex flex-col justify-between transition relative cursor-pointer select-none
                  ${isToday ? "bg-indigo-50/30 ring-2 ring-indigo-500 ring-inset" : "hover:bg-slate-50"}
                  ${isHoliday ? "bg-purple-50/30" : ""}
                  ${isSunday ? "bg-rose-50/20" : ""}
                `}
              >
                {/* Top Row: Day Number & Status Pill */}
                <div className="flex items-center justify-between">
                  <span
                    className={`text-xs font-black w-6 h-6 rounded-full flex items-center justify-center
                      ${isToday ? "bg-indigo-600 text-white shadow-sm" : isSunday ? "text-rose-600" : "text-slate-700"}
                    `}
                  >
                    {day}
                  </span>

                  {attendance ? (
                    <span
                      className={`text-[9px] font-extrabold uppercase px-1.5 py-0.5 rounded tracking-wider
                        ${
                          attendance.status === "Present"
                            ? "bg-emerald-100 text-emerald-800"
                            : attendance.status === "Late"
                            ? "bg-amber-100 text-amber-800"
                            : "bg-orange-100 text-orange-800"
                        }
                      `}
                    >
                      {attendance.status}
                    </span>
                  ) : isHoliday ? (
                    <span className="text-[9px] font-bold uppercase px-1.5 py-0.5 rounded bg-purple-100 text-purple-700">
                      Holiday
                    </span>
                  ) : isSunday ? (
                    <span className="text-[9px] font-semibold text-rose-500">Off</span>
                  ) : null}
                </div>

                {/* Middle & Bottom: In/Out Times */}
                <div className="space-y-1 my-1">
                  {attendance ? (
                    <>
                      {/* Check-In Time */}
                      <div className="flex items-center gap-1 text-[11px] font-bold text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded">
                        <LogIn size={11} className="text-emerald-600 shrink-0" />
                        <span className="truncate">In: {attendance.in_time || "--:--"}</span>
                      </div>

                      {/* Check-Out Time */}
                      <div
                        className={`flex items-center gap-1 text-[11px] font-bold px-1.5 py-0.5 rounded
                          ${
                            attendance.out_time
                              ? "text-indigo-700 bg-indigo-50"
                              : "text-amber-700 bg-amber-50 animate-pulse"
                          }
                        `}
                      >
                        <LogOut size={11} className="shrink-0" />
                        <span className="truncate">
                          {attendance.out_time ? `Out: ${attendance.out_time}` : "Punched In"}
                        </span>
                      </div>

                      {/* Working Duration */}
                      {attendance.work_duration && (
                        <div className="text-[10px] font-medium text-slate-500 flex items-center gap-1 px-1">
                          <Clock size={10} className="text-slate-400" />
                          <span>{attendance.work_duration}</span>
                        </div>
                      )}
                    </>
                  ) : isHoliday ? (
                    <div className="text-[11px] font-semibold text-purple-700 bg-purple-100/70 p-1.5 rounded leading-tight">
                      🎉 {isHoliday}
                    </div>
                  ) : isSunday ? (
                    <div className="text-[11px] text-rose-400 italic text-center py-2">
                      Weekly Off
                    </div>
                  ) : (
                    <div className="text-[10px] text-slate-300 italic text-center py-2">
                      No Log
                    </div>
                  )}
                </div>

                {/* Subtle Click Indicator */}
                <div className="text-[9px] text-slate-400 text-right opacity-0 hover:opacity-100 transition">
                  Inspect &rarr;
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Day Details Modal / Inspection Drawer */}
      {selectedDayData && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-fade-in">
          <div className="bg-white w-full max-w-md rounded-2xl shadow-2xl border border-slate-200 overflow-hidden">
            {/* Modal Header */}
            <div className="flex items-center justify-between p-5 bg-gradient-to-r from-slate-900 to-slate-800 text-white">
              <div>
                <span className="text-[11px] font-bold uppercase tracking-wider text-sky-400">
                  Daily Attendance Card
                </span>
                <h3 className="text-lg font-bold text-white mt-0.5">
                  {selectedDayData.formattedDate}
                </h3>
              </div>
              <button
                onClick={() => setSelectedDayData(null)}
                className="p-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-slate-300 hover:text-white transition"
              >
                <X size={18} />
              </button>
            </div>

            {/* Modal Content */}
            <div className="p-6 space-y-5">
              {/* Status Banner */}
              <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-200">
                <span className="text-xs font-semibold text-slate-500">Day Status</span>
                <span
                  className={`text-xs font-bold uppercase px-2.5 py-1 rounded-md
                    ${
                      selectedDayData.attendance?.status === "Present"
                        ? "bg-emerald-100 text-emerald-800 border border-emerald-300"
                        : selectedDayData.attendance?.status === "Late"
                        ? "bg-amber-100 text-amber-800 border border-amber-300"
                        : selectedDayData.attendance?.status === "Half Day"
                        ? "bg-orange-100 text-orange-800 border border-orange-300"
                        : selectedDayData.isHoliday
                        ? "bg-purple-100 text-purple-800 border border-purple-300"
                        : selectedDayData.isSunday
                        ? "bg-rose-100 text-rose-800 border border-rose-300"
                        : "bg-slate-200 text-slate-700"
                    }
                  `}
                >
                  {selectedDayData.attendance?.status ||
                    (selectedDayData.isHoliday
                      ? "Company Holiday"
                      : selectedDayData.isSunday
                      ? "Weekly Off"
                      : "Absent / No Record")}
                </span>
              </div>

              {/* In and Out Time Cards */}
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-emerald-50/70 border border-emerald-200 rounded-xl p-3.5 space-y-1">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-700">
                    <LogIn size={15} />
                    <span>Check-In Time</span>
                  </div>
                  <div className="text-lg font-black text-emerald-950">
                    {selectedDayData.attendance?.in_time || "--:--"}
                  </div>
                  <div className="text-[10px] text-emerald-600 flex items-center gap-1">
                    <MapPin size={10} /> Verified at Lucent Plant
                  </div>
                </div>

                <div className="bg-indigo-50/70 border border-indigo-200 rounded-xl p-3.5 space-y-1">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-indigo-700">
                    <LogOut size={15} />
                    <span>Check-Out Time</span>
                  </div>
                  <div className="text-lg font-black text-indigo-950">
                    {selectedDayData.attendance?.out_time || (
                      <span className="text-xs font-bold text-amber-600 bg-amber-100 px-2 py-0.5 rounded">
                        Active Shift
                      </span>
                    )}
                  </div>
                  <div className="text-[10px] text-indigo-600 flex items-center gap-1">
                    <MapPin size={10} /> Geofenced Punch
                  </div>
                </div>
              </div>

              {/* Shift Duration Details */}
              {selectedDayData.attendance && (
                <div className="p-3.5 rounded-xl border border-slate-200 bg-white space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-500 font-medium">Total Shift Duration:</span>
                    <span className="font-bold text-slate-800">
                      {selectedDayData.attendance.work_duration || "Calculating..."}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-500 font-medium">Punctuality Score:</span>
                    <span
                      className={`font-bold ${
                        selectedDayData.attendance.status === "Present"
                          ? "text-emerald-600"
                          : "text-amber-600"
                      }`}
                    >
                      {selectedDayData.attendance.status === "Present" ? "On Time" : "Grace Period"}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-500 font-medium">Plant Coordinates:</span>
                    <span className="font-mono text-[11px] text-slate-600">
                      22.8169° N, 72.4737° E
                    </span>
                  </div>
                </div>
              )}

              {/* Holiday Info if applicable */}
              {selectedDayData.isHoliday && (
                <div className="p-3.5 rounded-xl bg-purple-50 border border-purple-200 text-purple-900 space-y-1">
                  <div className="text-xs font-bold flex items-center gap-1.5">
                    <Sparkles size={14} className="text-purple-600" />
                    <span>Holiday Description</span>
                  </div>
                  <p className="text-sm font-semibold">{selectedDayData.holidayReason}</p>
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="p-4 bg-slate-50 border-t border-slate-200 flex justify-end">
              <button
                onClick={() => setSelectedDayData(null)}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-900 text-white rounded-lg text-sm font-semibold transition"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Calendar;
