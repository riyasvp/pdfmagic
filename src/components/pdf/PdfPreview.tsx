"use client";

import { useEffect, useState } from "react";
// TODO: [ARCHITECTURE] pdfjs-dist v5 has breaking changes - update import path when upgrading
// @ts-expect-error - pdfjs-dist v4 legacy path doesn't have TypeScript declarations
import * as pdfjsLib from "pdfjs-dist/legacy/build/pdf";

// Ensure worker is loaded (pdfjs uses a worker script)
(pdfjsLib as any).GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${(pdfjsLib as any).version}/pdf.worker.min.js`;

interface PdfPreviewProps {
  file: Blob; // PDF blob
}

export function PdfPreview({ file }: PdfPreviewProps) {
  const [pageImages, setPageImages] = useState<string[]>([]);

  useEffect(() => {
    let isMounted = true;
    const loadPdf = async () => {
      const arrayBuffer = await file.arrayBuffer();
      const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
      const numPages = pdf.numPages;
      const images: string[] = [];
      for (let i = 1; i <= numPages; i++) {
        const page = await pdf.getPage(i);
        const viewport = page.getViewport({ scale: 1.5 });
        const canvas = document.createElement("canvas");
        const context = canvas.getContext("2d");
        canvas.width = viewport.width;
        canvas.height = viewport.height;
        const renderContext = { canvasContext: context!, viewport };
        await page.render(renderContext).promise;
        const dataUrl = canvas.toDataURL("image/png");
        images.push(dataUrl);
      }
      if (isMounted) setPageImages(images);
    };
    loadPdf();
    return () => {
      isMounted = false;
    };
  }, [file]);

  return (
    <div className="grid grid-cols-2 gap-2 mt-2">
      {pageImages.map((src, idx) => (
        <img
          key={idx}
          src={src}
          alt={`Page ${idx + 1}`}
          className="w-full h-auto rounded border"
        />
      ))}
    </div>
  );
}
