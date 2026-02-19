import { PDFDocument } from 'pdf-lib';

/**
 * Parse page ranges string like "1-3, 5-7, 10-12" into array of page indices
 */
function parsePageRanges(rangesStr: string, totalPages: number): number[][] {
  const result: number[][] = [];
  const parts = rangesStr.split(',');

  for (const part of parts) {
    const trimmed = part.trim();
    if (trimmed.includes('-')) {
      // Range like "1-3"
      const [startStr, endStr] = trimmed.split('-');
      const start = parseInt(startStr.trim());
      const end = parseInt(endStr.trim());

      if (!isNaN(start) && !isNaN(end)) {
        const pages: number[] = [];
        for (let i = start; i <= end; i++) {
          if (i >= 1 && i <= totalPages) {
            pages.push(i - 1); // Convert to 0-indexed
          }
        }
        if (pages.length > 0) {
          result.push(pages);
        }
      }
    } else {
      // Single page like "5"
      const pageNum = parseInt(trimmed);
      if (!isNaN(pageNum) && pageNum >= 1 && pageNum <= totalPages) {
        result.push([pageNum - 1]); // Convert to 0-indexed
      }
    }
  }

  return result;
}

/**
 * Parse page numbers string like "1, 3, 5, 7" into array of page indices
 */
function parsePageNumbers(pagesStr: string, totalPages: number): number[] {
  const result: number[] = [];
  const parts = pagesStr.split(',');

  for (const part of parts) {
    const trimmed = part.trim();
    const pageNum = parseInt(trimmed);
    if (!isNaN(pageNum) && pageNum >= 1 && pageNum <= totalPages) {
      result.push(pageNum - 1); // Convert to 0-indexed
    }
  }

  return [...new Set(result)].sort((a, b) => a - b); // Remove duplicates and sort
}

/**
 * Split PDF by page ranges (e.g., "1-3, 5-7, 10-12")
 * Each range becomes a separate PDF
 */
export async function splitPDFByRanges(
  file: File,
  ranges: string
): Promise<{ blob: Blob; name: string }[]> {
  const arrayBuffer = await file.arrayBuffer();
  const pdfDoc = await PDFDocument.load(arrayBuffer, { ignoreEncryption: true });
  const totalPages = pdfDoc.getPageCount();

  const rangeGroups = parsePageRanges(ranges, totalPages);

  if (rangeGroups.length === 0) {
    throw new Error('No valid page ranges found');
  }

  const results: { blob: Blob; name: string }[] = [];
  const baseName = file.name.replace('.pdf', '');

  for (let i = 0; i < rangeGroups.length; i++) {
    const pages = rangeGroups[i];
    const newPdf = await PDFDocument.create();

    const copiedPages = await newPdf.copyPages(pdfDoc, pages);
    copiedPages.forEach(page => newPdf.addPage(page));

    const pdfBytes = await newPdf.save();
    const blob = new Blob([pdfBytes], { type: 'application/pdf' });

    // Create name from page numbers
    const pageNames = pages.map(p => p + 1).join('-');
    results.push({
      blob,
      name: `${baseName}_pages_${pageNames}.pdf`
    });
  }

  return results;
}

/**
 * Extract specific pages into a single PDF
 * Pages like "1, 3, 5, 7" are extracted into one PDF
 */
export async function extractPages(
  file: File,
  pages: string
): Promise<{ blob: Blob; name: string }> {
  const arrayBuffer = await file.arrayBuffer();
  const pdfDoc = await PDFDocument.load(arrayBuffer, { ignoreEncryption: true });
  const totalPages = pdfDoc.getPageCount();

  const pageIndices = parsePageNumbers(pages, totalPages);

  if (pageIndices.length === 0) {
    throw new Error('No valid page numbers found');
  }

  const newPdf = await PDFDocument.create();
  const copiedPages = await newPdf.copyPages(pdfDoc, pageIndices);
  copiedPages.forEach(page => newPdf.addPage(page));

  const pdfBytes = await newPdf.save();
  const blob = new Blob([pdfBytes], { type: 'application/pdf' });
  const baseName = file.name.replace('.pdf', '');

  return {
    blob,
    name: `${baseName}_extracted.pdf`
  };
}

/**
 * Split PDF every N pages
 * Creates multiple PDFs, each containing N pages
 */
