"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowLeft, Settings, ChevronDown, Send, Loader2, Copy, Check, FileText, MessageSquare, Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { FileUpload } from "./FileUpload";
import { ProcessingStatus } from "./ProcessingStatus";
import { DownloadButton } from "./DownloadButton";
import { MergePDFGrid } from "./MergePDFGrid";
import { cn } from "@/lib/utils";
import type { Tool } from "@/lib/tools-config";
import {
  splitPDFByRanges,
  extractPages as splitExtractPages,
  splitPDFEveryNPages,
  splitPDFIntoNFiles,
  splitAllPages,
  downloadBlob,
  downloadMultipleAsZip,
} from "@/lib/pdf-split";
import {
  compressPDF,
  formatFileSize,
  type CompressionQuality,
  type CompressionResult,
} from "@/lib/pdf-compress";
import {
  rotatePDF,
  addWatermark,
  deletePages,
  imagesToPDF,
  addPageNumbers,
  protectPDF,
  extractPages,
  reorderPages,
  cropPDF,
  getPDFInfo,
  pdfToImages,
  mergePDFs,
  type RotationAngle,
} from "@/lib/pdf-tools";

type Status = "idle" | "uploading" | "processing" | "success" | "error";

interface ToolLayoutProps {
  tool: Tool;
}

interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

