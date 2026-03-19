"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Upload, FileText, X, Image as ImageIcon, File, CheckCircle2, Loader2, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";

interface FileInfo {
  id: string;
  name: string;
  size: number;
  type: string;
  file: File;
  uploadProgress?: number;
  uploadStatus?: "idle" | "uploading" | "complete" | "error";
  error?: string;
}

interface FileUploadProps {
  acceptTypes: string;
  maxFiles: number;
  maxSizeMB?: number;
  onFilesSelected: (files: File[]) => void;
  isProcessing?: boolean;
  progress?: number;
  showUploadProgress?: boolean;
  onUploadProgress?: (progress: number, stage: "uploading" | "processing" | "complete") => void;
  onCancel?: () => void;
  onRetry?: () => void;
}

type ProcessingStage = "idle" | "uploading" | "processing" | "complete";

// Helper function outside component to validate files
function validateFileAgainstTypes(file: File, acceptTypes: string, maxSizeMB: number): string | null {
  const maxBytes = maxSizeMB * 1024 * 1024;
  if (file.size > maxBytes) {
    return `File too large (max ${maxSizeMB}MB)`;
  }

  const acceptedTypes = acceptTypes.split(",").map((t) => t.trim().toLowerCase());
  const fileExt = "." + file.name.split(".").pop()?.toLowerCase();
  if (!acceptedTypes.some((t) => t === fileExt || file.type.includes(t.replace(".", "")))) {
    return `Unsupported file type. Please upload a ${acceptTypes.replace(/\./g, "").toUpperCase()} file.`;
  }

  return null;
}

