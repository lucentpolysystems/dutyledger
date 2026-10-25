import React from 'react';
import { Bell, Search } from 'lucide-react';

const Header = () => {
  return (
    <header className="w-full bg-white shadow-sm px-4 sm:px-6 py-2.5 flex items-center justify-between border-b border-gray-100">
      {/* Branding */}
      <div className="flex items-center space-x-3">
        <img
          src="/logo.jpg"
          alt="Lucent PolySystems Pvt. Ltd."
          className="h-10 w-auto object-contain rounded"
        />
        <div className="flex flex-col">
          <span className="text-sm sm:text-base font-bold text-gray-900 leading-tight">
            Lucent PolySystems <span className="text-sky-600 text-xs font-semibold">Pvt. Ltd.</span>
          </span>
          <span className="text-[10px] sm:text-[11px] text-gray-500 font-medium">Attendance & Payroll System</span>
        </div>
      </div>

      {/* Search Bar - hidden on small screens */}
      <div className="hidden sm:flex w-full sm:w-1/2 md:w-1/3 items-center bg-gray-100 rounded-lg px-3 py-1.5">
        <Search className="w-4 h-4 text-gray-500 mr-2" />
        <input
          type="text"
          placeholder="Search records, employees..."
          className="bg-transparent w-full focus:outline-none text-sm"
        />
      </div>

      {/* Notification Bell */}
      <div className="flex items-center space-x-2">
        <div className="relative p-2 rounded-full hover:bg-gray-100 cursor-pointer transition-colors">
          <Bell className="w-5 h-5 text-gray-600" />
          <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full" />
        </div>
      </div>
    </header>
  );
};

export default Header;
