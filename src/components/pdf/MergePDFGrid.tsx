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
  small: { label: "Small", icon: Grid3X3, size: 120 },
  medium: { label: "Medium", icon: Grid2X2, size: 180 },
  large: { label: "Large", icon: Grid, size: 240 },
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

  // Get thumbnail size based on file count or user preference
  const autoThumbnailSize = useMemo(() => {
    const count = files.length;
    if (count >= 50) return 120;
    if (count >= 20) return 150;
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

      // Process thumbnails in parallel (max 3 at a time)
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

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ctrl/Cmd + A - Select all
      if ((e.ctrlKey || e.metaKey) && e.key === "a") {
        e.preventDefault();
        if (selectedIds.size === files.length) {
          deselectAll();
        } else {
          selectAll();
        }
      }

      // Delete / Backspace - Remove selected
      if (e.key === "Delete" || e.key === "Backspace") {
        if (selectedIds.size > 0) {
          removeFiles(Array.from(selectedIds));
        }
      }

      // Ctrl/Cmd + Z - Undo
      if ((e.ctrlKey || e.metaKey) && e.key === "z" && !e.shiftKey) {
        e.preventDefault();
        undo();
      }

      // Ctrl/Cmd + Shift + Z - Redo
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

  // Drag handlers
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
      // Create a new PDF document
      const mergedPdf = await PDFDocument.create();
      const totalFiles = files.length;

      // Process each PDF file
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        
        try {
          // Read the file as ArrayBuffer
          const arrayBuffer = await file.file.arrayBuffer();
          
          // Load the PDF
          const pdfDoc = await PDFDocument.load(arrayBuffer, { 
            ignoreEncryption: true 
          });
          
          // Copy all pages to the merged document
          const pages = await mergedPdf.copyPages(pdfDoc, pdfDoc.getPageIndices());
          pages.forEach((page) => mergedPdf.addPage(page));
          
          // Update progress
          setMergeProgress(Math.round(((i + 1) / totalFiles) * 100));
        } catch (err) {
          console.error(`Failed to process ${file.name}:`, err);
          throw new Error(`Failed to process ${file.name}: ${err instanceof Error ? err.message : 'Unknown error'}`);
        }
      }

      // Save the merged PDF
      const mergedPdfBytes = await mergedPdf.save();
      
      // Create download link
      const blob = new Blob([mergedPdfBytes], { type: "application/pdf" });
      const url = URL.createObjectURL(blob);
      
      // Generate filename with timestamp
      const timestamp = new Date().toISOString().slice(0, 19).replace(/[:-]/g, "");
      const fileName = `merged_${timestamp}.pdf`;
      
      // Trigger download
      const link = document.createElement("a");
      link.href = url;
      link.download = fileName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      // Cleanup
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

  // Calculate grid columns based on thumbnail size
  const gridCols = useMemo(() => {
    if (autoThumbnailSize <= 120) return "grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 xl:grid-cols-8";
    if (autoThumbnailSize <= 180) return "grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6";
    return "grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5";
  }, [autoThumbnailSize]);

  // Check if total size exceeds 500MB
  const sizeWarning = totalSize > 500 * 1024 * 1024;

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-2 p-4 rounded-xl bg-gradient-to-r from-violet-500/10 to-purple-500/10 border border-violet-500/20">
        {/* Add Files Button */}
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

        {/* Clear All */}
        {files.length > 0 && (
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
        )}

        {/* Select All / Deselect */}
        {files.length > 0 && (
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
                Deselect All
              </>
            ) : (
              <>
                <Square className="w-4 h-4" />
                Select All
              </>
            )}
          </Button>
        )}

        {/* Remove Selected */}
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

        <div className="flex-1" />

        {/* Undo/Redo */}
        <Button
          variant="ghost"
          size="icon"
          onClick={undo}
          disabled={!canUndo || isMerging}
          title="Undo (Ctrl+Z)"
        >
          <Undo2 className="w-4 h-4" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          onClick={redo}
          disabled={!canRedo || isMerging}
          title="Redo (Ctrl+Shift+Z)"
        >
          <Redo2 className="w-4 h-4" />
        </Button>

        {/* View Size Toggle */}
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

        {/* Sort */}
        <select
          value={sortOrder}
          onChange={(e) => setSortOrder(e.target.value as typeof sortOrder)}
          className="px-3 py-1.5 rounded-lg border bg-background text-sm"
          disabled={isMerging}
        >
          <option value="upload">Upload Order</option>
          <option value="name-asc">Name (A-Z)</option>
          <option value="name-desc">Name (Z-A)</option>
          <option value="size-asc">Size (Small-Large)</option>
          <option value="size-desc">Size (Large-Small)</option>
        </select>

        {/* Search */}
        {files.length > 5 && (
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              type="text"
              placeholder="Search files..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 w-40 h-9"
              disabled={isMerging}
            />
          </div>
        )}
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

      {/* Stats Bar */}
      {files.length > 0 && (
        <div className="flex items-center gap-4 text-sm text-muted-foreground">
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
        </div>
      )}

      {/* Empty State */}
      {files.length === 0 && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="flex flex-col items-center justify-center py-16 text-center"
        >
          <div className="w-24 h-24 mb-6 rounded-2xl bg-gradient-to-br from-violet-500/20 to-purple-500/20 flex items-center justify-center">
            <FileText className="w-12 h-12 text-violet-500" />
          </div>
          <h3 className="text-xl font-semibold mb-2">No PDFs added yet</h3>
          <p className="text-muted-foreground mb-6 max-w-md">
            Click "Add PDFs" or drag and drop files here to start merging.
            Supports unlimited PDF files!
          </p>
          <Button
            onClick={() => fileInputRef.current?.click()}
            className="btn-gradient text-white gap-2"
          >
            <Plus className="w-4 h-4" />
            Add PDFs
          </Button>
        </motion.div>
      )}

      {/* PDF Grid */}
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
            <motion.div
              layout
              className={cn("grid gap-3", gridCols)}
            >
              <AnimatePresence>
                {filteredFiles.map((file, index) => (
                  <PDFThumbnailCard
                    key={file.id}
                    file={file}
                    index={index}
                    isSelected={selectedIds.has(file.id)}
                    thumbnailSize={autoThumbnailSize}
                    onSelect={handleSelect}
                    onRemove={removeFile}
                  />
                ))}
              </AnimatePresence>
            </motion.div>
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
            Files will be merged in the order shown above. Drag to reorder.
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
        </div>
      )}
    </div>
  );
}