export function FileUpload({
  acceptTypes,
  maxFiles,
  maxSizeMB = 50,
  onFilesSelected,
  isProcessing = false,
  progress = 0,
  showUploadProgress = false,
  onUploadProgress,
  onCancel,
  onRetry,
}: FileUploadProps) {
  const [files, setFiles] = useState<FileInfo[]>([]);
  const [isDragOver, setIsDragOver] = useState(false);
  const [uploadStage, setUploadStage] = useState<ProcessingStage>("idle");
  const [uploadProgress, setUploadProgress] = useState(0);
  const [estimatedTimeRemaining, setEstimatedTimeRemaining] = useState<number | null>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const cancelRef = useRef(false);

  // Store props in refs for callback
  const acceptTypesRef = useRef(acceptTypes);
  const maxSizeMBRef = useRef(maxSizeMB);

  // Update refs when props change
  useEffect(() => {
    acceptTypesRef.current = acceptTypes;
    maxSizeMBRef.current = maxSizeMB;
  }, [acceptTypes, maxSizeMB]);

  // Calculate total upload size
  const totalSize = files.reduce((acc, f) => acc + f.size, 0);

  const formatSize = (bytes: number): string => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  };

  const formatTime = (seconds: number): string => {
    if (seconds < 60) return `${Math.round(seconds)}s`;
    if (seconds < 3600) return `${Math.round(seconds / 60)}m`;
    return `${Math.round(seconds / 3600)}h`;
  };

  const getFileIcon = (type: string) => {
    if (type.includes("image")) return ImageIcon;
    if (type.includes("pdf")) return FileText;
    return File;
  };

  const handleFiles = useCallback(
    (newFiles: FileList | null) => {
      if (!newFiles) return;

      const fileArray = Array.from(newFiles);
      const currentFiles = files;
      const currentMaxFiles = maxFiles;

      const remainingSlots = currentMaxFiles - currentFiles.length;
      const filesToAdd = fileArray.slice(0, remainingSlots);

      const newFileInfos: FileInfo[] = filesToAdd.map((file) => {
        const error = validateFileAgainstTypes(file, acceptTypesRef.current, maxSizeMBRef.current);
        return {
          id: Math.random().toString(36).substr(2, 9),
          name: file.name,
          size: file.size,
          type: file.type || `application/${file.name.split(".").pop()}`,
          file,
          uploadProgress: error ? 0 : undefined,
          uploadStatus: error ? "error" : "idle",
          error: error || undefined,
        };
      });

      const updatedFiles = [...currentFiles, ...newFileInfos];
      setFiles(updatedFiles);
      onFilesSelected(updatedFiles.filter((f) => !f.error).map((f) => f.file));

      // Reset state
      setUploadStage("idle");
      setUploadProgress(0);
      setEstimatedTimeRemaining(null);
      setUploadError(null);
      cancelRef.current = false;
    },
    [files, maxFiles, onFilesSelected]
  );

  const removeFile = (id: string) => {
    const updatedFiles = files.filter((f) => f.id !== id);
    setFiles(updatedFiles);
    onFilesSelected(updatedFiles.filter((f) => !f.error).map((f) => f.file));
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    handleFiles(e.dataTransfer.files);
  };

  // Simulate upload progress when isProcessing changes
  useEffect(() => {
    if (!showUploadProgress) return;

    if (isProcessing && uploadStage !== "complete") {
      const startTime = Date.now();
      let step = 0;

      const interval = setInterval(() => {
        if (cancelRef.current) {
          clearInterval(interval);
          return;
        }

        step += Math.random() * 5 + 2;

        if (step >= 50 && uploadStage === "idle") {
          setUploadStage("uploading");
          setUploadProgress(50);
          onUploadProgress?.(50, "uploading");
        }

        if (step >= 80 && uploadStage === "uploading") {
          setUploadStage("processing");
          setUploadProgress(80);
          onUploadProgress?.(80, "processing");
        }

        if (step >= 95) {
          setUploadStage("complete");
          setUploadProgress(100);
          onUploadProgress?.(100, "complete");
          clearInterval(interval);
          return;
        }

        setUploadProgress(Math.min(step, 95));

        // Estimate time remaining
        const elapsed = (Date.now() - startTime) / 1000;
        const rate = step / elapsed;
        if (rate > 0) {
          const remaining = (100 - step) / rate;
          setEstimatedTimeRemaining(remaining);
        }
      }, 200);

      return () => clearInterval(interval);
    }
  }, [isProcessing, showUploadProgress, uploadStage, onUploadProgress]);

  const handleCancel = () => {
    cancelRef.current = true;
    setUploadStage("idle");
    setUploadProgress(0);
    setEstimatedTimeRemaining(null);
    onCancel?.();
  };

  const handleRetry = () => {
    setUploadError(null);
    setUploadStage("idle");
    onRetry?.();
  };

  return (
    <div className="w-full space-y-3 md:space-y-4">
      {/* Upload Zone - Full width and touch optimized */}
      <motion.div
        className={cn(
          "upload-zone relative rounded-xl md:rounded-2xl p-6 md:p-8 transition-all duration-300 cursor-pointer",
          isDragOver && "drag-over scale-[1.01] border-primary bg-primary/5",
          files.length > 0 && "border-solid border-primary/30"
        )}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => !isProcessing && inputRef.current?.click()}
        whileHover={!isProcessing ? { scale: 1.01 } : undefined}
        whileTap={!isProcessing ? { scale: 0.98 } : undefined}
      >
        <input
          ref={inputRef}
          type="file"
          accept={acceptTypes}
          multiple={maxFiles > 1}
          className="hidden"
          onChange={(e) => handleFiles(e.target.files)}
          disabled={isProcessing}
        />

        <div className="flex flex-col items-center justify-center text-center">
          <motion.div
            className={cn(
              "w-16 h-16 md:w-20 md:h-20 rounded-xl md:rounded-2xl flex items-center justify-center mb-3 md:mb-4 transition-all duration-300",
              isDragOver
                ? "bg-primary text-white"
                : "bg-gradient-to-br from-violet-100 to-purple-100 dark:from-violet-900/30 dark:to-purple-900/30 text-primary"
            )}
            animate={isDragOver ? { scale: [1, 1.1, 1] } : {}}
            transition={{ duration: 0.3 }}
          >
            <Upload className="w-8 h-8 md:w-10 md:h-10" />
          </motion.div>

          <h3 className="text-base md:text-lg font-semibold mb-1 md:mb-2">
            {isDragOver ? "Drop files here" : "Drag & drop your files"}
          </h3>
          <p className="text-sm text-muted-foreground mb-2 md:mb-3">
            or tap to browse
          </p>
          <div className="flex flex-wrap justify-center gap-1 md:gap-2 text-xs text-muted-foreground">
            <span className="px-2 py-1 rounded bg-muted">
              {acceptTypes.replace(/\./g, "").toUpperCase()}
            </span>
            {maxFiles >= 999 ? (
              <span className="px-2 py-1 rounded bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 font-medium">
                No limit
              </span>
            ) : (
              <span className="px-2 py-1 rounded bg-muted">
                Max {maxFiles} file{maxFiles > 1 ? "s" : ""}
              </span>
            )}
            <span className="px-2 py-1 rounded bg-muted">
              {maxSizeMB}MB max
            </span>
          </div>
        </div>
      </motion.div>

      {/* File List */}
      <AnimatePresence>
        {files.length > 0 && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="space-y-2"
          >
            {files.map((file, index) => {
              const Icon = getFileIcon(file.type);
              return (
                <motion.div
                  key={file.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  transition={{ delay: index * 0.05 }}
                  className={cn(
                    "flex items-center gap-3 p-3 md:p-4 rounded-lg md:rounded-xl border touch-target",
                    file.error
                      ? "bg-destructive/5 border-destructive/30"
                      : "bg-muted/50 border-border"
                  )}
                >
                  <div className="w-10 h-10 md:w-12 md:h-12 rounded-lg bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center flex-shrink-0">
                    <Icon className="w-5 h-5 md:w-6 md:h-6 text-white" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{file.name}</p>
                    {file.error ? (
                      <p className="text-xs text-destructive flex items-center gap-1">
                        <AlertCircle className="w-3 h-3" />
                        {file.error}
                      </p>
                    ) : (
                      <p className="text-xs text-muted-foreground">{formatSize(file.size)}</p>
                    )}
                  </div>
                  {!file.error && (
                    <Button
                      variant="ghost"
                      size="icon"
                      className="flex-shrink-0 w-10 h-10 md:w-12 md:h-12 hover:bg-destructive hover:text-destructive-foreground rounded-lg"
                      onClick={(e) => {
                        e.stopPropagation();
                        removeFile(file.id);
                      }}
                      disabled={isProcessing}
                    >
                      <X className="w-4 h-4 md:w-5 md:h-5" />
                    </Button>
                  )}
                </motion.div>
              );
            })}

            {/* Total size indicator */}
            {files.length > 1 && (
              <div className="text-xs text-muted-foreground text-right px-2">
                Total: {formatSize(totalSize)} ({files.length} files)
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Upload Progress */}
      <AnimatePresence>
        {(isProcessing || uploadStage !== "idle") && showUploadProgress && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="space-y-3 p-4 md:p-5 rounded-xl bg-muted/30 border border-border"
          >
            {/* Stage indicator */}
            <div className="flex items-center justify-between text-sm">
              <div className="flex items-center gap-2">
                <Loader2 className="w-4 h-4 animate-spin text-primary" />
                <span className="font-medium capitalize">
                  {uploadStage === "uploading" && "Uploading files..."}
                  {uploadStage === "processing" && "Processing..."}
                  {uploadStage === "complete" && "Complete!"}
                </span>
              </div>
              <span className="text-muted-foreground">{uploadProgress}%</span>
            </div>

            {/* Progress bar */}
            <Progress
              value={uploadProgress}
              className="h-2 md:h-3"
            />

            {/* Estimated time */}
            {estimatedTimeRemaining && uploadStage !== "complete" && (
              <p className="text-xs text-muted-foreground">
                Estimated time remaining: {formatTime(estimatedTimeRemaining)}
              </p>
            )}

            {/* Cancel button */}
            {uploadStage !== "complete" && (
              <Button
                variant="outline"
                size="sm"
                onClick={handleCancel}
                className="w-full min-h-[44px]"
              >
                Cancel
              </Button>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Processing Status (legacy support) */}
      <AnimatePresence>
        {isProcessing && !showUploadProgress && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="space-y-3"
          >
            <div className="flex items-center justify-between text-sm">
              <span className="font-medium">Processing your files...</span>
              <span className="text-muted-foreground">{progress}%</span>
            </div>
            <Progress value={progress} className="h-2 md:h-3" />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Upload Error */}
      {uploadError && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="p-4 rounded-xl bg-destructive/10 border border-destructive/30 text-destructive"
        >
          <div className="flex items-center gap-2 mb-2">
            <AlertCircle className="w-4 h-4" />
            <span className="font-medium">Upload Failed</span>
          </div>
          <p className="text-sm mb-3">{uploadError}</p>
          <Button
            variant="outline"
            size="sm"
            onClick={handleRetry}
            className="gap-2 min-h-[44px]"
          >
            <Loader2 className="w-4 h-4" />
            Retry
          </Button>
        </motion.div>
      )}
    </div>
  );
}
