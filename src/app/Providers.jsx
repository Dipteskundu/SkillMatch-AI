"use client";

import { AuthProvider } from "./lib/AuthContext";
import { ThemeProvider } from "./lib/ThemeContext";
import NotificationSync from "./store/NotificationSync";

export default function Providers({ children }) {
  return (
    <ThemeProvider>
      <AuthProvider>
        {/* Single app-wide notifications polling subscription (renders nothing) */}
        <NotificationSync />
        {children}
      </AuthProvider>
    </ThemeProvider>
  );
}
