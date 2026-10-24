import React, { useState,useEffect } from "react";
import { FaDownload, FaEnvelope, FaPhone, FaGlobe, FaCalendarAlt,FaRupeeSign,FaRegClock } from "react-icons/fa";
import "chart.js/auto";
import { useParams } from "react-router-dom";
import { useSelector, useDispatch } from "react-redux";
import { cacheUser } from "../../Redux/Slice";
import { apiUrl, authHeaders } from "../../utils/api";


const PayrollPage = () => {
  const [tab, setTab] = useState("usersalaryinfo");

  return (
    <div className="min-h-screen flex flex-col bg-gray-100">
        <div className="flex-1 p-4 overflow-y-auto bg-gray-50">
          <div className="flex flex-col lg:flex-row gap-6 h-[calc(100vh-64px)]">
            <Profile />
            <div className="flex-1 bg-white p-6 rounded-2xl shadow-md flex flex-col">
              <nav className="flex gap-4 border-b pb-3 mb-4 text-sm font-medium">
                {["usersalaryinfo"].map((t) => (
                  <button
                    key={t}
                    className={`capitalize px-4 py-2 rounded-lg transition ${
                      tab === t ? "bg-indigo-100 text-indigo-600" : "hover:bg-gray-100"
                    }`}
                    onClick={() => setTab(t)}
                  >
                    {t.replace("info", " Info")}
                  </button>
                ))}
              </nav>

              <div className="flex-1 overflow-y-auto">
                {tab === "usersalaryinfo" && <InfoTab />} 
              </div>
            </div>
          </div>
        </div>
    </div>
  );
};

const Profile = () =>{
  const {id}=useParams();      
  console.log(id)
  const dispatch = useDispatch();
  const usersdata = useSelector((state) => state.auth.usersdata);
  console.log(usersdata)
  const [employee,setEmployee]=useState(null)
console.log("1. Profile rendered");
useEffect(()=>{
if (usersdata[id]){
  console.log("Loaded from cache",usersdata)
    console.log("2. Profile useEffect triggered");
  setEmployee(usersdata[id])
}else{
const FetchEmployee = async()=>{
  try{
  
    
    const response = await fetch(apiUrl(`/api/users/${id}`), {
      headers: authHeaders(),
    });
    
      if(!response.ok){
            throw new Error("Failed to fetch employees");
      }
       const data=await response.json()
       setEmployee(data.user)
       dispatch(cacheUser({ id, userData: data.user }));
       console.log('Fetching the data from api')
         
  }catch(error){
  console.error("Error fetching employees:", error);
  }
}
FetchEmployee();
};
},[id,dispatch,cacheUser])

 if (!employee) return <p>Loading...</p>;
console.log(employee)

  return (
 <div className="bg-white w-full lg:w-1/5 rounded-2xl shadow-md p-6 text-sm text-gray-700 space-y-6">
  {/* Profile Header */}
  <div className="flex flex-col items-center text-center">
    <div className="w-24 h-24 rounded-full mb-4 bg-slate-100 border-2 border-slate-200 flex items-center justify-center text-slate-700 font-extrabold text-3xl shadow-inner select-none">
      {employee?.username ? employee.username.charAt(0).toUpperCase() : (
        <svg className="w-12 h-12 text-slate-400" fill="currentColor" viewBox="0 0 24 24">
          <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z" />
        </svg>
      )}
    </div>
    <h3 className="text-lg font-semibold text-slate-800">{employee.username}</h3>
    <p className="text-sm text-slate-500">{employee.designation || employee.role || "Employee"}</p>
  </div>

  {/* Info Section */}
  <div>
    <h4 className="text-xs font-semibold text-gray-500 mb-3">Info</h4>
    <div className="space-y-4">
      <div className="flex items-start gap-3">
        <div className="p-2 bg-gray-100 rounded-md">
        <FaEnvelope className="text-gray-500 mt-1" />
        </div>
        <div>
          <p className="text-sm font-medium">Admin & HRM</p>
          <p className="text-xs text-gray-400">Department</p>
        </div>
      </div>

      <div className="flex items-start gap-3">
        <div className="p-2 bg-gray-100 rounded-md">
        <FaRupeeSign className="text-gray-500 mt-1" />
        </div>
        <div>
          <p className="text-sm font-medium text-green-600">{employee.
salary}</p>
          <p className="text-xs text-gray-400">Salary</p>
        </div>
      </div>

      <div className="flex items-start gap-3">
        <div className="p-2 bg-gray-100 rounded-md">
        <FaRegClock  className="text-gray-500 mt-1" />
        </div>
        <div>
          <p className="text-sm font-medium">Regular</p>
          <p className="text-xs text-gray-400">Work Shift</p>
        </div>
      </div>
    </div>
  </div>

  {/* Contact Section */}
  <div>
    <h4 className="text-xs font-semibold text-gray-500 mb-3">Contact</h4>
    <div className="space-y-3">
      <div className="flex items-start gap-3">
        <FaEnvelope className="text-gray-500 mt-1" />
        <div>
          <p className="text-xs text-gray-500">Email</p>
          <p className="text-sm">{employee.email}</p>
        </div>
      </div>

      <div className="flex items-start gap-3">
        <FaPhone className="text-gray-500 mt-1" />
        <div>
          <p className="text-xs text-gray-500">Phone</p>
          <p className="text-sm">{employee.mobile}</p>
        </div>
      </div>

    </div>
  </div>
</div>

)};


