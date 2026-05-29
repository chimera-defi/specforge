/**
 * API client utility
 * Centralized HTTP client with error handling, typing, and common patterns
 */

import { API_ENDPOINTS, ERROR_MESSAGES } from "./constants";

export class ApiError extends Error {
  constructor(
    message: string,
    public status?: number,
    public response?: Response
  ) {
    super(message);
    this.name = "ApiError";
  }
}

export interface ApiResponse<T = unknown> {
  data?: T;
  error?: string;
  status: number;
}

export interface FetchOptions extends RequestInit {
  timeout?: number;
}

/**
 * Default fetch with error handling
 */
export async function fetchApi<T = unknown>(
  url: string,
  options: FetchOptions = {}
): Promise<T> {
  const { timeout = 10000, ...fetchOptions } = options;

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeout);

  try {
    const response = await fetch(url, {
      ...fetchOptions,
      signal: controller.signal,
      headers: {
        "Content-Type": "application/json",
        ...fetchOptions.headers,
      },
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      let errorMessage: string = ERROR_MESSAGES.SERVER_ERROR;
      
      try {
        const errorData = await response.json();
        errorMessage = errorData.error || errorMessage;
      } catch {
        // If error response is not JSON, use status text
        errorMessage = response.statusText || errorMessage;
      }

      throw new ApiError(errorMessage, response.status, response);
    }

    return await response.json();
  } catch (error) {
    clearTimeout(timeoutId);

    if (error instanceof ApiError) {
      throw error;
    }

    if (error instanceof Error && error.name === "AbortError") {
      throw new ApiError(ERROR_MESSAGES.SERVER_ERROR);
    }

    throw new ApiError(ERROR_MESSAGES.NETWORK_ERROR);
  }
}

/**
 * GET request
 */
export function get<T = unknown>(url: string, options?: FetchOptions): Promise<T> {
  return fetchApi<T>(url, { ...options, method: "GET" });
}

/**
 * POST request
 */
export function post<T = unknown>(
  url: string,
  data?: unknown,
  options?: FetchOptions
): Promise<T> {
  return fetchApi<T>(url, {
    ...options,
    method: "POST",
    body: data ? JSON.stringify(data) : undefined,
  });
}

/**
 * PUT request
 */
export function put<T = unknown>(
  url: string,
  data?: unknown,
  options?: FetchOptions
): Promise<T> {
  return fetchApi<T>(url, {
    ...options,
    method: "PUT",
    body: data ? JSON.stringify(data) : undefined,
  });
}

/**
 * PATCH request
 */
export function patch<T = unknown>(
  url: string,
  data?: unknown,
  options?: FetchOptions
): Promise<T> {
  return fetchApi<T>(url, {
    ...options,
    method: "PATCH",
    body: data ? JSON.stringify(data) : undefined,
  });
}

/**
 * DELETE request
 */
export function del<T = unknown>(url: string, options?: FetchOptions): Promise<T> {
  return fetchApi<T>(url, { ...options, method: "DELETE" });
}

/**
 * Document API
 */
export const documentApi = {
  getById: (id: string) => get(API_ENDPOINTS.DOCUMENT_BY_ID(id)),
  update: (id: string, data: unknown) => put(API_ENDPOINTS.DOCUMENT_BY_ID(id), data),
  patch: (id: string, data: unknown) => patch(API_ENDPOINTS.DOCUMENT_BY_ID(id), data),
  delete: (id: string) => del(API_ENDPOINTS.DOCUMENT_BY_ID(id)),
};

/**
 * File API
 */
export const fileApi = {
  list: (documentId: string) => get(API_ENDPOINTS.FILES(documentId)),
  getById: (documentId: string, fileId: string) => 
    get(API_ENDPOINTS.FILE_BY_ID(documentId, fileId)),
  create: (documentId: string, data: unknown) => 
    post(API_ENDPOINTS.FILES(documentId), data),
  update: (documentId: string, fileId: string, data: unknown) => 
    put(API_ENDPOINTS.FILE_BY_ID(documentId, fileId), data),
  delete: (documentId: string, fileId: string) => 
    del(API_ENDPOINTS.FILE_BY_ID(documentId, fileId)),
  initialize: (documentId: string, data: unknown) => 
    post(API_ENDPOINTS.FILES_INITIALIZE(documentId), data),
  getVersions: (documentId: string, fileId: string) => 
    get(API_ENDPOINTS.FILE_VERSIONS(documentId, fileId)),
  restore: (documentId: string, fileId: string, versionId: string) => 
    post(API_ENDPOINTS.FILE_RESTORE(documentId, fileId, versionId)),
};

