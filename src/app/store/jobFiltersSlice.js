import { createSlice } from "@reduxjs/toolkit";

const initialState = {
  search: "",
  location: "",
  type: [], // selected employment types (multi-select)
  salaryRange: 0, // index into SALARY_RANGES on the jobs page
  page: 1,
};

const jobFiltersSlice = createSlice({
  name: "jobFilters",
  initialState,
  reducers: {
    setSearch(state, action) {
      state.search = action.payload;
      state.page = 1;
    },
    setLocation(state, action) {
      state.location = action.payload;
      state.page = 1;
    },
    toggleJobType(state, action) {
      const type = action.payload;
      state.type = state.type.includes(type)
        ? state.type.filter((t) => t !== type)
        : [...state.type, type];
      state.page = 1;
    },
    setSalaryRange(state, action) {
      state.salaryRange = action.payload;
      state.page = 1;
    },
    setPage(state, action) {
      state.page = action.payload;
    },
    clearJobFilters(state) {
      state.search = initialState.search;
      state.location = initialState.location;
      state.type = [];
      state.salaryRange = initialState.salaryRange;
      state.page = initialState.page;
    },
  },
});

export const {
  setSearch,
  setLocation,
  toggleJobType,
  setSalaryRange,
  setPage,
  clearJobFilters,
} = jobFiltersSlice.actions;

export const selectJobFilters = (state) => state.jobFilters;

export default jobFiltersSlice.reducer;
