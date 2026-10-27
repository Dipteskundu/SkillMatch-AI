import { describe, it, expect } from "vitest";
import reducer, {
  syncAuth,
  selectAuth,
  selectCurrentUser,
  selectRole,
  selectIsAuthenticated,
  selectAuthLoading,
} from "./authSlice";

describe("authSlice / syncAuth", () => {
  it("starts in the loading, signed-out state", () => {
    const state = reducer(undefined, { type: "@@INIT" });
    expect(state).toEqual({
      user: null,
      userProfile: null,
      role: null,
      loading: true,
      isAuthenticated: false,
    });
  });

  it("maps a signed-in user with a role profile", () => {
    const user = { uid: "u-1", email: "a@b.co" };
    const userProfile = { role: "recruiter" };
    const state = reducer(undefined, syncAuth({ user, userProfile, loading: false }));

    expect(state.user).toBe(user);
    expect(state.userProfile).toBe(userProfile);
    expect(state.role).toBe("recruiter");
    expect(state.loading).toBe(false);
    expect(state.isAuthenticated).toBe(true);
  });

  it("keeps role null when the profile carries no role", () => {
    const state = reducer(
      undefined,
      syncAuth({ user: { uid: "u-2" }, userProfile: {}, loading: false }),
    );
    expect(state.role).toBeNull();
    expect(state.isAuthenticated).toBe(true);
    expect(state.loading).toBe(false);
  });

  it("maps the auth-resolved-but-signed-out state", () => {
    const state = reducer(
      undefined,
      syncAuth({ user: null, userProfile: null, loading: false }),
    );
    expect(state.user).toBeNull();
    expect(state.role).toBeNull();
    expect(state.loading).toBe(false);
    expect(state.isAuthenticated).toBe(false);
  });

  it("mirrors Firebase still-initializing as loading + unauthenticated", () => {
    const state = reducer(
      undefined,
      syncAuth({ user: null, userProfile: null, loading: true }),
    );
    expect(state.loading).toBe(true);
    expect(state.isAuthenticated).toBe(false);
  });

  it("selectors read from the slice", () => {
    const user = { uid: "u-3" };
    const state = {
      auth: { user, userProfile: { role: "admin" }, role: "admin", loading: false, isAuthenticated: true },
    };
    expect(selectAuth(state).user).toBe(user);
    expect(selectCurrentUser(state)).toBe(user);
    expect(selectRole(state)).toBe("admin");
    expect(selectIsAuthenticated(state)).toBe(true);
    expect(selectAuthLoading(state)).toBe(false);
  });
});
