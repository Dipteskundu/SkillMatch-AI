import { describe, it, expect } from "vitest";
import { classifyUploadResponse, classifyStatusResponse } from "./resumeStatus";

describe("classifyUploadResponse", () => {
  it("recognizes the NEW queued shape ({resumeId, extractionStatus:'queued'})", () => {
    expect(classifyUploadResponse({ resumeId: "r1", extractionStatus: "queued" })).toEqual({
      kind: "queued",
      resumeId: "r1",
    });
  });

  it("recognizes a queued status nested under data", () => {
    expect(
      classifyUploadResponse({ success: true, data: { resumeId: "r2", extractionStatus: "queued" } }),
    ).toEqual({ kind: "queued", resumeId: "r2" });
  });

  it("renders the OLD synchronous shape directly (extracted data in data)", () => {
    const data = {
      skills: ["React"],
      technologies: ["Node.js"],
      experience_years: 4,
      role_titles: ["Frontend Dev"],
    };
    const result = classifyUploadResponse({ success: true, data, warning: "partial parse" });

    expect(result.kind).toBe("ready");
    expect(result.result).toEqual(data);
    expect(result.warning).toBe("partial parse");
  });

  it("keeps the old backend's warning alongside the result", () => {
    const result = classifyUploadResponse({
      success: true,
      warning: "AI extraction was unavailable.",
      data: { skills: ["SQL"], experience_years: 0 },
    });
    expect(result.kind).toBe("ready");
    expect(result.warning).toBe("AI extraction was unavailable.");
  });

  it("surfaces a server-side failure message (500-swallowing interceptor shape)", () => {
    const result = classifyUploadResponse({
      success: false,
      message: "Resume file is required",
      data: null,
    });
    expect(result.kind).toBe("error");
    expect(result.message).toBe("Resume file is required");
  });

  it("does not crash on a garbage payload", () => {
    expect(classifyUploadResponse(null).kind).toBe("error");
    expect(classifyUploadResponse("nope").kind).toBe("error");
  });
});

describe("classifyStatusResponse", () => {
  it("keeps polling for queued/processing", () => {
    expect(classifyStatusResponse({ success: true, status: "queued" }).kind).toBe("active");
    expect(classifyStatusResponse({ success: true, data: { status: "processing" } }).kind).toBe(
      "active",
    );
  });

  it("finishes on done and returns the extracted result", () => {
    const result = classifyStatusResponse({
      success: true,
      status: "done",
      data: { skills: ["Python"], experience_years: 2 },
    });

    expect(result.kind).toBe("done");
    expect(result.result).toEqual({ skills: ["Python"], experience_years: 2 });
  });

  it("reads a status nested under data with a result container", () => {
    const result = classifyStatusResponse({
      success: true,
      data: { status: "completed", result: { skills: ["Go"] } },
    });
    expect(result.kind).toBe("done");
    expect(result.result).toEqual({ skills: ["Go"] });
  });

  it("finishes on a payload with the extracted fields and no status at all", () => {
    const result = classifyStatusResponse({
      success: true,
      data: { skills: ["Vue"], technologies: ["Vite"] },
    });
    expect(result.kind).toBe("done");
    expect(result.result.skills).toEqual(["Vue"]);
  });

  it("flags injection results as suspicious while still returning the data", () => {
    const result = classifyStatusResponse({
      success: true,
      status: "suspicious",
      injectionFlags: ["ignore previous instructions"],
      data: { skills: ["C++"] },
    });

    expect(result.kind).toBe("suspicious");
    expect(result.injectionFlags).toEqual(["ignore previous instructions"]);
    expect(result.result).toEqual({ skills: ["C++"] });
  });

  it("treats done + injection flags as suspicious too", () => {
    const result = classifyStatusResponse({
      success: true,
      status: "done",
      injectionFlags: ["flag"],
      data: { skills: ["Java"] },
    });
    expect(result.kind).toBe("suspicious");
  });

  it("reports failures with the server message", () => {
    const result = classifyStatusResponse({ success: false, status: "failed", message: "boom" });
    expect(result).toMatchObject({ kind: "failed", message: "boom" });
  });

  it("returns unknown for an unrecognizable payload", () => {
    expect(classifyStatusResponse({ success: false, message: "nope" }).kind).toBe("unknown");
    expect(classifyStatusResponse(undefined).kind).toBe("unknown");
  });
});
