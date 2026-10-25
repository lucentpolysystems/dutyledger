// import React from "react";
// import { useNavigate } from "react-router-dom";

// const NotFound = () => {
//   const navigate = useNavigate();

//   return (
//     <div className="min-h-screen w-full flex items-center justify-center bg-gradient-to-br from-blue-100 via-white to-indigo-100 px-6 py-12">
//       <div className="max-w-5xl w-full bg-white/30 backdrop-blur-md shadow-2xl border border-white/20 rounded-3xl flex flex-col lg:flex-row items-center overflow-hidden animate-fadeIn">

//         {/* Text Section */}
//         <div className="w-full lg:w-1/2 p-10 text-center lg:text-left">
//           <h1 className="text-5xl font-bold text-red-500 mb-4">404 - Not Found</h1>
//           <h2 className="text-2xl font-semibold text-blue-900 mb-3">Oops! This page doesn’t exist.</h2>
//           <p className="text-gray-700 mb-6">
//             The page you are looking for might have been removed, renamed, or is temporarily unavailable.
//           </p>
//           <button
//             onClick={() => navigate("/")}
//             className="bg-red-500 hover:bg-red-600 text-white px-6 py-2 rounded-full text-sm transition-all shadow-md"
//           >
//             Back to Homepage
//           </button>
//         </div>

//       </div>
//     </div>
//   );
// };

// export default NotFound;


import React from "react";
import { useNavigate } from "react-router-dom";

const NotFound = () => {
  const navigate = useNavigate();

  return (
    <div className="relative flex min-h-screen w-full items-center justify-center overflow-hidden bg-slate-50 px-4 py-10 sm:px-6">
      {/* Background Decorations */}
      <div className="pointer-events-none absolute -left-24 -top-24 h-72 w-72 rounded-full bg-blue-200/40 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-24 -right-24 h-80 w-80 rounded-full bg-indigo-200/40 blur-3xl" />

      <main className="relative w-full max-w-5xl overflow-hidden rounded-3xl border border-white bg-white shadow-xl shadow-slate-200/60">
        <div className="grid min-h-[480px] grid-cols-1 items-center lg:grid-cols-2">
          {/* Text Section */}
          <section className="order-2 px-6 py-10 text-center sm:px-12 lg:order-1 lg:py-16 lg:text-left">
            <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-blue-100 bg-blue-50 px-4 py-2 text-sm font-medium text-blue-700">
              <span className="h-2 w-2 rounded-full bg-blue-600" />
              Error 404
            </div>

            <h1 className="text-4xl font-extrabold tracking-tight text-slate-900 sm:text-5xl lg:text-6xl">
              Page not
              <span className="block text-blue-600">found.</span>
            </h1>

            <p className="mx-auto mt-5 max-w-md text-base leading-7 text-slate-500 lg:mx-0">
              Sorry, we couldn't find the page you're looking for. It may
              have been moved, renamed, or no longer exists.
            </p>

            <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row lg:justify-start">
              <button
                type="button"
                onClick={() => navigate("/")}
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-blue-600/20 transition duration-200 hover:-translate-y-0.5 hover:bg-blue-700 focus:outline-none focus:ring-4 focus:ring-blue-200"
              >
                <svg
                  className="h-4 w-4"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  aria-hidden="true"
                >
                  <path d="m15 18-6-6 6-6" />
                </svg>
                Back to Homepage
              </button>

              <button
                type="button"
                onClick={() => navigate(-1)}
                className="inline-flex items-center justify-center rounded-xl border border-slate-200 bg-white px-6 py-3 text-sm font-semibold text-slate-700 transition hover:border-slate-300 hover:bg-slate-50 focus:outline-none focus:ring-4 focus:ring-slate-200"
              >
                Go Back
              </button>
            </div>

            <p className="mt-8 text-sm text-slate-400">
              Need help? Contact our support team.
            </p>
          </section>

          {/* Illustration Section */}
          <section
            aria-label="Page not found illustration"
            className="order-1 flex min-h-[260px] items-center justify-center bg-gradient-to-br from-blue-50 via-indigo-50 to-slate-100 px-6 py-10 sm:min-h-[320px] lg:order-2 lg:min-h-full"
          >
            <div className="relative flex h-64 w-64 items-center justify-center sm:h-80 sm:w-80">
              {/* Decorative circles */}
              <div className="absolute h-56 w-56 rounded-full border border-blue-200/70 sm:h-72 sm:w-72" />
              <div className="absolute h-44 w-44 rounded-full bg-white/70 shadow-inner sm:h-56 sm:w-56" />

              {/* 404 Illustration */}
              <div className="relative text-center">
                <div className="text-7xl font-black tracking-tighter text-blue-600 sm:text-8xl">
                  404
                </div>
                <div className="mx-auto mt-3 h-1.5 w-16 rounded-full bg-indigo-300" />
                <p className="mt-4 text-sm font-medium tracking-wide text-slate-500">
                  LOST IN SPACE?
                </p>
              </div>

              {/* Floating decorative elements */}
              <span className="absolute right-5 top-8 h-4 w-4 rounded-full bg-indigo-400 shadow-lg shadow-indigo-300/50" />
              <span className="absolute bottom-10 left-5 h-3 w-3 rounded-full bg-blue-400" />
              <span className="absolute right-8 bottom-12 h-2 w-2 rounded-full bg-sky-300" />

              <svg
                className="absolute -right-1 top-14 h-10 w-10 text-indigo-400 sm:right-1"
                viewBox="0 0 40 40"
                fill="none"
                aria-hidden="true"
              >
                <path
                  d="M20 2l3.5 13.5L37 20l-13.5 3.5L20 37l-3.5-13.5L3 20l13.5-4.5L20 2z"
                  fill="currentColor"
                />
              </svg>
            </div>
          </section>
        </div>
      </main>
    </div>
  );
};

export default NotFound;
