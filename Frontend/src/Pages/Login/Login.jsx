import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDispatch } from "react-redux";
import { loginUser } from "../../Redux/Slice";
import { toast, ToastContainer } from "react-toastify";
import { apiUrl } from "../../utils/api";
import { Lock, User, KeyRound, Clock, ShieldCheck, FileSpreadsheet, CheckCircle2 } from "lucide-react";
import "react-toastify/dist/ReactToastify.css";

const Login = () => {
  const [id, setId] = useState('');
  const [loading, setLoading] = useState(false);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const dispatch = useDispatch();
  const navigate = useNavigate();

  // Clear old token on page load
  useEffect(() => {
    localStorage.removeItem("token");
    localStorage.removeItem("role");
  }, []);


  const handelLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    const userData = { username, password, id };

    try {
      const response = await fetch(apiUrl("/api/login"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(userData),
      });

      const data = await response.json();

      if (!response.ok) {
        toast.error(data.message || "Invalid credentials", {
          position: "bottom-right",
        });
        return;
      }

      const role = (data?.user?.role || "").toLowerCase();

      // Update Redux
      dispatch(loginUser({ user: data.user, token: data.token }));

      // Save token to localStorage
      localStorage.setItem("token", data.token);
      localStorage.setItem("role", role);

      toast.success(`Welcome ${data?.user?.username || 'back'}!`, {
        position: "bottom-right",
      });

      // Navigate after login to clean, modern routes
      setTimeout(() => {
        if (role === "admin" || role === "super_admin" || role === "hr" || role === "manager" || role === "team_leader") {
          navigate("/admin/dashboard");
        } else {
          navigate("/dashboard");
        }
      }, 1200);

    } catch (error) {
      console.error("Error during login:", error);
      toast.error("An error occurred while logging in. Please check your connection.", {
        position: "bottom-right",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col md:flex-row bg-slate-50 text-slate-800">

      {/* Left Column (Brand + Form) */}
      <div className="flex flex-col justify-between w-full md:w-1/2 lg:w-5/12 p-6 sm:p-10 lg:p-12 bg-white shadow-xl z-10">

        {/* Top Company Brand Bar */}
        <div className="flex items-center gap-3.5">
          <img
            src="/logo.jpg"
            alt="Lucent PolySystems Pvt. Ltd."
            className="h-12 w-auto object-contain rounded-lg shadow-sm"
          />
          <div className="flex flex-col">
            <span className="font-extrabold text-lg text-slate-900 leading-tight">
              Lucent PolySystems
            </span>
            <span className="text-xs font-semibold text-sky-600 uppercase tracking-wider">
              Pvt. Ltd.
            </span>
          </div>
        </div>

        {/* Center: Sign-In Form */}
        <div className="my-8 max-w-md w-full mx-auto">
          <div className="mb-6">

            <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">
              Sign In
            </h1>
            <p className="text-sm text-slate-500 mt-1">
              Enter your employee ID and credentials to access your dashboard.
            </p>
          </div>

          <form className="space-y-4" onSubmit={handelLogin}>

            {/* User ID Field */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5">
                Employee / User ID <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                  <KeyRound className="w-4 h-4" />
                </div>
                <input
                  type="text"
                  placeholder="e.g. ADMIN001 or EMP001"
                  required
                  className="w-full pl-9 pr-3 py-2.5 bg-slate-50 border border-slate-300 rounded-lg text-sm text-slate-800 placeholder-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-transparent transition"
                  value={id}
                  onChange={(e) => setId(e.target.value)}
                />
              </div>
            </div>

            {/* Username Field */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5">
                Username <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                  <User className="w-4 h-4" />
                </div>
                <input
                  type="text"
                  placeholder="e.g. Admin User or John Doe"
                  required
                  className="w-full pl-9 pr-3 py-2.5 bg-slate-50 border border-slate-300 rounded-lg text-sm text-slate-800 placeholder-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-transparent transition"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                />
              </div>
            </div>

            {/* Password Field */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5">
                Password <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                  <Lock className="w-4 h-4" />
                </div>
                <input
                  type="password"
                  placeholder="••••••••"
                  required
                  className="w-full pl-9 pr-3 py-2.5 bg-slate-50 border border-slate-300 rounded-lg text-sm text-slate-800 placeholder-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-transparent transition"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className={`w-full py-3 px-4 rounded-lg font-bold text-white text-sm shadow-md transition-all flex items-center justify-center gap-2 ${loading
                ? "bg-sky-400 cursor-not-allowed"
                : "bg-sky-600 hover:bg-sky-700 active:scale-[0.99]"
                }`}
            >
              {loading && (
                <svg
                  className="animate-spin h-4 w-4 text-white"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  />
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"
                  />
                </svg>
              )}
              {loading ? "Authenticating..." : "Sign In to Portal"}
            </button>
          </form>

        </div>

        {/* Footer */}
        <div className="text-center text-xs text-slate-400 pt-4 border-t border-slate-100">
          © {new Date().getFullYear()} Lucent PolySystems Pvt. Ltd. • All Rights Reserved
        </div>
      </div>

      {/* Right Column: Branded Corporate Presentation (Desktop) */}
      <div className="hidden md:flex flex-1 flex-col justify-between p-12 lg:p-16 bg-gradient-to-br from-slate-900 via-sky-950 to-slate-900 text-white relative overflow-hidden">

        {/* Ambient Gradient Glows */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-sky-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-80 h-80 bg-orange-500/10 rounded-full blur-3xl pointer-events-none" />

        {/* Top Tag */}
        <div className="flex items-center justify-between">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 backdrop-blur-md border border-white/15 text-xs font-semibold text-sky-200">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            Lucent Enterprise Cloud
          </div>
          <span className="text-xs text-slate-400 font-mono">v2.4.0</span>
        </div>

        {/* Center Presentation Card */}
        <div className="my-auto max-w-lg space-y-6">
          <div className="inline-block p-4 rounded-2xl bg-white shadow-xl border border-white/20">
            <img
              src="/logo.jpg"
              alt="Lucent PolySystems Pvt. Ltd."
              className="h-16 w-auto object-contain"
            />
          </div>

          <h2 className="text-3xl lg:text-4xl font-extrabold tracking-tight text-white leading-tight">
            Lucent PolySystems <br />
            <span className="text-sky-400">Pvt. Ltd.</span>
          </h2>

          <p className="text-slate-300 text-sm leading-relaxed">
            Welcome to the centralized internal portal for Lucent PolySystems Pvt. Ltd.
          </p>


        </div>

      </div>

      {/* Toast Notifications */}
      <ToastContainer />
    </div>
  );
};

export default Login;
