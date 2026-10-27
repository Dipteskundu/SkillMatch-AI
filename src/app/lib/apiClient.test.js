import { describe, it, expect, vi, beforeEach } from "vitest";
import axios from "axios";

// apiClient imports firebaseClient at module scope — stub it so no Firebase
// app is initialized and no env vars are required.
vi.mock("./firebaseClient", () => ({
  default: null,
  auth: null,
  googleProvider: null,
  rtdb: null,
  firebaseConfigured: false,
  firebaseClientStatus: { configured: false, projectId: "", initError: null, authError: null },
}));

import api, { API_BASE } from "./apiClient";

/**
 * Install a fake axios adapter that rejects like a real transport would.
 * The response interceptor (not the adapter) is what turns 500s into a
 * resolved `{ success:false, _serverError:true }` payload.
 */
function failWith(status, data) {
  api.defaults.adapter = async (config) => {
    const response = {
      status,
      statusText: status === 500 ? "Internal Server Error" : "Error",
      headers: {},
      config,
      data,
    };
    throw new axios.AxiosError(
      `Request failed with status code ${status}`,
      "ERR_BAD_RESPONSE",
      config,
      {},
      response,
    );
  };
}

beforeEach(() => {
  vi.restoreAllMocks();
});

describe("apiClient — HTTP 500 contract (documented current behavior)", () => {
  it("resolves a 500 into { success:false, _serverError:true } with empty collections", async () => {
    failWith(500, { message: "Boom from server" });

    const result = await api.get("/api/anything");

    // NOT a reject: callers treat this as a soft failure (legacy authedFetch contract).
    expect(result.status).toBe(500);
    expect(result.data).toEqual({
      success: false,
      _serverError: true,
      message: "Boom from server",
      interviews: [],
      data: null,
      applications: [],
      jobs: [],
      notifications: [],
    });
  });

  it("falls back to a generic message when the 500 body has none", async () => {
    failWith(500, {});

    const result = await api.get("/api/anything");

    expect(result.data.success).toBe(false);
    expect(result.data._serverError).toBe(true);
    expect(result.data.message).toBe("Server error. Please try again later.");
  });

  it("still rejects non-500 errors so RTK Query sees them as errors", async () => {
    failWith(404, { message: "Not found" });

    await expect(api.get("/api/missing")).rejects.toMatchObject({
      response: { status: 404 },
    });
  });
});

describe("apiClient — base URL", () => {
  it("exposes a trimmed API_BASE with no trailing slash", () => {
    expect(API_BASE).toBe(API_BASE.trim());
    expect(API_BASE.endsWith("/")).toBe(false);
    expect(API_BASE.length).toBeGreaterThan(0);
  });
});