export async function splitPDFEveryNPages(
  file: File,
  n: number
): Promise<{ blob: Blob; name: string }[]> {
  if (n < 1) {
    throw new Error('Number of pages must be at least 1');
  }

  const arrayBuffer = await file.arrayBuffer();
  const pdfDoc = await PDFDocument.load(arrayBuffer, { ignoreEncryption: true });
  const totalPages = pdfDoc.getPageCount();
  const results: { blob: Blob; name: string }[] = [];
  const baseName = file.name.replace('.pdf', '');

  let partNum = 1;
  for (let i = 0; i < totalPages; i += n) {
    const newPdf = await PDFDocument.create();
    const endPage = Math.min(i + n, totalPages);

    const pageIndices: number[] = [];
    for (let j = i; j < endPage; j++) {
      pageIndices.push(j);
    }

    const copiedPages = await newPdf.copyPages(pdfDoc, pageIndices);
    copiedPages.forEach(page => newPdf.addPage(page));

    const pdfBytes = await newPdf.save();
    const blob = new Blob([pdfBytes], { type: 'application/pdf' });

    results.push({
      blob,
      name: `${baseName}_part_${partNum}.pdf`
    });
    partNum++;
  }

  return results;
}

/**
 * Split PDF into N equal files
 */
export async function splitPDFIntoNFiles(
  file: File,
  n: number
): Promise<{ blob: Blob; name: string }[]> {
  if (n < 2) {
    throw new Error('Must split into at least 2 files');
  }

  const arrayBuffer = await file.arrayBuffer();
  const pdfDoc = await PDFDocument.load(arrayBuffer, { ignoreEncryption: true });
  const totalPages = pdfDoc.getPageCount();

  if (n > totalPages) {
    throw new Error(`Cannot split ${totalPages} pages into ${n} files`);
  }

  const results: { blob: Blob; name: string }[] = [];
  const baseName = file.name.replace('.pdf', '');

  const pagesPerFile = Math.floor(totalPages / n);
  const extraPages = totalPages % n;

  let currentIndex = 0;

  for (let partNum = 1; partNum <= n; partNum++) {
    const newPdf = await PDFDocument.create();

    // First files get extra pages
    const pagesInThisFile = pagesPerFile + (partNum <= extraPages ? 1 : 0);
    const pageIndices: number[] = [];

    for (let j = 0; j < pagesInThisFile; j++) {
      if (currentIndex < totalPages) {
        pageIndices.push(currentIndex);
        currentIndex++;
      }
    }

    if (pageIndices.length > 0) {
      const copiedPages = await newPdf.copyPages(pdfDoc, pageIndices);
      copiedPages.forEach(page => newPdf.addPage(page));

      const pdfBytes = await newPdf.save();
      const blob = new Blob([pdfBytes], { type: 'application/pdf' });

      results.push({
        blob,
        name: `${baseName}_part_${partNum}.pdf`
      });
    }
  }

  return results;
}

/**
 * Split PDF - extract all pages as individual PDFs
 */
export async function splitAllPages(
  file: File
): Promise<{ blob: Blob; name: string }[]> {
  const arrayBuffer = await file.arrayBuffer();
  const pdfDoc = await PDFDocument.load(arrayBuffer, { ignoreEncryption: true });
  const totalPages = pdfDoc.getPageCount();
  const results: { blob: Blob; name: string }[] = [];
  const baseName = file.name.replace('.pdf', '');

  for (let i = 0; i < totalPages; i++) {
    const newPdf = await PDFDocument.create();
    const [copiedPage] = await newPdf.copyPages(pdfDoc, [i]);
    newPdf.addPage(copiedPage);

    const pdfBytes = await newPdf.save();
    const blob = new Blob([pdfBytes], { type: 'application/pdf' });

    results.push({
      blob,
      name: `${baseName}_page_${i + 1}.pdf`
    });
  }

  return results;
}

/**
 * Download a blob as a file
 */
export function downloadBlob(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * Download multiple blobs as a zip (using simple JSZip-like approach)
 * Creates a zip file in the browser
 */
export async function downloadMultipleAsZip(
  files: { blob: Blob; name: string }[],
  zipName: string
): Promise<void> {
  // Simple approach: download individually if no JSZip
  // For a better UX, we could add JSZip library

  if (files.length === 1) {
    downloadBlob(files[0].blob, files[0].name);
    return;
  }

  // Download all files
  // Note: In production, you might want to use JSZip to create a proper zip file
  // For now, we'll trigger multiple downloads with a small delay
  for (let i = 0; i < files.length; i++) {
    setTimeout(() => {
      downloadBlob(files[i].blob, files[i].name);
    }, i * 200); // 200ms delay between downloads
  }
}
