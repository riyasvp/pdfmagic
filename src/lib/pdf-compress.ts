import { PDFDocument } from 'pdf-lib';

/**
 * Compression quality levels
 */
export type CompressionQuality = 'low' | 'medium' | 'high';

/**
 * Compression result with statistics
 */
export interface CompressionResult {
  blob: Blob;
  name: string;
  originalSize: number;
  compressedSize: number;
  reduction: number;
}

/**
 * Format file size for display
 */
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 B';
  const units = ['B', 'KB', 'MB', 'GB'];
  const k = 1024;
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + units[i];
}

/**
 * Compress PDF file client-side
 */
export async function compressPDF(
  file: File,
  quality: CompressionQuality = 'medium'
): Promise<CompressionResult> {
  const arrayBuffer = await file.arrayBuffer();
  const originalSize = arrayBuffer.byteLength;

  const pdfDoc = await PDFDocument.load(arrayBuffer, {
    ignoreEncryption: true,
    updateMetadata: false,
  });

  const pdfBytes = await pdfDoc.save({
    useObjectStreams: true,
    addDefaultPage: false,
    objectsPerTick: 50,
  });

  const compressedSize = pdfBytes.byteLength;
  const reduction = ((1 - compressedSize / originalSize) * 100);
  const blob = new Blob([pdfBytes], { type: 'application/pdf' });

  const baseName = file.name.replace('.pdf', '');
  const qualitySuffix = quality === 'low' ? '_maxcompressed' : quality === 'high' ? '_optimized' : '_compressed';
  const name = `${baseName}${qualitySuffix}.pdf`;

  return {
    blob,
    name,
    originalSize,
    compressedSize,
    reduction,
  };
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
