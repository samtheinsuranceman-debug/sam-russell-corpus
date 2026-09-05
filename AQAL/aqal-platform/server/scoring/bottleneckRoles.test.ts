import { describe, it, expect } from "vitest";
import { bottleneckRole, BOTTLENECK_ROLE, MECHANISM_META } from "@shared/bottleneckRoles";
import { ALL_AXES } from "@shared/axisModes";

describe("bottleneck roles — naming the failure mechanism of the weakest line", () => {
  it("covers every one of the 32 axes with a real failure mode", () => {
    for (const axis of ALL_AXES) {
      const role = bottleneckRole(axis);
      expect(["liebig", "oring", "toc"]).toContain(role.mechanism);
      expect(role.failureMode.length).toBeGreaterThan(20);
      expect(role.label).toBe(MECHANISM_META[role.mechanism].label);
    }
  });

  it("falls back to a throughput constraint for an unknown line", () => {
    const role = bottleneckRole("NotARealLine");
    expect(role.mechanism).toBe("toc");
    expect(role.failureMode.length).toBeGreaterThan(0);
  });

  it("keeps self-regulation on the Liebig mechanism (it sets the barrel height)", () => {
    expect(bottleneckRole("Intrapersonal").mechanism).toBe("liebig");
    expect(bottleneckRole("Volitional").mechanism).toBe("liebig");
    expect(bottleneckRole("Existential").mechanism).toBe("liebig");
  });

  it("keeps collaboration/data-quality lines on the O-Ring mechanism (multiplicative)", () => {
    expect(bottleneckRole("Interpersonal").mechanism).toBe("oring");
    expect(bottleneckRole("Empathic").mechanism).toBe("oring");
    expect(bottleneckRole("Adversarial").mechanism).toBe("oring");
  });

  it("has no empty failure modes in the table", () => {
    for (const [axis, role] of Object.entries(BOTTLENECK_ROLE)) {
      expect(role.failureMode.trim().length, `empty failureMode for ${axis}`).toBeGreaterThan(0);
    }
  });
});
