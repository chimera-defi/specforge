#!/usr/bin/env node
import crypto from "node:crypto";
import fs from "node:fs";
import http from "node:http";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.resolve(__dirname, "..");
const composeProjectName = process.env.COMPOSE_PROJECT_NAME || "specforge-secure-local";
const webPort = process.env.SPECFORGE_WEB_PORT || "3000";
const collabHealthPort = process.env.SPECFORGE_COLLAB_HEALTH_PORT || "1235";

const brokerAndDatabasePorts = new Map([
  [5432, "postgres"],
  [6379, "redis"],
  [5672, "rabbitmq"],
  [15672, "rabbitmq-management"],
  [9092, "kafka"],
  [2181, "zookeeper"],
  [4222, "nats"],
  [27017, "mongodb"],
  [3306, "mysql"],
  [1433, "mssql"],
  [9200, "elasticsearch"],
]);

const appPorts = new Set([
  Number.parseInt(process.env.SPECFORGE_WEB_PORT || "3000", 10),
  Number.parseInt(process.env.SPECFORGE_COLLAB_PORT || "1234", 10),
  Number.parseInt(process.env.SPECFORGE_COLLAB_HEALTH_PORT || "1235", 10),
]);

function randomSecret(prefix) {
  return `${prefix}-${crypto.randomBytes(32).toString("hex")}`;
}

function secureEnv() {
  return {
    ...process.env,
    COMPOSE_PROJECT_NAME: composeProjectName,
    SPECFORGE_SESSION_SECRET:
      process.env.SPECFORGE_SESSION_SECRET || randomSecret("local-session"),
    SPECFORGE_CSRF_SECRET:
      process.env.SPECFORGE_CSRF_SECRET || randomSecret("local-csrf"),
    SPECFORGE_COLLAB_SECRET:
      process.env.SPECFORGE_COLLAB_SECRET || randomSecret("local-collab"),
    REDIS_PASSWORD: process.env.REDIS_PASSWORD || randomSecret("local-redis"),
    POSTGRES_PASSWORD:
      process.env.POSTGRES_PASSWORD || randomSecret("local-postgres"),
    GITHUB_CLIENT_ID: process.env.GITHUB_CLIENT_ID || "local-oauth-disabled",
    GITHUB_CLIENT_SECRET:
      process.env.GITHUB_CLIENT_SECRET || "local-oauth-disabled",
    SPECFORGE_REQUIRE_SECURE_SECRETS:
      process.env.SPECFORGE_REQUIRE_SECURE_SECRETS || "true",
    SPECFORGE_ENFORCE_HOSTED_SECURITY:
      process.env.SPECFORGE_ENFORCE_HOSTED_SECURITY || "false",
    NEXT_PUBLIC_SKIP_AUTH_OVERRIDE:
      process.env.NEXT_PUBLIC_SKIP_AUTH_OVERRIDE || "false",
    NEXT_PUBLIC_COLLAB_URL:
      process.env.NEXT_PUBLIC_COLLAB_URL || "ws://127.0.0.1:1234",
    SPECFORGE_GITHUB_REDIRECT_URI:
      process.env.SPECFORGE_GITHUB_REDIRECT_URI ||
      "http://127.0.0.1:3000/api/auth/callback",
  };
}

function log(message) {
  console.log(message);
}

function ok(message) {
  console.log(`ok: ${message}`);
}

function warn(message) {
  console.warn(`warn: ${message}`);
}

function fail(message) {
  console.error(`error: ${message}`);
}

function run(command, args, options = {}) {
  const result = spawnSync(command, args, {
    cwd: rootDir,
    env: options.env || process.env,
    encoding: "utf8",
    stdio: options.capture ? ["ignore", "pipe", "pipe"] : "inherit",
  });

  if (options.check !== false && result.status !== 0) {
    const rendered = [command, ...args].join(" ");
    const detail = result.stderr?.trim() || result.stdout?.trim();
    throw new Error(detail ? `${rendered} failed: ${detail}` : `${rendered} failed`);
  }

  return result;
}

function hasCommand(command) {
  const result = run("sh", ["-c", `command -v ${command}`], {
    capture: true,
    check: false,
  });
  return result.status === 0;
}

function dockerCompose(args, options = {}) {
  return run("docker", ["compose", ...args], {
    ...options,
    env: secureEnv(),
  });
}

function readComposeFile() {
  return fs.readFileSync(path.join(rootDir, "docker-compose.yml"), "utf8");
}

