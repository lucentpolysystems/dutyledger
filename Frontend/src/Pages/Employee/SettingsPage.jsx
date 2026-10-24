import React, { useState, useEffect } from "react";
import { useSelector, useDispatch } from "react-redux";
import { useNavigate } from "react-router-dom";
import { setUser, logoutUser } from "../../Redux/Slice";
import { apiUrl, authHeaders } from "../../utils/api";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import {
  User,
  Lock,
  Building2,
  Bell,
  LogOut,
  Save,
  KeyRound,
  Phone,
  MapPin,
  Mail,
  Briefcase,
  ShieldCheck,
  CheckCircle2,
  Calendar,
  CreditCard,
  Eye,
  EyeOff,
  Clock,
  DollarSign,
  Radio,
  Shield,
  Server,
  Layers,
  Users,
  AlertTriangle,
  Database,
  History,
  Award,
  Check,
  Cpu,
  FileCheck,
} from "lucide-react";

const SettingsPage = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const currentUser = useSelector((state) => state.auth.user);
  const token = useSelector((state) => state.auth.token);

  // -------------------------------------------------------------
  // ROLE DETECTION & RESOLUTION
  // -------------------------------------------------------------
  const userRoles = Array.isArray(currentUser?.roles)
    ? currentUser.roles.map((r) => String(r).toUpperCase())
    : [];
  const primaryRole = String(currentUser?.role || "").toUpperCase();

  const isSuperAdmin =
    userRoles.includes("ROLE_SUPER_ADMIN") ||
    primaryRole === "ROLE_SUPER_ADMIN" ||
    primaryRole === "SUPERADMIN" ||
    primaryRole === "SUPER_ADMIN";

  const isAdmin =
    isSuperAdmin ||
    userRoles.includes("ROLE_ADMIN") ||
    primaryRole === "ROLE_ADMIN" ||
    primaryRole === "ADMIN";

  const isHR =
    isSuperAdmin ||
    userRoles.includes("ROLE_HR") ||
    primaryRole === "ROLE_HR" ||
    primaryRole === "HR";

  const isManager =
    isSuperAdmin ||
    userRoles.includes("ROLE_MANAGER") ||
    primaryRole === "ROLE_MANAGER" ||
    primaryRole === "MANAGER";

  const isTeamLeader =
    isSuperAdmin ||
    userRoles.includes("ROLE_TEAM_LEADER") ||
    primaryRole === "ROLE_TEAM_LEADER" ||
    primaryRole === "TEAM_LEADER" ||
    primaryRole === "LEADER";

  const isEmployee = !isAdmin && !isHR && !isManager && !isTeamLeader;

  // Metadata and badge for the specific role
  const getRoleMeta = () => {
    if (isSuperAdmin) {
      return {
        category: "SUPER_ADMIN",
        title: "Super Admin • Enterprise Control Center",
        subtitle:
          "Master configuration of platform security, organization profile, geofencing, HR policies, and enterprise overrides.",
        badge: "⚡ Super Admin (Master)",
        badgeClass: "bg-amber-100 text-amber-900 border-amber-300 font-bold",
        avatarClass: "bg-amber-500 text-white border-amber-600",
        defaultTab: "company",
      };
    }
    if (isAdmin) {
      return {
        category: "ADMIN",
        title: "System & IT Infrastructure Settings",
        subtitle:
          "Configure IT security, session timeout, geofencing coordinates, audit log retention, and system integrations.",
        badge: "🛡️ System Administrator",
        badgeClass: "bg-indigo-100 text-indigo-900 border-indigo-300 font-bold",
        avatarClass: "bg-indigo-600 text-white border-indigo-700",
        defaultTab: "system-security",
      };
    }
    if (isHR) {
      return {
        category: "HR",
        title: "HR & Organization Policy Settings",
        subtitle:
          "Manage company legal profile, standard working hours, payroll tax rules, leave quotas, and automated employee notices.",
        badge: "👑 HR Administrator",
        badgeClass: "bg-sky-100 text-sky-900 border-sky-300 font-bold",
        avatarClass: "bg-sky-600 text-white border-sky-700",
        defaultTab: "company",
      };
    }
    if (isManager) {
      return {
        category: "MANAGER",
        title: "Department Operations & Shift Settings",
        subtitle:
          "Configure department shift rosters, overtime pre-approval thresholds, team leave limits, and operational notifications.",
        badge: "💼 Department Manager",
        badgeClass: "bg-teal-100 text-teal-900 border-teal-300 font-bold",
        avatarClass: "bg-teal-600 text-white border-teal-700",
        defaultTab: "dept-shifts",
      };
    }
    if (isTeamLeader) {
      return {
        category: "TEAM_LEADER",
        title: "Team Leadership & Attendance Alerts",
        subtitle:
          "Configure team shift notifications, late punch-in alerts, shift summary preferences, and personal profile.",
        badge: "🚀 Team Leader",
        badgeClass: "bg-purple-100 text-purple-900 border-purple-300 font-bold",
        avatarClass: "bg-purple-600 text-white border-purple-700",
        defaultTab: "team-alerts",
      };
    }
    return {
      category: "EMPLOYEE",
      title: "Employee Account & Personal Settings",
      subtitle:
        "Manage your personal profile, account credentials, workplace record verification, and personal alert preferences.",
      badge: "👤 Staff Member",
      badgeClass: "bg-emerald-100 text-emerald-900 border-emerald-300 font-bold",
      avatarClass: "bg-emerald-600 text-white border-emerald-700",
      defaultTab: "profile",
    };
  };

  const roleMeta = getRoleMeta();
  const [activeTab, setActiveTab] = useState(roleMeta.defaultTab);
  const [loading, setLoading] = useState(false);
  const [profileLoading, setProfileLoading] = useState(true);

  // -------------------------------------------------------------
  // 1. PERSONAL PROFILE STATE (All Roles)
  // -------------------------------------------------------------
  const [profileData, setProfileData] = useState({
    username: "",
    email: "",
    mobile: "",
    address: "",
    gender: "Male",
    emergencyContact: "",
    emergencyContactname: "",
    designation: "",
    bankAccount: "",
    IFSC: "",
    joigningDate: "",
    salary: "",
    employmentType: "",
    attendanceType: "",
  });

  // Password Change State
  const [passwordData, setPasswordData] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);

  // -------------------------------------------------------------
  // 2. HR & COMPANY POLICIES (HR & Super Admin)
  // -------------------------------------------------------------
  const defaultCompanySettings = {
    companyName: "Lucent Polysystem Pvt. Ltd.",
    cin: "U25209GJ2018PTC104523",
    gstin: "24AAACL5890P1ZB",
    corporateEmail: "hr@lucentpolysystem.com",
    supportEmail: "info@lucentpolysystem.com",
    contactPhone: "+91 79 2658 4100",
    headquarters: "Corporate Tower, 5th Floor, SG Highway, Ahmedabad, Gujarat - 380054",
    plantAddress: "Plot No. 42-45, Phase III, GIDC Industrial Estate, Sanand, Gujarat",
    industry: "Polymer Compounds, Masterbatches & Engineering Plastics",
    // Attendance & Geofence Policy
    officeLat: "22.816958",
    officeLng: "72.473781",
    geofenceRadiusKm: "3.0",
    workStartTime: "09:00",
    workEndTime: "18:00",
    lateGraceMinutes: "15",
    halfDayThresholdHours: "4.5",
    // Payroll & Compensation Rules
    payrollCycleDay: "30",
    pfDeductionPercent: "12",
    overtimeMultiplier: "1.5",
    ptDeductionFixed: "200",
    autoGenerateSalarySlips: true,
    // Leave Quotas
    annualCasualLeave: "12",
    annualSickLeave: "10",
    annualPaidLeave: "15",
    weeklyOff: "Sunday + 2nd & 4th Saturday",
    // Automated Dispatch
    sendWelcomeEmailOnAdd: true,
    sendSalarySlipOnProcess: true,
    sendAnnouncementBroadcast: true,
  };

  const [companySettings, setCompanySettings] = useState(() => {
    try {
      const saved = localStorage.getItem("lucent_company_settings");
      return saved ? { ...defaultCompanySettings, ...JSON.parse(saved) } : defaultCompanySettings;
    } catch {
      return defaultCompanySettings;
    }
  });

  // -------------------------------------------------------------
  // 3. SYSTEM & IT SECURITY POLICIES (System Admin & Super Admin)
  // -------------------------------------------------------------
  const defaultSystemSecurity = {
    sessionTimeoutMinutes: "60",
    maxFailedLogins: "5",
    enforceStrongPassword: true,
    require2FA: false,
    auditRetentionDays: "180",
    rbacStrictEnforcement: true,
    maintenanceMode: false,
    ipWhitelistEnabled: false,
    allowedIpSubnet: "192.168.1.0/24",
    allowApiTokens: true,
  };

  const [systemSecurity, setSystemSecurity] = useState(() => {
    try {
      const saved = localStorage.getItem("lucent_system_security");
      return saved ? { ...defaultSystemSecurity, ...JSON.parse(saved) } : defaultSystemSecurity;
    } catch {
      return defaultSystemSecurity;
    }
  });

  // -------------------------------------------------------------
  // 4. DEPARTMENT MANAGER POLICIES (Manager & Super Admin)
  // -------------------------------------------------------------
  const defaultDeptSettings = {
    deptName: "Polymer Production & Operations",
    deptShiftStart: "08:30",
    deptShiftEnd: "17:30",
    maxConcurrentLeaves: "2",
    overtimePreApprovalRequired: true,
    allowShiftSwapping: true,
    notifyOnEmployeeAbsent: true,
    dailyRosterReminderTime: "08:00",
  };

  const [deptSettings, setDeptSettings] = useState(() => {
    try {
      const saved = localStorage.getItem("lucent_dept_settings");
      return saved ? { ...defaultDeptSettings, ...JSON.parse(saved) } : defaultDeptSettings;
    } catch {
      return defaultDeptSettings;
    }
  });

  // -------------------------------------------------------------
  // 5. TEAM LEADER POLICIES (Team Leader & Super Admin)
  // -------------------------------------------------------------
  const defaultTeamLeaderSettings = {
    lateArrivalAlertMinutes: "15",
    notifyInstantOnClockIn: true,
    shiftHandoverReportEnabled: true,
    dailyAttendanceSummaryEmail: true,
    leadEscalationContact: "Plant Shift In-charge",
  };

  const [teamLeaderSettings, setTeamLeaderSettings] = useState(() => {
    try {
      const saved = localStorage.getItem("lucent_team_leader_settings");
      return saved ? { ...defaultTeamLeaderSettings, ...JSON.parse(saved) } : defaultTeamLeaderSettings;
    } catch {
      return defaultTeamLeaderSettings;
    }
  });

  // -------------------------------------------------------------
  // 6. EMPLOYEE NOTIFICATION PREFERENCES
  // -------------------------------------------------------------
  const [employeeNotifications, setEmployeeNotifications] = useState(() => {
    try {
      const saved = localStorage.getItem("lucent_employee_notifications");
      return saved
        ? JSON.parse(saved)
        : {
            payrollUpdates: true,
            attendanceReminders: true,
            announcements: true,
            leaveStatusAlerts: true,
          };
    } catch {
      return {
        payrollUpdates: true,
        attendanceReminders: true,
        announcements: true,
        leaveStatusAlerts: true,
      };
    }
  });

  // Fetch user profile from DB
  useEffect(() => {
    const fetchUserDetails = async () => {
      if (!currentUser?.id) return;
      try {
        setProfileLoading(true);
        const res = await fetch(apiUrl(`/api/users/${currentUser.id}`), {
          headers: authHeaders(token),
        });
        const data = await res.json();
        if (res.ok && data.user) {
          setProfileData({
            username: data.user.username || currentUser.username || "",
            email: data.user.email || currentUser.email || "",
            mobile: data.user.mobile || "",
            address: data.user.address || "",
            gender: data.user.gender || "Male",
            emergencyContact: data.user.emergencyContact || "",
            emergencyContactname: data.user.emergencyContactname || "",
            designation: data.user.designation || "",
            bankAccount: data.user.bankAccount || "",
            IFSC: data.user.IFSC || "",
            joigningDate: data.user.joigningDate || "",
            salary: data.user.salary || "",
            employmentType: data.user.employmentType || "Full-time",
            attendanceType: data.user.attendanceType || "Office",
          });
        }
      } catch (err) {
        console.error("Failed to load user details:", err);
      } finally {
        setProfileLoading(false);
      }
    };

    fetchUserDetails();
  }, [currentUser]);

  // Handle Profile Update
  const handleProfileSubmit = async (e) => {
    e.preventDefault();
    if (!currentUser?.id) return;
    setLoading(true);

    try {
      const response = await fetch(apiUrl(`/api/update/${currentUser.id}`), {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          username: profileData.username,
          email: profileData.email,
          mobile: profileData.mobile,
          address: profileData.address,
          gender: profileData.gender,
          emergencyContact: profileData.emergencyContact,
          emergencyContactname: profileData.emergencyContactname,
        }),
      });

      const resData = await response.json();

      if (!response.ok) {
        toast.error(resData.message || "Failed to update profile", {
          position: "bottom-right",
        });
        return;
      }

      dispatch(
        setUser({
          ...currentUser,
          username: profileData.username,
          email: profileData.email,
        })
      );

      toast.success("Personal profile updated successfully!", { position: "bottom-right" });
    } catch (error) {
      console.error("Error updating profile:", error);
      toast.error("Failed to update profile. Please try again.", {
        position: "bottom-right",
      });
    } finally {
      setLoading(false);
    }
  };

  // Handle Password Change
  const handlePasswordSubmit = async (e) => {
    e.preventDefault();

    if (passwordData.newPassword !== passwordData.confirmPassword) {
      toast.error("New passwords do not match!", { position: "bottom-right" });
      return;
    }

    if (passwordData.newPassword.length < 6) {
      toast.error("New password must be at least 6 characters long.", {
        position: "bottom-right",
      });
      return;
    }

    setLoading(true);

    try {
      const response = await fetch(apiUrl("/api/change-password"), {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          currentPassword: passwordData.currentPassword,
          newPassword: passwordData.newPassword,
        }),
      });

      const resData = await response.json();

      if (!response.ok) {
        toast.error(resData.message || "Failed to change password", {
          position: "bottom-right",
        });
        return;
      }

      toast.success("Password changed successfully!", { position: "bottom-right" });
      setPasswordData({ currentPassword: "", newPassword: "", confirmPassword: "" });
    } catch (error) {
      console.error("Error changing password:", error);
      toast.error("Error changing password. Please check your connection.", {
        position: "bottom-right",
      });
    } finally {
      setLoading(false);
    }
  };

  // Storage Savers
  const handleSaveCompanySettings = (sectionName) => {
    localStorage.setItem("lucent_company_settings", JSON.stringify(companySettings));
    toast.success(`${sectionName || "Company Settings"} saved successfully!`, {
      position: "bottom-right",
    });
  };

  const handleSaveSystemSecurity = () => {
    localStorage.setItem("lucent_system_security", JSON.stringify(systemSecurity));
    toast.success("System IT & Security configuration saved!", {
      position: "bottom-right",
    });
  };

  const handleSaveDeptSettings = () => {
    localStorage.setItem("lucent_dept_settings", JSON.stringify(deptSettings));
    toast.success("Department shift & approval settings saved!", {
      position: "bottom-right",
    });
  };

  const handleSaveTeamLeaderSettings = () => {
    localStorage.setItem("lucent_team_leader_settings", JSON.stringify(teamLeaderSettings));
    toast.success("Team leadership & attendance alert settings saved!", {
      position: "bottom-right",
    });
  };

  const handleSaveEmployeeNotifications = () => {
    localStorage.setItem("lucent_employee_notifications", JSON.stringify(employeeNotifications));
    toast.success("Notification preferences updated!", {
      position: "bottom-right",
    });
  };

  // Handle Logout
  const handleLogout = () => {
    dispatch(logoutUser());
    toast.info("Logged out successfully");
    navigate("/");
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-6">
      {/* ============================================================== */}
      {/* PAGE HEADER WITH ROLE-TAILORED IDENTITY                        */}
      {/* ============================================================== */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-slate-200">
        <div>
          <div className="flex items-center gap-2 text-xs font-bold text-sky-600 uppercase tracking-wider mb-1">
            <Building2 className="w-4 h-4" /> Lucent Polysystem Pvt. Ltd.
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            {roleMeta.title}
          </h1>
          <p className="text-sm text-slate-500 mt-1">{roleMeta.subtitle}</p>
        </div>

        {/* User Identity Pill with Specific Role Badge */}
        <div className="flex items-center gap-3 bg-white px-4 py-2.5 rounded-xl border border-slate-200 shadow-xs self-start md:self-auto">
          <div
            className={`w-10 h-10 rounded-full font-bold flex items-center justify-center text-sm border shrink-0 ${roleMeta.avatarClass}`}
          >
            {currentUser?.username ? currentUser.username.charAt(0).toUpperCase() : "U"}
          </div>
          <div>
            <div className="text-sm font-bold text-slate-800 leading-tight">
              {currentUser?.username || "Active User"}
            </div>
            <div className="text-xs text-slate-400 font-mono mt-0.5">
              ID: {currentUser?.id || "N/A"} •{" "}
              <span className={`px-2 py-0.5 rounded text-[11px] border ${roleMeta.badgeClass}`}>
                {roleMeta.badge}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* ============================================================== */}
      {/* MAIN CONTAINER: LEFT TAB NAV + RIGHT SETTINGS PANEL            */}
      {/* ============================================================== */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Sidebar Navigation */}
        <div className="lg:col-span-3 bg-white rounded-2xl border border-slate-200/90 shadow-xs p-2 space-y-1">
          {/* 1. SUPER ADMIN SPECIFIC NAVIGATION */}
          {isSuperAdmin && (
            <>
              <div className="px-3 pt-2 pb-1 text-[11px] font-extrabold uppercase tracking-wider text-amber-600 flex items-center gap-1.5">
                <Award className="w-3.5 h-3.5" /> Enterprise Controls
              </div>

              <button
                onClick={() => setActiveTab("company")}
                className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-semibold transition-colors ${
                  activeTab === "company"
                    ? "bg-amber-50 text-amber-900 font-bold border border-amber-200 shadow-2xs"
                    : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                }`}
              >
                <Building2 className="w-4 h-4 shrink-0 text-amber-600" />
                <span>Company Profile</span>
              </button>

              <button
                onClick={() => setActiveTab("system-security")}
                className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-semibold transition-colors ${
                  activeTab === "system-security"
                    ? "bg-amber-50 text-amber-900 font-bold border border-amber-200 shadow-2xs"
                    : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                }`}
              >
                <Shield className="w-4 h-4 shrink-0 text-indigo-600" />
                <span>Platform Security</span>
              </button>

              <button
                onClick={() => setActiveTab("geofence")}
                className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-semibold transition-colors ${
                  activeTab === "geofence"
                    ? "bg-amber-50 text-amber-900 font-bold border border-amber-200 shadow-2xs"
                    : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                }`}
              >
                <Radio className="w-4 h-4 shrink-0 text-sky-600" />
                <span>Plant Geofencing</span>
              </button>

              <button
                onClick={() => setActiveTab("payroll-policy")}
                className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-semibold transition-colors ${
                  activeTab === "payroll-policy"
                    ? "bg-amber-50 text-amber-900 font-bold border border-amber-200 shadow-2xs"
                    : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                }`}
              >
                <DollarSign className="w-4 h-4 shrink-0 text-emerald-600" />
                <span>Payroll & Tax Rules</span>
              </button>

              <button
                onClick={() => setActiveTab("leave-policy")}
                className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-semibold transition-colors ${
                  activeTab === "leave-policy"
                    ? "bg-amber-50 text-amber-900 font-bold border border-amber-200 shadow-2xs"
                    : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                }`}
              >
                <Calendar className="w-4 h-4 shrink-0 text-orange-600" />
                <span>Leave & Holidays</span>
              </button>

              <button
                onClick={() => setActiveTab("audit-policy")}
                className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-semibold transition-colors ${
                  activeTab === "audit-policy"
                    ? "bg-amber-50 text-amber-900 font-bold border border-amber-200 shadow-2xs"
                    : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                }`}
              >
                <History className="w-4 h-4 shrink-0 text-rose-600" />
                <span>Audit & RBAC Rules</span>
              </button>

              <button
                onClick={() => setActiveTab("email-dispatch")}
                className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-semibold transition-colors ${
                  activeTab === "email-dispatch"
                    ? "bg-amber-50 text-amber-900 font-bold border border-amber-200 shadow-2xs"
                    : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                }`}
              >
                <Mail className="w-4 h-4 shrink-0 text-cyan-600" />
                <span>Email & Broadcasts</span>
              </button>
            </>
          )}

          {/* 2. SYSTEM ADMIN SPECIFIC NAVIGATION */}
          {isAdmin && !isSuperAdmin && (
            <>
              <div className="px-3 pt-2 pb-1 text-[11px] font-extrabold uppercase tracking-wider text-indigo-600 flex items-center gap-1.5">
                <Cpu className="w-3.5 h-3.5" /> IT & Security Settings
              </div>

              <button
                onClick={() => setActiveTab("system-security")}
                className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-semibold transition-colors ${
                  activeTab === "system-security"
                    ? "bg-indigo-50 text-indigo-900 font-bold border border-indigo-200 shadow-2xs"
                    : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                }`}
              >
                <Shield className="w-4 h-4 shrink-0 text-indigo-600" />
                <span>IT Security & Session</span>
              </button>

              <button
                onClick={() => setActiveTab("geofence")}
                className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-semibold transition-colors ${
                  activeTab === "geofence"
                    ? "bg-indigo-50 text-indigo-900 font-bold border border-indigo-200 shadow-2xs"
                    : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                }`}
              >
                <Radio className="w-4 h-4 shrink-0 text-sky-600" />
                <span>Office GPS & Geofence</span>
              </button>

              <button
                onClick={() => setActiveTab("audit-policy")}
                className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-semibold transition-colors ${
                  activeTab === "audit-policy"
                    ? "bg-indigo-50 text-indigo-900 font-bold border border-indigo-200 shadow-2xs"
                    : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                }`}
              >
                <History className="w-4 h-4 shrink-0 text-rose-600" />
                <span>Audit & RBAC Retentions</span>
              </button>

              <button
                onClick={() => setActiveTab("email-dispatch")}
                className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-semibold transition-colors ${
                  activeTab === "email-dispatch"
                    ? "bg-indigo-50 text-indigo-900 font-bold border border-indigo-200 shadow-2xs"
                    : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                }`}
              >
                <Mail className="w-4 h-4 shrink-0 text-cyan-600" />
                <span>SMTP & Notification Gateway</span>
              </button>
            </>
          )}

          {/* 3. HR SPECIFIC NAVIGATION */}
          {isHR && !isSuperAdmin && (
            <>
              <div className="px-3 pt-2 pb-1 text-[11px] font-extrabold uppercase tracking-wider text-sky-600 flex items-center gap-1.5">
                <Building2 className="w-3.5 h-3.5" /> Organization & HR
              </div>

              <button
                onClick={() => setActiveTab("company")}
                className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-semibold transition-colors ${
                  activeTab === "company"
                    ? "bg-sky-50 text-sky-900 font-bold border border-sky-200 shadow-2xs"
                    : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                }`}
              >
                <Building2 className="w-4 h-4 shrink-0 text-sky-600" />
                <span>Company Legal Profile</span>
              </button>

              <button
                onClick={() => setActiveTab("shifts")}
                className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-semibold transition-colors ${
                  activeTab === "shifts"
                    ? "bg-sky-50 text-sky-900 font-bold border border-sky-200 shadow-2xs"
                    : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                }`}
              >
                <Clock className="w-4 h-4 shrink-0 text-indigo-600" />
                <span>Work Hours & Grace Period</span>
              </button>

              <button
                onClick={() => setActiveTab("payroll-policy")}
                className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-semibold transition-colors ${
                  activeTab === "payroll-policy"
                    ? "bg-sky-50 text-sky-900 font-bold border border-sky-200 shadow-2xs"
                    : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                }`}
              >
                <DollarSign className="w-4 h-4 shrink-0 text-emerald-600" />
                <span>Payroll & Statutory Rules</span>
              </button>

              <button
                onClick={() => setActiveTab("leave-policy")}
                className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-semibold transition-colors ${
                  activeTab === "leave-policy"
                    ? "bg-sky-50 text-sky-900 font-bold border border-sky-200 shadow-2xs"
                    : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                }`}
              >
                <Calendar className="w-4 h-4 shrink-0 text-amber-600" />
                <span>Leave Quotas & Holidays</span>
              </button>

              <button
                onClick={() => setActiveTab("email-dispatch")}
                className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-semibold transition-colors ${
                  activeTab === "email-dispatch"
                    ? "bg-sky-50 text-sky-900 font-bold border border-sky-200 shadow-2xs"
                    : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                }`}
              >
                <Mail className="w-4 h-4 shrink-0 text-cyan-600" />
                <span>Staff Email Dispatch</span>
              </button>
            </>
          )}

          {/* 4. DEPARTMENT MANAGER SPECIFIC NAVIGATION */}
          {isManager && !isSuperAdmin && !isAdmin && !isHR && (
            <>
              <div className="px-3 pt-2 pb-1 text-[11px] font-extrabold uppercase tracking-wider text-teal-600 flex items-center gap-1.5">
                <Layers className="w-3.5 h-3.5" /> Department Operations
              </div>

              <button
                onClick={() => setActiveTab("dept-shifts")}
                className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-semibold transition-colors ${
                  activeTab === "dept-shifts"
                    ? "bg-teal-50 text-teal-900 font-bold border border-teal-200 shadow-2xs"
                    : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                }`}
              >
                <Clock className="w-4 h-4 shrink-0 text-teal-600" />
                <span>Shift Rosters & Schedules</span>
              </button>

              <button
                onClick={() => setActiveTab("dept-approvals")}
                className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-semibold transition-colors ${
                  activeTab === "dept-approvals"
                    ? "bg-teal-50 text-teal-900 font-bold border border-teal-200 shadow-2xs"
                    : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                }`}
              >
                <FileCheck className="w-4 h-4 shrink-0 text-indigo-600" />
                <span>Leave & Overtime Limits</span>
              </button>
            </>
          )}

          {/* 5. TEAM LEADER SPECIFIC NAVIGATION */}
          {isTeamLeader && !isSuperAdmin && !isAdmin && !isHR && !isManager && (
            <>
              <div className="px-3 pt-2 pb-1 text-[11px] font-extrabold uppercase tracking-wider text-purple-600 flex items-center gap-1.5">
                <Users className="w-3.5 h-3.5" /> Team Leadership
              </div>

              <button
                onClick={() => setActiveTab("team-alerts")}
                className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-semibold transition-colors ${
                  activeTab === "team-alerts"
                    ? "bg-purple-50 text-purple-900 font-bold border border-purple-200 shadow-2xs"
                    : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                }`}
              >
                <AlertTriangle className="w-4 h-4 shrink-0 text-purple-600" />
                <span>Attendance & Late Alerts</span>
              </button>

              <button
                onClick={() => setActiveTab("team-roster")}
                className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-semibold transition-colors ${
                  activeTab === "team-roster"
                    ? "bg-purple-50 text-purple-900 font-bold border border-purple-200 shadow-2xs"
                    : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                }`}
              >
                <History className="w-4 h-4 shrink-0 text-indigo-600" />
                <span>Shift Handover Logs</span>
              </button>
            </>
          )}

          {/* ===================== PERSONAL ACCOUNT TABS (ALL ROLES) ===================== */}
          <div className="px-3 pt-3 pb-1 text-[11px] font-extrabold uppercase tracking-wider text-slate-400 border-t border-slate-100">
            My Account
          </div>

          <button
            onClick={() => setActiveTab("profile")}
            className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-semibold transition-colors ${
              activeTab === "profile"
                ? "bg-slate-100 text-slate-900 font-bold border border-slate-300 shadow-2xs"
                : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
            }`}
          >
            <User className="w-4 h-4 shrink-0 text-slate-600" />
            <span>Personal Profile</span>
          </button>

          {/* Workplace record visible to employees, team leaders, and managers */}
          {!isAdmin && !isSuperAdmin && (
            <button
              onClick={() => setActiveTab("employment")}
              className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-semibold transition-colors ${
                activeTab === "employment"
                  ? "bg-slate-100 text-slate-900 font-bold border border-slate-300 shadow-2xs"
                  : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
              }`}
            >
              <Briefcase className="w-4 h-4 shrink-0 text-sky-600" />
              <span>Workplace Record</span>
            </button>
          )}

          <button
            onClick={() => setActiveTab("security")}
            className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-semibold transition-colors ${
              activeTab === "security"
                ? "bg-slate-100 text-slate-900 font-bold border border-slate-300 shadow-2xs"
                : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
            }`}
          >
            <Lock className="w-4 h-4 shrink-0 text-rose-600" />
            <span>Account Security</span>
          </button>

          {/* Preferences for Employees, Team Leaders, and Managers */}
          {!isAdmin && !isSuperAdmin && (
            <button
              onClick={() => setActiveTab("notifications")}
              className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-semibold transition-colors ${
                activeTab === "notifications"
                  ? "bg-slate-100 text-slate-900 font-bold border border-slate-300 shadow-2xs"
                  : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
              }`}
            >
              <Bell className="w-4 h-4 shrink-0 text-amber-600" />
              <span>Personal Alerts</span>
            </button>
          )}

          <div className="pt-2 border-t border-slate-100">
            <button
              onClick={handleLogout}
              className="w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-semibold text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
            >
              <LogOut className="w-4 h-4 shrink-0" />
              <span>Sign Out of Portal</span>
            </button>
          </div>
        </div>

        {/* Right Settings Panel */}
        <div className="lg:col-span-9 bg-white rounded-2xl border border-slate-200/90 shadow-xs p-6 sm:p-8">
          {/* ============================================================== */}
          {/* TAB 1: COMPANY PROFILE (HR & Super Admin)                      */}
          {/* ============================================================== */}
          {(isHR || isSuperAdmin) && activeTab === "company" && (
            <div className="space-y-6">
              <div className="pb-4 border-b border-slate-100 flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-bold text-slate-900">Company & Organization Profile</h2>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Official registration, addresses, and corporate details for Lucent Polysystem Pvt. Ltd.
                  </p>
                </div>
                <img src="/logo.jpg" alt="Logo" className="h-9 w-auto object-contain rounded" />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-600 uppercase mb-1">Company Legal Name</label>
                  <input
                    type="text"
                    className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-300 rounded-lg focus:bg-white focus:ring-2 focus:ring-sky-500"
                    value={companySettings.companyName}
                    onChange={(e) => setCompanySettings({ ...companySettings, companyName: e.target.value })}
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-600 uppercase mb-1">Corporate CIN</label>
                  <input
                    type="text"
                    className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-300 rounded-lg focus:bg-white focus:ring-2 focus:ring-sky-500 font-mono text-xs"
                    value={companySettings.cin}
                    onChange={(e) => setCompanySettings({ ...companySettings, cin: e.target.value })}
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-600 uppercase mb-1">GSTIN</label>
                  <input
                    type="text"
                    className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-300 rounded-lg focus:bg-white focus:ring-2 focus:ring-sky-500 font-mono text-xs"
                    value={companySettings.gstin}
                    onChange={(e) => setCompanySettings({ ...companySettings, gstin: e.target.value })}
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-600 uppercase mb-1">HR Official Email</label>
                  <input
                    type="email"
                    className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-300 rounded-lg focus:bg-white focus:ring-2 focus:ring-sky-500"
                    value={companySettings.corporateEmail}
                    onChange={(e) => setCompanySettings({ ...companySettings, corporateEmail: e.target.value })}
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-xs font-bold text-slate-600 uppercase mb-1">Registered Headquarters Address</label>
                  <input
                    type="text"
                    className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-300 rounded-lg focus:bg-white focus:ring-2 focus:ring-sky-500"
                    value={companySettings.headquarters}
                    onChange={(e) => setCompanySettings({ ...companySettings, headquarters: e.target.value })}
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-xs font-bold text-slate-600 uppercase mb-1">Plant & Manufacturing Facility Address</label>
                  <input
                    type="text"
                    className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-300 rounded-lg focus:bg-white focus:ring-2 focus:ring-sky-500"
                    value={companySettings.plantAddress}
                    onChange={(e) => setCompanySettings({ ...companySettings, plantAddress: e.target.value })}
                  />
                </div>
              </div>

              <div className="pt-3 flex justify-end">
                <button
                  type="button"
                  onClick={() => handleSaveCompanySettings("Company Profile")}
                  className="inline-flex items-center gap-2 px-5 py-2.5 bg-sky-600 hover:bg-sky-700 text-white rounded-lg text-sm font-bold shadow-md transition cursor-pointer"
                >
                  <Save className="w-4 h-4" /> Save Company Details
                </button>
              </div>
            </div>
          )}

          {/* ============================================================== */}
          {/* TAB 2: SYSTEM IT & SECURITY (Admin & Super Admin)              */}
          {/* ============================================================== */}
          {(isAdmin || isSuperAdmin) && activeTab === "system-security" && (
            <div className="space-y-6">
              <div className="pb-4 border-b border-slate-100 flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-bold text-slate-900">IT & System Security Configuration</h2>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Configure enterprise session timeouts, login lockouts, password rules, and access safeguards.
                  </p>
                </div>
                <div className="p-2 bg-indigo-50 border border-indigo-200 rounded-lg">
                  <ShieldCheck className="w-6 h-6 text-indigo-600" />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-600 uppercase mb-1">
                    Inactivity Session Timeout (Minutes)
                  </label>
                  <select
                    className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-300 rounded-lg focus:bg-white"
                    value={systemSecurity.sessionTimeoutMinutes}
                    onChange={(e) =>
                      setSystemSecurity({ ...systemSecurity, sessionTimeoutMinutes: e.target.value })
                    }
                  >
                    <option value="15">15 Minutes (Strict Security)</option>
                    <option value="30">30 Minutes</option>
                    <option value="60">60 Minutes (Standard)</option>
                    <option value="120">2 Hours</option>
                    <option value="480">8 Hours (Full Shift)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-600 uppercase mb-1">
                    Failed Login Lockout Threshold
                  </label>
                  <select
                    className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-300 rounded-lg focus:bg-white"
                    value={systemSecurity.maxFailedLogins}
                    onChange={(e) =>
                      setSystemSecurity({ ...systemSecurity, maxFailedLogins: e.target.value })
                    }
                  >
                    <option value="3">3 Attempts (High Alert)</option>
                    <option value="5">5 Attempts (Standard)</option>
                    <option value="10">10 Attempts (Relaxed)</option>
                  </select>
                </div>

                <div className="sm:col-span-2 space-y-3 pt-2">
                  <div className="flex items-center justify-between p-4 rounded-xl bg-slate-50 border border-slate-200">
                    <div>
                      <div className="text-sm font-bold text-slate-800">Enforce Strong Password Complexity</div>
                      <div className="text-xs text-slate-500 mt-0.5">
                        Requires minimum 8 characters with alphanumeric and special characters.
                      </div>
                    </div>
                    <input
                      type="checkbox"
                      checked={systemSecurity.enforceStrongPassword}
                      onChange={(e) =>
                        setSystemSecurity({ ...systemSecurity, enforceStrongPassword: e.target.checked })
                      }
                      className="w-4 h-4 accent-indigo-600 rounded cursor-pointer"
                    />
                  </div>

                  <div className="flex items-center justify-between p-4 rounded-xl bg-slate-50 border border-slate-200">
                    <div>
                      <div className="text-sm font-bold text-slate-800">Two-Factor Authentication (2FA) for Admins</div>
                      <div className="text-xs text-slate-500 mt-0.5">
                        Mandates OTP verification when logging into Admin and HR roles.
                      </div>
                    </div>
                    <input
                      type="checkbox"
                      checked={systemSecurity.require2FA}
                      onChange={(e) =>
                        setSystemSecurity({ ...systemSecurity, require2FA: e.target.checked })
                      }
                      className="w-4 h-4 accent-indigo-600 rounded cursor-pointer"
                    />
                  </div>

                  <div className="flex items-center justify-between p-4 rounded-xl bg-slate-50 border border-slate-200">
                    <div>
                      <div className="text-sm font-bold text-slate-800">Plant Network IP Restriction (Whitelist)</div>
                      <div className="text-xs text-slate-500 mt-0.5">
                        Restrict attendance punch-ins to designated factory subnets.
                      </div>
                    </div>
                    <input
                      type="checkbox"
                      checked={systemSecurity.ipWhitelistEnabled}
                      onChange={(e) =>
                        setSystemSecurity({ ...systemSecurity, ipWhitelistEnabled: e.target.checked })
                      }
                      className="w-4 h-4 accent-indigo-600 rounded cursor-pointer"
                    />
                  </div>
                </div>
              </div>

              <div className="pt-3 flex justify-end">
                <button
                  type="button"
                  onClick={handleSaveSystemSecurity}
                  className="inline-flex items-center gap-2 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-sm font-bold shadow-md transition cursor-pointer"
                >
                  <Save className="w-4 h-4" /> Save IT Security Rules
                </button>
              </div>
            </div>
          )}

          {/* ============================================================== */}
          {/* TAB 3: GEOFENCING & GPS (Admin & Super Admin)                  */}
          {/* ============================================================== */}
          {(isAdmin || isSuperAdmin) && activeTab === "geofence" && (
            <div className="space-y-6">
              <div className="pb-4 border-b border-slate-100 flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-bold text-slate-900">Plant GPS Geofencing Settings</h2>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Configure office & plant GPS coordinates and geofence tolerance for attendance validation.
                  </p>
                </div>
                <div className="p-2 bg-sky-50 border border-sky-200 rounded-lg">
                  <Radio className="w-6 h-6 text-sky-600" />
                </div>
              </div>

              <div className="p-4 rounded-xl bg-sky-50 border border-sky-200 text-xs text-sky-800 flex items-start gap-3">
                <Radio className="w-5 h-5 text-sky-600 shrink-0 mt-0.5" />
                <div>
                  <strong>Active Geofence Protection:</strong> When staff click &quot;Mark Attendance&quot;, device GPS
                  coordinates are calculated using the Haversine formula against the plant location below. If distance
                  exceeds radius tolerance, punch-in is rejected.
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-600 uppercase mb-1">Office GPS Latitude</label>
                  <input
                    type="text"
                    className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-300 rounded-lg font-mono focus:bg-white"
                    value={companySettings.officeLat}
                    onChange={(e) => setCompanySettings({ ...companySettings, officeLat: e.target.value })}
                  />
                  <span className="text-[11px] text-slate-400 mt-0.5 block">Sanand Plant Default: 22.816958</span>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-600 uppercase mb-1">Office GPS Longitude</label>
                  <input
                    type="text"
                    className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-300 rounded-lg font-mono focus:bg-white"
                    value={companySettings.officeLng}
                    onChange={(e) => setCompanySettings({ ...companySettings, officeLng: e.target.value })}
                  />
                  <span className="text-[11px] text-slate-400 mt-0.5 block">Default: 72.473781</span>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-600 uppercase mb-1">
                    Allowed Geofence Radius (KM)
                  </label>
                  <input
                    type="number"
                    step="0.5"
                    className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-300 rounded-lg focus:bg-white"
                    value={companySettings.geofenceRadiusKm}
                    onChange={(e) => setCompanySettings({ ...companySettings, geofenceRadiusKm: e.target.value })}
                  />
                  <span className="text-[11px] text-slate-400 mt-0.5 block">
                    Staff within this perimeter can punch in successfully
                  </span>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-600 uppercase mb-1">
                    GPS Drift Tolerance
                  </label>
                  <select className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-300 rounded-lg focus:bg-white">
                    <option value="high">High Precision (Within 50m)</option>
                    <option value="standard">Standard (Within 100m)</option>
                    <option value="relaxed">Industrial Area Tolerant (Within 250m)</option>
                  </select>
                </div>
              </div>

              <div className="pt-3 flex justify-end">
                <button
                  type="button"
                  onClick={() => handleSaveCompanySettings("Geofencing Settings")}
                  className="inline-flex items-center gap-2 px-5 py-2.5 bg-sky-600 hover:bg-sky-700 text-white rounded-lg text-sm font-bold shadow-md transition cursor-pointer"
                >
                  <Save className="w-4 h-4" /> Save Geofence Coordinates
                </button>
              </div>
            </div>
          )}

          {/* ============================================================== */}
          {/* TAB 4: WORK HOURS & SHIFTS (HR & Super Admin)                  */}
          {/* ============================================================== */}
          {(isHR || isSuperAdmin) && activeTab === "shifts" && (
            <div className="space-y-6">
              <div className="pb-4 border-b border-slate-100 flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-bold text-slate-900">Work Hours & Shift Policies</h2>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Define official plant shifts, grace periods for late arrivals, and half-day thresholds.
                  </p>
                </div>
                <div className="p-2 bg-indigo-50 border border-indigo-200 rounded-lg">
                  <Clock className="w-6 h-6 text-indigo-600" />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-600 uppercase mb-1">Standard Shift Start Time</label>
                  <input
                    type="time"
                    className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-300 rounded-lg focus:bg-white"
                    value={companySettings.workStartTime}
                    onChange={(e) => setCompanySettings({ ...companySettings, workStartTime: e.target.value })}
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-600 uppercase mb-1">Standard Shift End Time</label>
                  <input
                    type="time"
                    className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-300 rounded-lg focus:bg-white"
                    value={companySettings.workEndTime}
                    onChange={(e) => setCompanySettings({ ...companySettings, workEndTime: e.target.value })}
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-600 uppercase mb-1">
                    Late Arrival Grace Period (Minutes)
                  </label>
                  <input
                    type="number"
                    className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-300 rounded-lg focus:bg-white"
                    value={companySettings.lateGraceMinutes}
                    onChange={(e) => setCompanySettings({ ...companySettings, lateGraceMinutes: e.target.value })}
                  />
                  <span className="text-[11px] text-slate-400 mt-0.5 block">Arrivals after 09:15 AM marked &apos;Late&apos;</span>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-600 uppercase mb-1">
                    Minimum Hours for Full Day
                  </label>
                  <input
                    type="number"
                    step="0.5"
                    className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-300 rounded-lg focus:bg-white"
                    value={companySettings.halfDayThresholdHours}
                    onChange={(e) =>
                      setCompanySettings({ ...companySettings, halfDayThresholdHours: e.target.value })
                    }
                  />
                  <span className="text-[11px] text-slate-400 mt-0.5 block">Working under 4.5 hours marked Half Day</span>
                </div>
              </div>

              <div className="pt-3 flex justify-end">
                <button
                  type="button"
                  onClick={() => handleSaveCompanySettings("Shift & Hours Policy")}
                  className="inline-flex items-center gap-2 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-sm font-bold shadow-md transition cursor-pointer"
                >
                  <Save className="w-4 h-4" /> Save Shift Policies
                </button>
              </div>
            </div>
          )}

          {/* ============================================================== */}
          {/* TAB 5: PAYROLL & STATUTORY RULES (HR & Super Admin)            */}
          {/* ============================================================== */}
          {(isHR || isSuperAdmin) && activeTab === "payroll-policy" && (
            <div className="space-y-6">
              <div className="pb-4 border-b border-slate-100 flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-bold text-slate-900">Payroll & Statutory Calculation Policy</h2>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Standardize monthly pay dates, Provident Fund (PF), Professional Tax (PT), and overtime rates.
                  </p>
                </div>
                <div className="p-2 bg-emerald-50 border border-emerald-200 rounded-lg">
                  <DollarSign className="w-6 h-6 text-emerald-600" />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-600 uppercase mb-1">Monthly Pay Cycle Date</label>
                  <select
                    className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-300 rounded-lg focus:bg-white"
                    value={companySettings.payrollCycleDay}
                    onChange={(e) => setCompanySettings({ ...companySettings, payrollCycleDay: e.target.value })}
                  >
                    <option value="28">28th of every month</option>
                    <option value="30">30th / Last day of month</option>
                    <option value="1">1st of following month</option>
                    <option value="5">5th of following month</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-600 uppercase mb-1">
                    Standard Provident Fund (PF) %
                  </label>
                  <input
                    type="number"
                    className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-300 rounded-lg focus:bg-white"
                    value={companySettings.pfDeductionPercent}
                    onChange={(e) => setCompanySettings({ ...companySettings, pfDeductionPercent: e.target.value })}
                  />
                  <span className="text-[11px] text-slate-400 mt-0.5 block">Statutory standard: 12%</span>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-600 uppercase mb-1">
                    Professional Tax (PT) Monthly Flat (₹)
                  </label>
                  <input
                    type="number"
                    className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-300 rounded-lg focus:bg-white"
                    value={companySettings.ptDeductionFixed}
                    onChange={(e) => setCompanySettings({ ...companySettings, ptDeductionFixed: e.target.value })}
                  />
                  <span className="text-[11px] text-slate-400 mt-0.5 block">Gujarat Standard: ₹200/mo</span>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-600 uppercase mb-1">
                    Overtime Hourly Multiplier
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-300 rounded-lg focus:bg-white"
                    value={companySettings.overtimeMultiplier}
                    onChange={(e) => setCompanySettings({ ...companySettings, overtimeMultiplier: e.target.value })}
                  />
                  <span className="text-[11px] text-slate-400 mt-0.5 block">1.5x standard hourly rate</span>
                </div>
              </div>

              <div className="pt-3 flex justify-end">
                <button
                  type="button"
                  onClick={() => handleSaveCompanySettings("Payroll Policy")}
                  className="inline-flex items-center gap-2 px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-sm font-bold shadow-md transition cursor-pointer"
                >
                  <Save className="w-4 h-4" /> Save Payroll Policy
                </button>
              </div>
            </div>
          )}

          {/* ============================================================== */}
          {/* TAB 6: LEAVE QUOTAS & HOLIDAYS (HR & Super Admin)              */}
          {/* ============================================================== */}
          {(isHR || isSuperAdmin) && activeTab === "leave-policy" && (
            <div className="space-y-6">
              <div className="pb-4 border-b border-slate-100 flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-bold text-slate-900">Leave Quotas & Work Schedule</h2>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Manage standard annual employee leave allocations and plant operating calendar.
                  </p>
                </div>
                <div className="p-2 bg-amber-50 border border-amber-200 rounded-lg">
                  <Calendar className="w-6 h-6 text-amber-600" />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
                  <label className="block text-xs font-bold text-slate-600 uppercase mb-1">Casual Leaves (CL)</label>
                  <input
                    type="number"
                    className="w-full px-3 py-2 text-sm bg-white border border-slate-300 rounded-lg font-bold"
                    value={companySettings.annualCasualLeave}
                    onChange={(e) => setCompanySettings({ ...companySettings, annualCasualLeave: e.target.value })}
                  />
                  <span className="text-[11px] text-slate-400 mt-1 block">Days / calendar year</span>
                </div>

                <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
                  <label className="block text-xs font-bold text-slate-600 uppercase mb-1">Sick Leaves (SL)</label>
                  <input
                    type="number"
                    className="w-full px-3 py-2 text-sm bg-white border border-slate-300 rounded-lg font-bold"
                    value={companySettings.annualSickLeave}
                    onChange={(e) => setCompanySettings({ ...companySettings, annualSickLeave: e.target.value })}
                  />
                  <span className="text-[11px] text-slate-400 mt-1 block">Certificate required for &gt;2 days</span>
                </div>

                <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
                  <label className="block text-xs font-bold text-slate-600 uppercase mb-1">Earned / Paid Leaves (PL)</label>
                  <input
                    type="number"
                    className="w-full px-3 py-2 text-sm bg-white border border-slate-300 rounded-lg font-bold"
                    value={companySettings.annualPaidLeave}
                    onChange={(e) => setCompanySettings({ ...companySettings, annualPaidLeave: e.target.value })}
                  />
                  <span className="text-[11px] text-slate-400 mt-1 block">Accumulated over tenure</span>
                </div>

                <div className="sm:col-span-3">
                  <label className="block text-xs font-bold text-slate-600 uppercase mb-1">
                    Plant & Office Weekly Off Schedule
                  </label>
                  <input
                    type="text"
                    className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-300 rounded-lg focus:bg-white"
                    value={companySettings.weeklyOff}
                    onChange={(e) => setCompanySettings({ ...companySettings, weeklyOff: e.target.value })}
                  />
                </div>
              </div>

              <div className="pt-3 flex justify-end">
                <button
                  type="button"
                  onClick={() => handleSaveCompanySettings("Leave Policies")}
                  className="inline-flex items-center gap-2 px-5 py-2.5 bg-amber-600 hover:bg-amber-700 text-white rounded-lg text-sm font-bold shadow-md transition cursor-pointer"
                >
                  <Save className="w-4 h-4" /> Save Leave Rules
                </button>
              </div>
            </div>
          )}

          {/* ============================================================== */}
          {/* TAB 7: AUDIT LOGS & STRICT RBAC (Admin & Super Admin)          */}
          {/* ============================================================== */}
          {(isAdmin || isSuperAdmin) && activeTab === "audit-policy" && (
            <div className="space-y-6">
              <div className="pb-4 border-b border-slate-100 flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-bold text-slate-900">Audit Log Retention & RBAC Enforcement</h2>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Maintain compliance logs for all administrative actions, permission overrides, and payroll runs.
                  </p>
                </div>
                <div className="p-2 bg-rose-50 border border-rose-200 rounded-lg">
                  <History className="w-6 h-6 text-rose-600" />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-600 uppercase mb-1">
                    Audit Log Retention Duration
                  </label>
                  <select
                    className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-300 rounded-lg focus:bg-white"
                    value={systemSecurity.auditRetentionDays}
                    onChange={(e) =>
                      setSystemSecurity({ ...systemSecurity, auditRetentionDays: e.target.value })
                    }
                  >
                    <option value="90">90 Days (Quarterly purge)</option>
                    <option value="180">180 Days (Half-yearly audit standard)</option>
                    <option value="365">365 Days (1 Calendar Year - Recommended)</option>
                    <option value="730">730 Days (2 Years Statutory Archive)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-600 uppercase mb-1">
                    RBAC Permission Enforcement Mode
                  </label>
                  <select
                    className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-300 rounded-lg focus:bg-white"
                    value={systemSecurity.rbacStrictEnforcement ? "strict" : "permissive"}
                    onChange={(e) =>
                      setSystemSecurity({
                        ...systemSecurity,
                        rbacStrictEnforcement: e.target.value === "strict",
                      })
                    }
                  >
                    <option value="strict">Strict (Immediate 403 Forbidden on unpermitted actions)</option>
                    <option value="permissive">Audited Permissive (Log warning but permit supervisor)</option>
                  </select>
                </div>

                <div className="sm:col-span-2 p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
                  <div className="text-sm font-bold text-slate-800 flex items-center gap-2">
                    <Database className="w-4 h-4 text-rose-600" /> Logged Administrative Events:
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-slate-600">
                    <div>• Role assignments & permission toggles</div>
                    <div>• Monthly payroll generation & adjustments</div>
                    <div>• Attendance manual regularizations</div>
                    <div>• Employee user additions and terminations</div>
                  </div>
                </div>
              </div>

              <div className="pt-3 flex justify-end">
                <button
                  type="button"
                  onClick={handleSaveSystemSecurity}
                  className="inline-flex items-center gap-2 px-5 py-2.5 bg-rose-600 hover:bg-rose-700 text-white rounded-lg text-sm font-bold shadow-md transition cursor-pointer"
                >
                  <Save className="w-4 h-4" /> Save Audit Policies
                </button>
              </div>
            </div>
          )}

          {/* ============================================================== */}
          {/* TAB 8: EMAIL & BROADCAST DISPATCH (Admin, HR, Super Admin)     */}
          {/* ============================================================== */}
          {(isHR || isAdmin || isSuperAdmin) && activeTab === "email-dispatch" && (
            <div className="space-y-6">
              <div className="pb-4 border-b border-slate-100 flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-bold text-slate-900">Email & Broadcast Automation</h2>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Control which automated notifications Lucent Polysystem dispatches to staff members.
                  </p>
                </div>
                <div className="p-2 bg-cyan-50 border border-cyan-200 rounded-lg">
                  <Mail className="w-6 h-6 text-cyan-600" />
                </div>
              </div>

              <div className="space-y-3.5">
                <div className="flex items-center justify-between p-4 rounded-xl bg-slate-50 border border-slate-200">
                  <div>
                    <div className="text-sm font-bold text-slate-800">Welcome Email & Password Setup Token</div>
                    <div className="text-xs text-slate-500 mt-0.5">
                      Automatically sends an email to new employees with a token to create their login password.
                    </div>
                  </div>
                  <input
                    type="checkbox"
                    checked={companySettings.sendWelcomeEmailOnAdd}
                    onChange={(e) =>
                      setCompanySettings({ ...companySettings, sendWelcomeEmailOnAdd: e.target.checked })
                    }
                    className="w-4 h-4 accent-cyan-600 rounded cursor-pointer"
                  />
                </div>

                <div className="flex items-center justify-between p-4 rounded-xl bg-slate-50 border border-slate-200">
                  <div>
                    <div className="text-sm font-bold text-slate-800">Monthly Salary Slip Auto-Dispatch</div>
                    <div className="text-xs text-slate-500 mt-0.5">
                      Sends structured email breakdown to employees when their salary record is processed.
                    </div>
                  </div>
                  <input
                    type="checkbox"
                    checked={companySettings.sendSalarySlipOnProcess}
                    onChange={(e) =>
                      setCompanySettings({ ...companySettings, sendSalarySlipOnProcess: e.target.checked })
                    }
                    className="w-4 h-4 accent-cyan-600 rounded cursor-pointer"
                  />
                </div>

                <div className="flex items-center justify-between p-4 rounded-xl bg-slate-50 border border-slate-200">
                  <div>
                    <div className="text-sm font-bold text-slate-800">
                      Company Circular & Holiday Announcement Broadcasts
                    </div>
                    <div className="text-xs text-slate-500 mt-0.5">
                      Notifies all registered staff members when HR publishes new circulars or emergency updates.
                    </div>
                  </div>
                  <input
                    type="checkbox"
                    checked={companySettings.sendAnnouncementBroadcast}
                    onChange={(e) =>
                      setCompanySettings({ ...companySettings, sendAnnouncementBroadcast: e.target.checked })
                    }
                    className="w-4 h-4 accent-cyan-600 rounded cursor-pointer"
                  />
                </div>
              </div>

              <div className="pt-3 flex justify-end">
                <button
                  type="button"
                  onClick={() => handleSaveCompanySettings("Email Automation Settings")}
                  className="inline-flex items-center gap-2 px-5 py-2.5 bg-cyan-600 hover:bg-cyan-700 text-white rounded-lg text-sm font-bold shadow-md transition cursor-pointer"
                >
                  <Save className="w-4 h-4" /> Save Email Preferences
                </button>
              </div>
            </div>
          )}

          {/* ============================================================== */}
          {/* TAB 9: DEPARTMENT SHIFTS & ROSTER (Manager & Super Admin)      */}
          {/* ============================================================== */}
          {(isManager || isSuperAdmin) && activeTab === "dept-shifts" && (
            <div className="space-y-6">
              <div className="pb-4 border-b border-slate-100 flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-bold text-slate-900">Department Shift & Roster Settings</h2>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Configure operational shift timings and roster reminders for your department.
                  </p>
                </div>
                <div className="p-2 bg-teal-50 border border-teal-200 rounded-lg">
                  <Clock className="w-6 h-6 text-teal-600" />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="sm:col-span-2">
                  <label className="block text-xs font-bold text-slate-600 uppercase mb-1">
                    Supervised Department Name
                  </label>
                  <input
                    type="text"
                    className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-300 rounded-lg focus:bg-white"
                    value={deptSettings.deptName}
                    onChange={(e) => setDeptSettings({ ...deptSettings, deptName: e.target.value })}
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-600 uppercase mb-1">
                    Department Shift Start
                  </label>
                  <input
                    type="time"
                    className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-300 rounded-lg focus:bg-white"
                    value={deptSettings.deptShiftStart}
                    onChange={(e) => setDeptSettings({ ...deptSettings, deptShiftStart: e.target.value })}
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-600 uppercase mb-1">Department Shift End</label>
                  <input
                    type="time"
                    className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-300 rounded-lg focus:bg-white"
                    value={deptSettings.deptShiftEnd}
                    onChange={(e) => setDeptSettings({ ...deptSettings, deptShiftEnd: e.target.value })}
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-xs font-bold text-slate-600 uppercase mb-1">
                    Morning Roster Briefing Time
                  </label>
                  <input
                    type="time"
                    className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-300 rounded-lg focus:bg-white"
                    value={deptSettings.dailyRosterReminderTime}
                    onChange={(e) => setDeptSettings({ ...deptSettings, dailyRosterReminderTime: e.target.value })}
                  />
                </div>
              </div>

              <div className="pt-3 flex justify-end">
                <button
                  type="button"
                  onClick={handleSaveDeptSettings}
                  className="inline-flex items-center gap-2 px-5 py-2.5 bg-teal-600 hover:bg-teal-700 text-white rounded-lg text-sm font-bold shadow-md transition cursor-pointer"
                >
                  <Save className="w-4 h-4" /> Save Department Rosters
                </button>
              </div>
            </div>
          )}

          {/* ============================================================== */}
          {/* TAB 10: DEPARTMENT APPROVALS (Manager & Super Admin)           */}
          {/* ============================================================== */}
          {(isManager || isSuperAdmin) && activeTab === "dept-approvals" && (
            <div className="space-y-6">
              <div className="pb-4 border-b border-slate-100 flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-bold text-slate-900">Leave Limits & Overtime Pre-Approvals</h2>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Prevent plant production shortages by establishing department concurrency thresholds.
                  </p>
                </div>
                <div className="p-2 bg-teal-50 border border-teal-200 rounded-lg">
                  <FileCheck className="w-6 h-6 text-teal-600" />
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-600 uppercase mb-1">
                    Maximum Concurrent Team Leaves Allowed
                  </label>
                  <input
                    type="number"
                    className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-300 rounded-lg focus:bg-white"
                    value={deptSettings.maxConcurrentLeaves}
                    onChange={(e) => setDeptSettings({ ...deptSettings, maxConcurrentLeaves: e.target.value })}
                  />
                  <span className="text-[11px] text-slate-400 mt-0.5 block">
                    Blocks overlapping leaves beyond this number on the same department line
                  </span>
                </div>

                <div className="flex items-center justify-between p-4 rounded-xl bg-slate-50 border border-slate-200">
                  <div>
                    <div className="text-sm font-bold text-slate-800">Mandatory Overtime Pre-Approval</div>
                    <div className="text-xs text-slate-500 mt-0.5">
                      Employees must submit an overtime pre-approval request before clocking extra hours.
                    </div>
                  </div>
                  <input
                    type="checkbox"
                    checked={deptSettings.overtimePreApprovalRequired}
                    onChange={(e) =>
                      setDeptSettings({ ...deptSettings, overtimePreApprovalRequired: e.target.checked })
                    }
                    className="w-4 h-4 accent-teal-600 rounded cursor-pointer"
                  />
                </div>

                <div className="flex items-center justify-between p-4 rounded-xl bg-slate-50 border border-slate-200">
                  <div>
                    <div className="text-sm font-bold text-slate-800">Allow Peer Shift Swapping</div>
                    <div className="text-xs text-slate-500 mt-0.5">
                      Permit department technicians to swap operational shifts with supervisor sign-off.
                    </div>
                  </div>
                  <input
                    type="checkbox"
                    checked={deptSettings.allowShiftSwapping}
                    onChange={(e) => setDeptSettings({ ...deptSettings, allowShiftSwapping: e.target.checked })}
                    className="w-4 h-4 accent-teal-600 rounded cursor-pointer"
                  />
                </div>
              </div>

              <div className="pt-3 flex justify-end">
                <button
                  type="button"
                  onClick={handleSaveDeptSettings}
                  className="inline-flex items-center gap-2 px-5 py-2.5 bg-teal-600 hover:bg-teal-700 text-white rounded-lg text-sm font-bold shadow-md transition cursor-pointer"
                >
                  <Save className="w-4 h-4" /> Save Approval Rules
                </button>
              </div>
            </div>
          )}

          {/* ============================================================== */}
          {/* TAB 11: TEAM LEADER ALERTS (Team Leader & Super Admin)         */}
          {/* ============================================================== */}
          {(isTeamLeader || isSuperAdmin) && activeTab === "team-alerts" && (
            <div className="space-y-6">
              <div className="pb-4 border-b border-slate-100 flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-bold text-slate-900">Team Attendance & Late Alerts</h2>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Configure real-time alerts for your shift crew arrivals and line absentees.
                  </p>
                </div>
                <div className="p-2 bg-purple-50 border border-purple-200 rounded-lg">
                  <AlertTriangle className="w-6 h-6 text-purple-600" />
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-600 uppercase mb-1">
                    Alert Leader if Team Member Late Beyond (Minutes)
                  </label>
                  <select
                    className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-300 rounded-lg focus:bg-white"
                    value={teamLeaderSettings.lateArrivalAlertMinutes}
                    onChange={(e) =>
                      setTeamLeaderSettings({
                        ...teamLeaderSettings,
                        lateArrivalAlertMinutes: e.target.value,
                      })
                    }
                  >
                    <option value="10">10 Minutes after shift start</option>
                    <option value="15">15 Minutes (Standard grace)</option>
                    <option value="30">30 Minutes (Critical tardiness)</option>
                  </select>
                </div>

                <div className="flex items-center justify-between p-4 rounded-xl bg-slate-50 border border-slate-200">
                  <div>
                    <div className="text-sm font-bold text-slate-800">Instant Push on Crew Clock-In</div>
                    <div className="text-xs text-slate-500 mt-0.5">
                      Receive an in-app notification each time an assigned crew member punches in at the gate.
                    </div>
                  </div>
                  <input
                    type="checkbox"
                    checked={teamLeaderSettings.notifyInstantOnClockIn}
                    onChange={(e) =>
                      setTeamLeaderSettings({
                        ...teamLeaderSettings,
                        notifyInstantOnClockIn: e.target.checked,
                      })
                    }
                    className="w-4 h-4 accent-purple-600 rounded cursor-pointer"
                  />
                </div>

                <div className="flex items-center justify-between p-4 rounded-xl bg-slate-50 border border-slate-200">
                  <div>
                    <div className="text-sm font-bold text-slate-800">Daily Attendance Summary Email</div>
                    <div className="text-xs text-slate-500 mt-0.5">
                      Receive a daily 10:00 AM summary of present, late, and absent team members.
                    </div>
                  </div>
                  <input
                    type="checkbox"
                    checked={teamLeaderSettings.dailyAttendanceSummaryEmail}
                    onChange={(e) =>
                      setTeamLeaderSettings({
                        ...teamLeaderSettings,
                        dailyAttendanceSummaryEmail: e.target.checked,
                      })
                    }
                    className="w-4 h-4 accent-purple-600 rounded cursor-pointer"
                  />
                </div>
              </div>

              <div className="pt-3 flex justify-end">
                <button
                  type="button"
                  onClick={handleSaveTeamLeaderSettings}
                  className="inline-flex items-center gap-2 px-5 py-2.5 bg-purple-600 hover:bg-purple-700 text-white rounded-lg text-sm font-bold shadow-md transition cursor-pointer"
                >
                  <Save className="w-4 h-4" /> Save Team Leader Alerts
                </button>
              </div>
            </div>
          )}

          {/* ============================================================== */}
          {/* TAB 12: SHIFT HANDOVER LOGS (Team Leader & Super Admin)       */}
          {/* ============================================================== */}
          {(isTeamLeader || isSuperAdmin) && activeTab === "team-roster" && (
            <div className="space-y-6">
              <div className="pb-4 border-b border-slate-100 flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-bold text-slate-900">Shift Handover & Operations Log</h2>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Standardize production shift handovers and critical incident notes between shift leads.
                  </p>
                </div>
                <div className="p-2 bg-purple-50 border border-purple-200 rounded-lg">
                  <History className="w-6 h-6 text-purple-600" />
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-600 uppercase mb-1">
                    Designated Shift In-charge / Plant Escalation Contact
                  </label>
                  <input
                    type="text"
                    className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-300 rounded-lg focus:bg-white"
                    value={teamLeaderSettings.leadEscalationContact}
                    onChange={(e) =>
                      setTeamLeaderSettings({
                        ...teamLeaderSettings,
                        leadEscalationContact: e.target.value,
                      })
                    }
                  />
                </div>

                <div className="flex items-center justify-between p-4 rounded-xl bg-slate-50 border border-slate-200">
                  <div>
                    <div className="text-sm font-bold text-slate-800">Mandatory Shift Handover Note Submission</div>
                    <div className="text-xs text-slate-500 mt-0.5">
                      Prompts team leaders to submit an operational summary before marking out.
                    </div>
                  </div>
                  <input
                    type="checkbox"
                    checked={teamLeaderSettings.shiftHandoverReportEnabled}
                    onChange={(e) =>
                      setTeamLeaderSettings({
                        ...teamLeaderSettings,
                        shiftHandoverReportEnabled: e.target.checked,
                      })
                    }
                    className="w-4 h-4 accent-purple-600 rounded cursor-pointer"
                  />
                </div>
              </div>

              <div className="pt-3 flex justify-end">
                <button
                  type="button"
                  onClick={handleSaveTeamLeaderSettings}
                  className="inline-flex items-center gap-2 px-5 py-2.5 bg-purple-600 hover:bg-purple-700 text-white rounded-lg text-sm font-bold shadow-md transition cursor-pointer"
                >
                  <Save className="w-4 h-4" /> Save Handover Protocols
                </button>
              </div>
            </div>
          )}

          {/* ============================================================== */}
          {/* TAB 13: PERSONAL PROFILE (ALL ROLES)                           */}
          {/* ============================================================== */}
          {activeTab === "profile" && (
            <div>
              <div className="mb-6 pb-4 border-b border-slate-100 flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-bold text-slate-900">Personal Profile & Contact</h2>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Update your official contact phone, home address, and emergency reach information.
                  </p>
                </div>
                <span className="text-xs px-2.5 py-1 bg-sky-50 text-sky-700 border border-sky-200 rounded-md font-semibold font-mono">
                  User ID: {currentUser?.id || "N/A"}
                </span>
              </div>

              {profileLoading ? (
                <div className="py-12 text-center text-slate-400 text-sm">Loading details...</div>
              ) : (
                <form onSubmit={handleProfileSubmit} className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-slate-600 uppercase mb-1">Full Name</label>
                      <div className="relative">
                        <User className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
                        <input
                          type="text"
                          required
                          className="w-full pl-9 pr-3 py-2 text-sm bg-slate-50 border border-slate-300 rounded-lg focus:bg-white focus:ring-2 focus:ring-sky-500"
                          value={profileData.username}
                          onChange={(e) => setProfileData({ ...profileData, username: e.target.value })}
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-600 uppercase mb-1">Email Address</label>
                      <div className="relative">
                        <Mail className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
                        <input
                          type="email"
                          required
                          className="w-full pl-9 pr-3 py-2 text-sm bg-slate-50 border border-slate-300 rounded-lg focus:bg-white focus:ring-2 focus:ring-sky-500"
                          value={profileData.email}
                          onChange={(e) => setProfileData({ ...profileData, email: e.target.value })}
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-600 uppercase mb-1">Mobile Contact</label>
                      <div className="relative">
                        <Phone className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
                        <input
                          type="tel"
                          placeholder="e.g. 9876543210"
                          className="w-full pl-9 pr-3 py-2 text-sm bg-slate-50 border border-slate-300 rounded-lg focus:bg-white"
                          value={profileData.mobile}
                          onChange={(e) => setProfileData({ ...profileData, mobile: e.target.value })}
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-600 uppercase mb-1">Gender</label>
                      <select
                        className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-300 rounded-lg focus:bg-white"
                        value={profileData.gender}
                        onChange={(e) => setProfileData({ ...profileData, gender: e.target.value })}
                      >
                        <option value="Male">Male</option>
                        <option value="Female">Female</option>
                        <option value="Other">Other</option>
                      </select>
                    </div>

                    <div className="sm:col-span-2">
                      <label className="block text-xs font-bold text-slate-600 uppercase mb-1">Residential Address</label>
                      <div className="relative">
                        <MapPin className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
                        <input
                          type="text"
                          className="w-full pl-9 pr-3 py-2 text-sm bg-slate-50 border border-slate-300 rounded-lg focus:bg-white"
                          value={profileData.address}
                          onChange={(e) => setProfileData({ ...profileData, address: e.target.value })}
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-600 uppercase mb-1">
                        Emergency Contact Person
                      </label>
                      <input
                        type="text"
                        placeholder="Relative / Guardian Name"
                        className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-300 rounded-lg focus:bg-white"
                        value={profileData.emergencyContactname}
                        onChange={(e) => setProfileData({ ...profileData, emergencyContactname: e.target.value })}
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-600 uppercase mb-1">
                        Emergency Contact Phone
                      </label>
                      <input
                        type="tel"
                        placeholder="Emergency Mobile"
                        className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-300 rounded-lg focus:bg-white"
                        value={profileData.emergencyContact}
                        onChange={(e) => setProfileData({ ...profileData, emergencyContact: e.target.value })}
                      />
                    </div>
                  </div>

                  <div className="pt-3 flex justify-end">
                    <button
                      type="submit"
                      disabled={loading}
                      className="inline-flex items-center gap-2 px-6 py-2.5 bg-sky-600 hover:bg-sky-700 text-white rounded-lg text-sm font-bold shadow-md transition disabled:bg-sky-400 cursor-pointer"
                    >
                      <Save className="w-4 h-4" />
                      {loading ? "Saving..." : "Save Profile Details"}
                    </button>
                  </div>
                </form>
              )}
            </div>
          )}

          {/* ============================================================== */}
          {/* TAB 14: WORKPLACE RECORD (Employees, Leaders, Managers)       */}
          {/* ============================================================== */}
          {!isAdmin && !isSuperAdmin && activeTab === "employment" && (
            <div className="space-y-6">
              <div className="pb-4 border-b border-slate-100 flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-bold text-slate-900">My Employment Record</h2>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Official workplace parameters verified by Lucent Polysystem HR administration.
                  </p>
                </div>
                <img src="/logo.jpg" alt="Lucent Logo" className="h-8 w-auto object-contain rounded" />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
                  <div className="text-xs font-bold uppercase text-slate-400 mb-1">Company / Employer</div>
                  <div className="text-base font-extrabold text-slate-900">Lucent Polysystem Pvt. Ltd.</div>
                  <div className="text-xs text-slate-500 mt-0.5">Sanand Plant & Industrial Facility</div>
                </div>

                <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
                  <div className="text-xs font-bold uppercase text-slate-400 mb-1">Designation & Role</div>
                  <div className="text-base font-bold text-slate-900">
                    {profileData.designation || "Staff Member"}
                  </div>
                  <div className="text-xs text-emerald-600 font-semibold mt-0.5 uppercase">
                    Status: Active Employee
                  </div>
                </div>

                <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
                  <div className="text-xs font-bold uppercase text-slate-400 mb-1">Employment Type</div>
                  <div className="text-sm font-bold text-slate-800">
                    {profileData.employmentType || "Full-time Permanent"}
                  </div>
                  <div className="text-xs text-slate-500 mt-0.5">Mode: {profileData.attendanceType || "Office / Plant"}</div>
                </div>

                <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
                  <div className="text-xs font-bold uppercase text-slate-400 mb-1">Official Joining Date</div>
                  <div className="text-sm font-bold text-slate-800 flex items-center gap-1.5">
                    <Calendar className="w-4 h-4 text-slate-400" />
                    {profileData.joigningDate || "Registered Staff"}
                  </div>
                </div>

                <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
                  <div className="text-xs font-bold uppercase text-slate-400 mb-1">Salary Bank Account</div>
                  <div className="text-sm font-mono font-bold text-slate-800 flex items-center gap-1.5">
                    <CreditCard className="w-4 h-4 text-slate-400" />
                    {profileData.bankAccount ? `•••• •••• ${profileData.bankAccount.slice(-4)}` : "Verified On File"}
                  </div>
                  <div className="text-xs text-slate-500 mt-0.5">IFSC: {profileData.IFSC || "Corporate Branch"}</div>
                </div>

                <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
                  <div className="text-xs font-bold uppercase text-slate-400 mb-1">Monthly Compensation Tier</div>
                  <div className="text-sm font-bold text-slate-800">
                    {profileData.salary
                      ? `₹ ${Number(profileData.salary).toLocaleString("en-IN")} / month`
                      : "Confidential HR Tier"}
                  </div>
                  <div className="text-xs text-slate-500 mt-0.5">Processed monthly via Payroll portal</div>
                </div>
              </div>

              <div className="p-3.5 rounded-xl bg-sky-50 border border-sky-200 text-xs text-sky-800 flex items-start gap-2.5">
                <CheckCircle2 className="w-4 h-4 text-sky-600 shrink-0 mt-0.5" />
                <div>
                  To request modifications to designations, salary, or banking credentials, please submit a request via{" "}
                  <strong>Contact With HR</strong> or email <strong>hr@lucentpolysystem.com</strong>.
                </div>
              </div>
            </div>
          )}

          {/* ============================================================== */}
          {/* TAB 15: SECURITY & PASSWORD CHANGE (ALL ROLES)                 */}
          {/* ============================================================== */}
          {activeTab === "security" && (
            <div>
              <div className="mb-6 pb-4 border-b border-slate-100">
                <h2 className="text-xl font-bold text-slate-900">Security & Password</h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Update your credentials to maintain strict system and data security.
                </p>
              </div>

              <form onSubmit={handlePasswordSubmit} className="space-y-4 max-w-lg">
                <div>
                  <label className="block text-xs font-bold text-slate-600 uppercase mb-1">
                    Current Password <span className="text-rose-500">*</span>
                  </label>
                  <div className="relative">
                    <KeyRound className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
                    <input
                      type={showCurrentPassword ? "text" : "password"}
                      required
                      placeholder="Enter existing password"
                      className="w-full pl-9 pr-10 py-2.5 text-sm bg-slate-50 border border-slate-300 rounded-lg focus:bg-white focus:ring-2 focus:ring-sky-500"
                      value={passwordData.currentPassword}
                      onChange={(e) => setPasswordData({ ...passwordData, currentPassword: e.target.value })}
                    />
                    <button
                      type="button"
                      onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                      className="absolute right-3 top-3 text-slate-400 hover:text-slate-600"
                    >
                      {showCurrentPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-600 uppercase mb-1">
                    New Password <span className="text-rose-500">*</span>
                  </label>
                  <div className="relative">
                    <Lock className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
                    <input
                      type={showNewPassword ? "text" : "password"}
                      required
                      placeholder="At least 6 characters"
                      className="w-full pl-9 pr-10 py-2.5 text-sm bg-slate-50 border border-slate-300 rounded-lg focus:bg-white focus:ring-2 focus:ring-sky-500"
                      value={passwordData.newPassword}
                      onChange={(e) => setPasswordData({ ...passwordData, newPassword: e.target.value })}
                    />
                    <button
                      type="button"
                      onClick={() => setShowNewPassword(!showNewPassword)}
                      className="absolute right-3 top-3 text-slate-400 hover:text-slate-600"
                    >
                      {showNewPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-600 uppercase mb-1">
                    Confirm New Password <span className="text-rose-500">*</span>
                  </label>
                  <div className="relative">
                    <Lock className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
                    <input
                      type="password"
                      required
                      placeholder="Re-enter new password"
                      className="w-full pl-9 pr-3 py-2.5 text-sm bg-slate-50 border border-slate-300 rounded-lg focus:bg-white focus:ring-2 focus:ring-sky-500"
                      value={passwordData.confirmPassword}
                      onChange={(e) => setPasswordData({ ...passwordData, confirmPassword: e.target.value })}
                    />
                  </div>
                </div>

                <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-600 space-y-1">
                  <div className="font-bold text-slate-800 flex items-center gap-1.5">
                    <ShieldCheck className="w-4 h-4 text-emerald-600" /> Password Security:
                  </div>
                  <div>• Password must be at least 6 characters.</div>
                  <div>• Passwords are encrypted using bcrypt salted hashing.</div>
                </div>

                <div className="pt-2">
                  <button
                    type="submit"
                    disabled={loading}
                    className="inline-flex items-center gap-2 px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-sm font-bold shadow-md transition disabled:bg-indigo-400 cursor-pointer"
                  >
                    <KeyRound className="w-4 h-4" />
                    {loading ? "Updating..." : "Update Password"}
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* ============================================================== */}
          {/* TAB 16: PERSONAL ALERTS & PREFERENCES                          */}
          {/* ============================================================== */}
          {!isAdmin && !isSuperAdmin && activeTab === "notifications" && (
            <div className="space-y-6">
              <div className="pb-4 border-b border-slate-100">
                <h2 className="text-xl font-bold text-slate-900">Personal Alerts & Preferences</h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Configure which notifications and alerts you receive from the portal.
                </p>
              </div>

              <div className="space-y-3.5">
                <div className="flex items-center justify-between p-4 rounded-xl bg-slate-50 border border-slate-200">
                  <div>
                    <div className="text-sm font-bold text-slate-800">Monthly Salary Slips via Email</div>
                    <div className="text-xs text-slate-500 mt-0.5">
                      Receive an itemized email breakdown when your salary is processed.
                    </div>
                  </div>
                  <input
                    type="checkbox"
                    checked={employeeNotifications.payrollUpdates}
                    onChange={(e) =>
                      setEmployeeNotifications({ ...employeeNotifications, payrollUpdates: e.target.checked })
                    }
                    className="w-4 h-4 accent-emerald-600 rounded cursor-pointer"
                  />
                </div>

                <div className="flex items-center justify-between p-4 rounded-xl bg-slate-50 border border-slate-200">
                  <div>
                    <div className="text-sm font-bold text-slate-800">Morning Punch-In Reminders</div>
                    <div className="text-xs text-slate-500 mt-0.5">
                      Receive a prompt on work days before 09:00 AM to mark your attendance.
                    </div>
                  </div>
                  <input
                    type="checkbox"
                    checked={employeeNotifications.attendanceReminders}
                    onChange={(e) =>
                      setEmployeeNotifications({ ...employeeNotifications, attendanceReminders: e.target.checked })
                    }
                    className="w-4 h-4 accent-emerald-600 rounded cursor-pointer"
                  />
                </div>

                <div className="flex items-center justify-between p-4 rounded-xl bg-slate-50 border border-slate-200">
                  <div>
                    <div className="text-sm font-bold text-slate-800">Leave Approval Status Updates</div>
                    <div className="text-xs text-slate-500 mt-0.5">
                      Instant notification when manager or HR approves/rejects your leave application.
                    </div>
                  </div>
                  <input
                    type="checkbox"
                    checked={employeeNotifications.leaveStatusAlerts}
                    onChange={(e) =>
                      setEmployeeNotifications({ ...employeeNotifications, leaveStatusAlerts: e.target.checked })
                    }
                    className="w-4 h-4 accent-emerald-600 rounded cursor-pointer"
                  />
                </div>

                <div className="flex items-center justify-between p-4 rounded-xl bg-slate-50 border border-slate-200">
                  <div>
                    <div className="text-sm font-bold text-slate-800">Company Announcements & Circulars</div>
                    <div className="text-xs text-slate-500 mt-0.5">
                      Receive updates on holiday calendars and management circulars.
                    </div>
                  </div>
                  <input
                    type="checkbox"
                    checked={employeeNotifications.announcements}
                    onChange={(e) =>
                      setEmployeeNotifications({ ...employeeNotifications, announcements: e.target.checked })
                    }
                    className="w-4 h-4 accent-emerald-600 rounded cursor-pointer"
                  />
                </div>
              </div>

              <div className="pt-3 flex justify-end">
                <button
                  type="button"
                  onClick={handleSaveEmployeeNotifications}
                  className="inline-flex items-center gap-2 px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-sm font-bold shadow-md transition cursor-pointer"
                >
                  <Save className="w-4 h-4" /> Save Preferences
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      <ToastContainer />
    </div>
  );
};

export default SettingsPage;
