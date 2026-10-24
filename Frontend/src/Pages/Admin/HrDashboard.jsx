// import React from "react";
// import Header from "../../Components/Header";
// import Sidebar from "../../Components/HRSidebar";

// const Dashboard = () => {
//   const employees = [
//     {
//       date: "13/01",
//       name: "Aisha Doe",
//       role: "HR Manager",
//       type: "Full-Time",
//       status: "Present",
//       checkIn: "09:00 AM",
//       checkOut: "05:00 PM",
//     },
//     {
//       date: "13/01",
//       name: "Chukwuemeka",
//       role: "Software Engineer",
//       type: "Part-Time",
//       status: "Absent",
//       checkIn: "-",
//       checkOut: "-",
//     },
//     {
//       date: "13/01",
//       name: "Suleiman",
//       role: "Marketing Executive",
//       type: "Full-Time",
//       status: "Late",
//       checkIn: "10:15 AM",
//       checkOut: "05:00 PM",
//     },
//     {
//       date: "13/01",
//       name: "Olamide",
//       role: "Financial Analyst",
//       type: "Full-Time",
//       status: "Present",
//       checkIn: "09:00 AM",
//       checkOut: "06:00 PM",
//     },
//     {
//       date: "13/01",
//       name: "Jide",
//       role: "Project Manager",
//       type: "Full-Time",
//       status: "Present",
//       checkIn: "09:00 AM",
//       checkOut: "05:00 PM",
//     },
//     {
//       date: "13/01",
//       name: "Femi",
//       role: "Sales Manager",
//       type: "Full-Time",
//       status: "Present",
//       checkIn: "09:00 AM",
//       checkOut: "07:00 PM",
//     },
//   ];

//   const getStatusColor = (status) => {
//     switch (status) {
//       case "Present":
//         return "bg-green-100 text-green-600";
//       case "Late":
//         return "bg-yellow-100 text-yellow-600";
//       case "Absent":
//         return "bg-red-100 text-red-600";
//       default:
//         return "bg-gray-100 text-gray-600";
//     }
//   };

//   return (
//     <div className="min-h-screen flex flex-col bg-gray-100">
//       {/* Header */}
//       <Header />

//       {/* Body */}
//       <div className="flex flex-1">
//         {/* Sidebar */}
//         <Sidebar />

//         {/* Main Content Area */}
//         <main className="flex-1 h-[calc(100vh-64px)] overflow-y-auto p-6 space-y-6 bg-gray-50">
//           {/* Summary Cards */}
//           <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
//             <div className="bg-white shadow rounded p-4">
//               <h3 className="text-sm text-gray-500">Total Employees</h3>
//               <p className="text-2xl font-semibold">100</p>
//             </div>
//             <div className="bg-white shadow rounded p-4">
//               <h3 className="text-sm text-gray-500">Present Employees</h3>
//               <p className="text-2xl font-semibold text-green-600">90</p>
//             </div>
//             <div className="bg-white shadow rounded p-4">
//               <h3 className="text-sm text-gray-500">Employees on Leave</h3>
//               <p className="text-2xl font-semibold text-red-600">10</p>
//             </div>
//           </div>

//           {/* Attendance Table */}
//           <div className="bg-white shadow rounded p-4">
//             <h2 className="text-lg font-semibold mb-4">Employees Status</h2>
//             <div className="overflow-x-auto">
//               <table className="min-w-full text-sm">
//                 <thead>
//                   <tr className="text-left text-gray-500 border-b">
//                     <th className="p-2">Date</th>
//                     <th className="p-2">Employee</th>
//                     <th className="p-2">Role</th>
//                     <th className="p-2">Employment Type</th>
//                     <th className="p-2">Status</th>
//                     <th className="p-2">Check In</th>
//                     <th className="p-2">Check Out</th>
//                   </tr>
//                 </thead>
//                 <tbody>
//                   {employees.map((emp, idx) => (
//                     <tr key={idx} className="border-b hover:bg-gray-50">
//                       <td className="p-2">{emp.date}</td>
//                       <td className="p-2">{emp.name}</td>
//                       <td className="p-2">{emp.role}</td>
//                       <td className="p-2">
//                         <span className="px-2 py-1 text-xs rounded bg-indigo-100 text-indigo-600">
//                           {emp.type}
//                         </span>
//                       </td>
//                       <td className="p-2">
//                         <span
//                           className={`px-2 py-1 text-xs rounded ${getStatusColor(
//                             emp.status
//                           )}`}
//                         >
//                           {emp.status}
//                         </span>
//                       </td>
//                       <td className="p-2">{emp.checkIn}</td>
//                       <td className="p-2">{emp.checkOut}</td>
//                     </tr>
//                   ))}
//                 </tbody>
//               </table>
//             </div>
//           </div>
//         </main>
//       </div>
//     </div>
//   );
// };

// export default Dashboard;





import React, { useEffect, useState } from "react";
import Header from "../../Components/Header";
import Sidebar from "../../Components/HRSidebar";
import { apiUrl } from "../../utils/api";
import { useNavigate } from "react-router-dom";

