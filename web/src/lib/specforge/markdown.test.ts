import { describe, expect, it } from "vitest";
import { applyPatchToMarkdown, deriveDocumentShape } from "./markdown";

describe("applyPatchToMarkdown", () => {
  it("replaces a section cleanly", () => {
    const markdown = "# Title\n\n## Problem\n\n- line 1\n- line 2\n\n## Goals\n\n- goal 1\n";
    const result = applyPatchToMarkdown({
      markdown,
      block_id: "blk_problem_1",
      operation: "replace",
      content: "## Problem\n\n- new line 1\n- new line 2\n",
    });

    expect(result).toContain("## Problem");
    expect(result).toContain("- new line 1");
    expect(result).toContain("## Goals");
    expect(result).not.toContain("## Overview");
  });

  it("handles patch content with Windows line endings (\\r\\n)", () => {
    const markdown = "# Title\n\n## Problem\n\n- line 1\n- line 2\n\n## Goals\n\n- goal 1\n";
    const patchContent = "## Problem\r\n\r\n- new line 1\r\n- new line 2\r\n";

    const result = applyPatchToMarkdown({
      markdown,
      block_id: "blk_problem_1",
      operation: "replace",
      content: patchContent,
    });

    // Should not inject an "Overview" section
    expect(result).not.toContain("## Overview");
    expect(result).toContain("## Problem");
    expect(result).toContain("- new line 1");
    expect(result).toContain("## Goals");

    // Re-parsing the result should preserve block IDs
    const shape = deriveDocumentShape(result);
    expect(shape.blocks[0]?.block_id).toBe("blk_problem_1");
    expect(shape.blocks[1]?.block_id).toBe("blk_goals_2");
  });
});
