import { describe, it, expect } from "vitest";
import reducer, {
  setSearch,
  setLocation,
  toggleJobType,
  setSalaryRange,
  setPage,
  clearJobFilters,
  selectJobFilters,
} from "./jobFiltersSlice";

const initial = { search: "", location: "", type: [], salaryRange: 0, page: 1 };

describe("jobFiltersSlice", () => {
  it("returns the initial state", () => {
    expect(reducer(undefined, { type: "@@INIT" })).toEqual(initial);
  });

  // Every user-driven filter change must jump back to page 1 — otherwise the
  // user is left staring at an empty page of a now-invalid pagination window.
  it.each([
    ["setSearch", setSearch("frontend")],
    ["setLocation", setLocation("Remote")],
    ["toggleJobType", toggleJobType("Full-time")],
    ["setSalaryRange", setSalaryRange(2)],
  ])("%s resets pagination to page 1", (_name, action) => {
    const stateOnPage5 = { ...initial, page: 5 };
    const next = reducer(stateOnPage5, action);
    expect(next.page).toBe(1);
  });

  it("setSearch updates only the search term and page", () => {
    const state = { ...initial, location: "Berlin", type: ["Part-time"], page: 4 };
    const next = reducer(state, setSearch("data scientist"));
    expect(next).toEqual({
      search: "data scientist",
      location: "Berlin",
      type: ["Part-time"],
      salaryRange: 0,
      page: 1,
    });
  });

  it("setLocation updates only the location term and page", () => {
    const next = reducer({ ...initial, search: "qa", page: 3 }, setLocation("Pune"));
    expect(next.location).toBe("Pune");
    expect(next.search).toBe("qa");
    expect(next.page).toBe(1);
  });

  it("toggleJobType adds an unknown type and removes a selected one", () => {
    let state = reducer(initial, toggleJobType("Contract"));
    expect(state.type).toEqual(["Contract"]);

    state = reducer(state, toggleJobType("Internship"));
    expect(state.type).toEqual(["Contract", "Internship"]);

    state = reducer(state, toggleJobType("Contract"));
    expect(state.type).toEqual(["Internship"]);
  });

  it("setSalaryRange stores the selected range index", () => {
    const next = reducer(initial, setSalaryRange(3));
    expect(next.salaryRange).toBe(3);
  });

  it("setPage changes the page without touching filters", () => {
    const state = { ...initial, search: "designer", type: ["Remote-ish"] };
    const next = reducer(state, setPage(7));
    expect(next.page).toBe(7);
    expect(next.search).toBe("designer");
    expect(next.type).toEqual(["Remote-ish"]);
  });

  it("clearJobFilters restores the pristine initial state from any page", () => {
    const dirty = {
      search: "backend",
      location: "Berlin",
      type: ["Full-time", "Contract"],
      salaryRange: 4,
      page: 9,
    };
    expect(reducer(dirty, clearJobFilters())).toEqual(initial);
  });

  it("selectJobFilters selects the whole slice", () => {
    const state = { jobFilters: initial };
    expect(selectJobFilters(state)).toBe(initial);
  });
});
