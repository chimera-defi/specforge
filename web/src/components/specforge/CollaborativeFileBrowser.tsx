"use client";

import hljs from "highlight.js/lib/core";
import hljsBash from "highlight.js/lib/languages/bash";
import hljsJson from "highlight.js/lib/languages/json";
import hljsMarkdown from "highlight.js/lib/languages/markdown";
import hljsTypescript from "highlight.js/lib/languages/typescript";
import hljsYaml from "highlight.js/lib/languages/yaml";
import { useEffect, useState } from "react";

// Register languages
hljs.registerLanguage("json", hljsJson);
hljs.registerLanguage("markdown", hljsMarkdown);
hljs.registerLanguage("typescript", hljsTypescript);
hljs.registerLanguage("bash", hljsBash);
hljs.registerLanguage("yaml", hljsYaml);

function getLanguage(filename: string): string {
  if (filename.endsWith(".json")) return "json";
  if (filename.endsWith(".md")) return "markdown";
  if (filename.endsWith(".ts") || filename.endsWith(".tsx")) return "typescript";
  if (filename.endsWith(".sh")) return "bash";
  if (filename.endsWith(".yaml") || filename.endsWith(".yml")) return "yaml";
  return "plaintext";
}

function highlight(code: string, filename: string): string {
  const lang = getLanguage(filename);
  if (lang === "plaintext") return escapeHtml(code);
  try {
    return hljs.highlight(code, { language: lang }).value;
  } catch {
    return escapeHtml(code);
  }
}

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

interface WorkspaceFile {
  file_id: string;
  filename: string;
  content: string;
  file_type: string;
  updated_at: string;
}

interface CollaborativeFileBrowserProps {
  documentId: string;
  activeActor: {
    actor_id: string;
    name: string;
    color: string;
  };
}

