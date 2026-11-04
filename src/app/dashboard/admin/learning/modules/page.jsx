"use client";

import { useEffect, useState } from "react";
import { apiFetch } from "../../../../lib/apiClient";

export default function AdminModulesPage() {
  const [modules, setModules] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;
    ;(async () => {
      try {
        setLoading(true);
        const res = await apiFetch("/api/v1/admin/learning/modules", {
          headers: { role: "admin" },
        });
        const data = await res.json();
        setModules(data?.data || []);
        setError(data?.error || "");
      } catch (err) {
        setError("Failed to load modules.");
      } finally {
        setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const loadModules = async () => {
    try {
      const res = await apiFetch("/api/v1/admin/learning/modules", {
        headers: { role: "admin" },
      });
      const data = await res.json();
      setModules(data?.data || []);
    } catch (err) {
      setError("Failed to reload modules.");
    }
  };

  if (loading) {
    return null;
  }

  if (error) {
    return <div>Error: {error}</div>;
  }

  return <div className="p-4"><h1>Admin Modules</h1><p>Modules management page</p></div>;
}