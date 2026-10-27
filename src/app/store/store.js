import { combineReducers, configureStore } from "@reduxjs/toolkit";
import { persistReducer, persistStore } from "redux-persist";
import { setupListeners } from "@reduxjs/toolkit/query";
import createWebStorage from "redux-persist/lib/storage/createWebStorage";
import authReducer, { syncAuth } from "./authSlice";
import uiReducer from "./uiSlice";
import jobFiltersReducer from "./jobFiltersSlice";
import notificationsReducer from "./notificationsSlice";
import { apiSlice } from "./api/apiSlice";

const noopStorage = {
  getItem: async () => null,
  setItem: async () => {},
  removeItem: async () => {},
};

// localStorage is unavailable during SSR/prerendering — fall back to a noop so
// importing this module on the server never throws or logs errors.
const storage =
  typeof window === "undefined" ? noopStorage : createWebStorage("local");

const persistConfig = {
  key: "root",
  storage,
  // Only UI preferences and job filters are persisted — never auth or tokens.
  whitelist: ["ui", "jobFilters"],
};

const rootReducer = combineReducers({
  auth: authReducer,
  ui: uiReducer,
  jobFilters: jobFiltersReducer,
  notifications: notificationsReducer,
  [apiSlice.reducerPath]: apiSlice.reducer,
});

const persistedReducer = persistReducer(persistConfig, rootReducer);

// Module-level singleton: Next.js may evaluate this module more than once
// (server + client bundles, HMR), and there must only ever be one store.
let storeSingleton = null;
let persistorSingleton = null;

export function makeStore() {
  if (!storeSingleton) {
    storeSingleton = configureStore({
      reducer: persistedReducer,
      middleware: (getDefaultMiddleware) =>
        getDefaultMiddleware({
          serializableCheck: {
            // `auth.user` is a live Firebase user object mirrored from
            // AuthContext (non-serializable by nature).
            ignoredActions: [syncAuth.type],
            ignoredPaths: ["auth.user"],
          },
        }).concat(apiSlice.middleware),
    });
    // Enables refetchOnFocus / refetchOnReconnect for RTK Query.
    setupListeners(storeSingleton.dispatch);
  }
  return storeSingleton;
}

/** Starts redux-persist for the store. Client-only; safe to call repeatedly. */
export function startPersist(store) {
  if (!persistorSingleton) {
    persistorSingleton = persistStore(store);
  }
  return persistorSingleton;
}
