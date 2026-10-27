import { describe, it, expect, vi, beforeEach } from "vitest";
import { configureStore } from "@reduxjs/toolkit";

// apiClient transitively pulls in firebaseClient — mock it so tests are
// hermetic (no Firebase init, no network, no env files needed).
vi.mock("../lib/apiClient", () => ({
  default: { request: vi.fn() },
}));

import apiClient from "../lib/apiClient";
import { apiSlice } from "./api/apiSlice";
import notificationsReducer, {
  notificationReceived,
  selectUnreadCount,
  selectListUnreadCount,
  selectNotificationsLoading,
} from "./notificationsSlice";
import { syncAuth } from "./authSlice";

const SERVER_ITEMS = [
  { _id: "n1", message: "New job match", read: false, createdAt: "2026-10-01T10:00:00.000Z" },
  { _id: "n2", message: "Application viewed", read: true, createdAt: "2026-10-01T09:00:00.000Z" },
  { _id: "n3", message: "Interview invite", read: false, createdAt: "2026-10-01T08:00:00.000Z" },
];

function makeStore() {
  return configureStore({
    reducer: {
      notifications: notificationsReducer,
      [apiSlice.reducerPath]: apiSlice.reducer,
    },
    middleware: (getDefaultMiddleware) => getDefaultMiddleware().concat(apiSlice.middleware),
  });
}

/** Payload returned by the next GET /api/notifications/:uid call. */
let notificationPayload;

function wireApiMocks() {
  notificationPayload = {
    success: true,
    data: { notifications: SERVER_ITEMS, unreadCount: 2 },
  };
  apiClient.request.mockReset().mockImplementation(async ({ url, method = "GET" }) => {
    if (method === "PATCH" && url.includes("/read-all/")) return { data: { success: true } };
    if (method === "PATCH" && url.endsWith("/read")) return { data: { success: true } };
    if (method === "GET" && url.startsWith("/api/notifications/")) {
      return { data: notificationPayload };
    }
    throw new Error(`Unexpected request in test: ${method} ${url}`);
  });
}

/** Fire the real getNotifications query through the mocked apiClient. */
async function loadNotifications(store, uid = "uid-1") {
  const promise = store.dispatch(apiSlice.endpoints.getNotifications.initiate(uid));
  await promise;
  promise.unsubscribe?.();
}

beforeEach(() => {
  wireApiMocks();
});

describe("notificationsSlice — server payload handling", () => {
  it("stores items and trusts the server-provided unreadCount", async () => {
    notificationPayload = {
      success: true,
      data: { notifications: SERVER_ITEMS, unreadCount: 5 },
    };
    const store = makeStore();
    await loadNotifications(store);

    const state = store.getState().notifications;
    expect(state.items).toHaveLength(3);
    expect(state.unreadCount).toBe(5); // server number wins over local count
    expect(state.loading).toBe(false);
    // ownerUid must store the raw uid string (not RTK Query's internal
    // thunk-arg object) — the slice unwraps `.originalArgs`.
    expect(state.ownerUid).toBe("uid-1");
    expect(selectUnreadCount(store.getState())).toBe(5);
    expect(selectListUnreadCount(store.getState())).toBe(2); // derived from items
    expect(selectNotificationsLoading(store.getState())).toBe(false);
  });

  it("falls back to counting unread items when the server omits unreadCount", async () => {
    notificationPayload = {
      success: true,
      data: { notifications: SERVER_ITEMS },
    };
    const store = makeStore();
    await loadNotifications(store);

    expect(store.getState().notifications.unreadCount).toBe(2); // n1 + n3 unread
  });

  it("keeps existing state when the payload is an apiClient 500 swallow ({success:false})", async () => {
    notificationPayload = { success: false, _serverError: true, message: "Server error" };
    const store = makeStore();
    await loadNotifications(store);

    const state = store.getState().notifications;
    expect(state.items).toEqual([]); // nothing was there to wipe
    expect(state.unreadCount).toBe(0);
    expect(state.loading).toBe(false); // loading resolves either way
    expect(state.ownerUid).toBe("uid-1");
  });
});

