/**
 * OpenAPI/Swagger Specification for SpecForge API
 * Version: 1.0.0
 */

import type { OpenAPIV3_1 } from "openapi-types";

export const openAPISpec: OpenAPIV3_1.Document = {
  openapi: "3.1.0",
  info: {
    title: "SpecForge API",
    description: "API for SpecForge - Collaborative specification authoring platform",
    version: "1.0.0",
    contact: {
      name: "SpecForge Team",
      email: "chimera_defi@protonmail.com",
    },
    license: {
      name: "MIT",
    },
  },
  servers: [
    {
      url: "http://localhost:3000",
      description: "Development server",
    },
    {
      url: "https://api.specforge.dev",
      description: "Production server",
    },
  ],
  tags: [
    {
      name: "Health",
      description: "Health check and monitoring endpoints",
    },
    {
      name: "Documents",
      description: "Document management endpoints",
    },
    {
      name: "Patches",
      description: "Patch proposal and management endpoints",
    },
    {
      name: "Workspace",
      description: "Workspace management endpoints",
    },
    {
      name: "Auth",
      description: "Authentication and authorization endpoints",
    },
    {
      name: "Metrics",
      description: "Metrics and monitoring endpoints",
    },
  ],
  paths: {
    "/api/health": {
      get: {
        tags: ["Health"],
        summary: "Health check",
        description: "Check the health status of the API",
        operationId: "getHealth",
        responses: {
          "200": {
            description: "Healthy",
            content: {
              "application/json": {
                schema: {
                  $ref: "#/components/schemas/HealthResponse",
                },
              },
            },
          },
          "503": {
            description: "Service unavailable",
            content: {
              "application/json": {
                schema: {
                  $ref: "#/components/schemas/ErrorResponse",
                },
              },
            },
          },
        },
      },
    },
    "/api/documents": {
      get: {
        tags: ["Documents"],
        summary: "List documents",
        description: "Get a list of documents in the workspace",
        operationId: "listDocuments",
        parameters: [
          {
            name: "workspaceId",
            in: "query",
            description: "Workspace ID",
            required: false,
            schema: {
              type: "string",
            },
          },
          {
            name: "limit",
            in: "query",
            description: "Number of documents to return",
            required: false,
            schema: {
              type: "integer",
              default: 50,
            },
          },
          {
            name: "offset",
            in: "query",
            description: "Number of documents to skip",
            required: false,
            schema: {
              type: "integer",
              default: 0,
            },
          },
        ],
        responses: {
          "200": {
            description: "List of documents",
            content: {
              "application/json": {
                schema: {
                  $ref: "#/components/schemas/DocumentsListResponse",
                },
              },
            },
          },
          "401": {
            description: "Unauthorized",
            content: {
              "application/json": {
                schema: {
                  $ref: "#/components/schemas/ErrorResponse",
                },
              },
            },
          },
        },
      },
      post: {
        tags: ["Documents"],
        summary: "Create document",
        description: "Create a new document",
        operationId: "createDocument",
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                $ref: "#/components/schemas/CreateDocumentRequest",
              },
            },
          },
        },
        responses: {
          "201": {
            description: "Document created",
            content: {
              "application/json": {
                schema: {
                  $ref: "#/components/schemas/DocumentResponse",
                },
              },
            },
          },
          "400": {
            description: "Bad request",
            content: {
              "application/json": {
                schema: {
                  $ref: "#/components/schemas/ErrorResponse",
                },
              },
            },
          },
          "401": {
            description: "Unauthorized",
            content: {
              "application/json": {
                schema: {
                  $ref: "#/components/schemas/ErrorResponse",
                },
              },
            },
          },
        },
      },
    },
    "/api/documents/{id}": {
      get: {
        tags: ["Documents"],
        summary: "Get document",
        description: "Get a specific document by ID",
        operationId: "getDocument",
        parameters: [
          {
            name: "id",
            in: "path",
            description: "Document ID",
            required: true,
            schema: {
              type: "string",
            },
          },
        ],
        responses: {
          "200": {
            description: "Document details",
            content: {
              "application/json": {
                schema: {
                  $ref: "#/components/schemas/DocumentResponse",
                },
              },
            },
          },
          "404": {
            description: "Document not found",
            content: {
              "application/json": {
                schema: {
                  $ref: "#/components/schemas/ErrorResponse",
                },
              },
            },
          },
        },
      },
    },
    "/api/documents/{id}/patches": {
      get: {
        tags: ["Patches"],
        summary: "List patches",
        description: "Get patches for a document",
        operationId: "listPatches",
        parameters: [
          {
            name: "id",
            in: "path",
            description: "Document ID",
            required: true,
            schema: {
              type: "string",
            },
          },
        ],
        responses: {
          "200": {
            description: "List of patches",
            content: {
              "application/json": {
                schema: {
                  $ref: "#/components/schemas/PatchesListResponse",
                },
              },
            },
          },
        },
      },
    },
    "/api/auth/callback": {
      get: {
        tags: ["Auth"],
        summary: "OAuth callback",
        description: "Handle OAuth callback from GitHub",
        operationId: "authCallback",
        parameters: [
          {
            name: "code",
            in: "query",
            description: "OAuth code",
            required: true,
            schema: {
              type: "string",
            },
          },
          {
            name: "state",
            in: "query",
            description: "OAuth state",
            required: true,
            schema: {
              type: "string",
            },
          },
        ],
        responses: {
          "302": {
            description: "Redirect to dashboard",
          },
          "400": {
            description: "Bad request",
          },
        },
      },
    },
    "/api/metrics/export": {
      get: {
        tags: ["Metrics"],
        summary: "Export metrics",
        description: "Get metrics in JSON format",
        operationId: "exportMetrics",
        responses: {
          "200": {
            description: "Metrics data",
            content: {
              "application/json": {
                schema: {
                  $ref: "#/components/schemas/MetricsResponse",
                },
              },
            },
          },
        },
      },
    },
    "/api/metrics/prometheus": {
      get: {
        tags: ["Metrics"],
        summary: "Prometheus metrics",
        description: "Get metrics in Prometheus format",
        operationId: "prometheusMetrics",
        responses: {
          "200": {
            description: "Metrics in Prometheus format",
            content: {
              "text/plain": {
                schema: {
                  type: "string",
                },
              },
            },
          },
        },
      },
    },
  },
  components: {
    schemas: {
      HealthResponse: {
        type: "object",
        properties: {
          status: {
            type: "string",
            enum: ["ok", "error"],
          },
          health: {
            type: "object",
            properties: {
              status: {
                type: "string",
                enum: ["healthy", "degraded", "unhealthy"],
              },
              checks: {
                type: "object",
                additionalProperties: {
                  type: "object",
                  properties: {
                    status: {
                      type: "string",
                      enum: ["pass", "fail"],
                    },
                  },
                },
              },
            },
          },
        },
      },
      ErrorResponse: {
        type: "object",
        properties: {
          error: {
            type: "string",
          },
          message: {
            type: "string",
          },
          details: {
            type: "object",
          },
        },
        required: ["error"],
      },
      DocumentsListResponse: {
        type: "object",
        properties: {
          documents: {
            type: "array",
            items: {
              $ref: "#/components/schemas/Document",
            },
          },
          total: {
            type: "integer",
          },
        },
      },
      Document: {
        type: "object",
        properties: {
          id: {
            type: "string",
          },
          title: {
            type: "string",
          },
          createdAt: {
            type: "string",
            format: "date-time",
          },
          updatedAt: {
            type: "string",
            format: "date-time",
          },
        },
      },
      DocumentResponse: {
        type: "object",
        properties: {
          document: {
            $ref: "#/components/schemas/Document",
          },
        },
      },
      CreateDocumentRequest: {
        type: "object",
        properties: {
          title: {
            type: "string",
          },
          workspaceId: {
            type: "string",
          },
        },
        required: ["title"],
      },
      PatchesListResponse: {
        type: "object",
        properties: {
          patches: {
            type: "array",
            items: {
              $ref: "#/components/schemas/Patch",
            },
          },
        },
      },
      Patch: {
        type: "object",
        properties: {
          id: {
            type: "string",
          },
          documentId: {
            type: "string",
          },
          status: {
            type: "string",
            enum: ["pending", "accepted", "rejected"],
          },
          createdAt: {
            type: "string",
            format: "date-time",
          },
        },
      },
      MetricsResponse: {
        type: "object",
        properties: {
          timestamp: {
            type: "string",
            format: "date-time",
          },
          uptime: {
            type: "number",
          },
          metrics: {
            type: "object",
          },
          health: {
            type: "object",
          },
          circuitBreakers: {
            type: "object",
          },
        },
      },
    },
    securitySchemes: {
      bearerAuth: {
        type: "http",
        scheme: "bearer",
        bearerFormat: "JWT",
      },
      oauth2: {
        type: "oauth2",
        flows: {
          authorizationCode: {
            authorizationUrl: "https://github.com/login/oauth/authorize",
            tokenUrl: "https://github.com/login/oauth/access_token",
            scopes: {
              "read:user": "Read user profile",
              "repo": "Access repositories",
            },
          },
        },
      },
    },
  },
  security: [
    {
      bearerAuth: [],
    },
  ],
};