import { openAPISpec } from "@/lib/api/openapi-spec";

export default function APIDocsPage() {
  return (
    <div className="min-h-screen bg-background p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-4">SpecForge API Documentation</h1>
        <p className="text-muted-foreground mb-8">
          OpenAPI specification for the SpecForge API
        </p>

        <div className="space-y-6">
          <div className="bg-card border rounded-lg p-6">
            <h2 className="text-xl font-semibold mb-2">OpenAPI Spec</h2>
            <p className="text-sm text-muted-foreground mb-4">
              Download the OpenAPI specification in JSON format
            </p>
            <a
              href="/api/openapi"
              download="openapi.json"
              className="inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 bg-primary text-primary-foreground hover:bg-primary/90 h-10 px-4 py-2"
            >
              Download OpenAPI Spec
            </a>
          </div>

          <div className="bg-card border rounded-lg p-6">
            <h2 className="text-xl font-semibold mb-2">API Endpoints</h2>
            <div className="space-y-4">
              {Object.entries(openAPISpec.paths).map(([path, methods]) => (
                <div key={path} className="border-b pb-4 last:border-0">
                  <h3 className="font-mono text-sm mb-2">{path}</h3>
                  <div className="space-y-2">
                    {Object.entries(methods).map(([method, spec]: [string, { summary: string }]) => (
                      <div key={method} className="flex items-center gap-2">
                        <span className="px-2 py-1 rounded text-xs font-bold bg-primary text-primary-foreground">
                          {method.toUpperCase()}
                        </span>
                        <span className="text-sm">{spec.summary}</span>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-card border rounded-lg p-6">
            <h2 className="text-xl font-semibold mb-2">Authentication</h2>
            <p className="text-sm text-muted-foreground">
              The API uses OAuth 2.0 for authentication. You can authenticate using GitHub OAuth.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}