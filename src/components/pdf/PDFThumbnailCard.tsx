"use client";

import { memo, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { FileText, X, GripVertical, Loader2, CheckCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import type { PDFFileItem } from "@/store/merge-pdf-store";

interface PDFThumbnailCardProps {
  file: PDFFileItem;
  index: number;
  isSelected: boolean;
  thumbnailSize: number;
  onSelect: (id: string, multi: boolean) => void;
  onRemove: (id: string) => void;
}

// Format file size
const formatSize = (bytes: number): string => {
  if (bytes === 0) return "0 B";
  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + " " + sizes[i];
};

// Truncate filename
const truncateName = (name: string, maxLength: number = 20): string => {
  if (name.length <= maxLength) return name;
  const ext = name.slice(name.lastIndexOf("."));
  const baseName = name.slice(0, name.lastIndexOf("."));
  const truncated = baseName.slice(0, maxLength - ext.length - 3);
  return truncated + "..." + ext;
};

export const PDFThumbnailCard = memo(function PDFThumbnailCard({
  file,
  index,
  isSelected,
  thumbnailSize,
  onSelect,
  onRemove,
}: PDFThumbnailCardProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: file.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 50 : 1,
  };

  const handleClick = useCallback(
    (e: React.MouseEvent) => {
      // Don't select if clicking remove button
      if ((e.target as HTMLElement).closest('[data-remove-btn]')) return;
      e.stopPropagation();
      onSelect(file.id, e.ctrlKey || e.metaKey || e.shiftKey);
    },
    [file.id, onSelect]
  );

  const handleRemove = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation();
      onRemove(file.id);
    },
    [file.id, onRemove]
  );

  return (
    <AnimatePresence>
      <motion.div
        ref={setNodeRef}
        style={style}
        initial={{ opacity: 0, scale: 0.8, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.8, y: -20 }}
        whileHover={{ scale: 1.02 }}
        className={cn(
          "relative group select-none",
          isDragging && "z-50"
        )}
      >
        {/* Main Card - ENTIRE CARD IS DRAGGABLE */}
        <div
          {...attributes}
          {...listeners}
          onClick={handleClick}
          className={cn(
            "relative rounded-xl overflow-hidden transition-all duration-200 cursor-grab active:cursor-grabbing",
            "bg-gradient-to-br from-white/80 to-white/40 dark:from-slate-800/80 dark:to-slate-900/40",
            "backdrop-blur-sm border-2",
            isSelected
              ? "border-violet-500 shadow-lg shadow-violet-500/20 ring-2 ring-violet-500/30"
              : "border-slate-200/50 dark:border-slate-700/50 hover:border-violet-300 dark:hover:border-violet-600",
            isDragging && "shadow-2xl shadow-violet-500/30 border-violet-400"
          )}
          style={{ width: thumbnailSize }}
        >
          {/* Large Drag Indicator Strip on Left */}
          <div className="absolute left-0 top-0 bottom-0 w-2 bg-gradient-to-b from-violet-400 to-purple-500 opacity-60 group-hover:opacity-100 transition-opacity" />

          {/* Thumbnail Container */}
          <div
            className="relative bg-slate-100 dark:bg-slate-800 overflow-hidden ml-2"
            style={{
              height: thumbnailSize * 1.4,
              width: thumbnailSize - 8,
            }}
          >
            {/* Order Number Badge */}
            <div className="absolute top-2 left-2 z-20">
              <div
                className={cn(
                  "w-8 h-8 rounded-lg flex items-center justify-center",
                  "bg-gradient-to-br from-violet-500 to-purple-600 text-white",
                  "text-sm font-bold shadow-lg shadow-violet-500/30"
                )}
              >
                {index + 1}
              </div>
            </div>

            {/* Delete Button */}
            <button
              data-remove-btn
              onClick={handleRemove}
              className={cn(
                "absolute top-2 right-2 z-20 p-2 rounded-lg",
                "bg-red-500/90 hover:bg-red-600 text-white",
                "opacity-0 group-hover:opacity-100 transition-all duration-200",
                "hover:scale-110 shadow-lg"
              )}
            >
              <X className="w-4 h-4" />
            </button>

            {/* Drag Handle Indicator - Now at top, always visible */}
            <div className="absolute bottom-2 right-2 z-20 flex items-center gap-1 px-2 py-1 rounded-lg bg-slate-900/60 text-white text-[10px] font-medium">
              <GripVertical className="w-3.5 h-3.5" />
              <span>Drag</span>
            </div>

            {/* Thumbnail Image or Placeholder */}
            {file.thumbnailLoading ? (
              <div className="absolute inset-0 flex items-center justify-center bg-slate-50 dark:bg-slate-900">
                <Loader2 className="w-8 h-8 text-violet-500 animate-spin" />
              </div>
            ) : file.error ? (
              <div className="absolute inset-0 flex items-center justify-center bg-slate-50 dark:bg-slate-900">
                <div className="w-16 h-20 rounded-lg bg-gradient-to-br from-red-400 to-rose-500 flex items-center justify-center shadow-lg">
                  <FileText className="w-8 h-8 text-white" />
                </div>
              </div>
            ) : file.thumbnail ? (
              <img
                src={file.thumbnail}
                alt={file.name}
                className="w-full h-full object-contain"
                draggable={false}
              />
            ) : (
              <div className="absolute inset-0 flex items-center justify-center bg-slate-50 dark:bg-slate-900">
                <div className="w-16 h-20 rounded-lg bg-gradient-to-br from-red-400 to-rose-500 flex items-center justify-center shadow-lg">
                  <FileText className="w-8 h-8 text-white" />
                </div>
              </div>
            )}

            {/* Selection Checkmark */}
            {isSelected && (
              <div className="absolute top-2 right-12 z-20">
                <div className="w-6 h-6 rounded-full bg-violet-500 flex items-center justify-center shadow-lg">
                  <CheckCircle className="w-4 h-4 text-white" />
                </div>
              </div>
            )}

            {/* Gradient Overlay on Hover */}
            <div
              className={cn(
                "absolute inset-0 bg-gradient-to-t from-violet-500/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-200"
              )}
            />
          </div>

          {/* File Info */}
          <div className="p-2 ml-2">
            <p
              className="text-xs font-medium text-slate-700 dark:text-slate-200 truncate"
              title={file.name}
            >
              {truncateName(file.name, thumbnailSize > 150 ? 25 : 15)}
            </p>
            <div className="flex items-center justify-between mt-1">
              <span className="text-[10px] text-slate-500 dark:text-slate-400">
                {formatSize(file.size)}
              </span>
              <span className="text-[10px] text-slate-500 dark:text-slate-400">
                {file.pageCount} {file.pageCount === 1 ? "page" : "pages"}
              </span>
            </div>
          </div>
        </div>

        {/* Dragging Shadow Effect */}
        {isDragging && (
          <div
            className="absolute inset-0 rounded-xl bg-violet-500/20 -z-10 blur-xl"
            style={{ transform: "scale(1.1)" }}
          />
        )}
      </motion.div>
    </AnimatePresence>
  );
});
