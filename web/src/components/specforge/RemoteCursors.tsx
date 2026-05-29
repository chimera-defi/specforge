interface RemoteCursor {
  x: number;
  y: number;
  name: string;
  color: string;
}

interface RemoteCursorsProps {
  cursors: Record<string, RemoteCursor>;
}

export function RemoteCursors({ cursors }: RemoteCursorsProps) {
  return (
    <>
      {Object.entries(cursors).map(([clientId, cursor]) => (
        <div
          key={clientId}
          style={{
            position: "absolute",
            left: cursor.x,
            top: cursor.y,
            pointerEvents: "none",
            zIndex: 100,
          }}
        >
          <div
            style={{
              width: "2px",
              height: "20px",
              backgroundColor: cursor.color,
              transition: "all 0.1s ease",
            }}
          />
          <div
            style={{
              position: "absolute",
              top: "20px",
              left: "0",
              backgroundColor: cursor.color,
              color: "white",
              padding: "2px 6px",
              borderRadius: "4px",
              fontSize: "0.7rem",
              whiteSpace: "nowrap",
            }}
          >
            {cursor.name}
          </div>
        </div>
      ))}
    </>
  );
}