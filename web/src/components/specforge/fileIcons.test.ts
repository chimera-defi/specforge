import { describe, expect, it } from "vitest";
import { getFileIcon } from "./fileIcons";

describe("getFileIcon", () => {
  it("returns markdown icon for .md files", () => {
    expect(getFileIcon("README.md")).toBe("📝");
  });

  it("returns markdown icon for .mdx files", () => {
    expect(getFileIcon("page.mdx")).toBe("📝");
  });

  it("returns clipboard icon for .json files", () => {
    expect(getFileIcon("package.json")).toBe("📋");
  });

  it("returns clipboard icon for .yaml files", () => {
    expect(getFileIcon("config.yaml")).toBe("📋");
  });

  it("returns clipboard icon for .yml files", () => {
    expect(getFileIcon(".github/ci.yml")).toBe("📋");
  });

  it("returns clipboard icon for .toml files", () => {
    expect(getFileIcon("Cargo.toml")).toBe("📋");
  });

  it("returns TypeScript icon for .ts files", () => {
    expect(getFileIcon("index.ts")).toBe("📘");
  });

  it("returns React icon for .tsx files", () => {
    expect(getFileIcon("App.tsx")).toBe("⚛️");
  });

  it("returns JavaScript icon for .js files", () => {
    expect(getFileIcon("main.js")).toBe("📜");
  });

  it("returns React icon for .jsx files", () => {
    expect(getFileIcon("Component.jsx")).toBe("⚛️");
  });

  it("returns shell icon for .sh files", () => {
    expect(getFileIcon("setup.sh")).toBe("⚙️");
  });

  it("returns text icon for .txt files", () => {
    expect(getFileIcon("notes.txt")).toBe("📄");
  });

  it("returns CSS icon for .css files", () => {
    expect(getFileIcon("styles.css")).toBe("🎨");
  });

  it("returns HTML icon for .html files", () => {
    expect(getFileIcon("index.html")).toBe("🌐");
  });

  it("returns default icon for unknown extension", () => {
    expect(getFileIcon("binary.exe")).toBe("📄");
  });

  it("returns default icon for files with no extension", () => {
    expect(getFileIcon("Makefile")).toBe("📄");
  });

  it("handles uppercase extension case-insensitively", () => {
    expect(getFileIcon("README.MD")).toBe("📝");
  });

  it("uses the last segment for files with multiple dots", () => {
    expect(getFileIcon("foo.bar.ts")).toBe("📘");
  });
});
