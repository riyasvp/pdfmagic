# PDFMagic Conversion Tools Audit

**Date:** March 20, 2026  
**Auditor:** PLANNER Agent  
**Status:** Complete

---

## Executive Summary

Audited **12 API routes** and **12 Python conversion scripts**. Found significant inconsistency between routes - `from-word` and `from-excel` have been properly modernized while other routes remain outdated.

---

## Issues Found

### Critical

| Tool | Issue | Severity | Status |
|------|-------|----------|--------|
| `from-ppt` | Missing auth check | Critical | OPEN |
| `from-ppt` | Missing Supabase upload | Critical | OPEN |
| `from-ppt` | Missing cleanup in finally block | Critical | OPEN |
| `from-html` | Missing auth check | Critical | OPEN |
| `from-html` | Missing Supabase upload | Critical | OPEN |
| `from-html` | Missing cleanup in finally block | Critical | OPEN |
| `from-image` | Missing auth check | Critical | OPEN |
| `from-image` | Missing Supabase upload | Critical | OPEN |
| `from-image` | Missing cleanup in finally block | Critical | OPEN |
| `to-word` | Missing auth check | Critical | OPEN |
| `to-word` | Missing Supabase upload | Critical | OPEN |
| `to-word` | Missing cleanup in finally block | Critical | OPEN |
| `to-excel` | Missing auth check | Critical | OPEN |
| `to-excel` | Missing Supabase upload | Critical | OPEN |
| `to-excel` | Missing cleanup in finally block | Critical | OPEN |
| `to-ppt` | Missing auth check | Critical | OPEN |
| `to-ppt` | Missing Supabase upload | Critical | OPEN |
| `to-ppt` | Missing cleanup in finally block | Critical | OPEN |
| `to-image` | Uses local `/api/download/` URL | Critical | OPEN |
| `markdown` | Missing auth check | Critical | OPEN |
| `markdown` | Missing Supabase upload | Critical | OPEN |
| `text` | Missing auth check | Critical | OPEN |
| `text` | Missing Supabase upload | Critical | OPEN |
| `html` | Missing auth check | Critical | OPEN |
| `html` | Missing Supabase upload | Critical | OPEN |

### High

| Tool | Issue | Severity | Status |
|------|-------|----------|--------|
| All routes | Missing file size validation | High | OPEN |
| All routes | Missing rate limiting | High | OPEN |
| `pdf_to_image` | Route parameter `format` not validated | High | OPEN |

### Medium

| Tool | Issue | Severity | Status |
|------|-------|----------|--------|
| All routes | Missing request timeout handling | Medium | OPEN |
| `excel_to_pdf` | Python script creates plain tables (no formatting preservation) | Medium | OPEN |
| `ppt_to_pdf` | Python script creates plain text slides (no images/layout) | Medium | OPEN |
| `html_to_pdf` | Fallback to reportlab loses CSS styling | Medium | OPEN |

---

## Routes Status

### Convert FROM PDF (Output: PDF)

| Route | Auth | Supabase | Cleanup | Error Handling | Status |
|-------|------|----------|---------|----------------|--------|
| `from-word` | ✅ | ✅ | ✅ | ✅ | ✅ PASS |
| `from-excel` | ✅ | ✅ | ✅ | ✅ | ✅ PASS |
| `from-ppt` | ❌ | ❌ | ❌ | ⚠️ Basic | ❌ FAIL |
| `from-html` | ❌ | ❌ | ❌ | ⚠️ Basic | ❌ FAIL |
| `from-image` | ❌ | ❌ | ❌ | ⚠️ Basic | ❌ FAIL |

### Convert TO PDF (Output: Other)

| Route | Auth | Supabase | Cleanup | Error Handling | Status |
|-------|------|----------|---------|----------------|--------|
| `to-word` | ❌ | ❌ | ❌ | ⚠️ Basic | ❌ FAIL |
| `to-excel` | ❌ | ❌ | ❌ | ⚠️ Basic | ❌ FAIL |
| `to-ppt` | ❌ | ❌ | ❌ | ⚠️ Basic | ❌ FAIL |
| `to-image` | ❌ | ❌ | ❌ | ⚠️ Basic | ❌ FAIL |
| `markdown` | ❌ | ❌ | ❌ | ⚠️ Basic | ❌ FAIL |
| `text` | ❌ | ❌ | ❌ | ⚠️ Basic | ❌ FAIL |
| `html` | ❌ | ❌ | ❌ | ⚠️ Basic | ❌ FAIL |

