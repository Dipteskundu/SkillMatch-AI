import { describe, it, expect } from "vitest";
import { render } from "@testing-library/react";
import Skeleton from "./Skeleton";

function el(container) {
  return container.firstElementChild;
}

describe("Skeleton", () => {
  it("renders an aria-hidden pulsing placeholder", () => {
    const { container } = render(<Skeleton />);
    const node = el(container);
    expect(node).toBeInTheDocument();
    expect(node).toHaveAttribute("aria-hidden", "true");
    expect(node.className).toContain("bg-slate-200");
    expect(node.className).toContain("animate-pulse");
  });

  it("applies the requested variant class", () => {
    const { container: text } = render(<Skeleton variant="text" />);
    expect(el(text).className).toContain("rounded-md");
    expect(el(text).className).toContain("h-4");
    expect(el(text).className).toContain("w-full");

    const { container: circle } = render(<Skeleton variant="circular" />);
    expect(el(circle).className).toContain("rounded-full");

    const { container: rounded } = render(<Skeleton variant="rounded" />);
    expect(el(rounded).className).toContain("rounded-[2rem]");
  });

  it("falls back to the rectangular variant for unknown variants", () => {
    const { container } = render(<Skeleton variant="banana" />);
    expect(el(container).className).toContain("rounded-lg");
  });

  it("merges the caller-supplied className last", () => {
    const { container } = render(<Skeleton className="mt-4 h-16" variant="rectangular" />);
    const className = el(container).className;
    expect(className).toContain("mt-4");
    expect(className).toContain("h-16");
    expect(className).toContain("rounded-lg");
  });
});
