import React, { useState } from 'react';
import {
  Users,
  LayoutDashboard,
  UserPlus,
  Wallet,
  Calendar,
  Settings,
  User,
  Menu,
  X,
  UserRoundPen,
  Megaphone,
  ShieldCheck,
} from "lucide-react";
import { useNavigate, useLocation } from 'react-router-dom';
import { useSelector } from 'react-redux';
const Sidebar = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [isOpen, setIsOpen] = useState(false);

  const isActive = (path) => {
    if (path === '/admin/dashboard') {
      return location.pathname === '/admin/dashboard' || location.pathname === '/dashboard' || location.pathname === '/hrhome';
    }
    return location.pathname === path || (path !== '/' && location.pathname.startsWith(path + '/'));
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("role");
    navigate("/");
  };
  const user = useSelector((state) => state.auth.user);
  return (
    <div className="flex">
      {/* Toggle button for mobile */}
      <button
        className="md:hidden fixed top-4 left-4 z-50 bg-white p-2 rounded-full shadow"
        onClick={() => setIsOpen(!isOpen)}
      >
        {isOpen ? <X size={20} /> : <Menu size={20} />}
      </button>

      {/* Sidebar */}
      <div
        className={`fixed top-0 left-0 h-full bg-white w-64 text-gray-800 shadow-sm z-40 transform transition-transform duration-300 ease-in-out
        ${isOpen ? "translate-x-0" : "-translate-x-full"} md:translate-x-0 md:static md:block`}
      >
        {/* Profile Section */}
        <div className="p-6">
          <div className="flex items-center gap-3 mb-6 pb-4 border-b border-gray-100">
            <div className="w-12 h-12 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-700 font-bold text-base shadow-inner shrink-0 select-none">
              {user?.username ? user.username.charAt(0).toUpperCase() : (
                <User size={22} className="text-slate-500" />
              )}
            </div>
            <div className="min-w-0 flex-1">
              <h2 className="text-sm font-bold text-slate-800 truncate">{user?.username || "Admin User"}</h2>
              <span className="inline-block text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-sky-100 text-sky-800 mt-0.5">
                {user?.role || "HR"}
              </span>
            </div>
          </div>

          {/* Navigation Menu */}
          <nav className="space-y-1.5">
            {(() => {
              const userRoles = user?.roles || [];
              const perms = new Set(user?.permissions || []);
              const isSuper = userRoles.includes("ROLE_SUPER_ADMIN");

              const menuItems = [
                {
                  label: 'Dashboard',
                  icon: <LayoutDashboard size={18} />,
                  path: '/admin/dashboard',
                  visible: true,
                },
                {
                  label: 'Access Control (RBAC)',
                  icon: <ShieldCheck size={18} className="text-indigo-600" />,
                  path: '/admin/rbac',
                  visible: isSuper || perms.has('rbac:roles:manage'),
                  badge: 'Admin Only',
                },
                {
                  label: 'Employees Directory',
                  icon: <Users size={18} />,
                  path: '/admin/employees',
                  visible: isSuper || perms.has('employees:read:all') || perms.has('employees:read:dept') || perms.has('employees:read:team'),
                },
                {
                  label: 'Add Employee',
                  icon: <UserPlus size={18} />,
                  path: '/admin/employees/add',
                  visible: isSuper || perms.has('employees:create'),
                  badge: 'HR',
                },
                {
                  label: 'Payroll System',
                  icon: <Wallet size={18} />,
                  path: '/admin/payroll',
                  visible: isSuper || perms.has('payroll:read:all') || perms.has('payroll:structure:manage'),
                  badge: 'HR',
                },
                {
                  label: 'Company Calendar',
                  icon: <Calendar size={18} />,
                  path: '/admin/calendar',
                  visible: isSuper || perms.has('attendance:read:all') || perms.has('attendance:read:dept'),
                },
                {
                  label: 'Employee Queries',
                  icon: <UserRoundPen size={18} />,
                  path: '/admin/queries',
                  visible: isSuper || perms.has('queries:resolve') || perms.has('queries:read:team'),
                },
                {
                  label: 'Announcements',
                  icon: <Megaphone size={18} />,
                  path: '/admin/announcements',
                  visible: isSuper || perms.has('announcements:publish') || perms.has('announcements:read'),
                },
                {
                  label: 'System Settings',
                  icon: <Settings size={18} />,
                  path: '/settings',
                  visible: true,
                },
              ];

              return menuItems
                .filter((item) => item.visible)
                .map(({ label, icon, path, badge }) => (
                  <button
                    key={path}
                    onClick={() => {
                      navigate(path);
                      setIsOpen(false);
                    }}
                    className={`flex items-center justify-between p-2.5 rounded-xl w-full text-left transition ${
                      isActive(path)
                        ? 'bg-indigo-50 text-indigo-700 font-bold border border-indigo-200/60 shadow-sm'
                        : 'text-slate-600 hover:bg-slate-100 font-medium'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      {icon}
                      <span className="text-xs">{label}</span>
                    </div>
                    {badge && (
                      <span className="text-[9px] font-extrabold uppercase px-1.5 py-0.5 rounded bg-slate-100 text-slate-500">
                        {badge}
                      </span>
                    )}
                  </button>
                ));
            })()}
          </nav>
        </div>

        {/* Logout Button */}
        <div className="p-6">
          <button
            onClick={handleLogout}
            className="w-full bg-red-500 hover:bg-red-600 text-white font-medium py-2 rounded-lg"
          >
            Log out
          </button>
        </div>
      </div>
    </div>
  );
};

export default Sidebar;