const Dashboard = () => {
  const [employees, setEmployees] = useState([]);
  const [announcements, setAnnouncements] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchAttendance = async () => {
      try {

        const response = await fetch(apiUrl("/api/all-attendance"));
        const data = await response.json();
        setEmployees(data.attendance || []);
        console.log("📊 Attendance data fetched successfully:", data);
      } catch (error) {
        console.error("❌ Error fetching attendance data:", error);
      }
    };

    fetchAttendance();
  }, []);

  const fetchAnnouncements = async () => {
    try {
      const response = await fetch(apiUrl("/api/announcements"));
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message || "Failed to fetch announcements");
      }
      setAnnouncements(data.announcements || []);
    } catch (error) {
      console.error("❌ Error fetching announcements:", error);
    }
  };

  useEffect(() => {
    fetchAnnouncements();
  }, []);

console.log("📊 Attendance data:", employees[0]?.username);

  const tenDaysAgo = new Date();
  tenDaysAgo.setDate(tenDaysAgo.getDate() - 10);
  const recentAnnouncements = announcements.filter((item) => {
    const createdAt = new Date(item.createdAt || item.startDate);
    return createdAt >= tenDaysAgo;
  });


  const getStatusColor = (status) => {
    if (!status) return "bg-gray-100 text-gray-600";
    if (status.toLowerCase().includes("present")) return "bg-green-100 text-green-600";
    if (status.toLowerCase().includes("late")) return "bg-yellow-100 text-yellow-600";
    if (status.toLowerCase().includes("absent")) return "bg-red-100 text-red-600";
    return "bg-gray-100 text-gray-600";
  };

  return (
    <div className="min-h-screen flex flex-col bg-gray-100">
        <main className="flex-1 h-[calc(100vh-64px)] overflow-y-auto p-6 space-y-6 bg-gray-50">
          {/* Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <div className="bg-white shadow rounded p-4">
              <h3 className="text-sm text-gray-500">Total Attendance Entries</h3>
              <p className="text-2xl font-semibold">{employees.length}</p>
            </div>
            <div className="bg-white shadow rounded p-4">
              <h3 className="text-sm text-gray-500">Present Employees</h3>
              <p className="text-2xl font-semibold text-green-600">
                {employees.filter((e) => e.status?.toLowerCase().includes("present")).length}
              </p>
            </div>
            <div className="bg-white shadow rounded p-4">
              <h3 className="text-sm text-gray-500">Late / Absent Entries</h3>
              <p className="text-2xl font-semibold text-red-600">
                {employees.filter((e) =>
                  e.status?.toLowerCase().includes("late") ||
                  e.status?.toLowerCase().includes("absent")
                ).length}
              </p>
            </div>
          </div>

          {/* Attendance Table */}
          <div className="bg-white shadow rounded p-4">
            <h2 className="text-lg font-semibold mb-4">Today's Employees Attendance</h2>

            {employees.length === 0 ? (
              <p className="text-sm text-gray-500">No attendance records found.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full text-sm">
                  <thead>
                    <tr className="text-left text-gray-500 border-b">
                      <th className="p-2">Date</th>
                      <th className="p-2">Employee</th>
                      <th className="p-2">User ID</th>
                      <th className="p-2">Punch IN</th>
                      <th className="p-2">Punch OUT</th>
                      <th className="p-2">Shift Duration</th>
                      <th className="p-2">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {employees.map((emp, idx) => (
                      <tr key={idx} className="border-b hover:bg-gray-50">
                        <td className="p-2 font-medium text-gray-700">{emp.date}</td>
                        <td className="p-2 font-semibold text-gray-800">{emp.username}</td>
                        <td className="p-2 font-mono text-xs text-gray-500">{emp.user_id}</td>
                        <td className="p-2 font-mono text-emerald-600 font-semibold">
                          {emp.in_time || "--"}
                        </td>
                        <td className="p-2 font-mono text-indigo-600 font-semibold">
                          {emp.out_time || (emp.in_time ? "Working..." : "--")}
                        </td>
                        <td className="p-2 font-mono text-xs text-gray-600">
                          {emp.work_duration || (emp.total_hours ? `${emp.total_hours} hrs` : "--")}
                        </td>
                        <td className="p-2">
                          <span className={`px-2 py-1 text-xs rounded font-bold ${getStatusColor(emp.status)}`}>
                            {emp.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Recent Announcements (Last 10 Days) */}
          <div className="bg-white shadow rounded p-4">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold">Recent Announcements (Last 10 Days)</h2>
              <button
                onClick={() => navigate("/hrannouncements")}
                className="text-sm bg-indigo-600 text-white px-3 py-2 rounded hover:bg-indigo-700"
              >
                Manage Announcements
              </button>
            </div>

            <div className="mt-6 overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead className="bg-gray-100 text-gray-700">
                  <tr>
                    <th className="p-2 text-left">Title</th>
                    <th className="p-2 text-left">Start Date</th>
                    <th className="p-2 text-left">End Date</th>
                    <th className="p-2 text-left">Description</th>
                  </tr>
                </thead>
                <tbody>
                  {recentAnnouncements.length === 0 ? (
                    <tr>
                      <td colSpan="4" className="p-3 text-center text-gray-500">
                        No announcements in the last 10 days.
                      </td>
                    </tr>
                  ) : (
                    recentAnnouncements.map((item) => (
                      <tr key={item._id} className="border-t">
                        <td className="p-2">{item.title}</td>
                        <td className="p-2">{item.startDate}</td>
                        <td className="p-2">{item.endDate}</td>
                        <td className="p-2">{item.description}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </main>

    </div>
  );
};

export default Dashboard;
