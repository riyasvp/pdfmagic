import { PDFDocument, degrees, rgb, StandardFonts } from 'pdf-lib';

// ==========================================
// TYPES
// ==========================================

export type RotationAngle = 90 | 180 | 270 | 360;

export interface PDFInfo {
  pageCount: number;
  fileSize: number;
  title?: string;
  author?: string;
  subject?: string;
  creator?: string;
  producer?: string;
  creationDate?: Date;
  modificationDate?: Date;
}

// ==========================================
// UTILITY FUNCTIONS
// ==========================================

export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 B';
  const units = ['B', 'KB', 'MB', 'GB'];
  const k = 1024;
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + units[i];
}

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

export function downloadMultipleBlobs(blobs: { blob: Blob; name: string }[]): void {
  blobs.forEach((item, index) => {
    setTimeout(() => downloadBlob(item.blob, item.name), index * 200);
  });
}

// ==========================================
// MERGE PDFs
// ==========================================

export async function mergePDFs(files: File[]): Promise<{ blob: Blob; name: string }> {
  const mergedPdf = await PDFDocument.create();

  for (const file of files) {
    const arrayBuffer = await file.arrayBuffer();
    const pdf = await PDFDocument.load(arrayBuffer, { ignoreEncryption: true });
    const pages = await mergedPdf.copyPages(pdf, pdf.getPageIndices());
    pages.forEach((page) => mergedPdf.addPage(page));
  }

  const pdfBytes = await mergedPdf.save({ useObjectStreams: true });
  const blob = new Blob([pdfBytes], { type: 'application/pdf' });

  return {
    blob,
    name: 'merged.pdf',
  };
}

// ==========================================
// GET PDF INFO
// ==========================================

export async function getPDFInfo(file: File): Promise<PDFInfo> {
  const arrayBuffer = await file.arrayBuffer();
  const pdfDoc = await PDFDocument.load(arrayBuffer, { ignoreEncryption: true });

  return {
    pageCount: pdfDoc.getPageCount(),
    fileSize: file.size,
    title: pdfDoc.getTitle() || undefined,
    author: pdfDoc.getAuthor() || undefined,
    subject: pdfDoc.getSubject() || undefined,
    creator: pdfDoc.getCreator() || undefined,
    producer: pdfDoc.getProducer() || undefined,
    creationDate: pdfDoc.getCreationDate()?.toISOString ? pdfDoc.getCreationDate() : undefined,
    modificationDate: pdfDoc.getModificationDate()?.toISOString ? pdfDoc.getModificationDate() : undefined,
  };
}

// ==========================================
// ROTATE PDF
// ==========================================

export async function rotatePDF(
  file: File,
  rotation: RotationAngle,
  pageNumbers?: number[]
): Promise<{ blob: Blob; name: string }> {
  const arrayBuffer = await file.arrayBuffer();
  const pdfDoc = await PDFDocument.load(arrayBuffer, { ignoreEncryption: true });
  const pages = pdfDoc.getPages();

  if (pageNumbers && pageNumbers.length > 0) {
    pageNumbers.forEach((pageNum) => {
      if (pageNum >= 1 && pageNum <= pages.length) {
        const page = pages[pageNum - 1];
        const currentRotation = page.getRotation().angle;
        page.setRotation(degrees((currentRotation + rotation) % 360));
      }
    });
  } else {
    pages.forEach((page) => {
      const currentRotation = page.getRotation().angle;
      page.setRotation(degrees((currentRotation + rotation) % 360));
    });
  }

  const pdfBytes = await pdfDoc.save({ useObjectStreams: true });
  const blob = new Blob([pdfBytes], { type: 'application/pdf' });
  const baseName = file.name.replace('.pdf', '');

  return {
    blob,
    name: `${baseName}_rotated_${rotation}deg.pdf`,
  };
}

// ==========================================
// ADD WATERMARK
// ==========================================

