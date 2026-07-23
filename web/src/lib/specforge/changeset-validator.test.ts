import { describe, expect, it } from "vitest";

import { validateChangeSet } from "./changeset-validator";
import type { ChangeSet } from "./changeset";
import type { StoredPatch } from "./contracts";

function makeChangeSet(overrides: Partial<ChangeSet> = {}): ChangeSet {
  return {
    id: "cs_1",
    documentId: "doc_1",
    name: "test changeset",
    description: "a clear description",
    createdAt: "2026-07-23T00:00:00Z",
    createdBy: { actor_type: "human", actor_id: "u1" },
    scope: {
      affectsProposal: false,
      affectsDesign: false,
      affectsRequirements: false,
      affectsAcceptance: false,
      affectsTasks: false,
    },
    patches: [],
    impact: {} as ChangeSet["impact"],
    status: "draft",
    ...overrides,
  };
}

function makePatch(overrides: Partial<StoredPatch> = {}): StoredPatch {
  return {
    patch_id: "p_1",
    document_id: "doc_1",
    block_id: "b_1",
    section_id: "s_1",
    operation: "replace",
    content: "updated content",
    patch_type: "wording_formatting",
    rationale: "typo fix",
    proposed_by: { actor_type: "human", actor_id: "u1" },
    base_version: 1,
    target_fingerprint: "abc123",
    confidence: 0.9,
    status: "proposed",
    created_at: "2026-07-23T00:00:00Z",
    ...overrides,
  };
}

describe("validateChangeSet", () => {
  it("perfect changeset returns score 100 and no warnings", () => {
    const cs = makeChangeSet({ description: "meaningful description" });
    const patches = [
      makePatch({ block_id: "b1" }),
      makePatch({ patch_id: "p2", block_id: "b2" }),
    ];
    const result = validateChangeSet(cs, patches);
    expect(result.score).toBe(100);
    expect(result.warnings).toHaveLength(0);
    expect(result.checks.backwardCompatible).toBe(true);
    expect(result.checks.hasDescription).toBe(true);
    expect(result.checks.patchCountReasonable).toBe(true);
  });

  it("delete operation sets backwardCompatible=false and reduces score", () => {
    const cs = makeChangeSet();
    const patches = [makePatch({ operation: "delete" })];
    const result = validateChangeSet(cs, patches);
    expect(result.checks.backwardCompatible).toBe(false);
    expect(result.score).toBeLessThan(100);
    expect(result.warnings.some((w) => /backward/i.test(w))).toBe(true);
  });

  it("missing description sets hasDescription=false and reduces score", () => {
    const cs = makeChangeSet({ description: "" });
    const patches = [makePatch()];
    const result = validateChangeSet(cs, patches);
    expect(result.checks.hasDescription).toBe(false);
    expect(result.score).toBeLessThan(100);
    expect(result.warnings.some((w) => /description/i.test(w))).toBe(true);
  });

  it("whitespace-only description treated as absent", () => {
    const cs = makeChangeSet({ description: "   " });
    const patches = [makePatch()];
    const result = validateChangeSet(cs, patches);
    expect(result.checks.hasDescription).toBe(false);
  });

  it("patch count over 20 sets patchCountReasonable=false and reduces score", () => {
    const cs = makeChangeSet();
    const patches = Array.from({ length: 21 }, (_, i) =>
      makePatch({ patch_id: `p_${i}`, block_id: `b_${i}` }),
    );
    const result = validateChangeSet(cs, patches);
    expect(result.checks.patchCountReasonable).toBe(false);
    expect(result.score).toBeLessThan(100);
    expect(result.warnings.some((w) => /large number/i.test(w))).toBe(true);
  });

  it("exactly 20 patches is considered reasonable", () => {
    const cs = makeChangeSet();
    const patches = Array.from({ length: 20 }, (_, i) =>
      makePatch({ patch_id: `p_${i}`, block_id: `b_${i}` }),
    );
    const result = validateChangeSet(cs, patches);
    expect(result.checks.patchCountReasonable).toBe(true);
  });

  it("score never goes below zero when all checks fail", () => {
    const cs = makeChangeSet({ description: "" });
    const patches = [
      makePatch({ operation: "delete" }),
      ...Array.from({ length: 25 }, (_, i) =>
        makePatch({ patch_id: `p_${i}`, block_id: `b_${i}` }),
      ),
    ];
    const result = validateChangeSet(cs, patches);
    expect(result.score).toBeGreaterThanOrEqual(0);
  });

  it("empty patch list has reasonable count and no backward-compat warning", () => {
    const cs = makeChangeSet();
    const result = validateChangeSet(cs, []);
    expect(result.checks.patchCountReasonable).toBe(true);
    expect(result.checks.backwardCompatible).toBe(true);
  });

  it("returned structure always has score, checks, and warnings", () => {
    const result = validateChangeSet(makeChangeSet(), []);
    expect(typeof result.score).toBe("number");
    expect(result.checks).toBeDefined();
    expect(Array.isArray(result.warnings)).toBe(true);
  });
});