describe("notificationsSlice — markRead / markAllRead", () => {
  it("markNotificationRead marks the item read and decrements the count", async () => {
    const store = makeStore();
    await loadNotifications(store);
    expect(store.getState().notifications.unreadCount).toBe(2);

    await store.dispatch(apiSlice.endpoints.markNotificationRead.initiate("n1"));

    const state = store.getState().notifications;
    // The request wiring is correct: PATCH /api/notifications/n1/read fires.
    const patchCall = apiClient.request.mock.calls.find(
      ([config]) => config.method === "PATCH" && config.url === "/api/notifications/n1/read",
    );
    expect(patchCall).toBeTruthy();

    // Regression test for the RTK-Query-v2 `meta.arg` bug: the slice must
    // unwrap `.originalArgs` or the id lookup misses and nothing is marked read.
    expect(state.items.find((n) => n._id === "n1").read).toBe(true);
    expect(state.items.find((n) => n._id === "n2").read).toBe(true); // was already read
    expect(state.unreadCount).toBe(1);
  });

  it("markAllNotificationsRead marks everything read and zeroes the count", async () => {
    const store = makeStore();
    await loadNotifications(store);

    await store.dispatch(apiSlice.endpoints.markAllNotificationsRead.initiate("uid-1"));

    const state = store.getState().notifications;
    expect(state.items.every((n) => n.read)).toBe(true);
    expect(state.unreadCount).toBe(0);
  });
});

describe("notificationsSlice — auth user switching", () => {
  it("clears items and unread count when syncAuth reports a different uid", async () => {
    const store = makeStore();
    await loadNotifications(store);
    expect(store.getState().notifications.items).toHaveLength(3);

    store.dispatch(syncAuth({ user: { uid: "uid-2" }, userProfile: null, loading: false }));

    const state = store.getState().notifications;
    expect(state.items).toEqual([]);
    expect(state.unreadCount).toBe(0);
    expect(state.ownerUid).toBeNull();
    expect(state.loading).toBe(true); // new user's data still needs loading
  });

  it("clears and stops loading when the user signs out", async () => {
    const store = makeStore();
    await loadNotifications(store);

    store.dispatch(syncAuth({ user: null, userProfile: null, loading: false }));

    const state = store.getState().notifications;
    expect(state.items).toEqual([]);
    expect(state.unreadCount).toBe(0);
    expect(state.ownerUid).toBeNull();
    expect(state.loading).toBe(false);
  });

  it("same-uid re-sync keeps the already-loaded data", async () => {
    const store = makeStore();
    await loadNotifications(store);

    store.dispatch(syncAuth({ user: { uid: "uid-1" }, userProfile: null, loading: false }));

    // Regression test: ownerUid must hold the raw uid string, otherwise the
    // same-uid comparison always mismatches and data is wiped on every auth
    // re-sync (profile refresh, token rotation).
    const state = store.getState().notifications;
    expect(state.items).toHaveLength(3);
    expect(state.unreadCount).toBe(2);
  });
});

describe("notificationsSlice — notificationReceived (RTDB push)", () => {
  it("prepends a realtime notification and bumps the unread count", () => {
    const store = makeStore();
    store.dispatch(
      notificationReceived({
        _id: "r1",
        message: "Realtime alert",
        read: false,
        createdAt: "2026-10-01T12:00:00.000Z",
      }),
    );

    const state = store.getState().notifications;
    expect(state.items).toHaveLength(1);
    expect(state.items[0].__realtime).toBe(true);
    expect(state.unreadCount).toBe(1);
  });

  it("dedupes the same message delivered twice within 10 seconds", () => {
    const store = makeStore();
    const incoming = {
      _id: "r1",
      message: "Realtime alert",
      read: false,
      createdAt: "2026-10-01T12:00:00.000Z",
    };
    store.dispatch(notificationReceived(incoming));
    store.dispatch(notificationReceived({ ...incoming, _id: "dup" }));

    expect(store.getState().notifications.items).toHaveLength(1);
    expect(store.getState().notifications.unreadCount).toBe(1);
  });

  it("does not count an already-read realtime notification as unread", () => {
    const store = makeStore();
    store.dispatch(
      notificationReceived({
        _id: "r2",
        message: "Read on the phone already",
        read: true,
        createdAt: "2026-10-01T12:05:00.000Z",
      }),
    );
    expect(store.getState().notifications.unreadCount).toBe(0);
  });
});
