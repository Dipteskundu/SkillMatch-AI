"use client";

import { useEffect, useState } from "react";
import { AlertTriangle, CheckCircle2, Loader2, X, Trash2, Eye, Clock, BarChart2, Zap } from "lucide-react";
import { apiFetch } from "../../../../lib/apiClient";

export default function AdminAssessmentsPage() {
  const [assessments, setAssessments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;
    ;(async () => {
      try {
        setLoading(true);
        const res = await apiFetch("/api/v1/admin/learning/assessments", {
          headers: { role: "admin" },
        });
        const data = await res.json();
        setAssessments(data?.data || []);
        setError(data?.error || "");
      } catch (err) {
        setError("Failed to load assessments.");
      } finally {
        setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const loadAssessments = async () => {
    try {
      const res = await apiFetch("/api/v1/admin/learning/assessments", {
        headers: { role: "admin" },
      });
      const data = await res.json();
      setAssessments(data?.data || []);
    } catch (err) {
      setError("Failed to reload assessments.");
    }
  };

  if (loading) {
    return null;
  }

  if (error) {
    return <div>Error: {error}</div>;
  }

  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold mb-4">Admin Assessments</h1>
      <p>Assessments management page</p>
    </div>
  );
}