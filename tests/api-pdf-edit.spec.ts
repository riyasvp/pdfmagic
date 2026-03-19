import { test, expect } from '@playwright/test';
import { readFileSync } from 'fs';
import path from 'path';

const TEST_PDF_PATH = path.join(process.cwd(), 'tests', 'fixtures', 'test.pdf');

test.describe('API: POST /api/pdf/edit', () => {
  test('1. POST no file → expect 400', async ({ request }) => {
    const response = await request.post('/api/pdf/edit', {
      multipart: {
        editType: 'watermark',
      },
    });

    expect(response.status()).toBe(400);
  });

  test('2. POST non-PDF file → expect 400', async ({ request }) => {
    const response = await request.post('/api/pdf/edit', {
      multipart: {
        file: {
          name: 'test.txt',
          mimeType: 'text/plain',
          buffer: Buffer.from('not a pdf'),
        },
        editType: 'watermark',
      },
    });

    expect(response.status()).toBe(400);
  });

  test('3. POST with invalid editType → expect 400', async ({ request }) => {
    const fileBuffer = readFileSync(TEST_PDF_PATH);

    const response = await request.post('/api/pdf/edit', {
      multipart: {
        files: {
          name: 'test.pdf',
          mimeType: 'application/pdf',
          buffer: fileBuffer,
        },
        editType: 'invalid_type',
      },
    });

    expect(response.status()).toBe(400);
  });
});