export function ToolLayout({ tool }: ToolLayoutProps) {
  const [status, setStatus] = useState<Status>("idle");
  const [progress, setProgress] = useState(0);
  const [files, setFiles] = useState<File[]>([]);
  const [downloadUrl, setDownloadUrl] = useState<string>("");
  const [outputFileName, setOutputFileName] = useState<string>("");
  const [errorMessage, setErrorMessage] = useState<string>("");
  const [showOptions, setShowOptions] = useState(true);
  const [options, setOptions] = useState<Record<string, unknown>>({});

  // Split-specific state
  const [splitMode, setSplitMode] = useState<string>("ranges");
  const [pageRanges, setPageRanges] = useState("");
  const [pageNumbers, setPageNumbers] = useState("");
  const [everyPages, setEveryPages] = useState("3");
  const [fileCount, setFileCount] = useState("2");
  const [splitResults, setSplitResults] = useState<{ blob: Blob; name: string }[]>([]);

  // Compress-specific state
  const [compressionQuality, setCompressionQuality] = useState<CompressionQuality>("medium");
  const [compressResult, setCompressResult] = useState<CompressionResult | null>(null);

  // Rotate-specific state
  const [rotation, setRotation] = useState<RotationAngle>(90);

  // Watermark-specific state
  const [watermarkText, setWatermarkText] = useState("CONFIDENTIAL");
  const [watermarkOpacity, setWatermarkOpacity] = useState(0.3);

  // Delete pages-specific state
  const [pagesToDelete, setPagesToDelete] = useState("");

  // Page numbers-specific state
  const [pageNumberPosition, setPageNumberPosition] = useState<string>("bottom-center");
  const [pageNumberStart, setPageNumberStart] = useState(1);

  // Protect PDF-specific state
  const [protectPassword, setProtectPassword] = useState("");

  // PDF to Image-specific state
  const [imageFormat, setImageFormat] = useState<'png' | 'jpg'>('png');
  const [imageDpi, setImageDpi] = useState(150);
  const [imageResults, setImageResults] = useState<{ blob: Blob; name: string }[]>([]);

  // Result blob for download
  const [resultBlob, setResultBlob] = useState<Blob | null>(null);

  // AI-specific state
  const [summary, setSummary] = useState<string>("");
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [chatInput, setChatInput] = useState("");
  const [isChatLoading, setIsChatLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const [fileId, setFileId] = useState<string>("");
  const chatContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
    }
  }, [chatMessages]);

  const handleFilesSelected = (selectedFiles: File[]) => {
    setFiles(selectedFiles);
    if (selectedFiles.length > 0) {
      setStatus("idle");
    }
  };

  // ==========================================
  // CLIENT-SIDE PROCESSING HANDLERS
  // ==========================================

  // Split PDF handler
  const handleSplitPDF = useCallback(async () => {
    if (files.length === 0) return;
    const file = files[0];
    setStatus("processing");
    setProgress(10);
    setErrorMessage("");

    try {
      let results: { blob: Blob; name: string }[] = [];
      switch (splitMode) {
        case "ranges":
          if (!pageRanges.trim()) throw new Error("Please enter page ranges");
          setProgress(30);
          results = await splitPDFByRanges(file, pageRanges);
          break;
        case "extract":
          if (!pageNumbers.trim()) throw new Error("Please enter page numbers");
          setProgress(30);
          results = [await splitExtractPages(file, pageNumbers)];
          break;
        case "every":
          setProgress(30);
          results = await splitPDFEveryNPages(file, parseInt(everyPages) || 3);
          break;
        case "count":
          setProgress(30);
          results = await splitPDFIntoNFiles(file, parseInt(fileCount) || 2);
          break;
        default:
          setProgress(30);
          results = await splitAllPages(file);
      }
      setProgress(100);
      setSplitResults(results);
      setStatus("success");
      setOutputFileName(`${results.length} files created`);
    } catch (error) {
      setStatus("error");
      setErrorMessage(error instanceof Error ? error.message : "Failed to split PDF");
      setProgress(0);
    }
  }, [files, splitMode, pageRanges, pageNumbers, everyPages, fileCount]);

  // Compress PDF handler
  const handleCompressPDF = useCallback(async () => {
    if (files.length === 0) return;
    const file = files[0];
    setStatus("processing");
    setProgress(10);
    setErrorMessage("");

    try {
      setProgress(30);
      const result = await compressPDF(file, compressionQuality);
      setProgress(100);
      setCompressResult(result);
      setResultBlob(result.blob);
      setStatus("success");
      setOutputFileName(result.name);
    } catch (error) {
      setStatus("error");
      setErrorMessage(error instanceof Error ? error.message : "Failed to compress PDF");
      setProgress(0);
    }
  }, [files, compressionQuality]);

  // Rotate PDF handler
  const handleRotatePDF = useCallback(async () => {
    if (files.length === 0) return;
    const file = files[0];
    setStatus("processing");
    setProgress(10);
    setErrorMessage("");

    try {
      setProgress(30);
      const result = await rotatePDF(file, rotation);
      setProgress(100);
      setResultBlob(result.blob);
      setStatus("success");
      setOutputFileName(result.name);
    } catch (error) {
      setStatus("error");
      setErrorMessage(error instanceof Error ? error.message : "Failed to rotate PDF");
      setProgress(0);
    }
  }, [files, rotation]);

  // Watermark PDF handler
  const handleWatermarkPDF = useCallback(async () => {
    if (files.length === 0) return;
    const file = files[0];
    setStatus("processing");
    setProgress(10);
    setErrorMessage("");

    try {
      setProgress(30);
      const result = await addWatermark(file, watermarkText, { opacity: watermarkOpacity });
      setProgress(100);
      setResultBlob(result.blob);
      setStatus("success");
      setOutputFileName(result.name);
    } catch (error) {
      setStatus("error");
      setErrorMessage(error instanceof Error ? error.message : "Failed to add watermark");
      setProgress(0);
    }
  }, [files, watermarkText, watermarkOpacity]);

  // Delete pages handler
  const handleDeletePages = useCallback(async () => {
    if (files.length === 0) return;
    const file = files[0];
    setStatus("processing");
    setProgress(10);
    setErrorMessage("");

    try {
      if (!pagesToDelete.trim()) throw new Error("Please enter pages to delete");
      const pageNumbers = pagesToDelete.split(',').map(p => parseInt(p.trim())).filter(p => !isNaN(p));
      if (pageNumbers.length === 0) throw new Error("Invalid page numbers");
      
      setProgress(30);
      const result = await deletePages(file, pageNumbers);
      setProgress(100);
      setResultBlob(result.blob);
      setStatus("success");
      setOutputFileName(result.name);
    } catch (error) {
      setStatus("error");
      setErrorMessage(error instanceof Error ? error.message : "Failed to delete pages");
      setProgress(0);
    }
  }, [files, pagesToDelete]);

  // Images to PDF handler
  const handleImagesToPDF = useCallback(async () => {
    if (files.length === 0) return;
    setStatus("processing");
    setProgress(10);
    setErrorMessage("");

    try {
      setProgress(30);
      const result = await imagesToPDF(files);
      setProgress(100);
      setResultBlob(result.blob);
      setStatus("success");
      setOutputFileName(result.name);
    } catch (error) {
      setStatus("error");
      setErrorMessage(error instanceof Error ? error.message : "Failed to convert images to PDF");
      setProgress(0);
    }
  }, [files]);

  // Add Page Numbers handler
  const handleAddPageNumbers = useCallback(async () => {
    if (files.length === 0) return;
    const file = files[0];
    setStatus("processing");
    setProgress(10);
    setErrorMessage("");

    try {
      setProgress(30);
      const result = await addPageNumbers(file, {
        position: pageNumberPosition as 'bottom-center' | 'bottom-left' | 'bottom-right' | 'top-center' | 'top-left' | 'top-right',
        startNumber: pageNumberStart,
      });
      setProgress(100);
      setResultBlob(result.blob);
      setStatus("success");
      setOutputFileName(result.name);
    } catch (error) {
      setStatus("error");
      setErrorMessage(error instanceof Error ? error.message : "Failed to add page numbers");
      setProgress(0);
    }
  }, [files, pageNumberPosition, pageNumberStart]);

  // Protect PDF handler
  const handleProtectPDF = useCallback(async () => {
    if (files.length === 0) return;
    if (!protectPassword.trim()) {
      setErrorMessage("Please enter a password");
      return;
    }
    const file = files[0];
    setStatus("processing");
    setProgress(10);
    setErrorMessage("");

    try {
      setProgress(30);
      const result = await protectPDF(file, protectPassword);
      setProgress(100);
      setResultBlob(result.blob);
      setStatus("success");
      setOutputFileName(result.name);
    } catch (error) {
      setStatus("error");
      setErrorMessage(error instanceof Error ? error.message : "Failed to protect PDF");
      setProgress(0);
    }
  }, [files, protectPassword]);

  // PDF to Images handler
  const handlePdfToImages = useCallback(async () => {
    if (files.length === 0) return;
    const file = files[0];
    setStatus("processing");
    setProgress(10);
    setErrorMessage("");

    try {
      setProgress(30);
      const results = await pdfToImages(file, imageFormat, imageDpi);
      setProgress(100);
      setImageResults(results);
      setStatus("success");
      setOutputFileName(`${results.length} images created`);
    } catch (error) {
      setStatus("error");
      setErrorMessage(error instanceof Error ? error.message : "Failed to convert PDF to images");
      setProgress(0);
    }
  }, [files, imageFormat, imageDpi]);

  // Merge PDFs handler
  const handleMergePDFs = useCallback(async () => {
    if (files.length === 0) return;
    setStatus("processing");
    setProgress(10);
    setErrorMessage("");

    try {
      setProgress(30);
      const result = await mergePDFs(files);
      setProgress(100);
      setResultBlob(result.blob);
      setStatus("success");
      setOutputFileName(result.name);
    } catch (error) {
      setStatus("error");
      setErrorMessage(error instanceof Error ? error.message : "Failed to merge PDFs");
      setProgress(0);
    }
  }, [files]);

  // Download result handler
  const handleDownloadResult = useCallback(() => {
    if (resultBlob) {
      downloadBlob(resultBlob, outputFileName);
    } else if (compressResult) {
      downloadBlob(compressResult.blob, compressResult.name);
    }
  }, [resultBlob, outputFileName, compressResult]);

  const handleProcess = async () => {
    if (files.length === 0) return;

    // Client-side processing tools
    if (tool.id === "split") {
      await handleSplitPDF();
      return;
    }
    if (tool.id === "compress") {
      await handleCompressPDF();
      return;
    }
    if (tool.id === "rotate") {
      await handleRotatePDF();
      return;
    }
    if (tool.id === "watermark") {
      await handleWatermarkPDF();
      return;
    }
    if (tool.id === "delete-pages") {
      await handleDeletePages();
      return;
    }
    if (tool.id === "from-image") {
      await handleImagesToPDF();
      return;
    }
    if (tool.id === "page-numbers") {
      await handleAddPageNumbers();
      return;
    }
    if (tool.id === "protect") {
      await handleProtectPDF();
      return;
    }
    if (tool.id === "pdf-to-image") {
      await handlePdfToImages();
      return;
    }
    if (tool.id === "merge") {
      await handleMergePDFs();
      return;
    }

    // Server-side processing for other tools
    setStatus("uploading");
    setProgress(0);
    setErrorMessage("");

    try {
      const formData = new FormData();
      files.forEach((file) => {
        formData.append("files", file);
      });

      // Add options to formData
      Object.entries(options).forEach(([key, value]) => {
        formData.append(key, String(value));
      });

      // Simulate upload progress
      const uploadInterval = setInterval(() => {
        setProgress((prev) => {
          if (prev >= 50) {
            clearInterval(uploadInterval);
            return prev;
          }
          return prev + 10;
        });
      }, 100);

      const response = await fetch(tool.endpoint, {
        method: "POST",
        body: formData,
      });

      clearInterval(uploadInterval);
      setProgress(60);
      setStatus("processing");

      // Simulate processing progress
      const processInterval = setInterval(() => {
        setProgress((prev) => {
          if (prev >= 90) {
            clearInterval(processInterval);
            return prev;
          }
          return prev + 10;
        });
      }, 200);

      const result = await response.json();

      clearInterval(processInterval);

      if (response.ok && result.success) {
        setProgress(100);
        setStatus("success");
        setDownloadUrl(result.downloadUrl);
        setOutputFileName(result.fileName);

        // Handle AI-specific responses
        if (result.summary) {
          setSummary(result.summary);
        }

        // Store file ID for chat
        if (result.fileId) {
          setFileId(result.fileId);
        }
      } else {
        throw new Error(result.error || "Processing failed");
      }
    } catch (error) {
      setStatus("error");
      setErrorMessage(error instanceof Error ? error.message : "An error occurred");
      setProgress(0);
    }
  };

  const handleChat = async () => {
    if (!chatInput.trim() || isChatLoading) return;

    const userMessage = chatInput;
    setChatInput("");
    setChatMessages((prev) => [...prev, { role: "user", content: userMessage }]);
    setIsChatLoading(true);

    try {
      const response = await fetch("/api/pdf/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          fileId,
          question: userMessage,
          pdfText: summary, // Use cached text if available
        }),
      });

      const result = await response.json();

      if (result.success) {
        setChatMessages((prev) => [
          ...prev,
          { role: "assistant", content: result.answer },
        ]);
      } else {
        setChatMessages((prev) => [
          ...prev,
          {
            role: "assistant",
            content: "Sorry, I couldn't process your question. Please try again.",
          },
        ]);
      }
    } catch {
      setChatMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: "An error occurred. Please try again.",
        },
      ]);
    } finally {
      setIsChatLoading(false);
    }
  };

  const handleReset = () => {
    setStatus("idle");
    setProgress(0);
    setFiles([]);
    setDownloadUrl("");
    setOutputFileName("");
    setErrorMessage("");
    setSummary("");
    setChatMessages([]);
    setFileId("");
    setSplitResults([]);
    setCompressResult(null);
    setResultBlob(null);
    setPageRanges("");
    setPageNumbers("");
    setPagesToDelete("");
    setProtectPassword("");
    setPageNumberPosition("bottom-center");
    setPageNumberStart(1);
    setImageFormat("png");
    setImageDpi(150);
    setImageResults([]);
  };

  const copyToClipboard = async (text: string) => {
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const renderToolOptions = () => {
    switch (tool.id) {
      case "merge":
        return null;
      
      case "compress":
        return (
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Choose compression level:</h3>
            <div className="space-y-2">
              {[
                { value: 'low', label: 'Maximum Compression', desc: '~30% reduction' },
                { value: 'medium', label: 'Recommended ⭐', desc: '~15% reduction' },
                { value: 'high', label: 'High Quality', desc: '~5% reduction' },
              ].map((opt) => (
                <label
                  key={opt.value}
                  className={cn(
                    "flex items-start p-4 border rounded-xl cursor-pointer transition-all",
                    compressionQuality === opt.value
                      ? "border-violet-500 bg-violet-50 dark:bg-violet-950/30"
                      : "hover:bg-gray-50 dark:hover:bg-gray-800/50"
                  )}
                >
                  <input
                    type="radio"
                    name="compression"
                    value={opt.value}
                    checked={compressionQuality === opt.value}
                    onChange={() => setCompressionQuality(opt.value as CompressionQuality)}
                    className="mt-1"
                  />
                  <div className="ml-3">
                    <span className="font-medium">{opt.label}</span>
                    <p className="text-sm text-muted-foreground">{opt.desc}</p>
                  </div>
                </label>
              ))}
            </div>
          </div>
        );

      case "split":
        return (
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Choose how to split your PDF:</h3>
            <div className="space-y-2">
              {[
                { value: 'ranges', label: 'Split by page ranges', desc: 'e.g., 1-3, 5-7', placeholder: '1-3, 5-7, 10-12' },
                { value: 'extract', label: 'Extract specific pages', desc: 'e.g., 1, 3, 5', placeholder: '1, 3, 5, 7' },
                { value: 'every', label: 'Split every X pages', desc: 'Create separate files every N pages' },
                { value: 'count', label: 'Split into X equal files', desc: 'Divide PDF into equal parts' },
              ].map((opt) => (
                <label
                  key={opt.value}
                  className={cn(
                    "flex items-start p-4 border rounded-xl cursor-pointer transition-all",
                    splitMode === opt.value
                      ? "border-violet-500 bg-violet-50 dark:bg-violet-950/30"
                      : "hover:bg-gray-50 dark:hover:bg-gray-800/50"
                  )}
                >
                  <input
                    type="radio"
                    name="splitMode"
                    value={opt.value}
                    checked={splitMode === opt.value}
                    onChange={() => setSplitMode(opt.value)}
                    className="mt-1"
                  />
                  <div className="ml-3 flex-1">
                    <span className="font-medium">{opt.label}</span>
                    <p className="text-sm text-muted-foreground">{opt.desc}</p>
                    {splitMode === opt.value && opt.placeholder && (
                      <input
                        type="text"
                        placeholder={opt.placeholder}
                        className="w-full mt-2 p-2 border rounded-lg bg-background"
                        value={opt.value === 'ranges' ? pageRanges : opt.value === 'extract' ? pageNumbers : ''}
                        onChange={(e) => {
                          if (opt.value === 'ranges') setPageRanges(e.target.value);
                          else if (opt.value === 'extract') setPageNumbers(e.target.value);
                        }}
                      />
                    )}
                    {splitMode === opt.value && opt.value === 'every' && (
                      <input
                        type="number"
                        min="1"
                        placeholder="3"
                        className="w-full mt-2 p-2 border rounded-lg bg-background"
                        value={everyPages}
                        onChange={(e) => setEveryPages(e.target.value)}
                      />
                    )}
                    {splitMode === opt.value && opt.value === 'count' && (
                      <input
                        type="number"
                        min="2"
                        placeholder="2"
                        className="w-full mt-2 p-2 border rounded-lg bg-background"
                        value={fileCount}
                        onChange={(e) => setFileCount(e.target.value)}
                      />
                    )}
                  </div>
                </label>
              ))}
            </div>
          </div>
        );

      case "rotate":
        return (
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Choose rotation angle:</h3>
            <div className="grid grid-cols-4 gap-2">
              {[90, 180, 270].map((angle) => (
                <Button
                  key={angle}
                  variant={rotation === angle ? "default" : "outline"}
                  onClick={() => setRotation(angle as RotationAngle)}
                  className="py-6"
                >
                  {angle}°
                </Button>
              ))}
            </div>
          </div>
        );

      case "watermark":
        return (
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Watermark Settings:</h3>
            <div>
              <label className="text-sm font-medium">Watermark Text</label>
              <input
                type="text"
                className="w-full mt-1 px-3 py-2 border rounded-lg bg-background"
                placeholder="CONFIDENTIAL"
                value={watermarkText}
                onChange={(e) => setWatermarkText(e.target.value)}
              />
            </div>
            <div>
              <label className="text-sm font-medium">Opacity: {Math.round(watermarkOpacity * 100)}%</label>
              <input
                type="range"
                min="0.1"
                max="0.9"
                step="0.1"
                className="w-full mt-1"
                value={watermarkOpacity}
                onChange={(e) => setWatermarkOpacity(parseFloat(e.target.value))}
              />
            </div>
          </div>
        );

      case "delete-pages":
        return (
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Pages to Delete:</h3>
            <div>
              <label className="text-sm font-medium">Enter page numbers (comma-separated)</label>
              <input
                type="text"
                className="w-full mt-1 px-3 py-2 border rounded-lg bg-background"
                placeholder="1, 3, 5-7"
                value={pagesToDelete}
                onChange={(e) => setPagesToDelete(e.target.value)}
              />
              <p className="text-sm text-muted-foreground mt-1">e.g., 1, 3, 5, 7-10</p>
            </div>
          </div>
        );

      case "protect":
        return (
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Password Protection:</h3>
            <div>
              <label className="text-sm font-medium">Enter password to protect PDF</label>
              <input
                type="password"
                className="w-full mt-1 px-3 py-2 border rounded-lg bg-background"
                placeholder="Enter password"
                value={protectPassword}
                onChange={(e) => setProtectPassword(e.target.value)}
              />
              <p className="text-sm text-muted-foreground mt-1">Password will be required to open the PDF</p>
            </div>
          </div>
        );

      case "page-numbers":
        return (
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Page Number Settings:</h3>
            <div>
              <label className="text-sm font-medium">Position</label>
              <select
                className="w-full mt-1 px-3 py-2 border rounded-lg bg-background"
                value={pageNumberPosition}
                onChange={(e) => setPageNumberPosition(e.target.value)}
              >
                <option value="bottom-center">Bottom Center</option>
                <option value="bottom-left">Bottom Left</option>
                <option value="bottom-right">Bottom Right</option>
                <option value="top-center">Top Center</option>
                <option value="top-left">Top Left</option>
                <option value="top-right">Top Right</option>
              </select>
            </div>
            <div>
              <label className="text-sm font-medium">Start Number</label>
              <input
                type="number"
                min="1"
                className="w-full mt-1 px-3 py-2 border rounded-lg bg-background"
                value={pageNumberStart}
                onChange={(e) => setPageNumberStart(parseInt(e.target.value) || 1)}
              />
            </div>
          </div>
        );

      case "pdf-to-image":
        return (
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Image Settings:</h3>
            <div>
              <label className="text-sm font-medium">Image Format</label>
              <div className="grid grid-cols-2 gap-2 mt-1">
                <Button
                  variant={imageFormat === 'png' ? "default" : "outline"}
                  onClick={() => setImageFormat('png')}
                  className="py-4"
                >
                  PNG (Lossless)
                </Button>
                <Button
                  variant={imageFormat === 'jpg' ? "default" : "outline"}
                  onClick={() => setImageFormat('jpg')}
                  className="py-4"
                >
                  JPG (Smaller)
                </Button>
              </div>
            </div>
            <div>
              <label className="text-sm font-medium">Quality (DPI)</label>
              <select
                className="w-full mt-1 px-3 py-2 border rounded-lg bg-background"
                value={imageDpi}
                onChange={(e) => setImageDpi(parseInt(e.target.value))}
              >
                <option value="72">72 DPI (Screen)</option>
                <option value="96">96 DPI (Web)</option>
                <option value="150">150 DPI (Standard)</option>
                <option value="300">300 DPI (Print)</option>
              </select>
            </div>
          </div>
        );

      case "ocr":
        return (
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium">Language</label>
              <select
                className="w-full mt-1 px-3 py-2 border rounded-lg bg-background"
                onChange={(e) => setOptions({ ...options, language: e.target.value })}
              >
                <option value="eng">English</option>
                <option value="chi_sim">Chinese (Simplified)</option>
                <option value="chi_tra">Chinese (Traditional)</option>
                <option value="jpn">Japanese</option>
                <option value="kor">Korean</option>
                <option value="fra">French</option>
                <option value="deu">German</option>
                <option value="spa">Spanish</option>
              </select>
            </div>
          </div>
        );
      default:
        return null;
    }
  };

  // Render AI summary result
  const renderSummaryResult = () => (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      <div className="flex items-center gap-2 mb-4">
        <FileText className="w-5 h-5 text-primary" />
        <h3 className="font-semibold">Document Summary</h3>
      </div>

      <div className="relative">
        <div className="prose prose-sm dark:prose-invert max-w-none p-4 rounded-xl bg-muted/50 border border-border max-h-[400px] overflow-y-auto">
          <div className="whitespace-pre-wrap">{summary}</div>
        </div>
        <Button
          variant="ghost"
          size="sm"
          className="absolute top-2 right-2"
          onClick={() => copyToClipboard(summary)}
        >
          {copied ? <Check className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4" />}
        </Button>
      </div>

      {/* Chat interface for Chat with PDF tool */}
      {tool.id === "chat" && (
        <div className="mt-6 space-y-4">
          <div className="flex items-center gap-2">
            <MessageSquare className="w-5 h-5 text-primary" />
            <h3 className="font-semibold">Ask Questions</h3>
          </div>

          {/* Chat messages */}
          <div
            ref={chatContainerRef}
            className="space-y-3 p-4 rounded-xl bg-muted/30 border border-border max-h-[300px] overflow-y-auto"
          >
            {chatMessages.length === 0 && (
              <p className="text-sm text-muted-foreground text-center">
                Ask questions about your document...
              </p>
            )}
            {chatMessages.map((msg, idx) => (
              <div
                key={idx}
                className={cn(
                  "flex",
                  msg.role === "user" ? "justify-end" : "justify-start"
                )}
              >
                <div
                  className={cn(
                    "max-w-[80%] rounded-2xl px-4 py-2",
                    msg.role === "user"
                      ? "bg-primary text-primary-foreground"
                      : "bg-muted border border-border"
                  )}
                >
                  <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
                </div>
              </div>
            ))}
            {isChatLoading && (
              <div className="flex justify-start">
                <div className="bg-muted border border-border rounded-2xl px-4 py-2">
                  <Loader2 className="w-4 h-4 animate-spin" />
                </div>
              </div>
            )}
          </div>

          {/* Chat input */}
          <div className="flex gap-2">
            <input
              type="text"
              value={chatInput}
              onChange={(e) => setChatInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleChat()}
              placeholder="Ask a question about your PDF..."
              className="flex-1 px-4 py-2 border rounded-full bg-background focus:outline-none focus:ring-2 focus:ring-primary"
            />
            <Button
              onClick={handleChat}
              disabled={!chatInput.trim() || isChatLoading}
              className="rounded-full w-10 h-10 p-0"
            >
              <Send className="w-4 h-4" />
            </Button>
          </div>
        </div>
      )}

      {/* Download and reset buttons */}
      <div className="flex gap-4 pt-4">
        {downloadUrl && (
          <DownloadButton
            downloadUrl={downloadUrl}
            fileName={outputFileName}
            onReset={handleReset}
          />
        )}
        <Button variant="outline" onClick={handleReset}>
          Process Another File
        </Button>
      </div>
    </motion.div>
  );

  // Check if this is the merge tool
  const isMergeTool = tool.id === "merge";

  return (
    <div className="min-h-screen pt-20 pb-10 px-4">
      <div className="container mx-auto max-w-4xl">
        {/* Back button */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="mb-6"
        >
          <Link href="/">
            <Button variant="ghost" className="rounded-full">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to all tools
            </Button>
          </Link>
        </motion.div>

        {/* Tool Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-8"
        >
          <div
            className={cn(
              "w-20 h-20 mx-auto rounded-2xl flex items-center justify-center mb-4 bg-gradient-to-br shadow-xl",
              tool.gradient
            )}
          >
            <tool.icon className="w-10 h-10 text-white" />
          </div>
          <h1 className="text-3xl font-bold mb-2">{tool.name}</h1>
          <p className="text-muted-foreground">{tool.description}</p>
        </motion.div>

        {/* Main Content */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="glass-card rounded-3xl p-6 md:p-8"
        >
          {/* Merge tool uses the advanced grid directly */}
          {isMergeTool && status !== "success" && (
            <MergePDFGrid onFilesChange={handleFilesSelected} />
          )}

          {/* Non-merge tools use regular file upload */}
          {!isMergeTool && status !== "success" && (
            <FileUpload
              acceptTypes={tool.acceptTypes}
              maxFiles={tool.maxFiles}
              onFilesSelected={handleFilesSelected}
              isProcessing={status === "uploading" || status === "processing"}
              progress={progress}
            />
          )}

          {/* Tool Options - Show directly for client-side tools, collapsible for others */}
          {!isMergeTool && status === "idle" && files.length > 0 && renderToolOptions() && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mt-6"
            >
              {/* Show options directly for client-side tools */}
              {["split", "compress", "rotate", "watermark", "delete-pages", "page-numbers", "protect", "pdf-to-image"].includes(tool.id) ? (
                <div className="p-4 rounded-xl bg-gradient-to-r from-violet-500/5 to-purple-500/5 border border-violet-500/20">
                  {renderToolOptions()}
                </div>
              ) : (
                <>
                  <button
                    onClick={() => setShowOptions(!showOptions)}
                    className="flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
                  >
                    <Settings className="w-4 h-4" />
                    Options
                    <ChevronDown
                      className={cn(
                        "w-4 h-4 transition-transform",
                        showOptions && "rotate-180"
                      )}
                    />
                  </button>
                  {showOptions && (
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="mt-4 p-4 rounded-xl bg-muted/50"
                    >
                      {renderToolOptions()}
                    </motion.div>
                  )}
                </>
              )}
            </motion.div>
          )}

          {/* Processing Status */}
          {status !== "idle" && status !== "success" && (
            <div className="mt-6">
              <ProcessingStatus
                status={status}
                progress={progress}
                errorMessage={errorMessage}
              />
            </div>
          )}

          {/* Process Button */}
          {status === "idle" && files.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="mt-6 flex justify-center"
            >
              <Button
                size="lg"
                onClick={handleProcess}
                className="btn-gradient text-white rounded-full px-12 py-6 text-lg font-semibold shadow-lg shadow-violet-500/25"
              >
                Process {files.length} file{files.length > 1 ? "s" : ""}
              </Button>
            </motion.div>
          )}

          {/* Success & Download - Client-side tools */}
          {status === "success" && (resultBlob || compressResult || splitResults.length > 0 || imageResults.length > 0) ? (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="text-center py-8"
            >
              <div className="w-24 h-24 mx-auto rounded-full bg-gradient-to-br from-green-400 to-emerald-500 flex items-center justify-center mb-6 animate-pulse-glow">
                <tool.icon className="w-12 h-12 text-white" />
              </div>
              <h2 className="text-2xl font-bold mb-2">
                {compressResult ? "Compressed!" : splitResults.length > 0 ? "Split Complete!" : imageResults.length > 0 ? "Converted!" : "Done!"}
              </h2>
              
              {/* Show compression stats */}
              {compressResult && (
                <div className="max-w-md mx-auto mb-6 p-4 rounded-xl bg-green-50 dark:bg-green-950/30 border border-green-200 dark:border-green-800">
                  <div className="grid grid-cols-2 gap-4 text-center">
                    <div>
                      <div className="text-sm text-muted-foreground">Original</div>
                      <div className="text-lg font-semibold">{formatFileSize(compressResult.originalSize)}</div>
                    </div>
                    <div>
                      <div className="text-sm text-muted-foreground">Compressed</div>
                      <div className="text-lg font-semibold text-green-600">{formatFileSize(compressResult.compressedSize)}</div>
                    </div>
                  </div>
                  <div className="mt-3 text-sm">
                    <span className="font-medium text-green-600">{compressResult.reduction.toFixed(1)}% smaller</span>
                  </div>
                </div>
              )}

              {/* Show split results count */}
              {splitResults.length > 0 && (
                <p className="text-muted-foreground mb-6">
                  Created {splitResults.length} file{splitResults.length > 1 ? "s" : ""}
                </p>
              )}

              {/* Show image results count */}
              {imageResults.length > 0 && (
                <p className="text-muted-foreground mb-6">
                  Created {imageResults.length} image{imageResults.length > 1 ? "s" : ""}
                </p>
              )}

              {/* Show file name for other tools */}
              {resultBlob && !compressResult && !splitResults.length && !imageResults.length && (
                <p className="text-muted-foreground mb-8">{outputFileName}</p>
              )}

              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Button
                  size="lg"
                  onClick={() => {
                    if (splitResults.length > 0) {
                      downloadMultipleAsZip(splitResults, "split_pdfs.zip");
                    } else if (imageResults.length > 0) {
                      downloadMultipleAsZip(imageResults, "images.zip");
                    } else {
                      handleDownloadResult();
                    }
                  }}
                  className="btn-gradient text-white rounded-full px-8 py-6 gap-2"
                >
                  <Download className="w-5 h-5" />
                  Download
                </Button>
                <Button variant="outline" size="lg" onClick={handleReset} className="rounded-full px-8 py-6">
                  Process Another File
                </Button>
              </div>
            </motion.div>
          ) : status === "success" && summary ? (
            renderSummaryResult()
          ) : status === "success" && downloadUrl ? (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="text-center py-8"
            >
              <div className="w-24 h-24 mx-auto rounded-full bg-gradient-to-br from-green-400 to-emerald-500 flex items-center justify-center mb-6 animate-pulse-glow">
                <tool.icon className="w-12 h-12 text-white" />
              </div>
              <h2 className="text-2xl font-bold mb-2">Your file is ready!</h2>
              <p className="text-muted-foreground mb-8">
                {outputFileName}
              </p>
              <DownloadButton
                downloadUrl={downloadUrl}
                fileName={outputFileName}
                onReset={handleReset}
              />
            </motion.div>
          ) : null}
        </motion.div>
      </div>
    </div>
  );
}
