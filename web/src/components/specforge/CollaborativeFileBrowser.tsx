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
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";

import { markdownToEditorHtml, tiptapJsonToMarkdown } from "@/lib/specforge/editor";

interface FileVersionRecord {
  version_id: string;
  file_id: string;
  document_id: string;
  filename: string;
  content: string;
  content_json: Record<string, unknown>;
  file_type: string;
  created_at: string;
  created_by: string;
  version_number: number;
}

import styles from "./CollaborativeFileBrowser.module.css";
import { FILE_TEMPLATES } from "./fileTemplates";
import { SortableFileItem } from "./SortableFileItem";
import { FileHistoryModal } from "./FileHistoryModal";
import { RemoteCursors } from "./RemoteCursors";

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
  providerRef: React.RefObject<HocuspocusProvider | WebsocketProvider | null>;
  activeActor: { name: string; color: string };
  remoteCursors: Record<string, { x: number; y: number; name: string; color: string }>;
}

function CodeEditor({ ytext, filename: _filename, providerRef, activeActor, remoteCursors }: CodeEditorProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    // Initialize textarea with Yjs content
    textarea.value = ytext.toString();

    // Sync textarea -> Yjs (user typing)
    const handleChange = () => {
      const _cursorPosition = textarea.selectionStart;
      const currentContent = ytext.toString();
      const newContent = textarea.value;

      if (currentContent !== newContent) {
        ytext.delete(0, currentContent.length);
        ytext.insert(0, newContent);
      }
    };

    textarea.addEventListener("input", handleChange);

    // Track cursor position for collaboration
    const handleSelectionChange = () => {
      if (!providerRef.current?.awareness) return;
      
      const cursorPosition = textarea.selectionStart;
      const textBeforeCursor = textarea.value.substring(0, cursorPosition);
      const lines = textBeforeCursor.split('\n');
      const line = lines.length;
      const col = lines[lines.length - 1].length + 1;

      // Calculate approximate pixel position
      const lineHeight = 16; // Approximate line height for monospace font
      const charWidth = 8; // Approximate character width for monospace font
      const x = col * charWidth;
      const y = line * lineHeight;

      providerRef.current.awareness.setLocalStateField("cursor", {
        x,
        y,
        name: activeActor.name,
        color: activeActor.color,
      });
    };

    textarea.addEventListener("selectionchange", handleSelectionChange);
    textarea.addEventListener("keyup", handleSelectionChange);
    textarea.addEventListener("click", handleSelectionChange);

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
      textarea.removeEventListener("selectionchange", handleSelectionChange);
      textarea.removeEventListener("keyup", handleSelectionChange);
      textarea.removeEventListener("click", handleSelectionChange);
      ytext.unobserve(handleYjsChange);
    };
  }, [ytext, providerRef, activeActor]);

  return (
    <div ref={containerRef} style={{ position: "relative" }}>
      <textarea
        ref={textareaRef}
        className={styles.codeTextarea}
        spellCheck={false}
      />
      <RemoteCursors cursors={remoteCursors} />
    </div>
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
  const [syncState, setSyncState] = useState<"connecting" | "live" | "local" | "offline">("local");
  const [isNetworkOnline, setIsNetworkOnline] = useState(true);
  const [concurrentEditors, setConcurrentEditors] = useState<string[]>([]);
  const [aiAssisting, setAiAssisting] = useState(false);
  const [ideaValidationSession, setIdeaValidationSession] = useState<{ completed: number; total: number } | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedFileIds, setSelectedFileIds] = useState<Set<string>>(new Set());
  const [connectedUsers, setConnectedUsers] = useState<number>(1);
  const [showHistory, setShowHistory] = useState(false);
  const [fileVersions, setFileVersions] = useState<FileVersionRecord[]>([]);
  const [loadingVersions, setLoadingVersions] = useState(false);
  const [remoteCursors, setRemoteCursors] = useState<Record<string, { x: number; y: number; name: string; color: string }>>({});
  const [isInitializing, setIsInitializing] = useState(false);
  const [filePresence, setFilePresence] = useState<Record<string, Array<{ name: string; color: string }>>>({});

  // Yjs document and provider for the selected file
  const ydocRef = useRef<Y.Doc | null>(null);
  const providerRef = useRef<HocuspocusProvider | WebsocketProvider | null>(null);
  const ytextRef = useRef<Y.Text | null>(null);

  // Drag and drop sensors
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      setFiles((items) => {
        const oldIndex = items.findIndex((item) => item.file_id === active.id);
        const newIndex = items.findIndex((item) => item.file_id === over.id);

        return arrayMove(items, oldIndex, newIndex);
      });
    }
  }

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
    onUpdate: ({ editor }) => {
      if (!providerRef.current?.awareness) return;
      
      // Broadcast cursor position
      const { from } = editor.state.selection;
      try {
        const coords = editor.view.coordsAtPos(from);
        const viewRect = editor.view.dom.getBoundingClientRect();
        
        // Calculate position relative to the editor, not viewport
        // This handles scrolling correctly without fragile DOM traversal
        const relativeX = coords.left - viewRect.left;
        const relativeY = coords.top - viewRect.top;
        
        providerRef.current.awareness.setLocalStateField("cursor", {
          x: relativeX,
          y: relativeY,
          name: activeActor.name,
          color: activeActor.color,
        });
      } catch {
        // Ignore errors when cursor is outside viewport
      }
    },
    immediatelyRender: false,
  }, [selected, ydocRef.current]);

  // Fetch files on mount
  useEffect(() => {
    fetchFiles();
    fetchIdeaValidationSession();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [documentId]);

  async function fetchIdeaValidationSession() {
    try {
      const res = await fetch(`/api/documents/${documentId}/idea-validation-sessions`);
      if (!res.ok) return;
      const data = await res.json();
      const sessions = data.sessions ?? [];
      if (sessions.length > 0) {
        const session = sessions[0];
        const completed = session.stages.filter((s: { status: string }) => s.status === "completed").length;
        setIdeaValidationSession({ completed, total: session.stages.length });
      }
    } catch {
      // Silently ignore
    }
  }

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

  // Update awareness state when file changes
  useEffect(() => {
    if (!selected || !providerRef.current?.awareness) return;
    
    providerRef.current.awareness.setLocalStateField("user", {
      name: activeActor.name,
      color: activeActor.color,
      currentFile: selected.filename,
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selected?.filename, activeActor.name, activeActor.color]);

  // Detect network status
  useEffect(() => {
    const handleOnline = () => {
      setIsNetworkOnline(true);
    };
    const handleOffline = () => {
      setIsNetworkOnline(false);
    };

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);
    
    // Initial check
    setIsNetworkOnline(navigator.onLine);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  // Update sync state when network status changes
  useEffect(() => {
    if (!providerRef.current) return;
    
    // Force re-evaluation of sync state based on network status
    if (isNetworkOnline) {
      // If we're offline and come online, the provider will emit status event
      // But we should check current provider status
      const currentStatus = (providerRef.current as any).status;
      setSyncState(
        currentStatus === "connected" ? "live" : "local"
      );
    } else {
      // If we go offline, immediately set sync state
      setSyncState("offline");
    }
  }, [isNetworkOnline]);

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
      setSyncState("connecting");
      setConnectedUsers(1);
      
      const provider = new HocuspocusProvider({
        url: process.env.NEXT_PUBLIC_COLLAB_SERVER_URL || "ws://localhost:3001",
        name: roomName,
        document: ydoc,
      });
      providerRef.current = provider;

      provider.on("status", (status: { status: string }) => {
        setSyncState(
          !isNetworkOnline 
            ? "offline" 
            : status.status === "connected" 
              ? "live" 
              : "local"
        );
      });

      // Track connected users and per-file presence
      if (provider.awareness) {
        provider.awareness.on("change", () => {
          const states = provider.awareness!.getStates();
          setConnectedUsers(Math.max(1, states.size));
          
          // Update remote cursors
          const cursors: Record<string, { x: number; y: number; name: string; color: string }> = {};
          // Update per-file presence
          const presence: Record<string, Array<{ name: string; color: string }>> = {};
          // Track concurrent editors for current file
          const currentFileEditors: string[] = [];
          
          states.forEach((state, clientId) => {
            if (state.cursor && clientId !== provider.awareness!.clientID) {
              cursors[clientId.toString()] = state.cursor;
            }
            if (state.user && clientId !== provider.awareness!.clientID) {
              const file = state.user.currentFile;
              if (file) {
                if (!presence[file]) {
                  presence[file] = [];
                }
                presence[file].push({
                  name: state.user.name,
                  color: state.user.color,
                });
                
                // Track if editing current file
                if (selected && file === selected.filename) {
                  currentFileEditors.push(state.user.name);
                }
              }
            }
          });
          setRemoteCursors(cursors);
          setFilePresence(presence);
          setConcurrentEditors(currentFileEditors);
        });
      }
    } else {
      // Code files use Yjs Text type
      const ytext = ydoc.getText("content");
      ytextRef.current = ytext;
      
      // Initialize with current content
      if (ytext.length === 0) {
        ytext.insert(0, selected.content);
      }

      setSyncState("connecting");
      setConnectedUsers(1);

      // Use WebsocketProvider for code files
      const provider = new WebsocketProvider(
        process.env.NEXT_PUBLIC_COLLAB_SERVER_URL || "ws://localhost:3001",
        roomName,
        ydoc,
      );
      providerRef.current = provider;

      // Set local state for code files too
      if (provider.awareness) {
        provider.awareness.setLocalStateField("user", {
          name: activeActor.name,
          color: activeActor.color,
          currentFile: selected.filename,
        });
      }

      provider.on("status", (status: { status: string }) => {
        setSyncState(
          !isNetworkOnline 
            ? "offline" 
            : status.status === "connected" 
              ? "live" 
              : "local"
        );
      });

      // Track connected users and per-file presence
      if (provider.awareness) {
        provider.awareness.on("change", () => {
          const states = provider.awareness!.getStates();
          setConnectedUsers(Math.max(1, states.size));
          
          // Update remote cursors
          const cursors: Record<string, { x: number; y: number; name: string; color: string }> = {};
          // Update per-file presence
          const presence: Record<string, Array<{ name: string; color: string }>> = {};
          // Track concurrent editors for current file
          const currentFileEditors: string[] = [];
          
          states.forEach((state, clientId) => {
            if (state.cursor && clientId !== provider.awareness!.clientID) {
              cursors[clientId.toString()] = state.cursor;
            }
            if (state.user && clientId !== provider.awareness!.clientID) {
              const file = state.user.currentFile;
              if (file) {
                if (!presence[file]) {
                  presence[file] = [];
                }
                presence[file].push({
                  name: state.user.name,
                  color: state.user.color,
                });
                
                // Track if editing current file
                if (selected && file === selected.filename) {
                  currentFileEditors.push(state.user.name);
                }
              }
            }
          });
          setRemoteCursors(cursors);
          setFilePresence(presence);
          setConcurrentEditors(currentFileEditors);
        });
      }

      // Sync changes back to database
      ytext.observe(() => {
        const content = ytext.toString();
        debouncedSave(selected.file_id, content);
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selected, documentId]);

  // Debounced save to avoid excessive API calls
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const pendingSaveRef = useRef<{ fileId: string; content: string } | null>(null);
  
  const debouncedSave = (fileId: string, content: string) => {
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }
    pendingSaveRef.current = { fileId, content };
    saveTimeoutRef.current = setTimeout(() => {
      if (pendingSaveRef.current) {
        saveFileContent(pendingSaveRef.current.fileId, pendingSaveRef.current.content);
        pendingSaveRef.current = null;
      }
    }, 1000); // Save after 1 second of inactivity
  };

  // Flush pending saves on unmount to prevent data loss
  useEffect(() => {
    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
      if (pendingSaveRef.current) {
        // Save any pending content before unmount
        saveFileContent(pendingSaveRef.current.fileId, pendingSaveRef.current.content);
      }
    };
  }, []);

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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [editor, selected]);

  async function fetchFiles() {
    let triggeredInitialize = false;
    try {
      const res = await fetch(`/api/documents/${documentId}/files`);
      if (!res.ok) throw new Error("Failed to fetch files");
      const data = await res.json();
      setFiles(data.files || []);
      if (data.files && data.files.length > 0) {
        setSelected(data.files[0]);
      } else if (!isInitializing) {
        // Auto-initialize if no files exist and not already initializing
        triggeredInitialize = true;
        await initializeFiles();
      }
    } catch (error) {
      console.error("Failed to fetch files:", error);
    } finally {
      // Only clear loading if we didn't trigger auto-initialize
      // (initializeFiles will handle clearing loading after it completes)
      if (!triggeredInitialize) {
        setLoading(false);
      }
    }
  }

  async function initializeFiles() {
    setIsInitializing(true);
    try {
      const res = await fetch(`/api/documents/${documentId}/files/initialize`, {
        method: "POST",
      });
      if (!res.ok) throw new Error("Failed to initialize files");
      await fetchFiles();
    } catch (error) {
      console.error("Failed to initialize files:", error);
      alert("Failed to initialize files");
    } finally {
      setIsInitializing(false);
      setLoading(false);
    }
  }

  async function addFile() {
  const filename = prompt("Enter filename (e.g., NOTES.md):");
  if (!filename) return;

  let content = "";
  
  // Check if there's a template for this filename
  const template = FILE_TEMPLATES[filename];
  if (template) {
    const useTemplate = confirm(`Use template for ${filename}?\n\n${template.description}`);
    if (useTemplate) {
      content = template.content;
    }
  }

  try {
    const res = await fetch(`/api/documents/${documentId}/files`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        filename,
        content,
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

  function toggleFileSelection(fileId: string) {
    setSelectedFileIds((prev) => {
      const next = new Set(prev);
      if (next.has(fileId)) {
        next.delete(fileId);
      } else {
        next.add(fileId);
      }
      return next;
    });
  }

  function toggleSelectAll() {
    if (selectedFileIds.size === filteredFiles.length) {
      setSelectedFileIds(new Set());
    } else {
      setSelectedFileIds(new Set(filteredFiles.map((f) => f.file_id)));
    }
  }

  async function batchDeleteFiles() {
    if (selectedFileIds.size === 0) return;
    if (!confirm(`Delete ${selectedFileIds.size} file(s)?`)) return;

    for (const fileId of selectedFileIds) {
      try {
        await fetch(`/api/documents/${fileId}`, { method: "DELETE" });
      } catch (error) {
        console.error(`Failed to delete file ${fileId}:`, error);
      }
    }
    setSelectedFileIds(new Set());
    await fetchFiles();
  }

  async function fetchFileVersions(fileId: string) {
    setLoadingVersions(true);
    try {
      const res = await fetch(`/api/documents/${documentId}/files/${fileId}/versions`);
      if (!res.ok) throw new Error("Failed to fetch versions");
      const data = await res.json();
      setFileVersions(data.versions || []);
    } catch (error) {
      console.error("Failed to fetch versions:", error);
    } finally {
      setLoadingVersions(false);
    }
  }

  async function restoreVersion(versionId: string) {
    if (!selected) return;
    if (!confirm("Restore this version? Current content will be replaced.")) return;

    try {
      const res = await fetch(`/api/documents/${documentId}/files/${selected.file_id}/versions/${versionId}/restore`, {
        method: "POST",
      });
      if (!res.ok) throw new Error("Failed to restore version");
      await fetchFiles();
      setShowHistory(false);
    } catch (error) {
      console.error("Failed to restore version:", error);
      alert("Failed to restore version");
    }
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

  const _highlighted = selected ? highlight(selected.content, selected.filename) : "";
  const isMarkdownFile = selected && isMarkdown(selected.filename);

  // Filter files based on search query
  const filteredFiles = files.filter((file) =>
    file.filename.toLowerCase().includes(searchQuery.toLowerCase())
  );

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
        {ideaValidationSession ? (
          <div className={styles.ideaValidation}>
            <div className={styles.ideaValidationTitle}>
              Idea Validation
            </div>
            <div className={styles.ideaValidationProgress}>
              {ideaValidationSession.completed}/{ideaValidationSession.total} stages completed
            </div>
          </div>
        ) : null}
        <div className={styles.fileListHeader}>
          <div className={styles.fileListControls}>
            <input
              type="checkbox"
              checked={selectedFileIds.size === filteredFiles.length && filteredFiles.length > 0}
              onChange={toggleSelectAll}
              className={styles.fileListCheckbox}
            />
            <span>{filteredFiles.length} files</span>
            <input
              type="text"
              placeholder="Search files..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className={styles.fileSearchInput}
              style={{ width: "100px" }}
            />
          </div>
          <div className={styles.fileListActions}>
            {selectedFileIds.size > 0 && (
              <button
                onClick={batchDeleteFiles}
                className={styles.batchDeleteBtn}
              >
                Delete ({selectedFileIds.size})
              </button>
            )}
            <button
              className={styles.addFileBtn}
              onClick={addFile}
              title="Add new file"
            >
              + Add File
            </button>
          </div>
        </div>

        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
          <SortableContext items={filteredFiles.map(f => f.file_id)} strategy={verticalListSortingStrategy}>
            <ul className={styles.fileListScroll} aria-label="Files">
              {filteredFiles.map((file) => (
                <SortableFileItem
                  key={file.file_id}
                  file={file}
                  isSelected={selected?.file_id === file.file_id}
                  isSelectionEnabled={true}
                  isFileSelected={selectedFileIds.has(file.file_id)}
                  onSelect={() => selectFile(file)}
                  onToggleSelection={() => toggleFileSelection(file.file_id)}
                  onDelete={() => deleteFile(file.file_id)}
                  presence={filePresence[file.filename] || []}
                />
              ))}
            </ul>
          </SortableContext>
        </DndContext>
      </aside>

      {/* ---- viewer / editor ---- */}
      <main className={styles.viewer}>
        {selected ? (
          <>
            <div className={styles.viewerHeader}>
              {syncState === "offline" && (
                <div className={styles.offlineBanner} style={{ gridColumn: "1 / -1", marginBottom: "8px" }}>
                  📡 You&apos;re offline. Edits are saved locally and will sync when you reconnect.
                </div>
              )}
              <span className={styles.filename}>{selected.filename}</span>
              <div className={styles.viewerActions}>
                <span className={styles.syncStatusText}>
                  👥 {connectedUsers} {connectedUsers === 1 ? "user" : "users"}
                </span>
                <span className={`${styles.syncStatus} ${styles[syncState]}`}>
                  {syncState === "live" ? "● Live" : syncState === "connecting" ? "● Connecting..." : syncState === "offline" ? "● Offline - edits sync when connected" : "● Local"}
                </span>
                <button
                  onClick={() => {
                    if (selected) {
                      fetchFileVersions(selected.file_id);
                      setShowHistory(true);
                    }
                  }}
                  className={styles.historyBtn}
                >
                  📜 History
                </button>
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
              {concurrentEditors.length > 0 && (
                <div className={styles.conflictWarning}>
                  ⚠️ {concurrentEditors.join(", ")} {concurrentEditors.length === 1 ? "is" : "are"} also editing this file. Changes sync automatically via CRDT.
                </div>
              )}
              {isMarkdownFile && editor ? (
                <div className={styles.editorContainer}>
                  <EditorContent editor={editor} />
                  <RemoteCursors cursors={remoteCursors} />
                </div>
              ) : ytextRef.current ? (
                <CodeEditor
                  ytext={ytextRef.current}
                  filename={selected.filename}
                  providerRef={providerRef}
                  activeActor={activeActor}
                  remoteCursors={remoteCursors}
                />
              ) : null}
            </div>
          </>
        ) : (
          <div className={styles.empty}>
            <p>No files in workspace yet.</p>
            {isInitializing ? (
              <p className={styles.emptyStateText}>Initializing default files...</p>
            ) : (
              <button
                className={styles.initBtn}
                onClick={async () => {
                  if (isInitializing) return; // Prevent double-click
                  setIsInitializing(true);
                  try {
                    await initializeFiles();
                  } finally {
                    setIsInitializing(false);
                  }
                }}
                disabled={isInitializing}
              >
                Initialize Default Files
              </button>
            )}
          </div>
        )}
      </main>

      <FileHistoryModal
        isOpen={showHistory}
        onClose={() => setShowHistory(false)}
        versions={fileVersions}
        loading={loadingVersions}
        onRestore={restoreVersion}
      />
    </div>
  );
}