/**
 * Agent API
 */
export const agentApi = {
  assist: (data: unknown) => post(API_ENDPOINTS.AGENT_ASSIST, data),
  diagnostics: () => get(API_ENDPOINTS.AGENT_ASSIST_DIAGNOSTICS),
};

/**
 * Collab API
 */
export const collabApi = {
  getSession: () => get(API_ENDPOINTS.COLLAB_SESSION),
};

/**
 * Idea Validation API
 */
export const ideaValidationApi = {
  getSessions: (documentId: string) => get(API_ENDPOINTS.IDEA_VALIDATION_SESSIONS(documentId)),
  getSession: (documentId: string, sessionId: string) => get(API_ENDPOINTS.IDEA_VALIDATION_SESSION(documentId, sessionId)),
  create: (documentId: string, data: unknown) => post(API_ENDPOINTS.IDEA_VALIDATION_SESSIONS(documentId), data),
  advance: (documentId: string, sessionId: string, data: unknown) => post(API_ENDPOINTS.IDEA_VALIDATION_SESSION_ADVANCE(documentId, sessionId), data),
  skip: (documentId: string, sessionId: string, data: unknown) => post(API_ENDPOINTS.IDEA_VALIDATION_SESSION_SKIP(documentId, sessionId), data),
};

/**
 * Iterate Chat API
 */
export const iterateChatApi = {
  send: (documentId: string, data: unknown) => post(API_ENDPOINTS.ITERATE_CHAT(documentId), data),
};

/**
 * Acceptance Test API
 */
export const acceptanceTestApi = {
  list: (documentId: string) => get(API_ENDPOINTS.ACCEPTANCE_TESTS(documentId)),
  getById: (documentId: string, testId: string) => get(API_ENDPOINTS.ACCEPTANCE_TEST_BY_ID(documentId, testId)),
  create: (documentId: string, data: unknown) => post(API_ENDPOINTS.ACCEPTANCE_TESTS(documentId), data),
  update: (documentId: string, testId: string, data: unknown) => put(API_ENDPOINTS.ACCEPTANCE_TEST_BY_ID(documentId, testId), data),
  delete: (documentId: string, testId: string) => del(API_ENDPOINTS.ACCEPTANCE_TEST_BY_ID(documentId, testId)),
  run: (documentId: string) => post(API_ENDPOINTS.ACCEPTANCE_TESTS_RUN(documentId)),
};

/**
 * Clarification API
 */
export const clarificationApi = {
  list: (documentId: string) => get(API_ENDPOINTS.CLARIFICATIONS(documentId)),
  answer: (documentId: string, clarificationId: string, data: unknown) => 
    patch(`${API_ENDPOINTS.CLARIFICATIONS(documentId)}?clarification_id=${clarificationId}`, data),
};

/**
 * Ops API
 */
export const opsApi = {
  getIncidents: () => get(API_ENDPOINTS.OPS_INCIDENTS),
  getBackups: () => get(API_ENDPOINTS.OPS_BACKUPS),
  getSummary: () => get(API_ENDPOINTS.OPS_SUMMARY),
  getDiagnosticsPack: () => get(API_ENDPOINTS.OPS_DIAGNOSTICS_PACK),
};

/**
 * Workspace API
 */
export const workspaceApi = {
  get: () => get(API_ENDPOINTS.WORKSPACE),
  getPlans: () => get(API_ENDPOINTS.WORKSPACE_PLANS),
  getBilling: () => get(API_ENDPOINTS.WORKSPACE_BILLING),
  getEntitlements: () => get(API_ENDPOINTS.WORKSPACE_ENTITLEMENTS),
  deleteMember: (data: unknown) => post(API_ENDPOINTS.WORKSPACE_DELETE_MEMBER, data),
};

/**
 * Health API
 */
export const healthApi = {
  check: () => get(API_ENDPOINTS.HEALTH),
};