function InfoTab() {
  const { id } = useParams();

  const [employee, setEmployee] = useState(null);
  const [message, setMessage] = useState("Loading...");
  const [showAddButton, setShowAddButton] = useState(false);

  const [showModal, setShowModal] = useState(false);
  const [formMode, setFormMode] = useState("add");
  const [selectedEmployeeData, setSelectedEmployeeData] = useState(null);

  useEffect(() => {
    if (!id) return;

    const fetchSalaryInfo = async () => {
      try {
        const response = await fetch(apiUrl(`/api/usersalaryinfo/${id}`), {
          headers: authHeaders(),
        });

        if (!response.ok) {
          setMessage("Salary data is not found for this user. Please add the user info.");
          setShowAddButton(true);
          return;
        }

        const data = await response.json();
        setEmployee(data);
        setShowAddButton(false);
      } catch (error) {
        console.error("Error fetching salary info:", error);
        setMessage("Something went wrong while fetching salary info.");
      }
    };

    fetchSalaryInfo();
  }, [id]);

  const openModal = (mode, data = null) => {
    setFormMode(mode);
    setSelectedEmployeeData(data);
    setShowModal(true);
  };  

  return (
    <div className="space-y-6 text-gray-700">
      {employee ? (
        <>
          <h3 className="text-xl font-semibold border-b pb-2">
            User {employee.user_id} Salary Info
          </h3>

          {/* Personal Info */}
          <div>
            <h4 className="text-md font-semibold mb-2 text-indigo-600">👤 Personal Details</h4>
            <div className="grid sm:grid-cols-2 gap-x-8 gap-y-3 text-sm">
              <p><span className="font-medium">Full Name:</span> {employee.employee_name}</p>
              <p><span className="font-medium">Employee ID:</span> {employee.employee_id}</p>
              <p><span className="font-medium">Base Salary:</span> ₹{employee.base_salary}</p>
              <p><span className="font-medium">Joining Date:</span> {employee.joining_date}</p>
            </div>
          </div>

          {/* Bonus Info */}
          <div>
            <h4 className="text-md font-semibold mb-2 text-indigo-600">💰 Bonus</h4>
            <div className="grid sm:grid-cols-2 gap-x-8 gap-y-3 text-sm">
              <p><span className="font-medium">Bonus:</span> ₹{employee.bonus}</p>
              <p><span className="font-medium">HRA:</span> ₹{employee.hra}</p>
            </div>
          </div>

          {/* Deductions Info */}
          <div>
            <h4 className="text-md font-semibold mb-2 text-indigo-600">➖ Deductions</h4>
            <div className="grid sm:grid-cols-2 gap-x-8 gap-y-3 text-sm">
              <p><span className="font-medium">Tax Percent:</span> {employee.tax_percent}%</p>
              <p><span className="font-medium">PF Percent:</span> {employee.pf_percent}%</p>
            </div>
          </div>

          {/* Updates */}
          {/* Updates */}
          <div>
            <h4 className="text-md font-semibold mb-2 text-indigo-600">🔄 Updates</h4>
            <div className="grid sm:grid-cols-2 gap-x-8 gap-y-3 text-sm">
              <p><span className="font-medium">Updated By:</span> {employee.updated_by || "System"}</p>
              <p><span className="font-medium">Last Update:</span> {String(employee.last_update || "").split("T")[0] || "N/A"}</p>
            </div>
          </div>

          {/* Buttons */}
          <div className="pt-4">
            <button
              onClick={() => openModal("update", employee)}
              className="px-4 py-2 bg-yellow-500 text-white rounded hover:bg-yellow-600 font-medium transition shadow-sm"
            >
              ✏️ Update Salary Info
            </button>
          </div>
        </>
      ) : (
        <>
          <p className="text-red-600 font-medium">{message}</p>

          {showAddButton && (
            <button
              onClick={() => openModal("add")}
              className="mt-4 px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 font-medium transition shadow-sm"
            >
              ➕ Add Salary Info
            </button>
          )}
        </>
      )}

      {/* Modal */}
      {showModal && (
        <SalaryModal
          mode={formMode}
          employeeId={id}
          defaultData={formMode === "update" ? selectedEmployeeData : {}}
          onClose={() => setShowModal(false)}
          onSuccess={() => {
            fetchSalaryInfo();
          }}
        />
      )}
    </div>
  );
}


