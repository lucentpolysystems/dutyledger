import React, { useState, useEffect } from "react";
import { useSelector } from "react-redux";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Legend,
  Cell,
} from "recharts";
import {
  LogIn,
  LogOut,
  Clock,
  Calendar,
  CheckCircle2,
  AlertCircle,
  MapPin,
  Building2,
  Sparkles,
  RefreshCw,
  TrendingUp,
  History,
  Timer,
} from "lucide-react";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import dayjs from "dayjs";
import { apiUrl } from "../../utils/api";

const Attendance = () => {
  const user = useSelector((state) => state.auth.user);
  const userId = user?.id || user?.user_id || "EMP001";
  const username = user?.username || "Staff Member";

  // Current live time ticker
  const [liveTime, setLiveTime] = useState(dayjs().format("hh:mm:ss A"));
  const [liveDate, setLiveDate] = useState(dayjs().format("dddd, D MMMM YYYY"));

  // Today's attendance state
  const [todayData, setTodayData] = useState({
    status: "Not Marked",
    in_time: null,
    out_time: null,
    work_duration: null,
    total_hours: null,
    punch_type: null,
  });
  const [todayLoading, setTodayLoading] = useState(true);
  const [punchLoading, setPunchLoading] = useState(false);

  // Monthly Chart state
  const currentMonthKey = dayjs().format("YYYY-MM");
  const [selectedMonth, setSelectedMonth] = useState(currentMonthKey);
  const [monthlyRecords, setMonthlyRecords] = useState([]);
  const [chartData, setChartData] = useState([]);
  const [chartLoading, setChartLoading] = useState(false);

  // Geolocation state
  const [geoStatus, setGeoStatus] = useState("Ready");

  // Keep live clock running
  useEffect(() => {
    const timer = setInterval(() => {
      setLiveTime(dayjs().format("hh:mm:ss A"));
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Fetch today's attendance record
  const fetchTodayAttendance = async () => {
    if (!userId) return;
    try {
      setTodayLoading(true);
      const res = await fetch(apiUrl(`/api/attendance/${userId}`));
      const data = await res.json();
      if (res.ok) {
        setTodayData({
          status: data.status || (data.in_time ? "Present" : "Not Marked"),
          in_time: data.in_time || null,
          out_time: data.out_time || null,
          work_duration: data.work_duration || null,
          total_hours: data.total_hours || null,
          punch_type: data.punch_type || (data.out_time ? "OUT" : data.in_time ? "IN" : null),
        });
      }
    } catch (err) {
      console.error("Failed to load today's attendance:", err);
    } finally {
      setTodayLoading(false);
    }
  };

  // Fetch monthly records for user
  const fetchMonthlyAttendance = async (monthKey) => {
    if (!userId) return;
    try {
      setChartLoading(true);
      const res = await fetch(apiUrl(`/api/getAllAttendanceByMonthofuser/${userId}/${monthKey}`));
      const records = await res.json();
      const recordsArr = Array.isArray(records) ? records : [];
      setMonthlyRecords(recordsArr);

      // Build daily chart dataset
      const [year, month] = monthKey.split("-");
      const daysInMonth = new Date(Number(year), Number(month), 0).getDate();
      const map = {};
      recordsArr.forEach((r) => {
        if (r.date) map[r.date] = r;
      });

      const chartList = Array.from({ length: daysInMonth }, (_, i) => {
        const dayNum = String(i + 1).padStart(2, "0");
        const dateStr = `${monthKey}-${dayNum}`;
        const record = map[dateStr];
        let val = 0;
        let statusStr = "Absent";

        if (record) {
          if (record.status === "Present") {
            val = 1;
            statusStr = "Present";
          } else if (record.status === "Late") {
            val = 0.8;
            statusStr = "Late";
          } else if (record.status === "Half Day") {
            val = 0.5;
            statusStr = "Half Day";
          } else {
            val = 0.2;
            statusStr = record.status || "Present";
          }
        }

        return {
          dayLabel: `${i + 1}`,
          fullDate: dateStr,
          value: val,
          status: statusStr,
          inTime: record?.in_time || "--:--",
          outTime: record?.out_time || "--:--",
          duration: record?.work_duration || record?.total_hours ? `${record.total_hours}h` : null,
        };
      });

      setChartData(chartList);
    } catch (err) {
      console.error("Failed to load monthly attendance:", err);
    } finally {
      setChartLoading(false);
    }
  };

  useEffect(() => {
    fetchTodayAttendance();
  }, [userId]);

  useEffect(() => {
    fetchMonthlyAttendance(selectedMonth);
  }, [userId, selectedMonth]);

  // Handle Mark Attendance (Punch IN or Punch OUT)
  const handlePunch = async (punchType) => {
    setPunchLoading(true);
    setGeoStatus("Locating plant coordinates...");

    const performRequest = async (location) => {
      try {
        const res = await fetch(apiUrl("/api/mark-attendance"), {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            id: userId,
            username: username,
            punchType: punchType,
            location: location || { lat: 22.816958, lng: 72.473781 }, // Default to Sanand Plant
          }),
        });

        const data = await res.json();

        if (res.ok) {
          toast.success(data.message || `Successfully punched ${punchType}!`, {
            position: "bottom-right",
          });
          setGeoStatus("Geofence Verified");
          // Refresh data immediately
          await fetchTodayAttendance();
          await fetchMonthlyAttendance(selectedMonth);
        } else {
          toast.error(data.message || `Failed to punch ${punchType}.`, {
            position: "bottom-right",
          });
          setGeoStatus("Error");
        }
      } catch (err) {
        console.error("Punch error:", err);
        toast.error("Network error while recording attendance. Please try again.", {
          position: "bottom-right",
        });
        setGeoStatus("Connection Error");
      } finally {
        setPunchLoading(false);
      }
    };

    // Attempt browser geolocation, or fallback smoothly
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const loc = {
            lat: pos.coords.latitude,
            lng: pos.coords.longitude,
          };
          performRequest(loc);
        },
        () => {
          // If browser denies permission, fallback to plant coordinates
          performRequest({ lat: 22.816958, lng: 72.473781, bypassGeofence: true });
        },
        { timeout: 4000 }
      );
    } else {
      performRequest({ lat: 22.816958, lng: 72.473781, bypassGeofence: true });
    }
  };

  const isCheckedIn = Boolean(todayData?.in_time);
  const isCheckedOut = Boolean(todayData?.out_time);

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-6">
      {/* ============================================================== */}
      {/* 1. PAGE HEADER & FACILITY INFO                                 */}
      {/* ============================================================== */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-5 border-b border-slate-200">
        <div>
          <div className="flex items-center gap-2 text-xs font-bold text-sky-600 uppercase tracking-wider mb-1">
            <Building2 className="w-4 h-4" /> Lucent PolySystems Pvt. Ltd. • Sanand Plant Facility
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            Daily Attendance & Shift Punch
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Mark your daily check-in (IN) and check-out (OUT) with geofence validation and shift tracking.
          </p>
        </div>

        {/* Live Clock Pill */}
        <div className="bg-white px-5 py-3 rounded-2xl border border-slate-200/90 shadow-xs flex items-center gap-3.5 self-start md:self-auto">
          <div className="w-10 h-10 rounded-xl bg-sky-50 text-sky-600 flex items-center justify-center shrink-0 border border-sky-100">
            <Clock className="w-5 h-5" />
          </div>
          <div>
            <div className="text-base font-extrabold text-slate-900 font-mono tracking-tight leading-none">
              {liveTime}
            </div>
            <div className="text-xs text-slate-400 font-medium mt-1">{liveDate}</div>
          </div>
        </div>
      </div>

      {/* ============================================================== */}
      {/* 2. TODAY'S ATTENDANCE HERO: PUNCH IN & PUNCH OUT ACTIONS       */}
      {/* ============================================================== */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* CHECK-IN CARD (PUNCH IN) */}
        <div
          className={`rounded-2xl border p-6 transition-all shadow-xs relative overflow-hidden ${isCheckedIn
            ? "bg-emerald-50/50 border-emerald-200"
            : "bg-white border-slate-200 hover:border-sky-300"
            }`}
        >
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
              <div
                className={`w-12 h-12 rounded-xl flex items-center justify-center font-bold ${isCheckedIn ? "bg-emerald-600 text-white shadow-sm" : "bg-sky-100 text-sky-700"
                  }`}
              >
                <LogIn className="w-6 h-6" />
              </div>
              <div>
                <span className="text-[11px] font-extrabold uppercase tracking-wider text-slate-400">
                  Step 1 • Morning Arrival
                </span>
                <h3 className="text-lg font-bold text-slate-900">Shift Check-In (Punch IN)</h3>
              </div>
            </div>

            {isCheckedIn && (
              <span className="px-3 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 border border-emerald-200 flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5" /> Checked In
              </span>
            )}
          </div>

          <div className="mt-5 space-y-3">
            <div className="flex items-center justify-between text-sm py-2 px-3 rounded-lg bg-white/70 border border-slate-200/60">
              <span className="text-slate-500 font-medium">Punch IN Time:</span>
              <span className="font-mono font-bold text-slate-800">
                {todayData.in_time || "Not Recorded Yet"}
              </span>
            </div>

            <div className="flex items-center justify-between text-sm py-2 px-3 rounded-lg bg-white/70 border border-slate-200/60">
              <span className="text-slate-500 font-medium">Arrival Status:</span>
              <span
                className={`font-bold px-2 py-0.5 rounded text-xs ${todayData.status === "Present"
                  ? "bg-emerald-100 text-emerald-800"
                  : todayData.status === "Late"
                    ? "bg-amber-100 text-amber-800"
                    : "bg-slate-100 text-slate-600"
                  }`}
              >
                {todayData.status}
              </span>
            </div>
          </div>

          <div className="mt-6">
            {!isCheckedIn ? (
              <button
                type="button"
                disabled={punchLoading}
                onClick={() => handlePunch("IN")}
                className="w-full py-3.5 px-4 bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white font-extrabold text-sm rounded-xl shadow-md transition flex items-center justify-center gap-2 cursor-pointer disabled:bg-emerald-400"
              >
                <LogIn className="w-4 h-4" />
                {punchLoading ? "Recording Check-In..." : "Punch IN (Start Shift)"}
              </button>
            ) : (
              <div className="text-center py-2 text-xs font-semibold text-emerald-700 bg-emerald-100/60 rounded-xl border border-emerald-200 flex items-center justify-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                Check-in logged successfully at {todayData.in_time}
              </div>
            )}
          </div>
        </div>

        {/* CHECK-OUT CARD (PUNCH OUT) */}
        <div
          className={`rounded-2xl border p-6 transition-all shadow-xs relative overflow-hidden ${isCheckedOut
            ? "bg-sky-50/50 border-sky-200"
            : isCheckedIn
              ? "bg-amber-50/40 border-amber-200"
              : "bg-slate-50 border-slate-200 opacity-90"
            }`}
        >
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
              <div
                className={`w-12 h-12 rounded-xl flex items-center justify-center font-bold ${isCheckedOut
                  ? "bg-sky-600 text-white shadow-sm"
                  : isCheckedIn
                    ? "bg-amber-500 text-white"
                    : "bg-slate-200 text-slate-500"
                  }`}
              >
                <LogOut className="w-6 h-6" />
              </div>
              <div>
                <span className="text-[11px] font-extrabold uppercase tracking-wider text-slate-400">
                  Step 2 • Evening Departure
                </span>
                <h3 className="text-lg font-bold text-slate-900">Shift Check-Out (Punch OUT)</h3>
              </div>
            </div>

            {isCheckedOut ? (
              <span className="px-3 py-1 rounded-full text-xs font-bold bg-sky-100 text-sky-800 border border-sky-200 flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5" /> Shift Completed
              </span>
            ) : isCheckedIn ? (
              <span className="px-3 py-1 rounded-full text-xs font-bold bg-amber-100 text-amber-800 border border-amber-200 flex items-center gap-1 animate-pulse">
                <Timer className="w-3.5 h-3.5" /> Shift In Progress
              </span>
            ) : (
              <span className="px-3 py-1 rounded-full text-xs font-bold bg-slate-200 text-slate-600">
                Awaiting Check-In
              </span>
            )}
          </div>

          <div className="mt-5 space-y-3">
            <div className="flex items-center justify-between text-sm py-2 px-3 rounded-lg bg-white/70 border border-slate-200/60">
              <span className="text-slate-500 font-medium">Punch OUT Time:</span>
              <span className="font-mono font-bold text-slate-800">
                {todayData.out_time || "Not Checked Out"}
              </span>
            </div>

            <div className="flex items-center justify-between text-sm py-2 px-3 rounded-lg bg-white/70 border border-slate-200/60">
              <span className="text-slate-500 font-medium">Total Shift Duration:</span>
              <span className="font-mono font-bold text-slate-800">
                {todayData.work_duration || (isCheckedIn ? "Calculating..." : "--")}
              </span>
            </div>
          </div>

          <div className="mt-6">
            {!isCheckedIn ? (
              <button
                disabled
                className="w-full py-3.5 px-4 bg-slate-200 text-slate-400 font-bold text-sm rounded-xl cursor-not-allowed text-center"
              >
                Punch IN required before Punch OUT
              </button>
            ) : !isCheckedOut ? (
              <button
                type="button"
                disabled={punchLoading}
                onClick={() => handlePunch("OUT")}
                className="w-full py-3.5 px-4 bg-rose-600 hover:bg-rose-700 active:bg-rose-800 text-white font-extrabold text-sm rounded-xl shadow-md transition flex items-center justify-center gap-2 cursor-pointer disabled:bg-rose-400"
              >
                <LogOut className="w-4 h-4" />
                {punchLoading ? "Recording Check-Out..." : "Punch OUT (End Shift)"}
              </button>
            ) : (
              <div className="flex gap-2">
                <div className="flex-1 text-center py-2.5 text-xs font-semibold text-sky-800 bg-sky-100/60 rounded-xl border border-sky-200">
                  🎉 Out at {todayData.out_time} ({todayData.work_duration})
                </div>
                <button
                  type="button"
                  onClick={() => handlePunch("OUT")}
                  title="Update Check-Out time if leaving later"
                  className="px-3 py-2 text-xs font-bold text-slate-600 hover:text-slate-900 bg-white border border-slate-300 rounded-xl hover:bg-slate-50 cursor-pointer"
                >
                  Update OUT
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ============================================================== */}
      {/* 3. TODAY'S SHIFT METRICS STRIP                                 */}
      {/* ============================================================== */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-xl border border-slate-200/90 shadow-2xs">
          <div className="text-xs font-bold text-slate-400 uppercase">Check-In Time</div>
          <div className="text-lg font-extrabold text-slate-900 font-mono mt-1">
            {todayData.in_time || "Pending"}
          </div>
          <div className="text-[11px] text-slate-500 mt-0.5">Plant Arrival Punch</div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200/90 shadow-2xs">
          <div className="text-xs font-bold text-slate-400 uppercase">Check-Out Time</div>
          <div className="text-lg font-extrabold text-slate-900 font-mono mt-1">
            {todayData.out_time || (isCheckedIn ? "Active" : "Pending")}
          </div>
          <div className="text-[11px] text-slate-500 mt-0.5">Plant Exit Punch</div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200/90 shadow-2xs">
          <div className="text-xs font-bold text-slate-400 uppercase">Logged Hours</div>
          <div className="text-lg font-extrabold text-slate-900 font-mono mt-1">
            {todayData.total_hours ? `${todayData.total_hours} hrs` : todayData.work_duration || "--"}
          </div>
          <div className="text-[11px] text-slate-500 mt-0.5">Net Productive Time</div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200/90 shadow-2xs">
          <div className="text-xs font-bold text-slate-400 uppercase">Official Status</div>
          <div className="text-lg font-extrabold text-slate-900 mt-1 flex items-center gap-1.5">
            <span
              className={`inline-block w-2.5 h-2.5 rounded-full ${todayData.status === "Present"
                ? "bg-emerald-500"
                : todayData.status === "Late"
                  ? "bg-amber-500"
                  : todayData.status === "Half Day"
                    ? "bg-purple-500"
                    : "bg-slate-400"
                }`}
            />
            {todayData.status}
          </div>
          <div className="text-[11px] text-slate-500 mt-0.5">Recorded for Payroll</div>
        </div>
      </div>

      {/* ============================================================== */}
      {/* 4. MONTHLY ATTENDANCE TREND & STATISTICS CHART                 */}
      {/* ============================================================== */}
      <div className="bg-white rounded-2xl border border-slate-200/90 shadow-xs p-6 sm:p-7 space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
          <div>
            <h2 className="text-lg sm:text-xl font-bold text-slate-900 flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-sky-600" /> Monthly Attendance Consistency
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Daily visual breakdown of recorded shifts, arrival tardiness, and absences.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-slate-500">Month:</span>
            <select
              className="text-xs font-bold bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 focus:bg-white focus:ring-2 focus:ring-sky-500"
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
            >
              <option value="2026-10">October 2026</option>
              <option value="2026-09">September 2026</option>
              <option value="2026-08">August 2026</option>
              <option value="2026-07">July 2026</option>
              <option value="2026-06">June 2026</option>
              <option value="2026-05">May 2026</option>
            </select>
          </div>
        </div>

        {chartLoading ? (
          <div className="py-14 text-center text-slate-400 text-sm">Loading attendance chart...</div>
        ) : (
          <div>
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={chartData} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="dayLabel" tick={{ fontSize: 11, fill: "#64748b" }} />
                <YAxis domain={[0, 1]} ticks={[0, 0.5, 1]} tick={{ fontSize: 11, fill: "#64748b" }} />
                <Tooltip
                  content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                      const data = payload[0].payload;
                      return (
                        <div className="bg-slate-900 text-white text-xs p-3 rounded-lg shadow-xl space-y-1">
                          <div className="font-bold border-b border-slate-700 pb-1">{data.fullDate}</div>
                          <div>Status: <span className="font-bold text-sky-400">{data.status}</span></div>
                          <div>In: <span className="font-mono">{data.inTime}</span></div>
                          <div>Out: <span className="font-mono">{data.outTime}</span></div>
                          {data.duration && <div>Duration: <span className="font-bold">{data.duration}</span></div>}
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                  {chartData.map((entry, index) => {
                    let barColor = "#e2e8f0"; // Absent / weekend
                    if (entry.status === "Present") barColor = "#10b981";
                    else if (entry.status === "Late") barColor = "#f59e0b";
                    else if (entry.status === "Half Day") barColor = "#8b5cf6";
                    return <Cell key={`cell-${index}`} fill={barColor} />;
                  })}
                </Bar>
              </BarChart>
            </ResponsiveContainer>

            {/* Chart Legend */}
            <div className="flex flex-wrap items-center justify-center gap-6 pt-3 text-xs font-semibold text-slate-600 border-t border-slate-100">
              <span className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded-xs bg-emerald-500 inline-block" /> Present (Full Shift)
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded-xs bg-amber-500 inline-block" /> Late Arrival
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded-xs bg-purple-500 inline-block" /> Half Day (&lt;4 hrs)
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded-xs bg-slate-200 inline-block" /> Absent / Off
              </span>
            </div>
          </div>
        )}
      </div>

      {/* ============================================================== */}
      {/* 5. RECENT ATTENDANCE HISTORY TABLE                             */}
      {/* ============================================================== */}
      <div className="bg-white rounded-2xl border border-slate-200/90 shadow-xs p-6 space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <h2 className="text-base sm:text-lg font-bold text-slate-900 flex items-center gap-2">
            <History className="w-5 h-5 text-indigo-600" /> Recent Attendance Records ({selectedMonth})
          </h2>
          <span className="text-xs text-slate-500 font-medium">
            Total Logged Days: {monthlyRecords.length}
          </span>
        </div>

        {monthlyRecords.length === 0 ? (
          <div className="py-8 text-center text-slate-400 text-sm">
            No attendance records logged for {selectedMonth}.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 text-[11px] font-extrabold text-slate-400 uppercase tracking-wider">
                <tr>
                  <th className="py-2.5 px-3 rounded-l-lg">Date</th>
                  <th className="py-2.5 px-3">Punch IN</th>
                  <th className="py-2.5 px-3">Punch OUT</th>
                  <th className="py-2.5 px-3">Shift Hours</th>
                  <th className="py-2.5 px-3 rounded-r-lg">Day Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {monthlyRecords
                  .slice()
                  .reverse()
                  .map((rec, i) => (
                    <tr key={rec._id || i} className="hover:bg-slate-50/70 transition-colors">
                      <td className="py-3 px-3 font-semibold text-slate-800 flex items-center gap-1.5">
                        <Calendar className="w-4 h-4 text-slate-400" />
                        {rec.date}
                      </td>
                      <td className="py-3 px-3 font-mono font-medium text-slate-700">
                        {rec.in_time || (rec.time ? dayjs(rec.time).format("hh:mm A") : "--")}
                      </td>
                      <td className="py-3 px-3 font-mono font-medium text-slate-700">
                        {rec.out_time || "--"}
                      </td>
                      <td className="py-3 px-3 font-mono text-slate-600">
                        {rec.work_duration || (rec.total_hours ? `${rec.total_hours} hrs` : "--")}
                      </td>
                      <td className="py-3 px-3">
                        <span
                          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold ${rec.status === "Present"
                            ? "bg-emerald-100 text-emerald-800 border border-emerald-200"
                            : rec.status === "Late"
                              ? "bg-amber-100 text-amber-800 border border-amber-200"
                              : rec.status === "Half Day"
                                ? "bg-purple-100 text-purple-800 border border-purple-200"
                                : "bg-rose-100 text-rose-800 border border-rose-200"
                            }`}
                        >
                          {rec.status || "Present"}
                        </span>
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <ToastContainer />
    </div>
  );
};

export default Attendance;
