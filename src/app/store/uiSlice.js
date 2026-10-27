import { createSlice } from "@reduxjs/toolkit";

const uiSlice = createSlice({
  name: "ui",
  initialState: {
    theme: "dark", // default to dark mode (matches the old ThemeContext)
  },
  reducers: {
    setTheme(state, action) {
      if (action.payload === "light" || action.payload === "dark") {
        state.theme = action.payload;
      }
    },
  },
});

export const { setTheme } = uiSlice.actions;

export const selectTheme = (state) => state.ui.theme;

export default uiSlice.reducer;
