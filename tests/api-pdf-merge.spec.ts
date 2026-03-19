import { test, expect } from '@playwright/test';
import path from 'path';

const TEST_PDF_PATH = path.join(process.cwd(), 'tests', 'fixtures', 'test.pdf');

test.describe('API: POST /api/pdf/merge', () => {
  test('1. POST <2 files → expect 400', async ({ request }) => {
    const fileBuffer = await Bun.file(TEST_PDF_PATH).arrayBuffer();
    
    const response = await request.post('/api/pdf/merge', {
      multipart: {
        files: {
          name: 'test.pdf',
          mimeType: 'application/pdf',
          buffer: Buffer.from(fileBuffer),
        },
      },
    });

    expect(response.status()).toBe(400);
  });

  test('2. POST 2 valid PDFs → expect 200', async ({ request }) => {
    const fileBuffer = await Bun.file(TEST_PDF_PATH).arrayBuffer();
    
    const response = await request.post('/api/pdf/merge', {
      multipart: [
        {
          name: 'files',
          mimeType: 'application/pdf',
          buffer: Buffer.from(fileBuffer),
        },
        {
          name: 'files',
          mimeType: 'application/pdf',
          buffer: Buffer.from(fileBuffer),
        },
      ],
    });

    expect(response.status()).toBe(200);
    const json = await response.json();
    expect(json).toHaveProperty('downloadUrl');
  });
});