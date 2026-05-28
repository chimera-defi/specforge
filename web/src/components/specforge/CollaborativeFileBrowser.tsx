"use client";

import hljs from "highlight.js/lib/core";
import hljsBash from "highlight.js/lib/languages/bash";
import hljsJson from "highlight.js/lib/languages/json";
import hljsMarkdown from "highlight.js/lib/languages/markdown";
import hljsTypescript from "highlight.js/lib/languages/typescript";
import hljsYaml from "highlight.js/lib/languages/yaml";
import { useEffect, useRef, useState } from "react";
import { EditorContent, useEditor } from "@tiptap/react";
import Collaboration from "@tiptap/extension-collaboration";
import StarterKit from "@tiptap/starter-kit";
import * as Y from "yjs";
import { HocuspocusProvider } from "@hocuspocus/provider";
import { WebsocketProvider } from "y-websocket";

import { markdownToEditorHtml, tiptapJsonToMarkdown } from "@/lib/specforge/editor";

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

function isMarkdown(filename: string): boolean {
  return filename.endsWith(".md");
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

interface CodeEditorProps {
  ytext: Y.Text;
  filename: string;
}

function CodeEditor({ ytext, filename }: CodeEditorProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    // Initialize textarea with Yjs content
    textarea.value = ytext.toString();

    // Sync textarea -> Yjs (user typing)
    const handleChange = () => {
      const cursorPosition = textarea.selectionStart;
      const currentContent = ytext.toString();
      const newContent = textarea.value;

      if (currentContent !== newContent) {
        ytext.delete(0, currentContent.length);
        ytext.insert(0, newContent);
      }
    };

    textarea.addEventListener("input", handleChange);

    // Sync Yjs -> textarea (remote changes)
    const handleYjsChange = () => {
      const cursorPosition = textarea.selectionStart;
      const newContent = ytext.toString();
      
      // Only update if content actually changed
      if (textarea.value !== newContent) {
        textarea.value = newContent;
        // Restore cursor position
        textarea.setSelectionRange(
          Math.min(cursorPosition, newContent.length),
          Math.min(cursorPosition, newContent.length)
        );
      }
    };

    ytext.observe(handleYjsChange);

    return () => {
      textarea.removeEventListener("input", handleChange);
      ytext.unobserve(handleYjsChange);
    };
  }, [ytext]);

  return (
    <textarea
      ref={textareaRef}
      className="w-full h-full p-4 font-mono text-sm resize-none bg-background border-0 focus:outline-none"
      spellCheck={false}
    />
  );
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
  const [loading, setLoading] = useState(true);
  const [syncState, setSyncState] = useState<"connecting" | "live" | "offline">("connecting");

  // Yjs document and provider for the selected file
  const ydocRef = useRef<Y.Doc | null>(null);
  const providerRef = useRef<HocuspocusProvider | WebsocketProvider | null>(null);
  const ytextRef = useRef<Y.Text | null>(null);

  // Tiptap editor for markdown files
  const editor = useEditor({
    extensions: [
      StarterKit,
      Collaboration.configure({
        document: ydocRef.current!,
      }),
    ],
    content: selected ? markdownToEditorHtml(selected.content) : "",
    editable: true,
    editorProps: {
      attributes: {
        class: "prose prose-sm max-w-none focus:outline-none min-h-full",
      },
    },
    immediatelyRender: false,
  }, [selected, ydocRef.current]);

  // Fetch files on mount
  useEffect(() => {
    fetchFiles();
  }, [documentId]);

  // Cleanup Yjs resources when switching files
  useEffect(() => {
    return () => {
      if (providerRef.current) {
        providerRef.current.destroy();
        providerRef.current = null;
      }
      if (ydocRef.current) {
        ydocRef.current.destroy();
        ydocRef.current = null;
      }
    };
  }, []);

  // Setup Yjs collaboration when file is selected
  useEffect(() => {
    if (!selected) return;

    // Cleanup previous resources
    if (providerRef.current) {
      providerRef.current.destroy();
      providerRef.current = null;
    }
    if (ydocRef.current) {
      ydocRef.current.destroy();
      ydocRef.current = null;
    }

    // Create new Yjs document for this file
    const ydoc = new Y.Doc();
    ydocRef.current = ydoc;

    const roomName = `${documentId}:${selected.filename}`;

    if (isMarkdown(selected.filename)) {
      // Markdown files use Tiptap with Collaboration
      // Provider is managed by Collaboration extension
      setSyncState("connecting");
      
      const provider = new HocuspocusProvider({
        url: process.env.NEXT_PUBLIC_COLLAB_SERVER_URL || "ws://localhost:3001",
        name: roomName,
        document: ydoc,
      });
      providerRef.current = provider;

      provider.on("status", (status: any) => {
        setSyncState(status.status === "connected" ? "live" : "offline");
      });
    } else {
      // Code files use Yjs Text type
      const ytext = ydoc.getText("content");
      ytextRef.current = ytext;
      
      // Initialize with current content
      if (ytext.length === 0) {
        ytext.insert(0, selected.content);
      }

      setSyncState("connecting");

      // Use WebsocketProvider for code files
      const provider = new WebsocketProvider(
        process.env.NEXT_PUBLIC_COLLAB_SERVER_URL || "ws://localhost:3001",
        roomName,
        ydoc,
      );
      providerRef.current = provider;

      provider.on("status", (status: any) => {
        setSyncState(status.status === "connected" ? "live" : "offline");
      });

      // Sync changes back to database
      ytext.observe(() => {
        const content = ytext.toString();
        debouncedSave(selected.file_id, content);
      });
    }
  }, [selected, documentId]);

  // Debounced save to avoid excessive API calls
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const debouncedSave = (fileId: string, content: string) => {
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }
    saveTimeoutRef.current = setTimeout(() => {
      saveFileContent(fileId, content);
    }, 1000); // Save after 1 second of inactivity
  };

  async function saveFileContent(fileId: string, content: string) {
    try {
      const res = await fetch(`/api/documents/${fileId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content }),
      });
      if (!res.ok) throw new Error("Failed to save file");
      // Update local state
      setFiles((prev) =>
        prev.map((f) => (f.file_id === fileId ? { ...f, content } : f)),
      );
    } catch (error) {
      console.error("Failed to save file:", error);
    }
  }

  // Save Tiptap markdown changes
  useEffect(() => {
    if (!editor || !selected || !isMarkdown(selected.filename)) return;

    const handleUpdate = () => {
      const markdown = tiptapJsonToMarkdown(editor.getJSON());
      debouncedSave(selected.file_id, markdown);
    };

    editor.on("update", handleUpdate);
    return () => {
      editor.off("update", handleUpdate);
    };
  }, [editor, selected]);

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
  }

  const highlighted = selected ? highlight(selected.content, selected.filename) : "";
  const isMarkdownFile = selected && isMarkdown(selected.filename);

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
                  {syncState === "live" ? "🟢 Live collaboration" : syncState === "connecting" ? "🟡 Connecting..." : "🔴 Offline"}
                </p>
              </div>
            </div>

            {/* Editor */}
            <div className="flex-1 overflow-hidden">
              {isMarkdownFile && editor ? (
                // Markdown files use Tiptap editor with Yjs collaboration
                <div className="h-full overflow-y-auto p-4">
                  <EditorContent editor={editor} />
                </div>
              ) : ytextRef.current ? (
                // Code files use textarea bound to Yjs Text
                <CodeEditor ytext={ytextRef.current} filename={selected.filename} />
              ) : null}
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