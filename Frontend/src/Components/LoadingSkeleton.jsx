import React from "react";

const LoadingSkeleton = ({ label = "Loading DutyLedger..." }) => {
  return (
    <div className="min-h-screen bg-slate-900 flex flex-col items-center justify-center p-6 text-white">
      <div className="relative flex items-center justify-center mb-6">
        {/* Outer glowing pulsing ring */}
        <div className="w-16 h-16 rounded-full border-4 border-indigo-500/20 border-t-indigo-500 animate-spin" />
        {/* Inner pulsing badge */}
        <div className="absolute w-8 h-8 rounded-full bg-indigo-600/30 animate-pulse flex items-center justify-center">
          <div className="w-3 h-3 rounded-full bg-indigo-400" />
        </div>
      </div>

      <p className="text-sm font-medium text-slate-300 tracking-wide animate-pulse">
        {label}
      </p>
      <span className="text-xs text-slate-500 mt-1">Lucent PolySystems Pvt. Ltd.</span>
    </div>
  );
};

export default LoadingSkeleton;