export async function addWatermark(
  file: File,
  text: string,
  options?: {
    opacity?: number;
    color?: string;
    fontSize?: number;
    position?: 'center' | 'diagonal';
  }
): Promise<{ blob: Blob; name: string }> {
  const { opacity = 0.3, color = '#8B5CF6', fontSize: customFontSize, position = 'diagonal' } = options || {};

  const arrayBuffer = await file.arrayBuffer();
  const pdfDoc = await PDFDocument.load(arrayBuffer, { ignoreEncryption: true });
  const pages = pdfDoc.getPages();
  const font = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

  const r = parseInt(color.slice(1, 3), 16) / 255;
  const g = parseInt(color.slice(3, 5), 16) / 255;
  const b = parseInt(color.slice(5, 7), 16) / 255;

  pages.forEach((page) => {
    const { width, height } = page.getSize();
    const fontSize = customFontSize || Math.min(width, height) * 0.08;
    const textWidth = font.widthOfTextAtSize(text, fontSize);

    if (position === 'diagonal') {
      page.drawText(text, {
        x: width / 2 - textWidth / 2,
        y: height / 2,
        size: fontSize,
        font,
        color: rgb(r, g, b),
        opacity,
        rotate: degrees(-45),
      });
    } else {
      page.drawText(text, {
        x: width / 2 - textWidth / 2,
        y: height / 2 - fontSize / 2,
        size: fontSize,
        font,
        color: rgb(r, g, b),
        opacity,
      });
    }
  });

  const pdfBytes = await pdfDoc.save({ useObjectStreams: true });
  const blob = new Blob([pdfBytes], { type: 'application/pdf' });
  const baseName = file.name.replace('.pdf', '');

  return {
    blob,
    name: `${baseName}_watermarked.pdf`,
  };
}

// ==========================================
// DELETE PAGES
// ==========================================

export async function deletePages(
  file: File,
  pageNumbers: number[]
): Promise<{ blob: Blob; name: string; deletedCount: number }> {
  const arrayBuffer = await file.arrayBuffer();
  const pdfDoc = await PDFDocument.load(arrayBuffer, { ignoreEncryption: true });

  const sortedPages = [...pageNumbers].sort((a, b) => b - a);
  const validPages = sortedPages.filter((p) => p >= 1 && p <= pdfDoc.getPageCount());

  validPages.forEach((pageNum) => {
    pdfDoc.removePage(pageNum - 1);
  });

  const pdfBytes = await pdfDoc.save({ useObjectStreams: true });
  const blob = new Blob([pdfBytes], { type: 'application/pdf' });
  const baseName = file.name.replace('.pdf', '');

  return {
    blob,
    name: `${baseName}_pages_removed.pdf`,
    deletedCount: validPages.length,
  };
}

// ==========================================
// IMAGES TO PDF
// ==========================================

export async function imagesToPDF(
  files: File[],
  options?: {
    pageSize?: 'a4' | 'letter' | 'fit';
    orientation?: 'portrait' | 'landscape';
  }
): Promise<{ blob: Blob; name: string }> {
  const { pageSize = 'fit', orientation = 'portrait' } = options || {};
  const pdfDoc = await PDFDocument.create();

  const pageSizes = {
    a4: { width: 595.28, height: 841.89 },
    letter: { width: 612, height: 792 },
    fit: null,
  };

  for (const file of files) {
    const arrayBuffer = await file.arrayBuffer();
    let image;

    if (file.type === 'image/png') {
      image = await pdfDoc.embedPng(arrayBuffer);
    } else if (file.type === 'image/jpeg' || file.type === 'image/jpg') {
      image = await pdfDoc.embedJpg(arrayBuffer);
    } else {
      try {
        image = await pdfDoc.embedPng(arrayBuffer);
      } catch {
        try {
          image = await pdfDoc.embedJpg(arrayBuffer);
        } catch {
          console.warn(`Skipping unsupported image: ${file.name}`);
          continue;
        }
      }
    }

    const { width: imgWidth, height: imgHeight } = image;

    let pageWidth: number;
    let pageHeight: number;

    if (pageSize === 'fit') {
      pageWidth = imgWidth;
      pageHeight = imgHeight;
    } else {
      const size = pageSizes[pageSize]!;
      if (orientation === 'landscape') {
        pageWidth = size.height;
        pageHeight = size.width;
      } else {
        pageWidth = size.width;
        pageHeight = size.height;
      }
    }

    const page = pdfDoc.addPage([pageWidth, pageHeight]);

    const scaleX = pageWidth / imgWidth;
    const scaleY = pageHeight / imgHeight;
    const scale = Math.min(scaleX, scaleY);

    const scaledWidth = imgWidth * scale;
    const scaledHeight = imgHeight * scale;

    const x = (pageWidth - scaledWidth) / 2;
    const y = (pageHeight - scaledHeight) / 2;

    page.drawImage(image, {
      x,
      y,
      width: scaledWidth,
      height: scaledHeight,
    });
  }

  const pdfBytes = await pdfDoc.save();
  const blob = new Blob([pdfBytes], { type: 'application/pdf' });

  return {
    blob,
    name: 'images_combined.pdf',
  };
}

