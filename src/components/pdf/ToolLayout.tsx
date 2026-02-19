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
  extractPages,
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

  // Client-side PDF split handler
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
          if (!pageRanges.trim()) {
            throw new Error("Please enter page ranges (e.g., 1-3, 5-7)");
          }
          setProgress(30);
          results = await splitPDFByRanges(file, pageRanges);
          break;

        case "extract":
          if (!pageNumbers.trim()) {
            throw new Error("Please enter page numbers (e.g., 1, 3, 5)");
          }
          setProgress(30);
          results = [await extractPages(file, pageNumbers)];
          break;

        case "every":
          const every = parseInt(everyPages);
          if (isNaN(every) || every < 1) {
            throw new Error("Please enter a valid number of pages");
          }
          setProgress(30);
          results = await splitPDFEveryNPages(file, every);
          break;

        case "count":
          const count = parseInt(fileCount);
          if (isNaN(count) || count < 2) {
            throw new Error("Please enter a valid number of files (at least 2)");
          }
          setProgress(30);
          results = await splitPDFIntoNFiles(file, count);
          break;

        default:
          setProgress(30);
          results = await splitAllPages(file);
      }

      setProgress(100);
      setSplitResults(results);
      setStatus("success");
      setOutputFileName(`${results.length} file${results.length > 1 ? 's' : ''} created`);

    } catch (error) {
      setStatus("error");
      setErrorMessage(error instanceof Error ? error.message : "Failed to split PDF");
      setProgress(0);
    }
  }, [files, splitMode, pageRanges, pageNumbers, everyPages, fileCount]);

  // Download split results
  const handleDownloadSplitResults = useCallback(() => {
    downloadMultipleAsZip(splitResults, "split_pdfs.zip");
  }, [splitResults]);

  // Client-side PDF compress handler
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
      setStatus("success");
      setOutputFileName(result.name);

    } catch (error) {
      setStatus("error");
      setErrorMessage(error instanceof Error ? error.message : "Failed to compress PDF");
      setProgress(0);
    }
  }, [files, compressionQuality]);

  // Download compress result
  const handleDownloadCompressResult = useCallback(() => {
    if (compressResult) {
      downloadBlob(compressResult.blob, compressResult.name);
    }
  }, [compressResult]);

  const handleProcess = async () => {
    if (files.length === 0) return;

    // Use client-side processing for split tool
    if (tool.id === "split") {
      await handleSplitPDF();
      return;
    }

    // Use client-side processing for compress tool
    if (tool.id === "compress") {
      await handleCompressPDF();
      return;
    }

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
    setPageRanges("");
    setPageNumbers("");
    setCompressResult(null);
  };

  const copyToClipboard = async (text: string) => {
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const renderToolOptions = () => {
    switch (tool.id) {
      case "merge":
        // Merge uses the grid directly, no options panel needed
        return null;
      case "compress":
        return (
          <div className="space-y-6">
            <h3 className="text-lg font-semibold">Choose compression level:</h3>
            
            <div className="space-y-3">
              {/* Maximum Compression */}
              <label 
                className={cn(
                  "flex items-start p-4 border rounded-xl cursor-pointer transition-all",
                  compressionQuality === "low" 
                    ? "border-violet-500 bg-violet-50 dark:bg-violet-950/30" 
                    : "hover:bg-gray-50 dark:hover:bg-gray-800/50"
                )}
              >
                <input 
                  type="radio" 
                  name="compression" 
                  value="low"
                  checked={compressionQuality === "low"}
                  onChange={() => setCompressionQuality("low")}
                  className="mt-1"
                />
                <div className="ml-3 flex-1">
                  <span className="font-medium">Maximum Compression</span>
                  <p className="text-sm text-muted-foreground">Smallest file size, lower quality (~30% reduction)</p>
                </div>
              </label>

              {/* Recommended */}
              <label 
                className={cn(
                  "flex items-start p-4 border rounded-xl cursor-pointer transition-all",
                  compressionQuality === "medium" 
                    ? "border-violet-500 bg-violet-50 dark:bg-violet-950/30" 
                    : "hover:bg-gray-50 dark:hover:bg-gray-800/50"
                )}
              >
                <input 
                  type="radio" 
                  name="compression" 
                  value="medium"
                  checked={compressionQuality === "medium"}
                  onChange={() => setCompressionQuality("medium")}
                  className="mt-1"
                />
                <div className="ml-3 flex-1">
                  <span className="font-medium">Recommended ⭐</span>
                  <p className="text-sm text-muted-foreground">Good balance of size and quality (~15% reduction)</p>
                </div>
              </label>

              {/* High Quality */}
              <label 
                className={cn(
                  "flex items-start p-4 border rounded-xl cursor-pointer transition-all",
                  compressionQuality === "high" 
                    ? "border-violet-500 bg-violet-50 dark:bg-violet-950/30" 
                    : "hover:bg-gray-50 dark:hover:bg-gray-800/50"
                )}
              >
                <input 
                  type="radio" 
                  name="compression" 
                  value="high"
                  checked={compressionQuality === "high"}
                  onChange={() => setCompressionQuality("high")}
                  className="mt-1"
                />
                <div className="ml-3 flex-1">
                  <span className="font-medium">High Quality</span>
                  <p className="text-sm text-muted-foreground">Best quality, minimal compression (~5% reduction)</p>
                </div>
              </label>
            </div>

            {/* Info box */}
            <div className="p-4 rounded-lg bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800">
              <p className="text-sm text-amber-700 dark:text-amber-400">
                <strong>Note:</strong> Browser-based compression has limitations. For maximum compression of image-heavy PDFs, consider desktop tools like Adobe Acrobat.
              </p>
            </div>
          </div>
        );
      case "split":
        return (
          <div className="space-y-6">
            <h3 className="text-lg font-semibold">Choose how to split your PDF:</h3>
            
            <div className="space-y-3">
              {/* Split by page ranges */}
              <label 
                className={cn(
                  "flex items-start p-4 border rounded-xl cursor-pointer transition-all",
                  splitMode === "ranges" 
                    ? "border-violet-500 bg-violet-50 dark:bg-violet-950/30" 
                    : "hover:bg-gray-50 dark:hover:bg-gray-800/50"
                )}
              >
                <input 
                  type="radio" 
                  name="splitMode" 
                  value="ranges"
                  checked={splitMode === "ranges"}
                  onChange={() => setSplitMode("ranges")}
                  className="mt-1"
                />
                <div className="ml-3 flex-1">
                  <span className="font-medium">Split by page ranges</span>
                  <p className="text-sm text-muted-foreground">e.g., 1-3, 4-6, 7-10</p>
                  {splitMode === "ranges" && (
                    <input 
                      type="text"
                      placeholder="1-3, 5-7, 10-12"
                      className="w-full mt-3 p-3 border rounded-lg bg-background"
                      value={pageRanges}
                      onChange={(e) => {
                        setPageRanges(e.target.value);
                        setOptions({ ...options, splitMode: "ranges", pageRanges: e.target.value });
                      }}
                    />
                  )}
                </div>
              </label>

              {/* Extract specific pages */}
              <label 
                className={cn(
                  "flex items-start p-4 border rounded-xl cursor-pointer transition-all",
                  splitMode === "extract" 
                    ? "border-violet-500 bg-violet-50 dark:bg-violet-950/30" 
                    : "hover:bg-gray-50 dark:hover:bg-gray-800/50"
                )}
              >
                <input 
                  type="radio" 
                  name="splitMode" 
                  value="extract"
                  checked={splitMode === "extract"}
                  onChange={() => setSplitMode("extract")}
                  className="mt-1"
                />
                <div className="ml-3 flex-1">
                  <span className="font-medium">Extract specific pages</span>
                  <p className="text-sm text-muted-foreground">e.g., 1, 3, 5, 7</p>
                  {splitMode === "extract" && (
                    <input 
                      type="text"
                      placeholder="1, 3, 5, 7"
                      className="w-full mt-3 p-3 border rounded-lg bg-background"
                      value={pageNumbers}
                      onChange={(e) => {
                        setPageNumbers(e.target.value);
                        setOptions({ ...options, splitMode: "extract", pageNumbers: e.target.value });
                      }}
                    />
                  )}
                </div>
              </label>

              {/* Split every X pages */}
              <label 
                className={cn(
                  "flex items-start p-4 border rounded-xl cursor-pointer transition-all",
                  splitMode === "every" 
                    ? "border-violet-500 bg-violet-50 dark:bg-violet-950/30" 
                    : "hover:bg-gray-50 dark:hover:bg-gray-800/50"
                )}
              >
                <input 
                  type="radio" 
                  name="splitMode" 
                  value="every"
                  checked={splitMode === "every"}
                  onChange={() => setSplitMode("every")}
                  className="mt-1"
                />
                <div className="ml-3 flex-1">
                  <span className="font-medium">Split every X pages</span>
                  <p className="text-sm text-muted-foreground">Create separate files every N pages</p>
                  {splitMode === "every" && (
                    <input 
                      type="number"
                      min="1"
                      placeholder="3"
                      className="w-full mt-3 p-3 border rounded-lg bg-background"
                      value={everyPages}
                      onChange={(e) => {
                        setEveryPages(e.target.value);
                        setOptions({ ...options, splitMode: "every", everyPages: e.target.value });
                      }}
                    />
                  )}
                </div>
              </label>

              {/* Split into X files */}
              <label 
                className={cn(
                  "flex items-start p-4 border rounded-xl cursor-pointer transition-all",
                  splitMode === "count" 
                    ? "border-violet-500 bg-violet-50 dark:bg-violet-950/30" 
                    : "hover:bg-gray-50 dark:hover:bg-gray-800/50"
                )}
              >
                <input 
                  type="radio" 
                  name="splitMode" 
                  value="count"
                  checked={splitMode === "count"}
                  onChange={() => setSplitMode("count")}
                  className="mt-1"
                />
                <div className="ml-3 flex-1">
                  <span className="font-medium">Split into X equal files</span>
                  <p className="text-sm text-muted-foreground">Divide PDF into N equal parts</p>
                  {splitMode === "count" && (
                    <input 
                      type="number"
                      min="2"
                      placeholder="3"
                      className="w-full mt-3 p-3 border rounded-lg bg-background"
                      value={fileCount}
                      onChange={(e) => {
                        setFileCount(e.target.value);
                        setOptions({ ...options, splitMode: "count", fileCount: e.target.value });
                      }}
                    />
                  )}
                </div>
              </label>
            </div>
          </div>
        );
      case "watermark":
        return (
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium">Watermark Text</label>
              <input
                type="text"
                className="w-full mt-1 px-3 py-2 border rounded-lg bg-background"
                placeholder="CONFIDENTIAL"
                onChange={(e) => setOptions({ ...options, watermarkText: e.target.value })}
              />
            </div>
          </div>
        );
      case "rotate":
        return (
          <div className="grid grid-cols-4 gap-2">
            {[90, 180, 270, 360].map((angle) => (
              <Button
                key={angle}
                variant={options.rotation === angle ? "default" : "outline"}
                onClick={() => setOptions({ ...options, rotation: angle })}
              >
                {angle}°
              </Button>
            ))}
          </div>
        );
      case "protect":
        return (
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium">Password</label>
              <input
                type="password"
                className="w-full mt-1 px-3 py-2 border rounded-lg bg-background"
                placeholder="Enter password"
                onChange={(e) => setOptions({ ...options, password: e.target.value })}
              />
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
      case "delete-pages":
        return (
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium">Pages to delete (e.g., "1,3,5-7")</label>
              <input
                type="text"
                className="w-full mt-1 px-3 py-2 border rounded-lg bg-background"
                placeholder="1,3,5-7"
                onChange={(e) => setOptions({ ...options, pagesToDelete: e.target.value })}
              />
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
          <Link 
            href="/"
            className="inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-full text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground h-10 px-4 py-2"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to all tools
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

          {/* Tool Options - Visible by default for split and compress, collapsible for others */}
          {!isMergeTool && status === "idle" && files.length > 0 && renderToolOptions() && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mt-6"
            >
              {/* For split and compress tools, show options directly without collapse */}
              {tool.id === "split" || tool.id === "compress" ? (
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

          {/* Success & Download */}
          {status === "success" && summary ? (
            renderSummaryResult()
          ) : status === "success" && compressResult ? (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="text-center py-8"
            >
              <div className="w-24 h-24 mx-auto rounded-full bg-gradient-to-br from-green-400 to-emerald-500 flex items-center justify-center mb-6 animate-pulse-glow">
                <tool.icon className="w-12 h-12 text-white" />
              </div>
              <h2 className="text-2xl font-bold mb-2">Compressed!</h2>
              
              {/* Compression stats */}
              <div className="max-w-md mx-auto mb-6 p-6 rounded-xl bg-gradient-to-r from-green-500/10 to-emerald-500/10 border border-green-500/20">
                <div className="grid grid-cols-2 gap-4 text-center">
                  <div>
                    <div className="text-sm text-muted-foreground mb-1">Original</div>
                    <div className="text-lg font-semibold">{formatFileSize(compressResult.originalSize)}</div>
                  </div>
                  <div>
                    <div className="text-sm text-muted-foreground mb-1">Compressed</div>
                    <div className="text-lg font-semibold text-green-600">{formatFileSize(compressResult.compressedSize)}</div>
                  </div>
                </div>
                <div className="mt-4 pt-4 border-t border-green-500/20">
                  <div className="text-sm text-muted-foreground mb-1">Size Reduction</div>
                  <div className="text-2xl font-bold text-green-600">
                    {compressResult.reduction > 0 ? '-' : ''}{compressResult.reduction.toFixed(1)}%
                  </div>
                  <div className="text-sm text-muted-foreground mt-1">
                    Saved {formatFileSize(Math.abs(compressResult.originalSize - compressResult.compressedSize))}
                  </div>
                </div>
              </div>
              
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Button
                  size="lg"
                  onClick={handleDownloadCompressResult}
                  className="btn-gradient text-white rounded-full px-8 py-6 gap-2"
                >
                  <Download className="w-5 h-5" />
                  Download Compressed PDF
                </Button>
                <Button
                  variant="outline"
                  size="lg"
                  onClick={handleReset}
                  className="rounded-full px-8 py-6"
                >
                  Compress Another PDF
                </Button>
              </div>
            </motion.div>
          ) : status === "success" && splitResults.length > 0 ? (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="text-center py-8"
            >
              <div className="w-24 h-24 mx-auto rounded-full bg-gradient-to-br from-green-400 to-emerald-500 flex items-center justify-center mb-6 animate-pulse-glow">
                <tool.icon className="w-12 h-12 text-white" />
              </div>
              <h2 className="text-2xl font-bold mb-2">Split Complete!</h2>
              <p className="text-muted-foreground mb-4">
                {splitResults.length} file{splitResults.length > 1 ? 's' : ''} created
              </p>
              
              {/* Show file list */}
              <div className="max-w-md mx-auto mb-6 p-4 rounded-xl bg-muted/50 border border-border">
                <div className="text-sm text-muted-foreground mb-2">Files:</div>
                <div className="space-y-1 text-left">
                  {splitResults.map((result, index) => (
                    <div key={index} className="flex items-center gap-2 text-sm">
                      <FileText className="w-4 h-4 text-violet-500" />
                      <span>{result.name}</span>
                    </div>
                  ))}
                </div>
              </div>
              
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Button
                  size="lg"
                  onClick={handleDownloadSplitResults}
                  className="btn-gradient text-white rounded-full px-8 py-6 gap-2"
                >
                  <Download className="w-5 h-5" />
                  Download {splitResults.length > 1 ? 'All Files' : 'File'}
                </Button>
                <Button
                  variant="outline"
                  size="lg"
                  onClick={handleReset}
                  className="rounded-full px-8 py-6"
                >
                  Split Another PDF
                </Button>
              </div>
            </motion.div>
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
