"use client";

import { useEffect, useState } from "react";
import { apiFetch } from "../../../../lib/apiClient";

export default function AdminLessonsPage() {
  const [lessons, setLessons] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;
    ;(async () => {
      try {
        setLoading(true);
        const res = await apiFetch("/api/v1/admin/learning/lessons", {
          headers: { role: "admin" },
        });
        const data = await res.json();
        setLessons(data?.data || []);
        setError(data?.error || "");
      } catch (err) {
        setError("Failed to load lessons.");
      } finally {
        setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const loadLessons = async () => {
    try {
      const res = await apiFetch("/api/v1/admin/learning/lessons", {
        headers: { role: "admin" },
      });
      const data = await res.json();
      setLessons(data?.data || []);
    } catch (err) {
      setError("Failed to reload lessons.");
    }
  };

  if (loading) {
    return null;
  }

  if (error) {
    return <div>Error: {error}</div>;
  }

  return <div className="p-4"><h1>Admin Lessons</h1><p>Lessons management page</p></div>;
}