// ==========================================
// ADD PAGE NUMBERS
// ==========================================

export async function addPageNumbers(
  file: File,
  options?: {
    position?: 'bottom-center' | 'bottom-left' | 'bottom-right' | 'top-center' | 'top-left' | 'top-right';
    startNumber?: number;
    fontSize?: number;
    margin?: number;
  }
): Promise<{ blob: Blob; name: string }> {
  const {
    position = 'bottom-center',
    startNumber = 1,
    fontSize = 12,
    margin = 30,
  } = options || {};

  const arrayBuffer = await file.arrayBuffer();
  const pdfDoc = await PDFDocument.load(arrayBuffer, { ignoreEncryption: true });
  const pages = pdfDoc.getPages();
  const font = await pdfDoc.embedFont(StandardFonts.Helvetica);

  pages.forEach((page, index) => {
    const { width, height } = page.getSize();
    const pageNum = index + startNumber;
    const text = String(pageNum);
    const textWidth = font.widthOfTextAtSize(text, fontSize);

    let x: number;
    let y: number;

    const isTop = position.includes('top');
    const isLeft = position.includes('left');
    const isRight = position.includes('right');

    y = isTop ? height - margin : margin;

    if (isLeft) {
      x = margin;
    } else if (isRight) {
      x = width - textWidth - margin;
    } else {
      x = (width - textWidth) / 2;
    }

    page.drawText(text, {
      x,
      y,
      size: fontSize,
      font,
      color: rgb(0, 0, 0),
    });
  });

  const pdfBytes = await pdfDoc.save({ useObjectStreams: true });
  const blob = new Blob([pdfBytes], { type: 'application/pdf' });
  const baseName = file.name.replace('.pdf', '');

  return {
    blob,
    name: `${baseName}_numbered.pdf`,
  };
}

// ==========================================
// PROTECT PDF
// ==========================================

export async function protectPDF(
  file: File,
  password: string
): Promise<{ blob: Blob; name: string }> {
  const arrayBuffer = await file.arrayBuffer();
  const pdfDoc = await PDFDocument.load(arrayBuffer, { ignoreEncryption: true });

  const pdfBytes = await pdfDoc.save({
    useObjectStreams: true,
    userPassword: password,
    ownerPassword: password,
  });

  const blob = new Blob([pdfBytes], { type: 'application/pdf' });
  const baseName = file.name.replace('.pdf', '');

  return {
    blob,
    name: `${baseName}_protected.pdf`,
  };
}

// ==========================================
// EXTRACT PAGES
// ==========================================

export async function extractPages(
  file: File,
  pageNumbers: number[]
): Promise<{ blob: Blob; name: string }> {
  const arrayBuffer = await file.arrayBuffer();
  const pdfDoc = await PDFDocument.load(arrayBuffer, { ignoreEncryption: true });
  const newPdf = await PDFDocument.create();

  const validIndices = pageNumbers
    .map((p) => p - 1)
    .filter((i) => i >= 0 && i < pdfDoc.getPageCount());

  const copiedPages = await newPdf.copyPages(pdfDoc, validIndices);
  copiedPages.forEach((page) => newPdf.addPage(page));

  const pdfBytes = await newPdf.save({ useObjectStreams: true });
  const blob = new Blob([pdfBytes], { type: 'application/pdf' });
  const baseName = file.name.replace('.pdf', '');

  return {
    blob,
    name: `${baseName}_extracted.pdf`,
  };
}

