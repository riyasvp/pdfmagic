# Dependency Audit

**Last Updated:** March 20, 2026  
**Node Version:** Check with `node --version`  
**Package Manager:** npm

## Outdated Packages

| Package | Current | Wanted | Latest | Update Priority | Breaking Changes | Effort |
|---------|--------|--------|--------|-----------------|------------------|--------|
| @prisma/client | 6.19.2 | 6.19.2 | **7.5.0** | High | Yes (Prisma 7) | 2h |
| eslint | 9.39.4 | 9.39.4 | **10.0.3** | Medium | Yes (Flat config) | 1h |
| lucide-react | 0.525.0 | 0.525.0 | **0.577.0** | Low | No | 15min |
| pdfjs-dist | 4.10.38 | 4.10.38 | **5.5.207** | High | Yes (v5 API) | 4h |
| react-resizable-panels | 3.0.6 | 3.0.6 | **4.7.3** | Medium | No | 30min |
| react-syntax-highlighter | 15.6.6 | 15.6.6 | **16.1.1** | Critical | No | 15min |
| recharts | 2.15.4 | 2.15.4 | **3.8.0** | High | Yes (v3 API) | 3h |
| uuid | 11.1.0 | 11.1.0 | **13.0.0** | Low | No | 15min |
| z-ai-web-dev-sdk | 0.0.16 | 0.0.16 | **0.0.17** | Low | No | 5min |

## Security Vulnerabilities

### Critical Vulnerabilities

| Package | Vulnerability | Severity | CVE | Fix Available | Fix Command |
|---------|---------------|----------|-----|---------------|-------------|
| prismjs (<1.30.0) | DOM Clobbering | **Moderate** | GHSA-x7hr-w5r2-h6wg | Yes | `npm audit fix` |

### Vulnerability Details

**prismjs - DOM Clobbering (GHSA-x7hr-w5r2-h6wg)**

```
prismjs DOM Clobbering vulnerability
Vulnerable versions: < 1.30.0
Patched versions: >= 1.30.0
Severity: moderate
```

**Impact:**  
DOM clobbering allows attackers to overwrite global variables used by the application, potentially leading to XSS attacks or security bypasses.

**Affected Chain:**
```
react-syntax-highlighter@15.6.6
  └── refractor@4.6.0
        └── prismjs (vulnerable version bundled)
```

**Recommended Fix:** Update to `react-syntax-highlighter@16.1.1` which includes `prismjs@1.30.0+`

## Recommended Additions

| Package | Purpose | Recommended Version | Justification |
|---------|---------|---------------------|---------------|
| @sentry/nextjs | Error tracking | ^9.x | Monitor production errors |
| @upstash/ratelimit | Distributed rate limiting | ^2.x | Scale beyond single instance |
| @upstash/redis | Redis client | ^1.x | Required for rate limiting |
| zod | Runtime validation | ^3.x | Validate API inputs |
| shiki | Syntax highlighting | ^1.x | Modern replacement for react-syntax-highlighter |
| @tanstack/react-table | Table component | ^8.x | If dashboard tables needed |
| clsx | Classname utility | ^2.x | Cleaner conditional classes |

## Unused Dependencies

Run this command to identify unused dependencies:
```bash
npm run depcheck
```

Potential unused packages (verify before removing):
- `react-syntax-highlighter` - Only used in dashboard (if present)
- `recharts` - Only used if analytics dashboard exists
- `uuid` - Consider using `crypto.randomUUID()` instead (Node.js 14.17+)

## Missing Dependencies

| Package | Purpose | Recommended Version |
|---------|---------|---------------------|
| @types/node | Node.js types | ^22.x |
| @types/react | React types (if using vite) | N/A (Next.js provides) |

## Version Compatibility Matrix

### Next.js 16 Compatibility
| Package | Required Version | Current | Compatible |
|---------|-----------------|---------|------------|
| react | 19.x | 19.x | ✅ |
| react-dom | 19.x | 19.x | ✅ |
| typescript | 5.x | 5.x | ✅ |

### Critical Pairings
| Package A | Package B | Min Version A | Min Version B | Status |
|-----------|-----------|---------------|----------------|--------|
| Next.js | React | 15.0.0 | 18.x | ✅ |
| Prisma | @prisma/client | 6.0.0 | 6.19.2 | ✅ |
| Sentry | Next.js | 8.0.0 | 16.x | ✅ |

## Update Strategy

### Phase 1: Security Fixes (Immediate)
```bash
npm audit fix
```

### Phase 2: Low-Risk Updates (This Week)
```bash
npm update lucide-react
npm update react-resizable-panels
npm update uuid
npm update z-ai-web-dev-sdk
```

### Phase 3: Medium-Risk Updates (Next Sprint)
```bash
npm update eslint
# Note: ESLint 10 requires flat config - may need config updates
```

### Phase 4: Major Version Updates (Schedule Time)
1. **Recharts 2→3**: API changes for some components
2. **pdfjs-dist 4→5**: Major API rewrite
3. **Prisma 6→7**: Schema changes, new features

## Environment Variables Checklist

Ensure these are in `.env.local`:
```bash
# Supabase
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=

# Analytics
NEXT_PUBLIC_GA_ID=

# Optional
SENTRY_DSN=
UPSTASH_REDIS_REST_URL=
UPSTASH_REDIS_REST_TOKEN=
```

---

*Generated: March 20, 2026*
*Next Audit: April 20, 2026*
