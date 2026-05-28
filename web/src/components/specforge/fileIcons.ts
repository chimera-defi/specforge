export function getFileIcon(filename: string): string {
  const ext = filename.split('.').pop()?.toLowerCase();
  const icons: Record<string, string> = {
    md: "📝",
    json: "📋",
    yaml: "📋",
    yml: "📋",
    ts: "📘",
    tsx: "⚛️",
    js: "📜",
    jsx: "⚛️",
    sh: "⚙️",
    txt: "📄",
    mdx: "📝",
    toml: "📋",
    css: "🎨",
    html: "🌐",
  };
  return icons[ext || ""] || "📄";
}