// ==========================================
// REORDER PAGES
// ==========================================

export async function reorderPages(
  file: File,
  newOrder: number[]
): Promise<{ blob: Blob; name: string }> {
  const arrayBuffer = await file.arrayBuffer();
  const pdfDoc = await PDFDocument.load(arrayBuffer, { ignoreEncryption: true });
  const newPdf = await PDFDocument.create();

  const indices = newOrder.map((p) => p - 1).filter((i) => i >= 0 && i < pdfDoc.getPageCount());

  const copiedPages = await newPdf.copyPages(pdfDoc, indices);
  copiedPages.forEach((page) => newPdf.addPage(page));

  const pdfBytes = await newPdf.save({ useObjectStreams: true });
  const blob = new Blob([pdfBytes], { type: 'application/pdf' });
  const baseName = file.name.replace('.pdf', '');

  return {
    blob,
    name: `${baseName}_reordered.pdf`,
  };
}

// ==========================================
// CROP PDF
// ==========================================

export async function cropPDF(
  file: File,
  cropBox: {
    left: number;
    bottom: number;
    right: number;
    top: number;
  }
): Promise<{ blob: Blob; name: string }> {
  const arrayBuffer = await file.arrayBuffer();
  const pdfDoc = await PDFDocument.load(arrayBuffer, { ignoreEncryption: true });
  const pages = pdfDoc.getPages();

  pages.forEach((page) => {
    const { width, height } = page.getSize();
    const newWidth = width - cropBox.left - cropBox.right;
    const newHeight = height - cropBox.bottom - cropBox.top;
    page.setCropBox(cropBox.left, cropBox.bottom, newWidth, newHeight);
  });

  const pdfBytes = await pdfDoc.save({ useObjectStreams: true });
  const blob = new Blob([pdfBytes], { type: 'application/pdf' });
  const baseName = file.name.replace('.pdf', '');

  return {
    blob,
    name: `${baseName}_cropped.pdf`,
  };
}

// ==========================================
// PDF TO IMAGES
// ==========================================

export async function pdfToImages(
  file: File,
  format: 'png' | 'jpg' = 'png',
  dpi: number = 150
): Promise<{ blob: Blob; name: string }[]> {
  if (typeof window === 'undefined') {
    throw new Error('Browser required for PDF to Image conversion');
  }

  const pdfjsLib = await import('pdfjs-dist');
  pdfjsLib.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@${pdfjsLib.version}/build/pdf.worker.min.mjs`;

  const arrayBuffer = await file.arrayBuffer();
  const pdf = await pdfjsLib.getDocument({ data: new Uint8Array(arrayBuffer) }).promise;
  const scale = dpi / 72;
  const images: { blob: Blob; name: string }[] = [];
  const baseName = file.name.replace('.pdf', '');

  for (let i = 1; i <= pdf.numPages; i++) {
    const page = await pdf.getPage(i);
    const viewport = page.getViewport({ scale });

    const canvas = document.createElement('canvas');
    canvas.width = Math.floor(viewport.width);
    canvas.height = Math.floor(viewport.height);

    const ctx = canvas.getContext('2d')!;
    ctx.fillStyle = 'white';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    await page.render({ canvasContext: ctx as unknown as CanvasRenderingContext2D, viewport }).promise;

    const blob = await new Promise<Blob>((resolve, reject) => {
      canvas.toBlob(
        (b) => (b ? resolve(b) : reject(new Error('Canvas failed'))),
        format === 'png' ? 'image/png' : 'image/jpeg',
        format === 'jpg' ? 0.92 : undefined
      );
    });

    images.push({
      blob,
      name: `${baseName}_page_${i}.${format}`,
    });
  }

  return images;
}
