import { describe, it, expect } from "vitest";
import { safeRedirectPath, signInUrlWithReturn } from "./redirect";

describe("safeRedirectPath (LH-004)", () => {
  it("accepts ordinary in-app paths", () => {
    expect(safeRedirectPath("/learning-hub")).toBe("/learning-hub");
    expect(safeRedirectPath("/jobs?search=react")).toBe("/jobs?search=react");
    expect(safeRedirectPath("/learning-hub/paths/abc")).toBe("/learning-hub/paths/abc");
    expect(safeRedirectPath("  /dashboard  ")).toBe("/dashboard");
  });

  it("strips the fragment", () => {
    expect(safeRedirectPath("/learn#top")).toBe("/learn");
  });

  it("rejects protocol-relative URLs (open redirect)", () => {
    expect(safeRedirectPath("//evil.com")).toBe("/");
    expect(safeRedirectPath("//evil.com/phish")).toBe("/");
    expect(safeRedirectPath("/\\evil.com")).toBe("/");
  });

  it("rejects absolute and non-http schemes", () => {
    expect(safeRedirectPath("https://evil.com")).toBe("/");
    expect(safeRedirectPath("javascript:alert(1)")).toBe("/");
    expect(safeRedirectPath("data:text/html,x")).toBe("/");
  });

  it("rejects malformed or empty input", () => {
    expect(safeRedirectPath("")).toBe("/");
    expect(safeRedirectPath("   ")).toBe("/");
    expect(safeRedirectPath(null)).toBe("/");
    expect(safeRedirectPath(undefined)).toBe("/");
    expect(safeRedirectPath(42)).toBe("/");
    expect(safeRedirectPath("jobs")).toBe("/");
  });

  it("rejects control characters", () => {
    expect(safeRedirectPath("/jobs\nevil")).toBe("/");
    expect(safeRedirectPath("/jobs\rSet-Cookie: x")).toBe("/");
  });
});

describe("signInUrlWithReturn", () => {
  it("appends an encoded redirect param", () => {
    expect(signInUrlWithReturn("/learning-hub/paths/react-nextjs")).toBe(
      "/signin?redirect=%2Flearning-hub%2Fpaths%2Freact-nextjs",
    );
  });

  it("omits the param when the path is unsafe", () => {
    expect(signInUrlWithReturn("//evil.com")).toBe("/signin");
    expect(signInUrlWithReturn("")).toBe("/signin");
  });
});
