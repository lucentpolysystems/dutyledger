import React, { useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { logoutUser } from '../Redux/Slice';
import {
  Users,
  DollarSign,
  Calendar,
  Settings,
  User,
  Menu,
  X,
  LayoutDashboard,
  NotepadText,
  Phone,
} from "lucide-react";
import { useNavigate, useLocation } from 'react-router-dom';


const Sidebar = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const dispatch = useDispatch();
  const [isOpen, setIsOpen] = useState(false);
  const user = useSelector((state) => state.auth.user);


  const isActive = (path) => {
    if (path === '/dashboard') {
      return location.pathname === '/dashboard' || location.pathname === '/emhome';
    }
    return location.pathname === path || (path !== '/' && location.pathname.startsWith(path + '/'));
  };

  const handleLogout = () => {
   dispatch(logoutUser());
    navigate("/");
  };

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
              <h2 className="text-sm font-bold text-slate-800 truncate">{user?.username || "Employee"}</h2>
              <span className="inline-block text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 mt-0.5">
                {user?.role || "Employee"}
              </span>
            </div>
          </div>

          {/* Navigation Menu */}
          <nav className="space-y-3">
            {[
              { label: 'Dashboard', icon: <LayoutDashboard size={18} />, path: '/dashboard' },
              { label: 'Attendance', icon: <Users size={18} />, path: '/attendance' },
              { label: 'Salary', icon: <DollarSign size={18} />, path: '/salary' },
              { label: 'Calendar', icon: <Calendar size={18} />, path: '/calendar' },
              { label: 'Profile', icon: <User size={18} />, path: `/profile/${user?.id}` },
              { label: 'Settings', icon: <Settings size={18} />, path: '/settings' },
              { label: 'Contact With HR', icon: <Phone size={18} />, path: '/contact-hr' },
            ].map(({ label, icon, path }) => (
              <button
                key={path}
                onClick={() => {
                  navigate(path);
                  setIsOpen(false); // Close sidebar on mobile after click
                }}
                className={`flex items-center gap-3 p-2 rounded-lg w-full text-left transition ${
                  isActive(path)
                    ? 'bg-indigo-100 text-indigo-600 font-semibold'
                    : 'hover:bg-gray-100'
                }`}
              >
                {icon} <span>{label}</span>
              </button>
            ))}
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

      {/* Dummy content space to push real content to the right on desktop */}
      {/* <div className="hidden md:block w-64"></div> */}
    </div>
  );
};

export default Sidebar;
