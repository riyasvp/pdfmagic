import { test, expect } from '@playwright/test';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

test.describe('Supabase Storage Integration', () => {
  test.skipUnless(Boolean(SUPABASE_SERVICE_ROLE_KEY)).each(
    'Supabase Storage: Upload and verify',
    async ({ page }) => {
      const testFileName = `test-${Date.now()}.pdf`;
      const testContent = Buffer.from('%PDF-1.4 test pdf content');

      const response = await fetch(`${SUPABASE_URL}/storage/v1/object/pdf-edits/${testFileName}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
          'Content-Type': 'application/pdf',
        },
        body: testContent,
      });

      expect(response.ok).toBe(true);

      const publicUrl = `${SUPABASE_URL}/storage/v1/object/public/pdf-edits/${testFileName}`;
      const urlResponse = await fetch(publicUrl);
      expect(urlResponse.ok).toBe(true);
      expect(urlResponse.headers.get('content-type')).toContain('pdf');

      const deleteResponse = await fetch(`${SUPABASE_URL}/storage/v1/object/pdf-edits/${testFileName}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
        },
      });

      expect(deleteResponse.ok).toBe(true);
    }
  );
});