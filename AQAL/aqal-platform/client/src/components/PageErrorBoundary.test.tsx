import { createElement, isValidElement, type ReactNode } from "react";
import { describe, expect, it, vi } from "vitest";
import PageErrorBoundary from "./PageErrorBoundary";

function textOf(node: ReactNode): string {
  if (node === null || node === undefined || typeof node === "boolean") return "";
  if (typeof node === "string" || typeof node === "number") return String(node);
  if (Array.isArray(node)) return node.map(textOf).join(" ");
  if (isValidElement<{ children?: ReactNode }>(node)) return textOf(node.props.children);
  return "";
}

function findRetry(node: ReactNode): (() => void) | undefined {
  if (!isValidElement<{ children?: ReactNode; onClick?: () => void }>(node)) {
    if (Array.isArray(node)) {
      for (const child of node) {
        const found = findRetry(child);
        if (found) return found;
      }
    }
    return undefined;
  }
  const props = node.props;
  if (typeof props.onClick === "function" && /Try Again/i.test(textOf(props.children))) {
    return props.onClick;
  }
  return findRetry(props.children);
}

describe("PageErrorBoundary", () => {
  it("isolates a page failure, exposes retry/home controls, and restores its child on retry", () => {
    const healthyChild = createElement("section", null, "Research library healthy");
    const boundary = new PageErrorBoundary({
      pageName: "Research Library",
      children: healthyChild,
    });
    const error = new Error("forced lazy-page failure");

    boundary.state = PageErrorBoundary.getDerivedStateFromError(error);
    const fallback = boundary.render();
    const fallbackText = textOf(fallback);

    expect(fallbackText).toContain("Something went wrong on Research Library");
    expect(fallbackText).toContain("This page encountered an error");
    expect(fallbackText).toContain("forced lazy-page failure");
    expect(fallbackText).toContain("Try Again");
    expect(fallbackText).toContain("Go Home");

    boundary.setState = vi.fn((next) => {
      boundary.state = { ...boundary.state, ...(next as typeof boundary.state) };
    }) as typeof boundary.setState;
    const retry = findRetry(fallback);
    expect(retry).toBeTypeOf("function");
    retry?.();

    expect(boundary.state).toEqual({ hasError: false, error: null });
    expect(boundary.render()).toBe(healthyChild);
  });
});
