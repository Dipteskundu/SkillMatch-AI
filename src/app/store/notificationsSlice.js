import { createSlice } from "@reduxjs/toolkit";
import { apiSlice } from "./api/apiSlice";
import { syncAuth } from "./authSlice";

const initialState = {
  items: [],
  unreadCount: 0,
  ownerUid: null, // uid the current items belong to
  loading: true,
};

/** Same message + <10s apart — used to dedupe REST vs. RTDB deliveries. */
function isSameNotification(a, b) {
  return (
    a?.message === b?.message &&
    Math.abs(
      new Date(a?.createdAt).getTime() - new Date(b?.createdAt).getTime(),
    ) < 10000
  );
}

function countUnread(items) {
  return items.reduce((count, item) => (item.read ? count : count + 1), 0);
}

/**
 * In RTK Query v2, `action.meta.arg` on a fulfilled query/mutation action is
 * the *internal* thunk arg object; the value originally passed to the
 * endpoint lives at `.originalArgs`. Defensive: falls back to the raw value
 * in case a future RTK version changes this.
 */
function originalArg(action) {
  const arg = action?.meta?.arg;
  return arg && typeof arg === "object" && "originalArgs" in arg
    ? arg.originalArgs
    : arg;
}

const notificationsSlice = createSlice({
  name: "notifications",
  initialState,
  reducers: {
    // Real-time notification pushed from the Firebase RTDB listener
    // (NotificationPanel) so new items show up before the next poll.
    notificationReceived(state, action) {
      const incoming = action.payload;
      if (!incoming) return;
      if (state.items.some((n) => isSameNotification(n, incoming))) return;
      state.items.unshift({ ...incoming, __realtime: true });
      if (!incoming.read) state.unreadCount += 1;
    },
  },
  extraReducers: (builder) => {
    builder
      // Auth signed out / switched users → drop the previous user's data.
      .addCase(syncAuth, (state, action) => {
        const uid = action.payload.user?.uid ?? null;
        if (uid !== state.ownerUid) {
          state.items = [];
          state.unreadCount = 0;
          state.ownerUid = null;
          state.loading = uid !== null;
        }
      })
      .addMatcher(
        apiSlice.endpoints.getNotifications.matchFulfilled,
        (state, action) => {
          state.loading = false;
          state.ownerUid = originalArg(action) ?? null;
          // apiClient resolves HTTP 500s into `{ success: false }` bodies —
          // keep whatever we already have instead of wiping the list.
          if (!action.payload?.success || !action.payload?.data) return;
          const data = action.payload.data;
          const serverItems = data.notifications || [];
          // Keep RTDB-pushed items the REST payload hasn't caught up with yet.
          const pendingRealtime = state.items.filter(
            (item) =>
              item.__realtime &&
              !serverItems.some((s) => isSameNotification(s, item)),
          );
          state.items = pendingRealtime.length
            ? [...pendingRealtime, ...serverItems]
            : serverItems;
          const serverCount =
            typeof data.unreadCount === "number"
              ? data.unreadCount
              : countUnread(serverItems);
          state.unreadCount =
            serverCount + pendingRealtime.filter((n) => !n.read).length;
        },
      )
      .addMatcher(
        apiSlice.endpoints.getNotifications.matchRejected,
        (state) => {
          state.loading = false;
        },
      )
      .addMatcher(
        apiSlice.endpoints.markNotificationRead.matchFulfilled,
        (state, action) => {
          if (!action.payload?.success) return;
          const id = originalArg(action);
          const item = state.items.find((n) => (n._id || n.id) === id);
          if (item && !item.read) {
            item.read = true;
            state.unreadCount = Math.max(0, state.unreadCount - 1);
          }
        },
      )
      .addMatcher(
        apiSlice.endpoints.markAllNotificationsRead.matchFulfilled,
        (state, action) => {
          if (!action.payload?.success) return;
          state.items.forEach((n) => {
            n.read = true;
          });
          state.unreadCount = 0;
        },
      );
  },
});

export const { notificationReceived } = notificationsSlice.actions;

export const selectNotifications = (state) => state.notifications.items;
export const selectUnreadCount = (state) => state.notifications.unreadCount;
export const selectNotificationsLoading = (state) =>
  state.notifications.loading;
// Derived count for the panel header (mirrors the old local computation).
export const selectListUnreadCount = (state) =>
  countUnread(state.notifications.items);

export default notificationsSlice.reducer;
