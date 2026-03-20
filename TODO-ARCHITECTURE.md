# PDFMagic Architecture TODO

**Last Updated:** March 20, 2026  
**Status:** Planning Complete, Implementation In Progress

## ✅ Completed Fixes

| Issue | Status | Date Fixed |
|-------|--------|------------|
| PrismJS vulnerability (Critical) | ✅ Fixed | Mar 20, 2026 |
| TypeScript errors in `src/` (50+ → 0) | ✅ Fixed | Mar 20, 2026 |
| PDF library BlobPart type errors | ✅ Fixed | Mar 20, 2026 |
| pdf-processor return type | ✅ Fixed | Mar 20, 2026 |
| Security: Path separator issue | ✅ Fixed | Mar 20, 2026 |
| Supabase null checks | ✅ Fixed | Mar 20, 2026 |
| i18n locale type | ✅ Fixed | Mar 20, 2026 |
| AuthProvider type mismatch | ✅ Fixed | Mar 20, 2026 |
| metadata 'manifest' property | ✅ Fixed | Mar 20, 2026 |

## 🔴 Critical (Fix This Week)

- [ ] **TypeScript Build Errors Ignored**
  - Location: `next.config.ts`
  - Priority: CRITICAL
  - Task: Run `npx tsc --noEmit` and fix all errors
  - Estimated Time: 4 hours

- [ ] **Shell Injection Risk in PDF Processor**
  - Location: `src/lib/pdf-processor.ts`
  - Priority: CRITICAL  
  - Task: Replace `exec` with `spawn` using args file
  - Estimated Time: 2 hours

## 🟠 High (Fix This Sprint)

- [ ] **Enable React Strict Mode**
  - Location: `next.config.ts`
  - Priority: HIGH
  - Task: Enable and fix any React 19 compatibility issues
  - Estimated Time: 2-4 hours

- [ ] **Monolithic ToolLayout Component**
  - Location: `src/components/pdf/ToolLayout.tsx`
  - Priority: HIGH
  - Task: Extract tool-specific UI into separate components
  - Estimated Time: 8 hours

- [ ] **Distributed Rate Limiting**
  - Location: `src/lib/security.ts`
  - Priority: HIGH
  - Task: Add Redis/Upstash integration
  - Estimated Time: 3 hours

## 🟡 Medium (Fix This Month)

- [ ] **Major Version Updates**
  - [ ] Prisma 6 → 7 (2h)
  - [ ] pdfjs-dist 4 → 5 (4h)
  - [ ] recharts 2 → 3 (3h)

- [ ] **Consolidate Supabase Clients**
  - Location: Multiple files
  - Estimated Time: 2 hours

- [ ] **Hardcoded Analytics ID**
  - Location: `src/app/layout.tsx`
  - Task: Move to env variable
  - Estimated Time: 30 minutes

## 🟢 Low (Schedule Later)

- [ ] Add Sentry error tracking
- [ ] Add comprehensive unit tests
- [ ] Add E2E tests
- [ ] Performance optimization pass
- [ ] Replace Python execution with WASM alternatives

## Progress Summary

```
Critical:   [##----] 2/6 complete (33%)
High:       [----]   0/4 complete (0%)
Medium:     [---]    0/4 complete (0%)
Low:        [----]   0/5 complete (0%)
```

## Quick Wins (15-30 min each)

1. ✅ ~~Fix PrismJS vulnerability~~ - DONE
2. [ ] Update lucide-react (0.525 → 0.577)
3. [ ] Update uuid (consider using crypto.randomUUID)
4. [ ] Move analytics to env var

## Documentation

- [x] ARCHITECTURE.md - Created
- [x] DEPENDENCIES.md - Created  
- [x] FIX-PLANS.md - Created
- [ ] Update README with setup instructions
- [ ] Add CONTRIBUTING.md

## Next Steps

1. Fix TypeScript errors (Critical)
2. Replace shell execution (Critical)
3. Enable React Strict Mode
4. Extract ToolLayout components

---

*Review weekly on Mondays*
