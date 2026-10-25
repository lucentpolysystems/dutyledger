import React, { useState, useEffect } from "react";
import axios from "axios";
import {
  Users,
  DollarSign,
  Calendar,
  Settings,
  User,
} from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { setAttendanceStatus } from "../../Redux/Slice.jsx";
import Header from "../../Components/Header";
import Sidebar from "../../Components/Sidebar";
import { apiUrl } from "../../utils/api";



import dayjs from "dayjs";
import { LogIn, LogOut, Clock as ClockIcon } from "lucide-react";

const Dashboard = () => {
  const [menuOpen, setMenuOpen] = useState(false);
  const [userId, setUserId] = useState("");
  const [status, setStatus] = useState(null);
  const [todayDetails, setTodayDetails] = useState({
    in_time: null,
    out_time: null,
    work_duration: null,
    status: "Absent",
  });
  const [announcements, setAnnouncements] = useState([]);
  const [announcementsLoading, setAnnouncementsLoading] = useState(true);
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const [selectedRange, setSelectedRange] = useState("This Year");

  const handleBuddyPunching = () => {
    navigate('/attendance');
  };
  const handleManagerPOV = () => {
    navigate('/emprofile/:id'); // your route path
  };

  const user = useSelector((state) => state.auth.user);
  const attendanceStatus = useSelector((state) => state.auth.status);
  useEffect(() => {
    if (user?.id) {
      setUserId(user.id);
    }
  }, [user]);

  // ✅ Fetch status and in/out times when `id` is set
  useEffect(() => {
    if (!userId) return;

    const fetchTodayStatus = async () => {
      try {
        const res = await axios.get(apiUrl(`/api/attendance/${userId}`));
        console.log("id sent to api is ", userId);
        const data = res.data || {};
        setStatus(data.status);
        setTodayDetails({
          in_time: data.in_time || null,
          out_time: data.out_time || null,
          work_duration: data.work_duration || null,
          status: data.status || "Absent",
        });
        dispatch(setAttendanceStatus(data.status));
        console.log("Attendance status updated in Redux:", data.status);
      } catch (err) {
        console.error("Error fetching today's attendance", err);
      }
    };

    fetchTodayStatus();
  }, [userId]);

  useEffect(() => {
    const fetchAnnouncements = async () => {
      try {
        setAnnouncementsLoading(true);
        const res = await fetch(apiUrl("/api/announcements"));
        const data = await res.json();
        if (!res.ok) {
          throw new Error(data.message || "Failed to fetch announcements");
        }
        setAnnouncements(data.announcements || []);
      } catch (err) {
        console.error("Error fetching announcements:", err);
      } finally {
        setAnnouncementsLoading(false);
      }
    };

    fetchAnnouncements();
  }, []);



  const yearData = [
    { name: "Jan", Attendance: 24 },
    { name: "Feb", Attendance: 22 },
    { name: "Mar", Attendance: 18 },
    { name: "Apr", Attendance: 27 },
    { name: "May", Attendance: 30 },
    { name: "Jun", Attendance: 25 },
    { name: "Jul", Attendance: 29 },
    { name: "Aug", Attendance: 24 },
    { name: "Sep", Attendance: 26 },
    { name: "Oct", Attendance: 28 },
    { name: "Nov", Attendance: 23 },
    { name: "Dec", Attendance: 21 },
  ];

  const monthData = Array.from({ length: 31 }, (_, i) => ({
    name: `${i + 1}`,
    Attendance: Math.random() > 0.15 ? 1 : 0,
  }));


  const statusmanager = () => {
    if (attendanceStatus === "Present") {
      return "Present";
    } else if (attendanceStatus === "Late") {
      return "Late";
    } else if (attendanceStatus === "Late Absent") {
      return "Late Absent";
    } else {
      return "Absent";
    }
  }




  return (
    <div className="min-h-screen flex flex-col">
      {/* Header */}
      <div className="flex-1 h-[calc(100vh-64px)] overflow-y-auto p-6 space-y-6 bg-gray-50">
        {/* Page Title */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <h1 className="text-xl font-semibold">Dashboard</h1>

          <div className="flex flex-wrap gap-2 items-center">
            <button
              onClick={handleBuddyPunching}
              className="bg-indigo-600 text-white px-4 py-2 rounded-md text-sm shadow hover:bg-indigo-700 transition"
            >
              + Buddy Punching
            </button>
            <button
              onClick={handleManagerPOV}
              className="border px-4 py-2 rounded-md text-sm shadow hover:bg-gray-50 transition"
            >
              Manager POV
            </button>

            {/* Today's Attendance Status */}
            <div
              className={`px-4 py-2 rounded-md text-sm font-medium shadow transition ${(attendanceStatus === 'Present' || attendanceStatus === 'Late')
                ? 'bg-green-500 text-white'
                : 'bg-red-500 text-white'
                }`}
            >
              {statusmanager()}
            </div>
          </div>
        </div>


        {/* Welcome Message & Today's Shift Status */}
        <div className="bg-white p-5 rounded-xl shadow-xs border border-gray-200/80 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="font-extrabold text-lg text-gray-900">Good to see you, {user?.username} 👋</span>
              <span className="text-xs px-2.5 py-0.5 rounded-full font-bold bg-indigo-50 text-indigo-700 border border-indigo-200">
                ID: {userId}
              </span>
            </div>
            <p className="text-xs text-gray-500 mt-1 flex items-center gap-1.5 font-medium">
              <Calendar className="w-3.5 h-3.5 text-gray-400" />
              Today is {dayjs().format("dddd, D MMMM YYYY")}
            </p>
          </div>

          {/* Today's Punch Summary */}
          <div className="flex flex-wrap items-center gap-3 text-xs bg-gray-50 p-2.5 rounded-lg border border-gray-200">
            <div className="flex items-center gap-1.5 font-medium">
              <LogIn className="w-4 h-4 text-emerald-600" />
              <span className="text-gray-500">In:</span>
              <span className="font-bold font-mono text-gray-800">{todayDetails.in_time || "Pending"}</span>
            </div>

            <span className="text-gray-300">•</span>

            <div className="flex items-center gap-1.5 font-medium">
              <LogOut className="w-4 h-4 text-indigo-600" />
              <span className="text-gray-500">Out:</span>
              <span className="font-bold font-mono text-gray-800">{todayDetails.out_time || (todayDetails.in_time ? "Active" : "Pending")}</span>
            </div>

            {todayDetails.work_duration && (
              <>
                <span className="text-gray-300">•</span>
                <div className="flex items-center gap-1.5 font-medium">
                  <ClockIcon className="w-3.5 h-3.5 text-amber-600" />
                  <span className="font-bold text-gray-800">{todayDetails.work_duration}</span>
                </div>
              </>
            )}

            <button
              onClick={() => navigate("/attendance")}
              className="ml-2 px-3 py-1 bg-indigo-600 hover:bg-indigo-700 text-white rounded font-bold transition shadow-xs cursor-pointer"
            >
              {todayDetails.in_time ? (todayDetails.out_time ? "View Attendance" : "Punch OUT") : "Punch IN"}
            </button>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            {
              title: "Total leave allowance",
              value: "34",
              note: "Paid 11 | Unpaid 4",
            },
            {
              title: "Total leave taken",
              value: "20",
              valueColor: "text-red-600",
              note: "Paid 62 | Unpaid 76",
            },
            {
              title: "Total leave available",
              value: "87",
              valueColor: "text-green-600",
              note: "Paid 50 | Unpaid 51",
            },
            {
              title: "Leave request pending",
              value: "122",
              valueColor: "text-indigo-600",
              note: "Paid 60 | Unpaid 53",
            },
          ].map((item, idx) => (
            <div
              key={idx}
              className="bg-white p-5 rounded-lg shadow flex flex-col gap-1"
            >
              <h4 className="text-xs text-gray-500">{item.title}</h4>
              <p className={`text-xl font-bold ${item.valueColor || ""}`}>
                {item.value}
              </p>
              <p className="text-xs text-gray-400">{item.note}</p>
            </div>
          ))}
        </div>

        {/* Announcements Table */}
        <div className="bg-white p-4 rounded shadow mb-6">
          <h3 className="font-semibold text-lg mb-4 text-gray-800">Announcements</h3>

          <div className="overflow-x-auto">
            <table className="min-w-full text-sm rounded text-left text-gray-600">
              <thead className="bg-gray-100 text-gray-700 uppercase text-xs">
                <tr>
                  <th className="px-4 py-3">Title</th>
                  <th className="px-4 py-3">Start Date</th>
                  <th className="px-4 py-3">End Date</th>
                  <th className="px-4 py-3">Description</th>
                </tr>
              </thead>
              <tbody>
                {announcementsLoading ? (
                  <tr>
                    <td className="px-4 py-3" colSpan="4">Loading announcements...</td>
                  </tr>
                ) : announcements.length === 0 ? (
                  <tr>
                    <td className="px-4 py-3" colSpan="4">No announcements available.</td>
                  </tr>
                ) : (
                announcements.map((item, idx) => (
                  <tr
                    key={item._id || idx}
                    className="border-b hover:bg-gray-50 transition duration-200"
                  >
                    <td className="px-4 py-3 font-medium text-gray-800">{item.title}</td>
                    <td className="px-4 py-3">{item.startDate}</td>
                    <td className="px-4 py-3">{item.endDate}</td>
                    <td className="px-4 py-3">{item.description}</td>
                  </tr>
                ))) }
              </tbody>
            </table>
          </div>
        </div>

        {/* Attendance Chart */}
        <div className="bg-white p-4 rounded shadow">
          <div className="flex justify-between items-center mb-4">
            <h3 className="font-semibold">Attendance Statistics</h3>
            <select
              className="text-sm border border-gray-300 rounded-md px-2 py-1 focus:outline-none"
              value={selectedRange}
              onChange={(e) => setSelectedRange(e.target.value)}
            >
              <option>This Year</option>
              <option>This Month</option>
            </select>
          </div>

          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={selectedRange === "This Year" ? yearData : monthData}>
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="Attendance" fill="#7c3aed" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
