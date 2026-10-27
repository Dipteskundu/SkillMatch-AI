"use client";

import { useAuth } from "../lib/AuthContext";
import { useNotificationsPolling } from "./api/apiSlice";

/**
 * Mounts the single, app-wide notifications polling subscription.
 * Renders nothing — polling/focus-refetch configuration lives once in
 * `useNotificationsPolling`. Badges and the panel read from the
 * notifications slice, so no other component needs to fetch.
 */
export default function NotificationSync() {
  const { user } = useAuth();
  useNotificationsPolling(user?.uid);
  return null;
}
