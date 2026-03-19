# Deployment Checklist

Pre-flight checklist before deploying PDFMagic with Supabase storage integration to production.

## Pre-Deployment Verification

### Build Verification
- [ ] `npm run build` passes with zero errors
- [ ] No TypeScript errors (even with `ignoreBuildErrors: true`)
- [ ] All pages render correctly in production build

### Local Validation
- [ ] All Phase 1 validation rules tested locally
- [ ] File upload works with files up to 50MB
- [ ] PDF processing completes without errors
- [ ] Download link generation works correctly

### Supabase Configuration
- [ ] Supabase bucket `pdf-edits` created in project
- [ ] Bucket is reachable from deployed URL (CORS configured)
- [ ] Bucket has appropriate size limits set

### Security Configuration
- [ ] Service role key set in Railway (not in client bundle)
- [ ] RLS policies permit upload for authenticated users
- [ ] RLS policies permit public read for download URLs
- [ ] Storage bucket has appropriate file type restrictions

### Environment Variables
All required env vars set in Railway dashboard:
- [ ] `NEXT_PUBLIC_SUPABASE_URL` - Supabase project URL
- [ ] `NEXT_PUBLIC_SUPABASE_ANON_KEY` - Public anon key
- [ ] `SUPABASE_SERVICE_ROLE_KEY` - Service role key (server-only)
- [ ] `SUPABASE_BUCKET_NAME=pdf-edits` - Storage bucket name

### Production Testing

Test the edit endpoint with curl:
```bash
curl -X POST https://your-domain.com/api/pdf/edit \
  -F "files=@test.pdf" \
  -F "editType=watermark" \
  -F "options={\"text\":\"CONFIDENTIAL\",\"opacity\":0.3}"
```

Expected response:
```json
{
  "success": true,
  "downloadUrl": "https://...",
  "fileName": "test_watermarked.pdf"
}
```

### Post-Deployment
- [ ] Test file upload from production URL
- [ ] Verify processed files appear in Supabase storage
- [ ] Check Supabase storage analytics for traffic
- [ ] Monitor Railway logs for any errors
- [ ] Test RLS policies (authenticated vs anonymous uploads)

### Rollback Plan
If issues occur:
1. Disable Supabase integration in Railway env vars
2. Revert to local file storage mode
3. Review Railway logs for specific errors
4. Check Supabase storage bucket accessibility
