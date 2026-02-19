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
          "relative group cursor-pointer select-none",
          isDragging && "z-50"
        )}
      >
        {/* Main Card */}
        <div
          onClick={handleClick}
          className={cn(
            "relative rounded-xl overflow-hidden transition-all duration-200",
            "bg-gradient-to-br from-white/80 to-white/40 dark:from-slate-800/80 dark:to-slate-900/40",
            "backdrop-blur-sm border-2",
            isSelected
              ? "border-violet-500 shadow-lg shadow-violet-500/20 ring-2 ring-violet-500/30"
              : "border-slate-200/50 dark:border-slate-700/50 hover:border-violet-300 dark:hover:border-violet-600",
            isDragging && "shadow-2xl shadow-violet-500/30 border-violet-400"
          )}
          style={{ width: thumbnailSize }}
        >
          {/* Thumbnail Container */}
          <div
            className="relative bg-slate-100 dark:bg-slate-800 overflow-hidden"
            style={{
              height: thumbnailSize * 1.4,
              width: thumbnailSize,
            }}
          >
            {/* Order Number Badge */}
            <div className="absolute top-2 left-2 z-20">
              <div
                className={cn(
                  "w-7 h-7 rounded-lg flex items-center justify-center",
                  "bg-gradient-to-br from-violet-500 to-purple-600 text-white",
                  "text-sm font-bold shadow-lg shadow-violet-500/30"
                )}
              >
                {index + 1}
              </div>
            </div>

            {/* Delete Button */}
            <button
              onClick={handleRemove}
              className={cn(
                "absolute top-2 right-2 z-20 p-1.5 rounded-lg",
                "bg-red-500/90 hover:bg-red-600 text-white",
                "opacity-0 group-hover:opacity-100 transition-all duration-200",
                "hover:scale-110 shadow-lg"
              )}
            >
              <X className="w-3.5 h-3.5" />
            </button>

            {/* Drag Handle */}
            <div
              {...attributes}
              {...listeners}
              className={cn(
                "absolute bottom-2 right-2 z-20 p-1.5 rounded-lg cursor-grab active:cursor-grabbing",
                "bg-slate-900/50 hover:bg-slate-900/70 text-white",
                "opacity-0 group-hover:opacity-100 transition-all duration-200"
              )}
            >
              <GripVertical className="w-4 h-4" />
            </div>

            {/* Thumbnail Image or Placeholder */}
            {file.thumbnailLoading ? (
              <div className="absolute inset-0 flex items-center justify-center bg-slate-50 dark:bg-slate-900">
                <Loader2 className="w-8 h-8 text-violet-500 animate-spin" />
              </div>
            ) : file.error ? (
              // Show PDF icon on error instead of error text
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
          <div className="p-2">
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
            className="absolute inset-0 rounded-xl bg-violet-500/10 -z-10 blur-xl"
            style={{ transform: "scale(1.1)" }}
          />
        )}
      </motion.div>
    </AnimatePresence>
  );
});
