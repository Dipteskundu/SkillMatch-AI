import { describe, it, expect, vi, beforeAll } from "vitest";

// The API client pulls in Firebase — keep the module graph hermetic.
vi.mock("./apiClient", () => ({
  default: { post: vi.fn(), get: vi.fn(), delete: vi.fn() },
}));

import { askBot, normalizeAskResponse } from "./chatbotApi";
import api from "./apiClient";

describe("normalizeAskResponse", () => {
  it("reads the NEW career-agent shape (answer + sources + grounded)", () => {
    const result = normalizeAskResponse({
      success: true,
      data: {
        answer: "Three roles match your profile.",
        grounded: true,
        intent: "job_search",
        sources: [
          { type: "job", id: "abc123", title: "Senior React Dev", company: "Acme" },
          { type: "job", id: "def456", title: "Frontend Engineer", company: "Globex" },
        ],
      },
    });

    expect(result.answer).toBe("Three roles match your profile.");
    expect(result.grounded).toBe(true);
    expect(result.intent).toBe("job_search");
    expect(result.sources).toEqual([
      { type: "job", id: "abc123", title: "Senior React Dev", company: "Acme" },
      { type: "job", id: "def456", title: "Frontend Engineer", company: "Globex" },
    ]);
  });

  it("reads the OLD shape (assistant + link) with no sources/grounded", () => {
    const result = normalizeAskResponse({
      success: true,
      assistant: "You have 4 applications.",
      link: { label: "View applications", path: "/applications" },
    });

    expect(result.answer).toBe("You have 4 applications.");
    expect(result.sources).toEqual([]);
    expect(result.grounded).toBeNull();
    expect(result.link).toEqual({ label: "View applications", path: "/applications" });
  });

  it("drops malformed sources instead of crashing the chat UI", () => {
    const result = normalizeAskResponse({
      success: true,
      data: { answer: "hi", sources: [{ title: "no id" }, null, { id: "1", title: "Backend Dev" }] },
    });

    expect(result.sources).toEqual([
      { type: "job", id: "1", title: "Backend Dev", company: "" },
    ]);
  });

  it("survives a payload with no recognizable answer", () => {
    const result = normalizeAskResponse(undefined);
    expect(result.answer).toBe("");
    expect(result.sources).toEqual([]);
    expect(result.link).toBeNull();
  });
});

describe("askBot", () => {
  beforeAll(() => {
    api.post.mockResolvedValue({
      data: { success: true, data: { answer: "A", grounded: false, sources: [] } },
    });
  });

  it("POSTs the prompt and returns the normalized payload", async () => {
    const result = await askBot("what roles are open?", undefined);

    expect(api.post).toHaveBeenCalledWith("/api/chatbot/ask", { prompt: "what roles are open?" }, {});
    expect(result.answer).toBe("A");
    expect(result.grounded).toBe(false);
  });

  it("forwards the abort signal when given", async () => {
    const controller = new AbortController();
    await askBot("again", controller.signal);
    expect(api.post).toHaveBeenLastCalledWith(
      "/api/chatbot/ask",
      { prompt: "again" },
      { signal: controller.signal },
    );
  });
});
