interface FileVersion {
  version_id: string;
  version_number: number;
  created_at: string;
  content: string;
}

interface FileHistoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  versions: FileVersion[];
  loading: boolean;
  onRestore: (versionId: string) => void;
}

export function FileHistoryModal({
  isOpen,
  onClose,
  versions,
  loading,
  onRestore,
}: FileHistoryModalProps) {
  if (!isOpen) return null;

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(0, 0, 0, 0.5)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 1000,
      }}
      onClick={onClose}
    >
      <div
        style={{
          background: "var(--sf-surface)",
          borderRadius: "12px",
          padding: "24px",
          maxWidth: "600px",
          width: "90%",
          maxHeight: "80vh",
          overflow: "auto",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
          <h2 style={{ margin: 0, fontSize: "1.25rem" }}>Version History</h2>
          <button
            onClick={onClose}
            style={{
              background: "none",
              border: "none",
              fontSize: "1.5rem",
              cursor: "pointer",
              color: "var(--sf-muted-mid)",
            }}
          >
            ✕
          </button>
        </div>
        {loading ? (
          <div style={{ textAlign: "center", padding: "24px" }}>Loading...</div>
        ) : versions.length === 0 ? (
          <div style={{ textAlign: "center", padding: "24px", color: "var(--sf-muted-mid)" }}>
            No versions yet
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
            {versions.map((version) => (
              <div
                key={version.version_id}
                style={{
                  padding: "12px",
                  border: "1px solid var(--sf-border-faint)",
                  borderRadius: "8px",
                  background: "var(--sf-surface-elevated)",
                }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <div>
                    <div style={{ fontWeight: 500, marginBottom: "4px" }}>
                      Version {version.version_number}
                    </div>
                    <div style={{ fontSize: "0.75rem", color: "var(--sf-muted-mid)" }}>
                      {new Date(version.created_at).toLocaleString()}
                    </div>
                  </div>
                  <button
                    onClick={() => onRestore(version.version_id)}
                    style={{
                      padding: "4px 12px",
                      borderRadius: "999px",
                      fontSize: "0.78rem",
                      fontWeight: 500,
                      cursor: "pointer",
                      border: "1px solid var(--sf-border)",
                      background: "var(--sf-surface)",
                      color: "var(--sf-ink)",
                    }}
                  >
                    Restore
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}