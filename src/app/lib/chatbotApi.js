import api from "./apiClient";

/**
 * Normalize the `/api/chatbot/ask` response across backend versions.
 *
 * - NEW career-agent shape:
 *   `{ success, data: { answer, sources: [{type,id,title,company}], grounded, intent? } }`
 * - OLD shape (still deployed): `{ success, assistant, link }`
 *
 * Unknown/malformed fields degrade to safe defaults so the chat UI never
 * crashes on a backend that hasn't been upgraded yet.
 *
 * @param {any} payload raw response body
 * @returns {{answer: string, sources: Array<{type: string, id: string, title: string, company: string}>, grounded: boolean|null, link: {label: string, path: string}|null, intent: string|undefined}}
 */
export function normalizeAskResponse(payload) {
  const data =
    payload && typeof payload === "object" && payload.data && typeof payload.data === "object"
      ? payload.data
      : null;

  const answer = String(data?.answer ?? payload?.assistant ?? "").trim();

  const sources = (Array.isArray(data?.sources) ? data.sources : [])
    .filter((source) => source && typeof source === "object" && (source.id || source._id))
    .map((source) => ({
      type: String(source.type || "job"),
      id: String(source.id || source._id),
      title: String(source.title || source.name || "Untitled role"),
      company: source.company ? String(source.company) : "",
    }));

  const grounded = typeof data?.grounded === "boolean" ? data.grounded : null;
  const link = payload?.link || data?.link || null;
  const intent = data?.intent;

  return { answer, sources, grounded, link, intent };
}

/**
 * Ask the chatbot a question.
 * @param {string} prompt
 * @param {AbortSignal} [signal]
 * @returns {Promise<{answer: string, sources: Array<{type: string, id: string, title: string, company: string}>, grounded: boolean|null, link: {label: string, path: string}|null, intent?: string}>}
 */
export async function askBot(prompt, signal) {
  const response = await api.post(
    "/api/chatbot/ask",
    { prompt },
    signal ? { signal } : {}
  );
  return normalizeAskResponse(response.data);
}

/**
 * Fetch the user's persistent chat history.
 * @returns {Promise<Array<{ sender: string, text: string, createdAt: string }>>}
 */
export async function fetchHistory() {
  const response = await api.get("/api/chatbot/history");
  return response.data?.messages || [];
}

/**
 * Clear the user's chat history on the backend.
 * @returns {Promise<void>}
 */
export async function clearHistory() {
  await api.delete("/api/chatbot/history");
}
