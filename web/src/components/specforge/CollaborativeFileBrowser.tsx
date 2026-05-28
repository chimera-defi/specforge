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

import styles from "./CollaborativeFileBrowser.module.css";

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
      className={styles.codeTextarea}
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
  const [aiAssisting, setAiAssisting] = useState(false);

  // Yjs document and provider for the selected file
  const ydocRef = useRef<Y.Doc | null>(null);
  const providerRef = useRef<HocuspocusProvider | WebsocketProvider | null>(null);
  const ytextRef = useRef<Y.Text | null>(null);

  // Tiptap editor for markdown files
  const editor = useEditor({
    extensions: [
      StarterKit,
      ...(ydocRef.current ? [Collaboration.configure({
        document: ydocRef.current,
      })] : []),
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

  async function handleAiAssist() {
    if (!selected) return;

    setAiAssisting(true);
    alert(`AI Assist: Processing ${selected.filename}...`);

    try {
      const res = await fetch("/api/agent/assist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          document_id: documentId,
          block_id: selected.filename,
          section_id: selected.filename,
          context: {
            filename: selected.filename,
            content: selected.content,
            file_type: selected.file_type,
          },
        }),
      });

      if (!res.ok) {
        throw new Error("AI assist request failed");
      }

      const data = await res.json();
      
      if (data.suggestion) {
        // Apply the suggestion to the file
        await saveFileContent(selected.file_id, data.suggestion);
        alert(`AI Assist: Updated ${selected.filename}`);
      } else {
        alert("AI Assist: No changes suggested");
      }
    } catch (error) {
      console.error("AI assist failed:", error);
      alert("AI Assist: Could not process request");
    } finally {
      setAiAssisting(false);
    }
  }

  const highlighted = selected ? highlight(selected.content, selected.filename) : "";
  const isMarkdownFile = selected && isMarkdown(selected.filename);

  if (loading) {
    return (
      <div className={styles.loading}>
        Loading files...
      </div>
    );
  }

  return (
    <div className={styles.browser}>
      {/* ---- file list ---- */}
      <aside className={styles.fileList} aria-label="Workspace files">
        <div className={styles.fileListHeader}>
          <span>{files.length} files</span>
          <button
            className={styles.addFileBtn}
            onClick={addFile}
            title="Add new file"
          >
            + Add File
          </button>
        </div>

        <ul className={styles.fileListScroll} aria-label="Files">
          {files.map((file) => (
            <li
              key={file.file_id}
              className={`${styles.fileItem} ${selected?.file_id === file.file_id ? styles.fileItemActive : ""}`}
            >
              <button
                className={styles.fileNameBtn}
                onClick={() => selectFile(file)}
                title={file.filename}
              >
                {file.filename}
              </button>
              <button
                className={styles.removeBtn}
                onClick={() => deleteFile(file.file_id)}
                aria-label={`Remove ${file.filename}`}
                title={`Remove ${file.filename}`}
              >
                ✕
              </button>
            </li>
          ))}
        </ul>
      </aside>

      {/* ---- viewer / editor ---- */}
      <main className={styles.viewer}>
        {selected ? (
          <>
            <div className={styles.viewerHeader}>
              <span className={styles.filename}>{selected.filename}</span>
              <div className={styles.viewerActions}>
                <span className={`${styles.syncStatus} ${styles[syncState]}`}>
                  {syncState === "live" ? "● Live" : syncState === "connecting" ? "● Connecting..." : "● Offline"}
                </span>
                <button
                  className={styles.aiAssistBtn}
                  onClick={handleAiAssist}
                  disabled={aiAssisting}
                  title="AI Assist"
                >
                  {aiAssisting ? "Processing..." : "✨ AI Assist"}
                </button>
              </div>
            </div>

            <div className={styles.editorArea}>
              {isMarkdownFile && editor ? (
                <EditorContent editor={editor} />
              ) : ytextRef.current ? (
                <CodeEditor ytext={ytextRef.current} filename={selected.filename} />
              ) : null}
            </div>
          </>
        ) : (
          <div className={styles.empty}>
            <p>No files in workspace yet.</p>
            <button
              className={styles.initBtn}
              onClick={initializeFiles}
            >
              Initialize Default Files
            </button>
          </div>
        )}
      </main>
    </div>
  );
}