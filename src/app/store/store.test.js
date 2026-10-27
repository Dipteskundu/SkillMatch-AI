import { describe, it, expect, vi, beforeAll } from "vitest";

// Keep the store hermetic: no axios, no Firebase — RTK Query's baseQuery
// would otherwise be free to hit the real network from a test.
vi.mock("../lib/apiClient", () => ({
  default: { request: vi.fn(async () => ({ data: { success: true } })) },
}));

import { makeStore } from "./store";
import { apiSlice } from "./api/apiSlice";
import { syncAuth } from "./authSlice";
import { setSearch, setPage } from "./jobFiltersSlice";

// makeStore() is a module-level singleton — build it once for the file.
let store;
beforeAll(() => {
  store = makeStore();
});

describe("store", () => {
  it("instantiates with every slice mounted", () => {
    const state = store.getState();
    expect(state).toHaveProperty("auth");
    expect(state).toHaveProperty("ui");
    expect(state).toHaveProperty("jobFilters");
    expect(state).toHaveProperty("notifications");
    // RTK Query api slice (reducerPath: "api")
    expect(state.api).toMatchObject({ queries: {}, mutations: {} });
  });

  it("getState() reflects dispatched slice actions", () => {
    store.dispatch(setSearch("platform engineer"));
    store.dispatch(setPage(6));

    const state = store.getState();
    expect(state.jobFilters.page).toBe(6);
    expect(state.jobFilters.search).toBe("platform engineer");
    expect(state.ui.theme).toBe("dark"); // untouched slice keeps its state
  });

  it("runs the apiSlice middleware — endpoint initiate resolves through the mocked apiClient", async () => {
    const promise = store.dispatch(apiSlice.endpoints.getJobs.initiate());
    await promise;
    promise.unsubscribe?.();

    const result = apiSlice.endpoints.getJobs.select()(store.getState());
    expect(result.isSuccess).toBe(true);
    expect(result.data).toEqual({ success: true });
  });

  it("tolerates the non-serializable Firebase user mirrored by syncAuth (serializableCheck ignoredPaths)", () => {
    class FirebaseUserLike {
      constructor() {
        this.uid = "u-1";
      }
      getIdToken() {
        return Promise.resolve("token");
      }
    }
    const user = new FirebaseUserLike();

    expect(() =>
      store.dispatch(syncAuth({ user, userProfile: { role: "candidate" }, loading: false })),
    ).not.toThrow();

    const auth = store.getState().auth;
    expect(auth.user).toBe(user);
    expect(auth.isAuthenticated).toBe(true);
    expect(auth.role).toBe("candidate");
  });
});