---

## Python Scripts Status

All 12 conversion scripts passed Python syntax validation.

| Script | Syntax OK | Imports OK | Output Path OK | Has Fallback | Status |
|--------|-----------|------------|----------------|--------------|--------|
| `word_to_pdf.py` | ✅ | ✅ | ✅ | ✅ COM/LibreOffice | ✅ OK |
| `excel_to_pdf.py` | ✅ | ✅ | ✅ | N/A | ✅ OK |
| `ppt_to_pdf.py` | ✅ | ✅ | ✅ | N/A | ✅ OK |
| `html_to_pdf.py` | ✅ | ✅ | ✅ | ✅ WeasyPrint/reportlab | ✅ OK |
| `image_to_pdf.py` | ✅ | ✅ | ✅ | N/A | ✅ OK |
| `pdf_to_word.py` | ✅ | ✅ | ✅ | N/A | ✅ OK |
| `pdf_to_excel.py` | ✅ | ✅ | ✅ | N/A | ✅ OK |
| `pdf_to_ppt.py` | ✅ | ✅ | ✅ | N/A | ✅ OK |
| `pdf_to_image.py` | ✅ | ✅ | ✅ | N/A | ✅ OK |
| `markdown_pdf.py` | ✅ | ✅ | ✅ | N/A | ✅ OK |
| `text_pdf.py` | ✅ | ✅ | ✅ | N/A | ✅ OK |
| `html_pdf.py` | ✅ | ✅ | ✅ | N/A | ✅ OK |

---

## Recommended Fixes

### Priority 1: Update Routes to Match `from-word` Pattern

The `from-word` route serves as the **reference implementation**. All other routes should be updated to match:

```typescript
// Pattern to follow (from from-word/route.ts):
1. Import auth & upload utilities
2. Add auth check with 401 response
3. Track inputPath and outputPath
4. Upload to Supabase after conversion
5. Return Supabase URL instead of local URL
6. Cleanup in finally block
```

### Priority 2: Add Consistent Security

- Add `MAX_FILE_SIZE` constant to all routes
- Add file size validation before processing
- Add rate limiting middleware

### Priority 3: Improve Python Script Quality

- `excel_to_pdf.py`: Preserve cell formatting, borders, colors
- `ppt_to_pdf.py`: Extract images and preserve slide layout
- `html_to_pdf.py`: Improve CSS parsing in fallback mode

---

## Comparison: Reference vs Outdated

### Reference Implementation (`from-word/route.ts`)
```typescript
✅ import { getUserFromRequest } from "@/lib/supabase-auth";
✅ import { uploadToSupabase } from "@/lib/supabase-upload";
✅ Auth check: if (!user) return 401
✅ Supabase upload: const { url, error } = await uploadToSupabase(...)
✅ Returns: { success: true, downloadUrl: url, ... }
✅ finally: cleanupFile(inputPath); cleanupFile(outputPath);
```

### Outdated Routes (all others except `from-excel`)
```typescript
❌ No auth imports
❌ No auth check
❌ Local download only: /api/download/${fileName}
❌ No Supabase upload
❌ No finally block cleanup
❌ No MAX_FILE_SIZE constant
```

---

## Action Items

| Priority | Task | Owner |
|----------|------|-------|
| P1 | Update `from-ppt` route with auth & Supabase | Dev |
| P1 | Update `from-html` route with auth & Supabase | Dev |
| P1 | Update `from-image` route with auth & Supabase | Dev |
| P1 | Update `to-word` route with auth & Supabase | Dev |
| P1 | Update `to-excel` route with auth & Supabase | Dev |
| P1 | Update `to-ppt` route with auth & Supabase | Dev |
| P1 | Update `to-image` route with auth & Supabase | Dev |
| P1 | Update `markdown` route with auth & Supabase | Dev |
| P1 | Update `text` route with auth & Supabase | Dev |
| P1 | Update `html` route with auth & Supabase | Dev |
| P2 | Add file size validation to all routes | Dev |
| P3 | Improve Python script fidelity | Dev |

---

*Audit completed by PLANNER agent*
