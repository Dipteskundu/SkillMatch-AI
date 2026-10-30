"use client";

import { useEffect, useState } from "react";
import { apiFetch } from "../../../../lib/apiClient";

export default function AdminPathsPage() {
  const [paths, setPaths] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;
    ;(async () => {
      try {
        setLoading(true);
        const res = await apiFetch("/api/v1/admin/learning/paths", {
          headers: { role: "admin" },
        });
        const data = await res.json();
        setPaths(data?.data || []);
        setError(data?.error || "");
      } catch (err) {
        setError("Failed to load paths.");
      } finally {
        setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const loadPaths = async () => {
    try {
      const res = await apiFetch("/api/v1/admin/learning/paths", {
        headers: { role: "admin" },
      });
      const data = await res.json();
      setPaths(data?.data || []);
    } catch (err) {
      setError("Failed to reload paths.");
    }
  };

  if (loading) {
    return null;
  }

  if (error) {
    return <div>Error: {error}</div>;
  }

  return <div className="p-4"><h1>Admin Paths</h1><p>Paths management page</p></div>;
}