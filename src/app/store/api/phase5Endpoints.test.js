// Phase 5 endpoint contract tests — every billing/compliance/API-key hook the
// new pages depend on must exist and hit the exact documented URL/method.
// apiClient is mocked so the suite stays hermetic (same pattern as store.test.js).
import { describe, it, expect, vi, beforeAll } from "vitest";

vi.mock("../../lib/apiClient", () => ({
  default: { request: vi.fn(async () => ({ data: { success: true } })) },
}));

import { makeStore } from "../store";
import { apiSlice } from "./apiSlice";
import apiClient from "../../lib/apiClient";

let store;
beforeAll(() => {
  store = makeStore();
});

const QUERY_ENDPOINTS = [
  "getPlans",
  "getSubscription",
  "getDisclosure",
  "getScoreExport",
  "getAuditLog",
  "getBiasMetrics",
  "getApiKeys",
];

const MUTATION_ENDPOINTS = [
  "createCheckout",
  "openBillingPortal",
  "createApiKey",
  "revokeApiKey",
];

describe("Phase 5 endpoints exist", () => {
  it.each(QUERY_ENDPOINTS)("%s is registered", (name) => {
    expect(apiSlice.endpoints[name]).toBeTruthy();
    expect(typeof apiSlice.endpoints[name].initiate).toBe("function");
  });

  it.each(MUTATION_ENDPOINTS)("%s is registered", (name) => {
    expect(apiSlice.endpoints[name]).toBeTruthy();
    expect(typeof apiSlice.endpoints[name].initiate).toBe("function");
  });
});

describe("Phase 5 request contracts", () => {
  it("getPlans requests the public plans catalog", async () => {
    await store.dispatch(apiSlice.endpoints.getPlans.initiate());
    expect(apiClient.request).toHaveBeenCalledWith(
      expect.objectContaining({ url: "/api/billing/plans", method: "GET" }),
    );
  });

  it("createCheckout POSTs the pro planId (only purchasable plan)", async () => {
    await store.dispatch(apiSlice.endpoints.createCheckout.initiate());
    expect(apiClient.request).toHaveBeenCalledWith(
      expect.objectContaining({
        url: "/api/billing/checkout",
        method: "POST",
        data: { planId: "pro" },
      }),
    );
  });

  it("getDisclosure hits the public disclosure endpoint", async () => {
    await store.dispatch(apiSlice.endpoints.getDisclosure.initiate());
    expect(apiClient.request).toHaveBeenCalledWith(
      expect.objectContaining({ url: "/api/compliance/disclosure" }),
    );
  });

  it("getBiasMetrics hits the admin-only metrics endpoint", async () => {
    await store.dispatch(apiSlice.endpoints.getBiasMetrics.initiate());
    expect(apiClient.request).toHaveBeenCalledWith(
      expect.objectContaining({ url: "/api/compliance/admin/bias-metrics" }),
    );
  });

  it("revokeApiKey DELETEs the specific key id", async () => {
    await store.dispatch(apiSlice.endpoints.revokeApiKey.initiate("64b000000000000000000001"));
    expect(apiClient.request).toHaveBeenCalledWith(
      expect.objectContaining({
        url: "/api/admin/api-keys/64b000000000000000000001",
        method: "DELETE",
      }),
    );
  });
});
