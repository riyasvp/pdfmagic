import { test, expect } from '@playwright/test';
import path from 'path';

const TEST_PDF_PATH = path.join(process.cwd(), 'tests', 'fixtures', 'test.pdf');

test.describe('API: POST /api/pdf/edit', () => {
  test('1. POST a valid PDF formData → expect 200 + downloadUrl field', async ({ request }) => {
    const fileBuffer = await Bun.file(TEST_PDF_PATH).arrayBuffer();
    const formData = new FormData();
    formData.append('file', new Blob([fileBuffer]), 'test.pdf');
    formData.append('editType', 'compress');

    const response = await request.post('/api/pdf/edit', {
      multipart: {
        file: {
          name: 'test.pdf',
          mimeType: 'application/pdf',
          buffer: Buffer.from(fileBuffer),
        },
        editType: 'compress',
      },
    });

    expect(response.status()).toBe(200);
    const json = await response.json();
    expect(json).toHaveProperty('downloadUrl');
  });

  test('2. POST no file → expect 400', async ({ request }) => {
    const formData = new FormData();
    formData.append('editType', 'compress');

    const response = await request.post('/api/pdf/edit', {
      data: formData,
    });

    expect(response.status()).toBe(400);
  });

  test('3. POST non-PDF file → expect 400', async ({ request }) => {
    const formData = new FormData();
    formData.append('file', Buffer.from('not a pdf'), 'test.txt');
    formData.append('editType', 'compress');

    const response = await request.post('/api/pdf/edit', {
      multipart: {
        file: {
          name: 'test.txt',
          mimeType: 'text/plain',
          buffer: Buffer.from('not a pdf'),
        },
        editType: 'compress',
      },
    });

    expect(response.status()).toBe(400);
  });

  test('4. POST with invalid editType → expect 400', async ({ request }) => {
    const fileBuffer = await Bun.file(TEST_PDF_PATH).arrayBuffer();
    
    const response = await request.post('/api/pdf/edit', {
      multipart: {
        file: {
          name: 'test.pdf',
          mimeType: 'application/pdf',
          buffer: Buffer.from(fileBuffer),
        },
        editType: 'invalid_type',
      },
    });

    expect(response.status()).toBe(400);
  });

  test('5. Integration: upload → verify public URL returns 200', async ({ request }) => {
    const fileBuffer = await Bun.file(TEST_PDF_PATH).arrayBuffer();
    
    const response = await request.post('/api/pdf/edit', {
      multipart: {
        file: {
          name: 'test.pdf',
          mimeType: 'application/pdf',
          buffer: Buffer.from(fileBuffer),
        },
        editType: 'compress',
      },
    });

    expect(response.status()).toBe(200);
    const json = await response.json();
    
    if (json.downloadUrl) {
      const urlResponse = await request.get(json.downloadUrl);
      expect(urlResponse.status()).toBe(200);
    }
  });
});