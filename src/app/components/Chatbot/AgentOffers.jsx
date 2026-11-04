"use client";

import { useCallback, useEffect, useState } from "react";
import { Sparkles, RefreshCw, Check, X, History, Bot } from "lucide-react";
import {
  fetchAgents,
  proposeAgent,
  decideAction,
  fetchAgentActions,
} from "../../lib/agentApi";

/**
 * Agent "offers" panel: AI proposes a task → user approves → agent executes.
 * Human-in-the-loop: nothing runs without the Approve button.
 */
export default function AgentOffers() {
  const [agents, setAgents] = useState([]);
  const [actions, setActions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [proposingId, setProposingId] = useState(null);
  const [decidingId, setDecidingId] = useState(null);
  const [showHistory, setShowHistory] = useState(false);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    setError("");
    try {
      const [agentsList, actionsList] = await Promise.all([
        fetchAgents(),
        fetchAgentActions(),
      ]);
      setAgents(agentsList);
      setActions(actionsList);
    } catch (_) {
      setError("Couldn't load your agent offers. Please try again.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const handlePropose = async (agentId) => {
    setProposingId(agentId);
    setError("");
    try {
      await proposeAgent(agentId);
      setActions(await fetchAgentActions());
      setShowHistory(true); // the new pending proposal lives there
    } catch (err) {
      setError(err?.response?.data?.message || "The agent couldn't build a plan right now.");
    } finally {
      setProposingId(null);
    }
  };

  const handleDecide = async (actionId, decision) => {
    setDecidingId(actionId);
    setError("");
    try {
      await decideAction(actionId, decision);
      setActions(await fetchAgentActions());
    } catch (err) {
      setError(err?.response?.data?.message || "Couldn't complete this action.");
    } finally {
      setDecidingId(null);
    }
  };

  const pending = actions.filter((a) => a.status === "pending");
  const history = actions.filter((a) => a.status !== "pending");

  const statusPill = {
    executed: "bg-emerald-50 text-emerald-700 border-emerald-200",
    approved: "bg-indigo-50 text-indigo-700 border-indigo-200",
    rejected: "bg-slate-100 text-slate-500 border-slate-200",
    failed: "bg-rose-50 text-rose-700 border-rose-200",
  };

  if (loading) {
    return (
      <div className="flex flex-1 items-center justify-center gap-2 py-10 text-[13px] text-slate-400">
        <RefreshCw className="h-4 w-4 animate-spin" /> Loading your offers…
      </div>
    );
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <div className="flex-1 space-y-4 overflow-y-auto px-5 pb-4 pt-3">
        {error && (
          <p className="rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-[12.5px] text-amber-800 leading-relaxed">
            {error}
          </p>
        )}

        {/* Pending proposals: approve or reject */}
        {pending.map((a) => (
          <div key={a._id} className="rounded-2xl border border-indigo-200 bg-white p-4 shadow-sm">
            <div className="mb-2 flex items-center gap-2">
              <Bot className="h-4 w-4 text-indigo-500" />
              <span className="text-[13px] font-semibold text-indigo-700">
                {agents.find((g) => g.id === a.agentId)?.label || a.agentId}
              </span>
              <span className="ml-auto rounded-full border border-indigo-200 bg-indigo-50 px-2 py-0.5 text-[11px] font-medium text-indigo-600">
                needs your approval
              </span>
            </div>
            <p className="text-[13.5px] leading-relaxed text-slate-700">{a.summary}</p>
            {a.proposal?.message && (
              <p className="mt-2 rounded-xl bg-slate-50 px-3 py-2 text-[12.5px] italic text-slate-600 leading-relaxed">
                “{a.proposal.message}”
              </p>
            )}
            {a.proposal?.weeks && (
              <ul className="mt-2 space-y-1 text-[12.5px] text-slate-600">
                {a.proposal.weeks.map((w) => (
                  <li key={w.week}>Week {w.week}: {w.focus}</li>
                ))}
              </ul>
            )}
            {a.proposal?.problems && (
              <ul className="mt-2 list-disc space-y-0.5 pl-4 text-[12.5px] text-slate-600">
                {a.proposal.problems.map((p) => <li key={p}>{p}</li>)}
              </ul>
            )}
            {a.proposal?.ranking && (
              <ol className="mt-2 list-decimal space-y-1 pl-4 text-[12.5px] text-slate-600">
                {a.proposal.ranking.map((r) => (
                  <li key={r.name}>{r.name} — {r.rationale}</li>
                ))}
              </ol>
            )}
            <div className="mt-3 flex gap-2">
              <button
                onClick={() => handleDecide(a._id, "approve")}
                disabled={!!decidingId}
                className="inline-flex items-center gap-1.5 rounded-full bg-[#6452F5] px-3.5 py-1.5 text-[12.5px] font-semibold text-white shadow-sm transition-all hover:bg-indigo-700 disabled:opacity-50"
              >
                {decidingId === a._id ? <RefreshCw className="h-3.5 w-3.5 animate-spin" /> : <Check className="h-3.5 w-3.5" />}
                Approve &amp; Run
              </button>
              <button
                onClick={() => handleDecide(a._id, "reject")}
                disabled={!!decidingId}
                className="inline-flex items-center gap-1.5 rounded-full border border-slate-300 px-3.5 py-1.5 text-[12.5px] font-medium text-slate-600 transition-all hover:bg-slate-50 disabled:opacity-50"
              >
                <X className="h-3.5 w-3.5" /> Reject
              </button>
            </div>
          </div>
        ))}

        {/* Agent offer cards */}
        <div className="space-y-2">
          {agents.map((agent) => (
            <div key={agent.id} className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
              <div className="flex items-center justify-between gap-2">
                <span className="flex items-center gap-2 text-[14px] font-semibold text-slate-900">
                  <Sparkles className="h-4 w-4 text-indigo-500 shrink-0" /> {agent.label}
                </span>
                <button
                  onClick={() => handlePropose(agent.id)}
                  disabled={proposingId === agent.id || !!decidingId}
                  className="shrink-0 rounded-full border border-indigo-200 bg-indigo-50 px-3 py-1.5 text-[12.5px] font-semibold text-indigo-700 transition-all hover:bg-indigo-100 disabled:opacity-50"
                >
                  {proposingId === agent.id ? "Planning…" : "Run agent"}
                </button>
              </div>
              <p className="mt-1.5 text-[12.5px] leading-relaxed text-slate-500">{agent.description}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Activity log toggle */}
      <div className="border-t border-slate-100 bg-white px-5 py-3 shrink-0">
        <button
          onClick={() => setShowHistory((v) => !v)}
          className="inline-flex items-center gap-1.5 text-[12.5px] font-medium text-slate-500 hover:text-slate-700"
        >
          <History className="h-3.5 w-3.5" /> Agent activity log ({history.length})
        </button>
        {showHistory && (
          <ul className="mt-2 max-h-40 space-y-2 overflow-y-auto">
            {history.length === 0 && <li className="text-[12px] text-slate-400">No agent activity yet.</li>}
            {history.map((a) => (
              <li key={a._id} className="flex items-start gap-2 text-[12.5px] text-slate-600">
                <span className={"mt-0.5 shrink-0 rounded-full border px-2 py-0.5 text-[10.5px] font-medium " + (statusPill[a.status] || "")}>
                  {a.status}
                </span>
                <span className="leading-snug">{a.summary}</span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
