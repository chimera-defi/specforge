/**
 * SpecForge Local Bridge Server
 *
 * Design spike implementation for hybrid hosted + local CLI access.
 * This server runs locally and proxies requests from hosted SpecForge
 * to local CLI tools (codex, claude, etc.).
 */

import { createServer } from "http";

const BRIDGE_PORT = parseInt(process.env.BRIDGE_PORT || "4323", 10);
const BRIDGE_VERSION = "0.1.0";

interface HealthResponse {
  status: "ok" | "error";
  version: string;
  uptime_seconds: number;
}

interface CliRequest {
  tool: "codex" | "claude";
  prompt: string;
  options?: Record<string, unknown>;
}

interface CliResponse {
  success: boolean;
  output?: string;
  error?: string;
  tool: string;
}

const serverStartTime = Date.now();

function getUptimeSeconds(): number {
  return (Date.now() - serverStartTime) / 1000;
}

function handleHealthCheck(): HealthResponse {
  return {
    status: "ok",
    version: BRIDGE_VERSION,
    uptime_seconds: getUptimeSeconds(),
  };
}

async function handleCliRequest(request: CliRequest): Promise<CliResponse> {
  const { tool, prompt, options = {} } = request;

  // Validate tool name
  const validTools = ["codex", "claude"];
  if (!validTools.includes(tool)) {
    return {
      success: false,
      error: `Unsupported tool: ${tool}. Valid tools: ${validTools.join(", ")}`,
      tool,
    };
  }

  // Validate prompt
  if (!prompt || typeof prompt !== "string" || prompt.trim().length === 0) {
    return {
      success: false,
      error: "Prompt is required and must be a non-empty string",
      tool,
    };
  }

  // In this design spike, we'll just return a mock response
  // Future implementation would actually spawn the CLI process
  return {
    success: true,
    output: `[${tool.toUpperCase()} SPIKE] Received prompt: "${prompt.trim()}"`,
    tool,
  };
}

const server = createServer((req, res) => {
  // Set CORS headers for development
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") {
    res.writeHead(200);
    res.end();
    return;
  }

  const url = new URL(req.url || "/", `http://localhost:${BRIDGE_PORT}`);

  try {
    if (url.pathname === "/health" && req.method === "GET") {
      const health = handleHealthCheck();
      res.writeHead(200, { "Content-Type": "application/json" });
      res.end(JSON.stringify(health));
    } else if (url.pathname === "/cli" && req.method === "POST") {
      let body = "";
      req.on("data", (chunk) => {
        body += chunk.toString();
      });
      req.on("end", async () => {
        try {
          const request = JSON.parse(body) as CliRequest;
          const response = await handleCliRequest(request);
          res.writeHead(200, { "Content-Type": "application/json" });
          res.end(JSON.stringify(response));
        } catch (error) {
          res.writeHead(400, { "Content-Type": "application/json" });
          res.end(
            JSON.stringify({
              success: false,
              error: error instanceof Error ? error.message : "Invalid request body",
              tool: "unknown",
            }),
          );
        }
      });
    } else {
      res.writeHead(404, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ error: "Not found" }));
    }
  } catch (error) {
    console.error("Bridge server error:", error);
    res.writeHead(500, { "Content-Type": "application/json" });
    res.end(JSON.stringify({ error: "Internal server error" }));
  }
});

server.listen(BRIDGE_PORT, "127.0.0.1", () => {
  console.log(`SpecForge Local Bridge v${BRIDGE_VERSION}`);
  console.log(`Listening on http://127.0.0.1:${BRIDGE_PORT}`);
  console.log(`Health check: http://127.0.0.1:${BRIDGE_PORT}/health`);
});

// Graceful shutdown
process.on("SIGTERM", () => {
  console.log("Received SIGTERM, shutting down gracefully...");
  server.close(() => {
    console.log("Bridge server closed");
    process.exit(0);
  });
});

process.on("SIGINT", () => {
  console.log("Received SIGINT, shutting down gracefully...");
  server.close(() => {
    console.log("Bridge server closed");
    process.exit(0);
  });
});