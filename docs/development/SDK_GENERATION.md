# API Client SDK Generation Guide

This guide explains how to generate API client SDKs from the OpenAPI specification for various languages.

## Prerequisites

The OpenAPI specification is available at `/api/openapi`

## OpenAPI Generator

### Installation

```bash
# Using npm
npm install -g @openapitools/openapi-generator-cli

# Using Docker
docker pull openapitools/openapi-generator-cli
```

## Generate SDKs

### JavaScript/TypeScript

```bash
openapi-generator-cli generate \
  -i http://localhost:3000/api/openapi \
  -g typescript-axios \
  -o ./client-sdk/typescript \
  --additional-properties=supportsES6=true
```

### Python

```bash
openapi-generator-cli generate \
  -i http://localhost:3000/api/openapi \
  -g python \
  -o ./client-sdk/python
```

### Java

```bash
openapi-generator-cli generate \
  -i http://localhost:3000/api/openapi \
  -g java \
  -o ./client-sdk/java \
  --library=resttemplate
```

### Go

```bash
openapi-generator-cli generate \
  -i http://localhost:3000/api/openapi \
  -g go \
  -o ./client-sdk/go
```

### Ruby

```bash
openapi-generator-cli generate \
  -i http://localhost:3000/api/openapi \
  -g ruby \
  -o ./client-sdk/ruby
```

### PHP

```bash
openapi-generator-cli generate \
  -i http://localhost:3000/api/openapi \
  -g php \
  -o ./client-sdk/php
```

## Usage Examples

### TypeScript SDK

```typescript
import { SpecForgeApi } from './client-sdk/typescript';

const api = new SpecForgeApi({
  baseURL: 'https://api.specforge.dev',
  apiKey: 'your-api-key',
});

// Get documents
const documents = await api.documents.getDocuments();

// Create document
const document = await api.documents.createDocument({
  title: 'My Document',
  workspaceId: 'workspace-123',
});
```

### Python SDK

```python
from specforge import SpecForgeApi

api = SpecForgeApi(
    base_url='https://api.specforge.dev',
    api_key='your-api-key',
)

# Get documents
documents = api.documents.get_documents()

# Create document
document = api.documents.create_document(
    title='My Document',
    workspace_id='workspace-123',
)
```

### Java SDK

```java
import org.openapitools.client.ApiClient;
import org.openapitools.client.api.DocumentsApi;

ApiClient apiClient = new ApiClient();
apiClient.setBasePath("https://api.specforge.dev");
apiClient.addDefaultHeader("Authorization", "Bearer your-api-key");

DocumentsApi api = new DocumentsApi(apiClient);

// Get documents
List<Document> documents = api.getDocuments();

// Create document
Document document = api.createDocument(
    new Document()
        .title("My Document")
        .workspaceId("workspace-123")
);
```

## Authentication

### API Key

```typescript
const api = new SpecForgeApi({
  apiKey: 'your-api-key',
});
```

### Bearer Token

```typescript
const api = new SpecForgeApi({
  apiKey: 'your-jwt-token',
});
```

## CI/CD Integration

Add to `.github/workflows/generate-sdk.yml`:

```yaml
name: Generate SDK

on:
  push:
    paths:
      - 'web/src/lib/api/openapi-spec.ts'

jobs:
  generate-sdk:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - name: Generate TypeScript SDK
        run: |
          npm install -g @openapitools/openapi-generator-cli
          openapi-generator-cli generate \
            -i web/src/lib/api/openapi-spec.ts \
            -g typescript-axios \
            -o client-sdk/typescript
      - name: Generate Python SDK
        run: |
          openapi-generator-cli generate \
            -i web/src/lib/api/openapi-spec.ts \
            -g python \
            -o client-sdk/python
      - name: Commit SDKs
        run: |
          git config user.name "SDK Bot"
          git config user.email "sdk-bot@specforge.dev"
          git add client-sdk/
          git commit -m "chore: auto-generate SDKs"
          git push
```

## Version Management

### Semantic Versioning

SDKs should follow the API version:
- v1 API → SDK v1.x.x
- Breaking changes → Major version bump
- New features → Minor version bump
- Bug fixes → Patch version bump

### Auto-publishing

Configure package.json for auto-publishing:

```json
{
  "name": "@specforge/typescript-sdk",
  "version": "1.0.0",
  "publishConfig": {
    "access": "public"
  },
  "scripts": {
    "publish": "npm publish"
  }
}
```

## Documentation

### SDK Documentation

Auto-generate docs from OpenAPI:

```bash
# For TypeScript
openapi-generator-cli generate \
  -i http://localhost:3000/api/openapi \
  -g typescript-axios \
  -o ./client-sdk/typescript \
  --additional-properties=withInterfaces=true
```

### Example Code

Include examples in SDK README:

```markdown
# SpecForge TypeScript SDK

## Installation
npm install @specforge/typescript-sdk

## Usage
```typescript
import { SpecForgeApi } from '@specforge/typescript-sdk';

const api = new SpecForgeApi({
  apiKey: process.env.SPECFORGE_API_KEY,
});

const documents = await api.documents.getDocuments();
```
```

## Testing

### SDK Tests

Generate test files:

```bash
openapi-generator-cli generate \
  -i http://localhost:3000/api/openapi \
  -g typescript-axios \
  -o ./client-sdk/typescript \
  --additional-properties=withSeparateModelsAndApi=true
```

### Integration Tests

Test SDK against staging environment:

```typescript
describe('SpecForge SDK', () => {
  const api = new SpecForgeApi({
    baseURL: 'https://staging.specforge.dev',
    apiKey: process.env.TEST_API_KEY,
  });

  it('should get documents', async () => {
    const documents = await api.documents.getDocuments();
    expect(documents).toBeDefined();
  });
});
```

## Best Practices

1. **Generate SDKs automatically** on API changes
2. **Publish to npm/pypi** for easy installation
3. **Include examples** in documentation
4. **Version alongside API** (v1 API → v1 SDK)
5. **Test SDKs** against staging environment
6. **Provide TypeScript types** for type safety
7. **Handle errors gracefully** with proper error types
8. **Support async/await** in all SDKs
9. **Include authentication helpers** in SDK
10. **Document breaking changes** in changelog

## Troubleshooting

### Generation fails
- Check OpenAPI spec is valid
- Verify API endpoint is accessible
- Check generator version compatibility
- Review generator logs

### SDK doesn't compile
- Check TypeScript version compatibility
- Verify dependencies are installed
- Review generated code for syntax errors
- Check for missing type definitions

### Runtime errors
- Verify base URL is correct
- Check authentication credentials
- Review API endpoint changes
- Check for network issues