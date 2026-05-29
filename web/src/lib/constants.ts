/**
 * Application constants
 * Centralized configuration values to avoid magic numbers and strings
 */

export const APP_CONFIG = {
  // URLs
  WEB_URL: process.env.NEXT_PUBLIC_WEB_URL || "http://localhost:3000",
  COLLAB_SERVER_URL: process.env.NEXT_PUBLIC_COLLAB_SERVER_URL || "ws://localhost:3001",
  
  // Timeouts (in milliseconds)
  COPY_FEEDBACK_DURATION: 1500,
  COPY_FEEDBACK_DURATION_LONG: 1800,
  
  // Pagination
  DEFAULT_PAGE_SIZE: 20,
  MAX_PAGE_SIZE: 100,
  
  // File limits
  MAX_FILE_SIZE: 10 * 1024 * 1024, // 10MB
  MAX_FILENAME_LENGTH: 255,
  
  // Collaboration
  SYNC_DEBOUNCE_MS: 500,
  SAVE_DEBOUNCE_MS: 1000,
  
  // UI
  TOAST_DURATION: 3000,
  TOAST_DURATION_LONG: 5000,
} as const;

export const API_ENDPOINTS = {
  // Auth
  AUTH_LOGIN: "/api/auth/login",
  AUTH_LOGOUT: "/api/auth/logout",
  AUTH_DEMO_LOGIN: "/api/auth/demo-login",
  AUTH_CALLBACK: "/api/auth/callback",
  
  // Documents
  DOCUMENTS: "/api/documents",
  DOCUMENT_BY_ID: (id: string) => `/api/documents/${id}`,
  
  // Sections
  SECTIONS_ITERATE: (documentId: string, blockId: string) => `/api/documents/${documentId}/sections/${blockId}/iterate`,
  
  // Clarifications
  CLARIFICATIONS: (documentId: string) => `/api/documents/${documentId}/clarifications`,
  
  // Acceptance tests
  ACCEPTANCE_TESTS: (documentId: string) => `/api/documents/${documentId}/acceptance-tests`,
  ACCEPTANCE_TEST_BY_ID: (documentId: string, testId: string) => `/api/documents/${documentId}/acceptance-tests/${testId}`,
  ACCEPTANCE_TESTS_RUN: (documentId: string) => `/api/documents/${documentId}/acceptance-tests/run`,
  
  // Files
  FILES: (documentId: string) => `/api/documents/${documentId}/files`,
  FILE_BY_ID: (documentId: string, fileId: string) => `/api/documents/${documentId}/files/${fileId}`,
  FILES_INITIALIZE: (documentId: string) => `/api/documents/${documentId}/files/initialize`,
  FILE_VERSIONS: (documentId: string, fileId: string) => `/api/documents/${documentId}/files/${fileId}/versions`,
  FILE_RESTORE: (documentId: string, fileId: string, versionId: string) => 
    `/api/documents/${documentId}/files/${fileId}/versions/${versionId}/restore`,
  
  // Collaboration
  COLLAB_SESSION: "/api/collab/session",
  
  // Agent assist
  AGENT_ASSIST: "/api/agent/assist",
  AGENT_ASSIST_DIAGNOSTICS: "/api/agent/assist/diagnostics",
  
  // Billing
  BILLING_WEBHOOK: "/api/billing/webhook",
  WORKSPACE_BILLING: "/api/workspace/billing",
  
  // Operations
  OPS_INCIDENTS: "/api/ops/incidents",
  OPS_BACKUPS: "/api/ops/backups",
  OPS_DIAGNOSTICS_PACK: "/api/ops/diagnostics-pack",
  OPS_SUMMARY: "/api/ops/summary",
  
  // Health
  HEALTH: "/api/health",
  
  // Workspace
  WORKSPACE: "/api/workspace",
  WORKSPACE_PLANS: "/api/workspace/plans",
  WORKSPACE_ENTITLEMENTS: "/api/workspace/entitlements",
  WORKSPACE_DELETE_MEMBER: "/api/workspace/delete-member",
  
  // Ideas
  IDEAS_GENERATE: "/api/ideas/generate",
  
  // Design
  DESIGN_FEEDBACK: (documentId: string) => `/api/documents/${documentId}/design-feedback`,
  
  // Handoff
  HANDOFF: (documentId: string) => `/api/documents/${documentId}/handoff`,
  
  // Launch packet
  LAUNCH_PACKET: (documentId: string) => `/api/documents/${documentId}/launch-packet`,
  
  // Idea validation
  IDEA_VALIDATION_SESSIONS: (documentId: string) => `/api/documents/${documentId}/idea-validation-sessions`,
  IDEA_VALIDATION_SESSION: (documentId: string, sessionId: string) => 
    `/api/documents/${documentId}/idea-validation-sessions/${sessionId}`,
  IDEA_VALIDATION_SESSION_ADVANCE: (documentId: string, sessionId: string) => 
    `/api/documents/${documentId}/idea-validation-sessions/${sessionId}/advance`,
  IDEA_VALIDATION_SESSION_SKIP: (documentId: string, sessionId: string) => 
    `/api/documents/${documentId}/idea-validation-sessions/${sessionId}/skip-stage`,
  
  // Plan sessions
  PLAN_SESSIONS: (documentId: string) => `/api/documents/${documentId}/plan-sessions`,
  PLAN_SESSION: (documentId: string, sessionId: string) => 
    `/api/documents/${documentId}/plan-sessions/${sessionId}`,
  
  // Iterate chat
  ITERATE_CHAT: (documentId: string) => `/api/documents/${documentId}/iterate-chat`,
} as const;

export const ERROR_MESSAGES = {
  NETWORK_ERROR: "Network error. Please check your connection.",
  AUTH_ERROR: "Authentication failed. Please log in again.",
  PERMISSION_ERROR: "You don't have permission to perform this action.",
  NOT_FOUND_ERROR: "The requested resource was not found.",
  VALIDATION_ERROR: "Please check your input and try again.",
  SERVER_ERROR: "An unexpected error occurred. Please try again later.",
} as const;