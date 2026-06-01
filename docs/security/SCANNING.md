# Security Scanning Guide

This guide explains the security scanning tools and practices used in SpecForge.

## Automated Security Scans

SpecForge uses GitHub Actions for automated security scanning:

### 1. Dependency Scanning (Trivy)
- **Trigger**: Every PR, weekly on Sunday
- **What it scans**: All dependencies in package.json
- **Output**: SARIF format uploaded to GitHub Security tab
- **Location**: `.github/workflows/security-scan.yml`

### 2. CodeQL Analysis
- **Trigger**: Every PR
- **What it scans**: JavaScript/TypeScript code for vulnerabilities
- **Output**: SARIF format uploaded to GitHub Security tab
- **Location**: `.github/workflows/security-scan.yml`

### 3. Secret Scanning (Gitleaks)
- **Trigger**: Every PR
- **What it scans**: Git history for leaked secrets/API keys
- **Output**: Fails PR if secrets found
- **Location**: `.github/workflows/security-scan.yml`

### 4. Container Scanning (Trivy)
- **Trigger**: Every PR
- **What it scans**: Docker images for vulnerabilities
- **Output**: SARIF format uploaded to GitHub Security tab
- **Location**: `.github/workflows/security-scan.yml`

## Manual Security Scans

### Local Dependency Scan
```bash
# Install Trivy
brew install trivy

# Scan dependencies
trivy fs .
```

### Local Secret Scan
```bash
# Install Gitleaks
brew install gitleaks

# Scan repository
gitleaks detect --source .
```

### Local Container Scan
```bash
# Build image
docker build -t specforge:test .

# Scan image
trivy image specforge:test
```

## Security Best Practices

### Dependency Management
1. **Update dependencies regularly**
   ```bash
   bun update
   bun audit
   ```

2. **Pin dependency versions** in package.json
3. **Review security advisories** for each dependency
4. **Use `bun audit`** to check for vulnerabilities

### Secret Management
1. **Never commit secrets** to git
2. **Use environment variables** for sensitive data
3. **Use GitHub Secrets** for CI/CD
4. **Rotate keys regularly**

### Code Security
1. **Validate all inputs** (use Zod schemas)
2. **Use parameterized queries** to prevent SQL injection
3. **Sanitize user output** to prevent XSS
4. **Implement rate limiting** to prevent abuse
5. **Use HTTPS** everywhere

### Container Security
1. **Use minimal base images** (alpine)
2. **Scan images** before deployment
3. **Don't run as root** in containers
4. **Keep images updated**

## Security Checklist

Before deploying to production:

- [ ] All dependency vulnerabilities are patched
- [ ] No secrets in code or git history
- [ ] Container image scanned and clean
- [ ] CodeQL analysis passes
- [ ] Rate limiting configured
- [ ] HTTPS enforced
- [ ] Security headers configured
- [ ] Input validation in place
- [ ] Output sanitization in place
- [ ] Error messages don't leak info

## Security Incident Response

If a vulnerability is discovered:

1. **Assess severity** using CVSS score
2. **Patch immediately** for critical/high severity
3. **Rotate secrets** if they were exposed
4. **Notify users** if data was compromised
5. **Document incident** in security log
6. **Update security policies** to prevent recurrence

## Security Resources

- [OWASP Top 10](https://owasp.org/www-project-top-ten/)
- [CVE Database](https://cve.mitre.org/)
- [GitHub Security Advisories](https://github.com/advisories)
- [Snyk Vulnerability DB](https://security.snyk.io/)

## Compliance

SpecForge aims to comply with:
- **OWASP Top 10** - Web application security risks
- **GDPR** - Data protection (when applicable)
- **SOC 2** - Security controls (future goal)