export function CollaborativeFileBrowser({
  documentId,
  activeActor,
}: CollaborativeFileBrowserProps) {
  const [files, setFiles] = useState<WorkspaceFile[]>([]);
  const [selected, setSelected] = useState<WorkspaceFile | null>(null);
  const [editMode, setEditMode] = useState(false);
  const [editedContent, setEditedContent] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Fetch files on mount
  useEffect(() => {
    fetchFiles();
  }, [documentId]);

  async function fetchFiles() {
    try {
      const res = await fetch(`/api/documents/${documentId}/files`);
      if (!res.ok) throw new Error("Failed to fetch files");
      const data = await res.json();
      setFiles(data.files || []);
      if (data.files && data.files.length > 0) {
        setSelected(data.files[0]);
      }
    } catch (error) {
      console.error("Failed to fetch files:", error);
    } finally {
      setLoading(false);
    }
  }

  async function initializeFiles() {
    try {
      const res = await fetch(`/api/documents/${documentId}/files/initialize`, {
        method: "POST",
      });
      if (!res.ok) throw new Error("Failed to initialize files");
      await fetchFiles();
    } catch (error) {
      console.error("Failed to initialize files:", error);
      alert("Failed to initialize files");
    }
  }

  async function saveFile() {
    if (!selected) return;
    setSaving(true);
    try {
      const res = await fetch(`/api/documents/${selected.file_id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: editedContent }),
      });
      if (!res.ok) throw new Error("Failed to save file");
      const data = await res.json();
      setSelected(data.file);
      setEditMode(false);
      // Refresh files list
      await fetchFiles();
    } catch (error) {
      console.error("Failed to save file:", error);
      alert("Failed to save file");
    } finally {
      setSaving(false);
    }
  }

  async function addFile() {
    const filename = prompt("Enter filename (e.g., NOTES.md):");
    if (!filename) return;

    try {
      const res = await fetch(`/api/documents/${documentId}/files`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          filename,
          content: "",
          file_type: filename.endsWith(".json") ? "json" : "markdown",
        }),
      });
      if (!res.ok) throw new Error("Failed to create file");
      await fetchFiles();
    } catch (error) {
      console.error("Failed to create file:", error);
      alert("Failed to create file");
    }
  }

  async function deleteFile(fileId: string) {
    if (!confirm("Are you sure you want to delete this file?")) return;

    try {
      const res = await fetch(`/api/documents/${fileId}`, {
        method: "DELETE",
      });
      if (!res.ok) throw new Error("Failed to delete file");
      if (selected?.file_id === fileId) {
        setSelected(files.find((f) => f.file_id !== fileId) || null);
      }
      await fetchFiles();
    } catch (error) {
      console.error("Failed to delete file:", error);
      alert("Failed to delete file");
    }
  }

  function selectFile(file: WorkspaceFile) {
    setSelected(file);
    setEditMode(false);
    setEditedContent(file.content);
  }

  const highlighted = selected ? highlight(selected.content, selected.filename) : "";

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-muted-foreground">Loading files...</div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen bg-background">
      {/* File list sidebar */}
      <aside className="w-64 border-r border-border bg-card flex flex-col">
        <div className="p-4 border-b border-border">
          <h2 className="text-lg font-semibold">Files</h2>
          <p className="text-sm text-muted-foreground">{files.length} files</p>
        </div>
        <ul className="flex-1 overflow-y-auto p-2" role="list">
          {files.map((file) => (
            <li
              key={file.file_id}
              className={`mb-1 rounded-md ${
                selected?.file_id === file.file_id
                  ? "bg-accent text-accent-foreground"
                  : "bg-muted hover:bg-muted/80"
              }`}
            >
              <button
                className="w-full text-left px-3 py-2 flex items-center justify-between group"
                onClick={() => selectFile(file)}
              >
                <span className="truncate flex-1">{file.filename}</span>
                <button
                  className="opacity-0 group-hover:opacity-100 ml-2 text-red-500 hover:text-red-700"
                  onClick={(e) => {
                    e.stopPropagation();
                    deleteFile(file.file_id);
                  }}
                >
                  ✕
                </button>
              </button>
            </li>
          ))}
        </ul>
        <div className="p-4 border-t border-border space-y-2">
          <button
            onClick={addFile}
            className="w-full bg-secondary text-secondary-foreground py-2 px-4 rounded-md hover:bg-secondary/80"
          >
            + Add File
          </button>
        </div>
      </aside>

      {/* Main editor area */}
      <main className="flex-1 flex flex-col">
        {selected ? (
          <>
            {/* Header */}
            <div className="p-4 border-b border-border flex items-center justify-between">
              <div>
                <h2 className="text-lg font-semibold">{selected.filename}</h2>
                <p className="text-sm text-muted-foreground">
                  {editMode ? "Editing mode" : "View mode"}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setEditMode((e) => !e)}
                  className="px-3 py-1.5 rounded-md border border-border hover:bg-muted"
                >
                  {editMode ? "View" : "Edit"}
                </button>
              </div>
            </div>

            {/* Editor/Viewer */}
            <div className="flex-1 overflow-hidden">
              {editMode ? (
                <div className="h-full flex flex-col">
                  <textarea
                    className="flex-1 w-full p-4 font-mono text-sm resize-none bg-background border-0 focus:outline-none"
                    value={editedContent}
                    onChange={(e) => setEditedContent(e.target.value)}
                    spellCheck={false}
                  />
                  <div className="p-4 border-t border-border flex justify-end gap-2">
                    <button
                      onClick={() => {
                        setEditMode(false);
                        setEditedContent(selected.content);
                      }}
                      className="px-4 py-2 rounded-md border border-border hover:bg-muted"
                      disabled={saving}
                    >
                      Cancel
                    </button>
                    <button
                      onClick={saveFile}
                      className="px-4 py-2 rounded-md bg-primary text-primary-foreground hover:bg-primary/90"
                      disabled={saving}
                    >
                      {saving ? "Saving..." : "Save"}
                    </button>
                  </div>
                </div>
              ) : (
                <div className="h-full overflow-y-auto p-4">
                  <pre>
                    <code
                      dangerouslySetInnerHTML={{ __html: highlighted }}
                      className="text-sm"
                    />
                  </pre>
                </div>
              )}
            </div>
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-muted-foreground p-8">
            <p className="mb-4">No files in workspace yet.</p>
            <button
              onClick={initializeFiles}
              className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90"
            >
              Initialize Default Files
            </button>
          </div>
        )}
      </main>
    </div>
  );
}