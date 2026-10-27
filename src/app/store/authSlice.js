import { createSlice } from "@reduxjs/toolkit";

const initialState = {
  user: null,
  userProfile: null,
  role: null,
  loading: true,
  isAuthenticated: false,
};

const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    // AuthContext (Firebase) stays the source of truth and mirrors its state
    // into the store so non-context consumers can read it via selectors.
    syncAuth(state, action) {
      const { user, userProfile, loading } = action.payload;
      state.user = user;
      state.userProfile = userProfile;
      state.role = userProfile?.role || null;
      state.loading = loading;
      state.isAuthenticated = !!user;
    },
  },
});

export const { syncAuth } = authSlice.actions;

export const selectAuth = (state) => state.auth;
export const selectCurrentUser = (state) => state.auth.user;
export const selectRole = (state) => state.auth.role;
export const selectIsAuthenticated = (state) => state.auth.isAuthenticated;
export const selectAuthLoading = (state) => state.auth.loading;

export default authSlice.reducer;
