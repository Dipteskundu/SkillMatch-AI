"use client";

// /admin/api-keys — Phase 5 key management for the public API. The plaintext
// key is displayed EXACTLY once (at creation) and can never be retrieved
// again; the list shows prefixes only.

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "../../../lib/AuthContext";
import api from "../../../lib/apiClient";
import {
  KeyRound,
  Copy,
  Trash2,
  Loader2,
  AlertCircle,
  Plus,
  ExternalLink,
  CheckCircle2,
} from "lucide-react";

export default function ApiKeysPage() {
  const { role, isAuthenticated, loading: authLoading } = useAuth();
  const router = useRouter();

  const [keys, setKeys] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [creating, setCreating] = useState(false);
  const [newName, setNewName] = useState("");
  const [freshKey, setFreshKey] = useState(null);
  const [copied, setCopied] = useState(false);
  const [actionMsg, setActionMsg] = useState(null);

  useEffect(() => {
    if (authLoading) return;
    if (!isAuthenticated) {
      router.push("/signin?redirect=/admin/api-keys");
      return;
    }
    if (role !== "admin") {
      router.push("/dashboard");
      return;
    }

    let cancelled = false;
    (async () => {
      try {
        const res = await api.get("/api/admin/api-keys");
        if (!cancelled) {
          if (res.data?.success) setKeys(res.data.data?.keys || []);
          else setError("Could not load API keys.");
        }
      } catch {
        if (!cancelled) setError("Error connecting to server.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [authLoading, isAuthenticated, role, router]);

  async function createKey(e) {
    e.preventDefault();
    if (!newName.trim()) return;
    setCreating(true);
    setError(null);
    try {
      const res = await api.post("/api/admin/api-keys", {
        name: newName.trim(),
      });
      const data = res.data?.data;
      if (res.data?.success && data) {
        setFreshKey(data);
        setKeys((prev) => [
          {
            _id: data._id,
            name: data.name,
            keyPrefix: data.keyPrefix,
            rateLimitPerMin: data.rateLimitPerMin,
            active: true,
            createdAt: data.createdAt,
          },
          ...prev,
        ]);
        setNewName("");
      } else {
        setError(res.data?.message || "Could not create key.");
      }
    } catch {
      setError("Error connecting to server.");
    } finally {
      setCreating(false);
    }
  }

  async function revokeKey(id) {
    if (!window.confirm("Revoke this key? Integrations using it will stop immediately.")) {
      return;
    }
    setActionMsg(null);
    try {
      const res = await api.delete(`/api/admin/api-keys/${id}`);
      if (res.data?.success) {
        setKeys((prev) =>
          prev.map((k) =>
            k._id === id
              ? { ...k, active: false, revokedAt: new Date().toISOString() }
              : k,
          ),
        );
        setActionMsg({ ok: true, text: "Key revoked." });
      } else {
        setActionMsg({ ok: false, text: "Could not revoke the key." });
      }
    } catch {
      setActionMsg({ ok: false, text: "Error connecting to server." });
    }
  }

  async function copyKey() {
    if (!freshKey?.key) return;
    try {
      await navigator.clipboard.writeText(freshKey.key);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch {
      setCopied(false);
    }
  }

  if (authLoading || !isAuthenticated || role !== "admin") {
    return (
      <div className="flex items-center justify-center min-h-[50vh] text-muted-foreground text-sm">
        <Loader2 className="w-5 h-5 animate-spin mr-2" aria-hidden="true" />
        Checking access…
      </div>
    );
  }

  return (
    <div className="space-y-6 text-foreground">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <KeyRound className="w-6 h-6 text-indigo-600" aria-hidden="true" />
            Public API Keys
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Keys authenticate <code className="text-xs">/api/public/v1</code> —
            60 requests/min per key by default. Only a hash is stored; the full
            key shows once below.
          </p>
        </div>
        <a
          href="/api/public/v1/jobs"
          target="_blank"
          rel="noreferrer"
          className="text-sm font-semibold text-indigo-600 hover:underline inline-flex items-center gap-1.5"
        >
          API docs <ExternalLink className="w-3.5 h-3.5" aria-hidden="true" />
        </a>
      </header>

      {/* Create */}
      <form
        onSubmit={createKey}
        className="bg-white rounded-2xl border border-slate-200 p-5 flex flex-col sm:flex-row sm:items-center gap-3"
      >
        <label htmlFor="key-name" className="sr-only">
          Key name
        </label>
        <input
          id="key-name"
          type="text"
          value={newName}
          onChange={(e) => setNewName(e.target.value)}
          placeholder="Key name (e.g. website integration)"
          maxLength={80}
          className="flex-1 px-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
        />
        <button
          type="submit"
          disabled={creating || !newName.trim()}
          className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold bg-indigo-600 text-white hover:bg-indigo-700 disabled:opacity-60 transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-400"
        >
          {creating ? (
            <Loader2 className="w-4 h-4 animate-spin" aria-hidden="true" />
          ) : (
            <Plus className="w-4 h-4" aria-hidden="true" />
          )}
          Create key
        </button>
      </form>

      {/* One-time key reveal */}
      {freshKey && (
        <div
          role="status"
          className="rounded-2xl border border-emerald-300 bg-emerald-50 p-5"
        >
          <p className="text-sm font-bold text-emerald-900 flex items-center gap-2 mb-2">
            <CheckCircle2 className="w-4 h-4" aria-hidden="true" />
            Key created — copy it now, it won&apos;t be shown again
          </p>
          <div className="flex flex-col sm:flex-row items-stretch gap-2">
            <code className="flex-1 bg-white border border-emerald-200 rounded-lg px-3 py-2.5 text-xs break-all">
              {freshKey.key}
            </code>
            <button
              type="button"
              onClick={copyKey}
              className="inline-flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-lg text-xs font-bold bg-emerald-600 text-white hover:bg-emerald-700 transition-colors"
            >
              {copied ? (
                <CheckCircle2 className="w-3.5 h-3.5" aria-hidden="true" />
              ) : (
                <Copy className="w-3.5 h-3.5" aria-hidden="true" />
              )}
              {copied ? "Copied" : "Copy"}
            </button>
          </div>
        </div>
      )}

      {error && (
        <p role="alert" className="text-sm text-amber-700 bg-amber-50 border border-amber-200 rounded-xl p-4 flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" aria-hidden="true" />
          {error}
        </p>
      )}
      {actionMsg && (
        <p
          role="status"
          className={`text-sm rounded-xl p-4 flex items-center gap-2 ${
            actionMsg.ok
              ? "text-emerald-700 bg-emerald-50 border border-emerald-200"
              : "text-amber-700 bg-amber-50 border border-amber-200"
          }`}
        >
          <AlertCircle className="w-4 h-4 shrink-0" aria-hidden="true" />
          {actionMsg.text}
        </p>
      )}

      {/* List */}
      <section aria-labelledby="keys-heading" className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
        <h2 id="keys-heading" className="sr-only">
          Existing keys
        </h2>
        {loading ? (
          <div className="p-6 text-sm text-muted-foreground flex items-center gap-2">
            <Loader2 className="w-4 h-4 animate-spin" aria-hidden="true" />
            Loading keys…
          </div>
        ) : keys.length === 0 ? (
          <p className="p-6 text-sm text-muted-foreground">
            No API keys yet — create one above to integrate the public API.
          </p>
        ) : (
          <ul role="list" className="divide-y divide-slate-100">
            {keys.map((k) => (
              <li
                key={k._id}
                className="p-4 sm:px-6 flex flex-wrap items-center gap-3"
              >
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold truncate">{k.name}</p>
                  <p className="text-xs text-muted-foreground font-mono mt-0.5">
                    {k.keyPrefix}…{" "}
                    <span className="font-sans">
                      · {k.rateLimitPerMin}/min
                      {k.lastUsedAt
                        ? ` · last used ${new Date(k.lastUsedAt).toLocaleString()}`
                        : " · never used"}
                    </span>
                  </p>
                </div>
                {k.active ? (
                  <>
                    <span className="text-[11px] font-bold uppercase tracking-wide text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-1 rounded-full">
                      Active
                    </span>
                    <button
                      type="button"
                      onClick={() => revokeKey(k._id)}
                      className="inline-flex items-center gap-1.5 text-xs font-semibold text-red-600 hover:text-red-700 border border-red-200 hover:bg-red-50 rounded-lg px-3 py-1.5 transition-colors"
                      aria-label={`Revoke key ${k.name}`}
                    >
                      <Trash2 className="w-3.5 h-3.5" aria-hidden="true" />
                      Revoke
                    </button>
                  </>
                ) : (
                  <span className="text-[11px] font-bold uppercase tracking-wide text-slate-500 bg-slate-100 border border-slate-200 px-2 py-1 rounded-full">
                    Revoked
                  </span>
                )}
              </li>
            ))}
          </ul>
        )}
      </section>

      <p className="text-xs text-muted-foreground">
        Endpoints, filters and error codes are documented in{" "}
        <code className="text-[11px] bg-slate-100 px-1.5 py-0.5 rounded">
          docs/PUBLIC_API.md
        </code>{" "}
        in the repository. The bundled MCP server (
        <code className="text-[11px] bg-slate-100 px-1.5 py-0.5 rounded">
          SkillMatch-AI-MCP
        </code>
        ) uses this same API.
      </p>
    </div>
  );
}
