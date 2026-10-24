import { createSlice } from "@reduxjs/toolkit";

const initialState = {
  user: JSON.parse(localStorage.getItem("user")) || null,
  token: localStorage.getItem("token") || null,
  roles: JSON.parse(localStorage.getItem("roles")) || [],
  permissions: JSON.parse(localStorage.getItem("permissions")) || [],
  isAuthenticated: !!localStorage.getItem("token"),
  status: null,
  usersdata: {},
};

const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    loginUser: (state, action) => {
      state.user = action.payload.user;
      state.token = action.payload.token;
      state.roles = action.payload.user?.roles || [];
      state.permissions = action.payload.user?.permissions || [];
      state.isAuthenticated = true;

      localStorage.setItem("user", JSON.stringify(action.payload.user));
      localStorage.setItem("token", action.payload.token);
      localStorage.setItem("roles", JSON.stringify(state.roles));
      localStorage.setItem("permissions", JSON.stringify(state.permissions));
    },

    logoutUser: (state) => {
      state.user = null;
      state.token = null;
      state.roles = [];
      state.permissions = [];
      state.isAuthenticated = false;
      state.usersdata = {}; // ✅ Clear cache
      localStorage.removeItem("user");
      localStorage.removeItem("token");
      localStorage.removeItem("role");
      localStorage.removeItem("roles");
      localStorage.removeItem("permissions");
      console.log("🧹 User logged out and cache cleared");
    },

    setUser: (state, action) => {
      state.user = action.payload;
      if (action.payload?.roles) {
        state.roles = action.payload.roles;
        localStorage.setItem("roles", JSON.stringify(state.roles));
      }
      if (action.payload?.permissions) {
        state.permissions = action.payload.permissions;
        localStorage.setItem("permissions", JSON.stringify(state.permissions));
      }
      localStorage.setItem("user", JSON.stringify(action.payload));
    },

    updatePermissions: (state, action) => {
      if (action.payload.roles) state.roles = action.payload.roles;
      if (action.payload.permissions) state.permissions = action.payload.permissions;
      localStorage.setItem("roles", JSON.stringify(state.roles));
      localStorage.setItem("permissions", JSON.stringify(state.permissions));
    },

    setAttendanceStatus: (state, action) => {
      state.status = action.payload;
    },

    cacheUser: (state, action) => {
      const { id, userData } = action.payload;
      state.usersdata[id] = userData;
    },

    clearUserCache: (state) => {
      state.usersdata = {};
    },
  },
});

export const {
  loginUser,
  logoutUser,
  setUser,
  updatePermissions,
  setAttendanceStatus,
  cacheUser,
  clearUserCache,
} = authSlice.actions;

export default authSlice.reducer;
