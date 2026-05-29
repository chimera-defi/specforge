import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import styles from "./CollaborativeFileBrowser.module.css";
import { getFileIcon } from "./fileIcons";

interface WorkspaceFile {
  file_id: string;
  filename: string;
  content: string;
  file_type: string;
  updated_at: string;
}

interface SortableFileItemProps {
  file: WorkspaceFile;
  isSelected: boolean;
  isSelectionEnabled: boolean;
  isFileSelected: boolean;
  onSelect: () => void;
  onToggleSelection: () => void;
  onDelete: () => void;
  presence?: Array<{ name: string; color: string }>;
}

export function SortableFileItem({
  file,
  isSelected,
  isSelectionEnabled,
  isFileSelected,
  onSelect,
  onToggleSelection,
  onDelete,
  presence = [],
}: SortableFileItemProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
  } = useSortable({ id: file.file_id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <li
      ref={setNodeRef}
      style={style}
      className={`${styles.fileItem} ${isSelected ? styles.fileItemActive : ""}`}
    >
      <div
        style={{ display: "flex", alignItems: "center", flex: 1, gap: "8px" }}
        {...attributes}
        {...listeners}
      >
        <span style={{ cursor: "grab", color: "var(--sf-muted-faint)" }}>⋮⋮</span>
        {isSelectionEnabled && (
          <input
            type="checkbox"
            checked={isFileSelected}
            onChange={onToggleSelection}
            onClick={(e) => e.stopPropagation()}
            style={{ cursor: "pointer" }}
          />
        )}
        <button
          className={styles.fileNameBtn}
          onClick={onSelect}
          title={file.filename}
          style={{ flex: 1 }}
        >
          <span style={{ marginRight: "6px" }}>{getFileIcon(file.filename)}</span>
          {file.filename}
        </button>
        {presence.length > 0 && (
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "2px",
              marginLeft: "8px",
            }}
            title={presence.map(p => p.name).join(", ")}
          >
            {presence.slice(0, 3).map((p, idx) => (
              <div
                key={idx}
                style={{
                  width: "8px",
                  height: "8px",
                  borderRadius: "50%",
                  backgroundColor: p.color,
                  border: "1px solid var(--sf-border)",
                }}
                title={p.name}
              />
            ))}
            {presence.length > 3 && (
              <span style={{ fontSize: "0.7rem", color: "var(--sf-muted-mid)" }}>
                +{presence.length - 3}
              </span>
            )}
          </div>
        )}
        <button
          className={styles.removeBtn}
          onClick={onDelete}
          aria-label={`Remove ${file.filename}`}
          title={`Remove ${file.filename}`}
        >
          ✕
        </button>
      </div>
    </li>
  );
}