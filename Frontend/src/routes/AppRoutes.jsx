import React, { lazy, Suspense } from "react";
import { Routes, Route } from "react-router-dom";
import { useSelector } from "react-redux";
import LoadingSkeleton from "../Components/LoadingSkeleton";

// Layouts
import HrLayoutDashboard from "../Components/Layout/HRLayout";
import EmployeeLayoutDashboard from "../Components/Layout/EmployeLayout";

// Auth Pages (Lazy Loaded)
const Login = lazy(() => import("../Pages/Login/Login"));
const SetPassword = lazy(() => import("../Pages/Employee/Email"));

// HR Pages (Lazy Loaded)
const HRDashboard = lazy(() => import("../Pages/Admin/HrDashboard"));
const Employees = lazy(() => import("../Pages/Admin/Employees"));
const AddEmployee = lazy(() => import("../Pages/Admin/AddEmployee"));
const PayrollSystem = lazy(() => import("../Pages/Admin/Payrollsystem"));
const HRCalendar = lazy(() => import("../Pages/Admin/HRCalendar"));
const EmployeeDashboard = lazy(() => import("../Pages/Admin/EmployeePage"));
const PayrollPage = lazy(() => import("../Pages/Admin/PayrollPage"));
const Hrprofile = lazy(() => import("../Pages/Admin/HrProfile"));
const Query = lazy(() => import("../Pages/Admin/Query"));
const Announcements = lazy(() => import("../Pages/Admin/Announcements"));
const RbacManagement = lazy(() => import("../Pages/Admin/RbacManagement"));

// Employee Pages (Lazy Loaded)
const Dashboard = lazy(() => import("../Pages/Employee/EmployeeHome"));
const Attendance = lazy(() => import("../Pages/Employee/Attendance"));
const Salary = lazy(() => import("../Pages/Employee/Salary"));
const Calendar = lazy(() => import("../Pages/Employee/Calendar"));
const AttendanceNew = lazy(() => import("../Components/attendance"));
const Emprofile = lazy(() => import("../Pages/Employee/Emprofile"));
const Chatbot = lazy(() => import("../Pages/Employee/Chat"));
const Contect = lazy(() => import("../Pages/Employee/Contect"));
const SettingsPage = lazy(() => import("../Pages/Employee/SettingsPage"));

// Fallbacks (Lazy Loaded)
const Add = lazy(() => import("../Pages/Add"));
const NotFound = lazy(() => import("../Components/NotFound"));

const AppRoutes = () => {
  const token = useSelector((state) => state.auth.token);
  const user = useSelector((state) => state.auth.user);
  const role = user?.role?.toLowerCase();
  const isAuthenticated = !!token;

  return (
    <Suspense fallback={<LoadingSkeleton />}>
      <Routes>
        <Route path="/" element={<Login />} />

        {/* Employee Routes */}
        {isAuthenticated && role === "employee" && (
          <Route path="/" element={<EmployeeLayoutDashboard />}>
            <Route path="emhome" element={<Dashboard />} />
            <Route path="emattendance" element={<Attendance />} />
            <Route path="emsalary" element={<Salary />} />
            <Route path="emcalendar" element={<Calendar />} />
            <Route path="attendance" element={<AttendanceNew />} />
            <Route path="emprofile/:id" element={<Emprofile />} />
            <Route path="emchat" element={<Chatbot />} />
            <Route path="emcontect" element={<Contect />} />
            <Route path="settings" element={<SettingsPage />} />
          </Route>
        )}

        {/* HR, Admin, Super Admin, Manager, Team Leader Routes */}
        {isAuthenticated && (role === "hr" || role === "admin" || role === "super_admin" || role === "manager" || role === "team_leader") && (
          <Route path="/" element={<HrLayoutDashboard />}>
            <Route path="hrhome" element={<HRDashboard />} />
            <Route path="hremployees" element={<Employees />} />
            <Route path="hraddemployee" element={<AddEmployee />} />
            <Route path="hrpayrollsystem" element={<PayrollSystem />} />
            <Route path="hrcalendar" element={<HRCalendar />} />
            <Route path="hremployees/profile/:id" element={<EmployeeDashboard />} />
            <Route path="payrollsystem/profile/:id" element={<PayrollPage />} />
            <Route path="hrprofile/:id" element={<Hrprofile />} />
            <Route path="hrquery" element={<Query />} />
            <Route path="hrannouncements" element={<Announcements />} />
            <Route path="admin/rbac" element={<RbacManagement />} />
            <Route path="rbac" element={<RbacManagement />} />
            <Route path="settings" element={<SettingsPage />} />
          </Route>
        )}

        <Route path="/:id/set-password" element={<SetPassword />} />
        <Route path="/add" element={<Add />} />
        <Route path="*" element={<NotFound />} />
      </Routes>
    </Suspense>
  );
};

export default AppRoutes;