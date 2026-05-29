"use client";

import { useState } from "react";
import { Copy, Check } from "lucide-react";
import { APP_CONFIG } from "@/lib/constants";

export function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);

  function handleCopy() {
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), APP_CONFIG.COPY_FEEDBACK_DURATION_LONG);
    });
  }

  return (
    <button
      onClick={handleCopy}
      className="inline-flex items-center gap-1.5 rounded-full border border-border bg-card px-2.5 py-1 text-xs text-muted-foreground transition-colors hover:text-foreground"
      aria-label="Copy to clipboard"
    >
      {copied ? <Check size={11} className="text-success" /> : <Copy size={11} />}
      {copied ? "Copied" : "Copy"}
    </button>
  );
}
