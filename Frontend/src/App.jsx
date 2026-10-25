import React, { useEffect } from "react";
import { BrowserRouter } from "react-router-dom";
import { useDispatch } from "react-redux";
import { loginUser } from "./Redux/Slice";
import AppRoutes from "./routes/AppRoutes";
import ErrorBoundary from "./Components/ErrorBoundary";

function App() {
  const dispatch = useDispatch();

  useEffect(() => {
    try {
      const storedUser = localStorage.getItem("user");
      const token = localStorage.getItem("token");
      if (storedUser && token) {
        const user = JSON.parse(storedUser);
        dispatch(loginUser({ user, token }));
      }
    } catch (err) {
      console.warn("Failed to parse cached user session from localStorage:", err);
      localStorage.removeItem("user");
      localStorage.removeItem("token");
    }
  }, [dispatch]);

  return (
    <ErrorBoundary>
      <BrowserRouter>
        <AppRoutes />
      </BrowserRouter>
    </ErrorBoundary>
  );
}

export default App;