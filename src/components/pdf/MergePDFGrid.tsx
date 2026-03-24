"use client";

import { useCallback, useEffect, useMemo, useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
  DragStartEvent,
  DragOverlay,
} from "@dnd-kit/core";
import {
  SortableContext,
  sortableKeyboardCoordinates,
  rectSortingStrategy,
} from "@dnd-kit/sortable";
import {
  Plus,
  Trash2,
  Search,
  Grid3X3,
  Grid2X2,
  Grid,
  Undo2,
  Redo2,
  CheckSquare,
  Square,
  AlertTriangle,
  FileText,
  Loader2,
  Download,
  Combine,
  Upload,
  GripVertical,
  Eye,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { PDFThumbnailCard } from "./PDFThumbnailCard";
import {
  useMergePDFStore,
  selectTotalSize,
  selectTotalPages,
  selectFilteredFiles,
  selectCanUndo,
  selectCanRedo,
  getThumbnailPixels,
} from "@/store/merge-pdf-store";
import { generatePDFThumbnailWithRetry } from "@/lib/pdf-thumbnail";
import { PDFDocument } from "pdf-lib";

// Format file size
const formatSize = (bytes: number): string => {
  if (bytes === 0) return "0 B";
  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + " " + sizes[i];
};

// Size presets
const SIZE_PRESETS = {
  small: { label: "Small", icon: Grid3X3, size: 100 },
  medium: { label: "Medium", icon: Grid2X2, size: 140 },
  large: { label: "Large", icon: Grid, size: 180 },
} as const;

interface MergePDFGridProps {
  onFilesChange?: (files: File[]) => void;
}

export function MergePDFGrid({ onFilesChange }: MergePDFGridProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [isMerging, setIsMerging] = useState(false);
  const [mergeProgress, setMergeProgress] = useState(0);
  const [mergeError, setMergeError] = useState<string | null>(null);
  const [previewFileId, setPreviewFileId] = useState<string | null>(null);
  const [isDragOver, setIsDragOver] = useState(false);

  const {
    files,
    selectedIds,
    thumbnailSize,
    sortOrder,
    searchQuery,
    addFiles,
    removeFile,
    removeFiles,
    clearAllFiles,
    reorderFiles,
    selectFile,
    toggleSelectFile,
    selectAll,
    deselectAll,
    setThumbnailSize,
    setSortOrder,
    setSearchQuery,
    updateFileThumbnail,
    setFileError,
    undo,
    redo,
  } = useMergePDFStore();

  const totalSize = useMergePDFStore(selectTotalSize);
  const totalPages = useMergePDFStore(selectTotalPages);
  const filteredFiles = useMergePDFStore(selectFilteredFiles);
  const canUndo = useMergePDFStore(selectCanUndo);
  const canRedo = useMergePDFStore(selectCanRedo);

  // Get preview file
  const previewFile = useMemo(
    () => files.find((f) => f.id === previewFileId),
    [files, previewFileId]
  );

  // Get thumbnail size based on file count or user preference
  const autoThumbnailSize = useMemo(() => {
    const count = files.length;
    if (count >= 50) return 100;
    if (count >= 20) return 120;
    return getThumbnailPixels(thumbnailSize);
  }, [files.length, thumbnailSize]);

  // Notify parent when files change
  useEffect(() => {
    if (onFilesChange) {
      onFilesChange(files.map((f) => f.file));
    }
  }, [files, onFilesChange]);

  // DnD sensors
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  // Generate thumbnails for new files
  useEffect(() => {
    const generateThumbnails = async () => {
      const filesNeedingThumbnails = files.filter(
        (f) => f.thumbnailLoading && !f.thumbnail && !f.error
      );

      for (let i = 0; i < filesNeedingThumbnails.length; i += 3) {
        const batch = filesNeedingThumbnails.slice(i, i + 3);

        await Promise.all(
          batch.map(async (fileItem) => {
            try {
              console.log(`[MergePDF] Generating thumbnail for ${fileItem.name}`);
              const result = await generatePDFThumbnailWithRetry(fileItem.file, autoThumbnailSize);
              updateFileThumbnail(fileItem.id, result.dataUrl, result.pageCount);
              console.log(`[MergePDF] Thumbnail generated for ${fileItem.name}`);
            } catch (error) {
              console.error(`[MergePDF] Failed to generate thumbnail for ${fileItem.name}:`, error);
              setFileError(fileItem.id, error instanceof Error ? error.message : "Failed to generate thumbnail");
            }
          })
        );
      }
    };

    if (files.length > 0) {
      generateThumbnails();
    }
  }, [files, autoThumbnailSize, updateFileThumbnail, setFileError]);

  // Auto-select first file for preview when files are added
  useEffect(() => {
    if (files.length > 0 && !previewFileId) {
      setPreviewFileId(files[0].id);
    } else if (files.length === 0) {
      setPreviewFileId(null);
    }
  }, [files, previewFileId]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === "a") {
        e.preventDefault();
        if (selectedIds.size === files.length) {
          deselectAll();
        } else {
          selectAll();
        }
      }

      if (e.key === "Delete" || e.key === "Backspace") {
        if (selectedIds.size > 0) {
          removeFiles(Array.from(selectedIds));
        }
      }

      if ((e.ctrlKey || e.metaKey) && e.key === "z" && !e.shiftKey) {
        e.preventDefault();
        undo();
      }

      if ((e.ctrlKey || e.metaKey) && e.key === "z" && e.shiftKey) {
        e.preventDefault();
        redo();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [files.length, selectedIds, selectAll, deselectAll, removeFiles, undo, redo]);

  // Handle file selection
  const handleSelect = useCallback(
    (id: string, multi: boolean) => {
      if (multi) {
        toggleSelectFile(id);
      } else {
        if (selectedIds.has(id) && selectedIds.size === 1) {
          deselectAll();
        } else {
          deselectAll();
          selectFile(id);
        }
      }
      // Set preview to selected file
      setPreviewFileId(id);
    },
    [selectedIds, selectFile, toggleSelectFile, deselectAll]
  );

  // Handle file input
  const handleFilesAdded = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const newFiles = Array.from(e.target.files || []).filter(
        (f) => f.type === "application/pdf" || f.name.toLowerCase().endsWith(".pdf")
      );
      if (newFiles.length > 0) {
        addFiles(newFiles);
      }
      e.target.value = "";
    },
    [addFiles]
  );

  // Handle drag and drop on the drop zone
  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragOver(false);
      const newFiles = Array.from(e.dataTransfer.files).filter(
        (f) => f.type === "application/pdf" || f.name.toLowerCase().endsWith(".pdf")
      );
      if (newFiles.length > 0) {
        addFiles(newFiles);
      }
    },
    [addFiles]
  );

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  }, []);

  // Drag handlers for reordering
  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(event.active.id as string);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveId(null);

    if (over && active.id !== over.id) {
      const oldIndex = files.findIndex((f) => f.id === active.id);
      const newIndex = files.findIndex((f) => f.id === over.id);
      reorderFiles(oldIndex, newIndex);
    }
  };

  // Merge PDFs function
  const handleMergePDFs = useCallback(async () => {
    if (files.length < 2) {
      setMergeError("Please add at least 2 PDF files to merge");
      return;
    }

    setIsMerging(true);
    setMergeProgress(0);
    setMergeError(null);

    try {
      const mergedPdf = await PDFDocument.create();
      const totalFiles = files.length;

      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        
        try {
          const arrayBuffer = await file.file.arrayBuffer();
          const pdfDoc = await PDFDocument.load(arrayBuffer, { 
            ignoreEncryption: true 
          });
          
          const pages = await mergedPdf.copyPages(pdfDoc, pdfDoc.getPageIndices());
          pages.forEach((page) => mergedPdf.addPage(page));
          
          setMergeProgress(Math.round(((i + 1) / totalFiles) * 100));
        } catch (err) {
          console.error(`Failed to process ${file.name}:`, err);
          throw new Error(`Failed to process ${file.name}: ${err instanceof Error ? err.message : 'Unknown error'}`);
        }
      }

      const mergedPdfBytes = await mergedPdf.save();
      const blob = new Blob([mergedPdfBytes], { type: "application/pdf" });
      const url = URL.createObjectURL(blob);
      
      const timestamp = new Date().toISOString().slice(0, 19).replace(/[:-]/g, "");
      const fileName = `merged_${timestamp}.pdf`;
      
      const link = document.createElement("a");
      link.href = url;
      link.download = fileName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      URL.revokeObjectURL(url);
      
      console.log(`[MergePDF] Successfully merged ${files.length} PDFs into ${fileName}`);
    } catch (error) {
      console.error("[MergePDF] Merge failed:", error);
      setMergeError(error instanceof Error ? error.message : "Failed to merge PDFs");
    } finally {
      setIsMerging(false);
      setMergeProgress(0);
    }
  }, [files]);

  // Get active file for drag overlay
  const activeFile = useMemo(
    () => files.find((f) => f.id === activeId),
    [files, activeId]
  );

  // Check if total size exceeds 500MB
  const sizeWarning = totalSize > 500 * 1024 * 1024;

  return (
    <div className="space-y-4">
      {/* Stats Bar */}
      {files.length > 0 && (
        <div className="flex items-center gap-4 text-sm text-muted-foreground px-2">
          <span className="flex items-center gap-1.5">
            <FileText className="w-4 h-4" />
            <strong>{files.length}</strong> file{files.length !== 1 ? "s" : ""}
          </span>
          <span>
            <strong>{totalPages}</strong> page{totalPages !== 1 ? "s" : ""} total
          </span>
          <span>
            <strong>{formatSize(totalSize)}</strong> total
          </span>
          <div className="flex-1" />
          {/* Undo/Redo */}
          <Button
            variant="ghost"
            size="icon"
            onClick={undo}
            disabled={!canUndo || isMerging}
            title="Undo (Ctrl+Z)"
            className="h-8 w-8"
          >
            <Undo2 className="w-4 h-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={redo}
            disabled={!canRedo || isMerging}
            title="Redo (Ctrl+Shift+Z)"
            className="h-8 w-8"
          >
            <Redo2 className="w-4 h-4" />
          </Button>
        </div>
      )}

      {/* Main Two-Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* LEFT: Drag & Drop Area */}
        <div className="space-y-3">
          {/* Toolbar - Compact */}
          <div className="flex flex-wrap items-center gap-2">
            <Button
              onClick={() => fileInputRef.current?.click()}
              className="btn-gradient text-white gap-2"
              disabled={isMerging}
            >
              <Plus className="w-4 h-4" />
              Add PDFs
            </Button>
            <input
              ref={fileInputRef}
              type="file"
              accept=".pdf,application/pdf"
              multiple
              className="hidden"
              onChange={handleFilesAdded}
            />

            {files.length > 0 && (
              <>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={clearAllFiles}
                  className="gap-2 text-red-600 hover:text-red-700 hover:bg-red-50"
                  disabled={isMerging}
                >
                  <Trash2 className="w-4 h-4" />
                  Clear All
                </Button>

                <Button
                  variant="outline"
                  size="sm"
                  onClick={selectedIds.size === files.length ? deselectAll : selectAll}
                  className="gap-2"
                  disabled={isMerging}
                >
                  {selectedIds.size === files.length ? (
                    <>
                      <CheckSquare className="w-4 h-4" />
                      Deselect
                    </>
                  ) : (
                    <>
                      <Square className="w-4 h-4" />
                      Select All
                    </>
                  )}
                </Button>

                {selectedIds.size > 0 && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => removeFiles(Array.from(selectedIds))}
                    className="gap-2 text-red-600"
                    disabled={isMerging}
                  >
                    <Trash2 className="w-4 h-4" />
                    Remove ({selectedIds.size})
                  </Button>
                )}
              </>
            )}

            <div className="flex-1" />

            {/* View Size Toggle - Compact */}
            {files.length > 0 && (
              <div className="flex items-center gap-1 p-1 rounded-lg bg-muted/50">
                {Object.entries(SIZE_PRESETS).map(([key, preset]) => (
                  <Button
                    key={key}
                    variant={thumbnailSize === key ? "default" : "ghost"}
                    size="icon"
                    className="h-7 w-7"
                    onClick={() => setThumbnailSize(key as "small" | "medium" | "large")}
                    title={preset.label}
                    disabled={isMerging}
                  >
                    <preset.icon className="w-3.5 h-3.5" />
                  </Button>
                ))}
              </div>
            )}
          </div>

          {/* Large Drop Zone / File List */}
          <div
            onDrop={handleDrop}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            className={cn(
              "relative min-h-[400px] lg:min-h-[500px] rounded-2xl border-2 border-dashed transition-all duration-300",
              isDragOver 
                ? "border-violet-500 bg-violet-500/10 scale-[1.02]" 
                : files.length === 0 
                  ? "border-violet-300 bg-violet-500/5 hover:border-violet-400 hover:bg-violet-500/10"
                  : "border-transparent bg-muted/30",
              "overflow-hidden"
            )}
          >
            {/* Empty State */}
            {files.length === 0 && (
              <div className="absolute inset-0 flex flex-col items-center justify-center p-8 text-center">
                <motion.div
                  initial={{ scale: 0.9, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  className="w-32 h-32 mb-6 rounded-3xl bg-gradient-to-br from-violet-500/20 to-purple-500/20 flex items-center justify-center"
                >
                  <Upload className="w-16 h-16 text-violet-500" />
                </motion.div>
                <motion.h3
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 }}
                  className="text-2xl font-semibold mb-3"
                >
                  Drop PDFs Here
                </motion.h3>
                <motion.p
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 }}
                  className="text-muted-foreground mb-6 max-w-md"
                >
                  Drag and drop your PDF files here, or click the button below to browse.
                  Add multiple files to merge them together.
                </motion.p>
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 }}
                >
                  <Button
                    onClick={() => fileInputRef.current?.click()}
                    className="btn-gradient text-white gap-2 text-lg px-8 py-6"
                  >
                    <Plus className="w-5 h-5" />
                    Add PDFs
                  </Button>
                </motion.div>
              </div>
            )}

            {/* File Grid */}
            {files.length > 0 && (
              <DndContext
                sensors={sensors}
                collisionDetection={closestCenter}
                onDragStart={handleDragStart}
                onDragEnd={handleDragEnd}
              >
                <SortableContext
                  items={filteredFiles.map((f) => f.id)}
                  strategy={rectSortingStrategy}
                >
                  <div className="p-4 h-full overflow-y-auto max-h-[600px]">
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                      <AnimatePresence>
                        {filteredFiles.map((file, index) => (
                          <motion.div
                            key={file.id}
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.9 }}
                            className={cn(
                              "relative group cursor-pointer rounded-xl overflow-hidden border-2 transition-all",
                              previewFileId === file.id
                                ? "border-violet-500 ring-2 ring-violet-500/30"
                                : "border-transparent hover:border-violet-300"
                            )}
                            onClick={() => setPreviewFileId(file.id)}
                          >
                            <PDFThumbnailCard
                              file={file}
                              index={index}
                              isSelected={selectedIds.has(file.id)}
                              thumbnailSize={autoThumbnailSize}
                              onSelect={handleSelect}
                              onRemove={removeFile}
                            />
                            {/* Order Badge */}
                            <div className="absolute top-2 left-2 w-7 h-7 rounded-full bg-violet-600 text-white flex items-center justify-center text-sm font-bold shadow-lg">
                              {index + 1}
                            </div>
                            {/* Preview indicator */}
                            {previewFileId === file.id && (
                              <div className="absolute top-2 right-2 w-6 h-6 rounded-full bg-green-500 text-white flex items-center justify-center">
                                <Eye className="w-3.5 h-3.5" />
                              </div>
                            )}
                            {/* Drag handle */}
                            <div className="absolute bottom-2 right-2 w-6 h-6 rounded bg-black/50 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                              <GripVertical className="w-3.5 h-3.5" />
                            </div>
                          </motion.div>
                        ))}
                      </AnimatePresence>
                    </div>
                  </div>
                </SortableContext>

                {/* Drag Overlay */}
                <DragOverlay>
                  {activeFile && (
                    <div className="opacity-80 pointer-events-none">
                      <PDFThumbnailCard
                        file={activeFile}
                        index={files.findIndex((f) => f.id === activeFile.id)}
                        isSelected={selectedIds.has(activeFile.id)}
                        thumbnailSize={autoThumbnailSize}
                        onSelect={() => {}}
                        onRemove={() => {}}
                      />
                    </div>
                  )}
                </DragOverlay>
              </DndContext>
            )}
          </div>

          {/* Add more files button when files exist */}
          {files.length > 0 && (
            <Button
              variant="outline"
              onClick={() => fileInputRef.current?.click()}
              className="w-full border-dashed border-2 h-12 gap-2"
              disabled={isMerging}
            >
              <Plus className="w-4 h-4" />
              Add More PDFs
            </Button>
          )}
        </div>

        {/* RIGHT: Preview Panel */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold text-lg flex items-center gap-2">
              <Eye className="w-5 h-5" />
              Preview
            </h3>
            {previewFile && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setPreviewFileId(null)}
                className="text-muted-foreground"
              >
                <X className="w-4 h-4 mr-1" />
                Clear
              </Button>
            )}
          </div>

          {/* Preview Area */}
          <div className="rounded-2xl border bg-muted/30 min-h-[400px] lg:min-h-[500px] overflow-hidden">
            {previewFile ? (
              <div className="h-full flex flex-col">
                {/* File Info Header */}
                <div className="p-4 border-b bg-gradient-to-r from-violet-500/10 to-purple-500/10">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-violet-600 text-white flex items-center justify-center text-sm font-bold">
                      {files.findIndex((f) => f.id === previewFile.id) + 1}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium truncate">{previewFile.name}</p>
                      <p className="text-sm text-muted-foreground">
                        {previewFile.pageCount || "?"} pages • {formatSize(previewFile.size)}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Preview Image */}
                <div className="flex-1 overflow-y-auto p-4 flex items-start justify-center bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-800 dark:to-gray-900">
                  {previewFile.thumbnail ? (
                    <motion.img
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      src={previewFile.thumbnail}
                      alt={previewFile.name}
                      className="max-w-full h-auto rounded-lg shadow-2xl"
                      style={{ maxHeight: "calc(100% - 2rem)" }}
                    />
                  ) : previewFile.thumbnailLoading ? (
                    <div className="flex flex-col items-center gap-3 py-20">
                      <Loader2 className="w-10 h-10 animate-spin text-violet-500" />
                      <p className="text-muted-foreground">Loading preview...</p>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center gap-3 py-20 text-muted-foreground">
                      <FileText className="w-16 h-16" />
                      <p>Preview not available</p>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="h-full flex flex-col items-center justify-center p-8 text-center text-muted-foreground">
                <Eye className="w-16 h-16 mb-4 opacity-50" />
                <p className="text-lg font-medium mb-2">No file selected</p>
                <p className="text-sm">Click on a file to preview it here</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Size Warning */}
      {sizeWarning && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center gap-2 p-3 rounded-lg bg-amber-500/10 border border-amber-500/30 text-amber-700 dark:text-amber-400"
        >
          <AlertTriangle className="w-5 h-5" />
          <span className="text-sm font-medium">
            Total file size ({formatSize(totalSize)}) exceeds 500MB. Processing may take longer.
          </span>
        </motion.div>
      )}

      {/* Merge Error */}
      {mergeError && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center gap-2 p-3 rounded-lg bg-red-500/10 border border-red-500/30 text-red-700 dark:text-red-400"
        >
          <AlertTriangle className="w-5 h-5" />
          <span className="text-sm font-medium">{mergeError}</span>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setMergeError(null)}
            className="ml-auto"
          >
            Dismiss
          </Button>
        </motion.div>
      )}

      {/* Merge Button - Shows when files are added */}
      {files.length >= 2 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col items-center gap-4 pt-6"
        >
          {/* Progress Bar during merge */}
          {isMerging && (
            <div className="w-full max-w-md">
              <div className="flex items-center justify-between text-sm mb-2">
                <span className="font-medium text-violet-600">Merging PDFs...</span>
                <span className="text-muted-foreground">{mergeProgress}%</span>
              </div>
              <div className="h-2 bg-muted rounded-full overflow-hidden">
                <motion.div
                  className="h-full bg-gradient-to-r from-violet-500 to-purple-500"
                  initial={{ width: 0 }}
                  animate={{ width: `${mergeProgress}%` }}
                />
              </div>
            </div>
          )}

          <Button
            size="lg"
            onClick={handleMergePDFs}
            disabled={isMerging || files.length < 2}
            className="btn-gradient text-white rounded-full px-12 py-6 text-lg font-semibold shadow-lg shadow-violet-500/25 gap-3"
          >
            {isMerging ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                Merging {files.length} PDFs...
              </>
            ) : (
              <>
                <Combine className="w-5 h-5" />
                Merge {files.length} PDFs
              </>
            )}
          </Button>
          
          <p className="text-xs text-muted-foreground text-center">
            Files will be merged in the order shown. Drag to reorder • Click to preview
          </p>
        </motion.div>
      )}

      {/* Hint when only 1 file */}
      {files.length === 1 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col items-center gap-2 pt-6"
        >
          <p className="text-sm text-muted-foreground">
            Add at least 1 more PDF to merge
          </p>
        </motion.div>
      )}

      {/* Keyboard Shortcuts Help */}
      {files.length > 0 && (
        <div className="flex flex-wrap gap-4 text-xs text-muted-foreground pt-4">
          <span>
            <kbd className="px-1.5 py-0.5 rounded bg-muted font-mono">Ctrl+A</kbd> Select all
          </span>
          <span>
            <kbd className="px-1.5 py-0.5 rounded bg-muted font-mono">Del</kbd> Remove selected
          </span>
          <span>
            <kbd className="px-1.5 py-0.5 rounded bg-muted font-mono">Ctrl+Z</kbd> Undo
          </span>
          <span>
            <kbd className="px-1.5 py-0.5 rounded bg-muted font-mono">Drag</kbd> Reorder files
          </span>
          <span>
            <kbd className="px-1.5 py-0.5 rounded bg-muted font-mono">Click</kbd> Preview file
          </span>
        </div>
      )}
    </div>
  );
}