function auditComposeFile() {
  const compose = readComposeFile();
  const errors = [];
  const warnings = [];

  for (const [port, service] of brokerAndDatabasePorts) {
    const publishedPortPattern = new RegExp(`["'](?:0\\.0\\.0\\.0:|\\$\\{[^}]+:-0\\.0\\.0\\.0\\}:)?${port}:${port}["']`);
    if (publishedPortPattern.test(compose)) {
      errors.push(`docker-compose.yml publishes ${service} port ${port}`);
    }
  }

  if (/POSTGRES_PASSWORD=\$\{POSTGRES_PASSWORD:-specforge\}/.test(compose)) {
    errors.push("docker-compose.yml uses the default Postgres password 'specforge'");
  }

  if (/change-me-in-production/.test(compose)) {
    errors.push("docker-compose.yml contains change-me-in-production secret defaults");
  }

  if (/redis-server --appendonly yes(?![^"\n]*--requirepass)/.test(compose)) {
    errors.push("docker-compose.yml starts Redis without --requirepass");
  }

  if (/\$\{SPECFORGE_BIND_HOST:-0\.0\.0\.0\}/.test(compose)) {
    warnings.push("app services default to public 0.0.0.0 binding");
  }

  if (errors.length > 0) {
    for (const error of errors) fail(error);
    throw new Error("compose security audit failed");
  }

  for (const warning of warnings) warn(warning);
  ok("docker-compose.yml keeps database and broker services internal by default");
}

function parseListener(line) {
  const fields = line.trim().split(/\s+/);
  const local = fields[3];
  if (!local) return null;

  let host = "";
  let port = Number.NaN;
  const bracketed = local.match(/^\[([^\]]+)\]:(\d+)$/);
  if (bracketed) {
    host = bracketed[1];
    port = Number.parseInt(bracketed[2], 10);
  } else {
    const index = local.lastIndexOf(":");
    if (index === -1) return null;
    host = local.slice(0, index);
    port = Number.parseInt(local.slice(index + 1), 10);
  }

  if (!Number.isFinite(port)) return null;
  return { host, port, line };
}

function isPublicHost(host) {
  return host === "*" || host === "0.0.0.0" || host === "::" || host === "[::]";
}

function readListeners() {
  if (hasCommand("ss")) {
    const result = run("ss", ["-H", "-ltnp"], { capture: true, check: false });
    return result.stdout
      .split("\n")
      .map(parseListener)
      .filter(Boolean);
  }

  if (hasCommand("lsof")) {
    const result = run("lsof", ["-nP", "-iTCP", "-sTCP:LISTEN"], {
      capture: true,
      check: false,
    });
    return result.stdout
      .split("\n")
      .slice(1)
      .map((line) => {
        const fields = line.trim().split(/\s+/);
        const local = fields[8];
        if (!local) return null;
        const index = local.lastIndexOf(":");
        if (index === -1) return null;
        return {
          host: local.slice(0, index),
          port: Number.parseInt(local.slice(index + 1), 10),
          line,
        };
      })
      .filter((listener) => listener && Number.isFinite(listener.port));
  }

  warn("neither ss nor lsof is available; live port exposure audit skipped");
  return [];
}

function auditLiveListeners() {
  const listeners = readListeners();
  const publicDataServices = listeners.filter(
    (listener) =>
      brokerAndDatabasePorts.has(listener.port) && isPublicHost(listener.host),
  );
  const publicAppServices = listeners.filter(
    (listener) => appPorts.has(listener.port) && isPublicHost(listener.host),
  );

  if (publicDataServices.length > 0) {
    for (const listener of publicDataServices) {
      fail(
        `${brokerAndDatabasePorts.get(listener.port)} is publicly listening on ${listener.host}:${listener.port}: ${listener.line}`,
      );
    }
    throw new Error("public database or broker listener detected");
  }

  for (const listener of listeners) {
    if (brokerAndDatabasePorts.has(listener.port)) {
      ok(
        `${brokerAndDatabasePorts.get(listener.port)} listener is not public: ${listener.host}:${listener.port}`,
      );
    }
  }

  for (const listener of publicAppServices) {
    warn(
      `app port ${listener.port} is publicly listening on ${listener.host}; prefer a tunnel or set a demo gate before exposing it`,
    );
  }

  if (listeners.every((listener) => !brokerAndDatabasePorts.has(listener.port))) {
    ok("no active database or broker listeners detected");
  }
}

function listSpecForgeContainers() {
  const result = run(
    "docker",
    [
      "ps",
      "-a",
      "--format",
      "{{.ID}}\t{{.Names}}\t{{.Image}}\t{{.Labels}}",
    ],
    { capture: true, check: false },
  );
  if (result.status !== 0) return [];

  return result.stdout
    .split("\n")
    .filter(Boolean)
    .map((line) => {
      const [id, name, image, labels] = line.split("\t");
      return { id, name, image, labels };
    })
    .filter((container) => {
      const text = `${container.name} ${container.image} ${container.labels}`.toLowerCase();
      const isSpecForge = text.includes("specforge");
      const isDataService = /(redis|postgres|rabbitmq|kafka|zookeeper|nats)/.test(text);
      return isSpecForge && isDataService;
    });
}

function cleanupSpecForgeContainers() {
  dockerCompose(["down", "--remove-orphans"], { check: false });

  const containers = listSpecForgeContainers();
  if (containers.length === 0) {
    ok("no old SpecForge database or broker containers found");
    return;
  }

  for (const container of containers) {
    warn(`removing old SpecForge data-service container ${container.name}`);
    run("docker", ["rm", "-f", container.id], { check: false });
  }
}

function getProcessTable() {
  const result = run("ps", ["-eo", "pid=,args="], { capture: true, check: false });
  if (result.status !== 0) return [];

  return result.stdout
    .split("\n")
    .map((line) => {
      const match = line.trim().match(/^(\d+)\s+(.+)$/);
      if (!match) return null;
      return { pid: Number.parseInt(match[1], 10), args: match[2] };
    })
    .filter(Boolean);
}

function processCwd(pid) {
  try {
    return fs.readlinkSync(`/proc/${pid}/cwd`);
  } catch {
    return "";
  }
}

function cleanupSpecForgeProcesses() {
  const candidates = getProcessTable().filter((processInfo) => {
    if (processInfo.pid === process.pid) return false;
    const args = processInfo.args;
    const looksLikeSpecForge =
      args.includes("specforge") ||
      args.includes("next dev") ||
      args.includes("node --watch src/index.js") ||
      args.includes("bun --filter specforge-web dev") ||
      args.includes("bun --filter specforge-collab-server dev");
    if (!looksLikeSpecForge) return false;

    const cwd = processCwd(processInfo.pid);
    return cwd.startsWith(rootDir);
  });

  if (candidates.length === 0) {
    ok("no old SpecForge app server processes found");
    return;
  }

  for (const processInfo of candidates) {
    warn(`stopping old SpecForge process ${processInfo.pid}: ${processInfo.args}`);
    try {
      process.kill(processInfo.pid, "SIGTERM");
    } catch (error) {
      warn(`could not stop process ${processInfo.pid}: ${error.message}`);
    }
  }
}

function requestHealth(url) {
  return new Promise((resolve, reject) => {
    const request = http.get(url, (response) => {
      response.resume();
      if (response.statusCode && response.statusCode >= 200 && response.statusCode < 300) {
        resolve();
        return;
      }
      reject(new Error(`${url} returned ${response.statusCode}`));
    });
    request.setTimeout(3_000, () => {
      request.destroy(new Error(`${url} timed out`));
    });
    request.on("error", reject);
  });
}

async function waitForHealth(name, url, timeoutMs = 120_000) {
  const startedAt = Date.now();
  let lastError = null;
  while (Date.now() - startedAt < timeoutMs) {
    try {
      await requestHealth(url);
      ok(`${name} health check passed at ${url}`);
      return;
    } catch (error) {
      lastError = error;
      await new Promise((resolve) => setTimeout(resolve, 2_000));
    }
  }
  throw new Error(`${name} health check failed: ${lastError?.message || "timeout"}`);
}

async function verifyStack() {
  await waitForHealth("web", `http://127.0.0.1:${webPort}/api/health`);
  await waitForHealth(
    "collab",
    `http://127.0.0.1:${collabHealthPort}/health`,
  );
  auditLiveListeners();
}

function audit() {
  auditComposeFile();
  auditLiveListeners();
}

async function up() {
  cleanupSpecForgeContainers();
  cleanupSpecForgeProcesses();
  auditComposeFile();
  dockerCompose(["up", "--build", "-d", "web", "collab-server", "redis"]);
  await verifyStack();
  ok(`secure local stack is running at http://127.0.0.1:${webPort}`);
}

function down() {
  cleanupSpecForgeContainers();
  cleanupSpecForgeProcesses();
  auditLiveListeners();
}

async function cycle() {
  try {
    down();
    audit();
    await up();
  } finally {
    down();
  }
}

async function main() {
  const command = process.argv[2] || "audit";
  if (command === "audit") {
    audit();
    return;
  }
  if (command === "up") {
    await up();
    return;
  }
  if (command === "down") {
    down();
    return;
  }
  if (command === "cycle") {
    await cycle();
    return;
  }
  if (command === "cleanup") {
    down();
    return;
  }

  fail(`unknown command: ${command}`);
  log("usage: node tools/secure-local-server.mjs [audit|up|down|cycle|cleanup]");
  process.exitCode = 2;
}

main().catch((error) => {
  fail(error.message);
  process.exitCode = 1;
});