const SalaryModal = ({ mode = "add", employeeId, defaultData = {}, onClose, onSuccess }) => {
  const user = useSelector((state) => state.auth.user);
  
  const [formData, setFormData] = useState({
    employee_id: employeeId || "",
    employee_name: "",
    base_salary: "",
    hra: "",
    bonus: "5000",
    tax_percent: "10",
    pf_percent: "12",
    paid_leaves_allowed: "2",
    joining_date: "",
    updated_by: user?.username || "Admin",
  });

  const [message, setMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);

  // Pre-fill form
  useEffect(() => {
    if (mode === "update" && defaultData && Object.keys(defaultData).length > 0) {
      setFormData({
        ...defaultData,
        updated_by: user?.username || "Admin",
      });
    } else {
      // Fetch user profile to pre-fill name and base salary
      fetch(apiUrl(`/api/getuser/${employeeId}`))
        .then((r) => r.json())
        .then((data) => {
          if (data && data.user) {
            const base = data.user.salary || 75000;
            setFormData((prev) => ({
              ...prev,
              employee_id: employeeId,
              employee_name: data.user.username || "",
              base_salary: base,
              hra: Math.round(base * 0.4),
              joining_date: data.user.joigningDate || new Date().toISOString().split("T")[0],
            }));
          }
        })
        .catch(() => {
          setFormData((prev) => ({ ...prev, employee_id: employeeId }));
        });
    }
  }, [defaultData, mode, employeeId]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => {
      const updated = { ...prev, [name]: value };
      // Auto-compute HRA as 40% when base salary changes if HRA was empty
      if (name === "base_salary" && value) {
        updated.hra = Math.round(Number(value) * 0.4);
      }
      return updated;
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setMessage("");

    const url =
      mode === "add"
        ? apiUrl("/api/usersalaryinfo/add")
        : apiUrl("/api/usersalaryinfo/update");

    const method = mode === "add" ? "POST" : "PUT";

    try {
      const response = await fetch(url, {
        method,
        headers: {
          ...authHeaders(),
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      });

      const result = await response.json();

      if (!response.ok) throw new Error(result.message || "Failed to save salary info");

      setMessage(`✅ ${result.message || "Salary info saved successfully"}`);
      setTimeout(() => {
        if (onSuccess) onSuccess();
        onClose();
      }, 700);
    } catch (err) {
      setMessage(`❌ ${err.message}`);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center px-4 animate-fade-in">
      <div className="bg-white max-w-2xl w-full rounded-2xl shadow-2xl p-6 relative max-h-[90vh] overflow-y-auto border border-slate-200">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 transition"
        >
          ✖
        </button>

        <h2 className="text-xl font-bold mb-4 text-slate-800 text-center">
          {mode === "add" ? "➕ Add Employee Salary Info" : "✏️ Update Salary Info"}
        </h2>

        <form onSubmit={handleSubmit} className="space-y-4 text-sm">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-600 uppercase mb-1">
                Employee ID
              </label>
              <input
                type="text"
                name="employee_id"
                value={formData.employee_id}
                disabled
                className="w-full border border-slate-200 bg-slate-100 p-2.5 rounded-lg text-slate-700 font-semibold"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-600 uppercase mb-1">
                Employee Full Name
              </label>
              <input
                type="text"
                name="employee_name"
                value={formData.employee_name}
                onChange={handleChange}
                placeholder="Full Name"
                required
                className="w-full border border-slate-300 p-2.5 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-600 uppercase mb-1">
                Base Monthly Salary (₹)
              </label>
              <input
                type="number"
                name="base_salary"
                value={formData.base_salary}
                onChange={handleChange}
                placeholder="e.g. 75000"
                required
                className="w-full border border-slate-300 p-2.5 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none font-bold"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-600 uppercase mb-1">
                HRA Allowance (₹)
              </label>
              <input
                type="number"
                name="hra"
                value={formData.hra}
                onChange={handleChange}
                placeholder="e.g. 30000"
                className="w-full border border-slate-300 p-2.5 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-600 uppercase mb-1">
                Bonus / Incentives (₹)
              </label>
              <input
                type="number"
                name="bonus"
                value={formData.bonus}
                onChange={handleChange}
                placeholder="Bonus"
                className="w-full border border-slate-300 p-2.5 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-600 uppercase mb-1">
                Tax Deduction (%)
              </label>
              <input
                type="number"
                name="tax_percent"
                value={formData.tax_percent}
                onChange={handleChange}
                placeholder="e.g. 10"
                className="w-full border border-slate-300 p-2.5 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-600 uppercase mb-1">
                PF Deduction (%)
              </label>
              <input
                type="number"
                name="pf_percent"
                value={formData.pf_percent}
                onChange={handleChange}
                placeholder="e.g. 12"
                className="w-full border border-slate-300 p-2.5 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-600 uppercase mb-1">
                Joining Date
              </label>
              <input
                type="date"
                name="joining_date"
                value={formData.joining_date}
                onChange={handleChange}
                className="w-full border border-slate-300 p-2.5 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="w-full mt-4 bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3 rounded-xl transition shadow-md disabled:opacity-50"
          >
            {submitting ? "Saving..." : mode === "add" ? "Save Salary Configuration" : "Update Salary Details"}
          </button>
        </form>

        {message && (
          <p
            className={`text-center text-sm mt-3 font-semibold ${
              message.startsWith("✅") ? "text-emerald-600" : "text-rose-600"
            }`}
          >
            {message}
          </p>
        )}
      </div>
    </div>
  );
};

export default PayrollPage;
