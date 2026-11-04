import api from "./apiClient";

/**
 * List agent "offers" available to the logged-in role.
 * @returns {Promise<Array<{id, label, role, description}>>}
 */
export async function fetchAgents() {
  const response = await api.get("/api/agents");
  return response.data?.agents || [];
}

/**
 * Ask an agent to build a proposal (dry-run — writes nothing until approved).
 * @returns {Promise<{ action: {_id, agentId, summary, proposal, status} }>}
 */
export async function proposeAgent(agentId, opts = {}) {
  const response = await api.post(`/api/agents/${agentId}/propose`, opts);
  return response.data;
}

/**
 * Approve (and execute) or reject a pending agent action (human in the loop).
 */
export async function decideAction(actionId, decision) {
  const response = await api.post(`/api/agents/actions/${actionId}/${decision}`);
  return response.data;
}

/**
 * Activity log: pending + past agent actions for the current user.
 */
export async function fetchAgentActions(status) {
  const response = await api.get(
    "/api/agents/actions",
    status ? { params: { status } } : {}
  );
  return response.data?.actions || [];
}

/* ── Interview prep ─────────────────────────────────────────────── */

export async function startPrep(opts = {}) {
  const response = await api.post("/api/interview-prep/start", opts);
  return response.data;
}

export async function submitPrep(sessionId, answers) {
  const response = await api.post(`/api/interview-prep/${sessionId}/submit`, { answers });
  return response.data;
}

export async function fetchPrepSessions() {
  const response = await api.get("/api/interview-prep/sessions");
  return response.data?.sessions || [];
}
