import { create } from "zustand";

export interface PDFFileItem {
  id: string;
  file: File;
  name: string;
  size: number;
  pageCount: number;
  thumbnail: string | null;
  thumbnailLoading: boolean;
  error: string | null;
  createdAt: Date;
}

export type SortOrder = "upload" | "name-asc" | "name-desc" | "size-asc" | "size-desc";

export interface MergePDFState {
  files: PDFFileItem[];
  selectedIds: Set<string>;
  thumbnailSize: "small" | "medium" | "large";
  sortOrder: SortOrder;
  searchQuery: string;
  history: PDFFileItem[][];
  historyIndex: number;

  // Actions
  addFiles: (files: File[]) => void;
  removeFile: (id: string) => void;
  removeFiles: (ids: string[]) => void;
  clearAllFiles: () => void;
  reorderFiles: (fromIndex: number, toIndex: number) => void;

  selectFile: (id: string) => void;
  toggleSelectFile: (id: string) => void;
  selectAll: () => void;
  deselectAll: () => void;

  setThumbnailSize: (size: "small" | "medium" | "large") => void;
  setSortOrder: (order: SortOrder) => void;
  setSearchQuery: (query: string) => void;

  updateFileThumbnail: (id: string, thumbnail: string, pageCount: number) => void;
  setFileThumbnailLoading: (id: string, loading: boolean) => void;
  setFileError: (id: string, error: string | null) => void;

  undo: () => void;
  redo: () => void;
}

// Generate unique ID
const generateId = () => `pdf-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

// Get thumbnail size in pixels
export const getThumbnailPixels = (size: "small" | "medium" | "large"): number => {
  switch (size) {
    case "small": return 120;
    case "medium": return 180;
    case "large": return 240;
    default: return 180;
  }
};

// Sort files based on order
const sortFiles = (files: PDFFileItem[], order: SortOrder): PDFFileItem[] => {
  const sorted = [...files];
  switch (order) {
    case "name-asc":
      return sorted.sort((a, b) => a.name.localeCompare(b.name));
    case "name-desc":
      return sorted.sort((a, b) => b.name.localeCompare(a.name));
    case "size-asc":
      return sorted.sort((a, b) => a.size - b.size);
    case "size-desc":
      return sorted.sort((a, b) => b.size - a.size);
    default:
      return files; // Keep upload order
  }
};

export const useMergePDFStore = create<MergePDFState>((set, get) => ({
  files: [],
  selectedIds: new Set<string>(),
  thumbnailSize: "medium",
  sortOrder: "upload",
  searchQuery: "",
  history: [[]],
  historyIndex: 0,

  addFiles: (newFiles: File[]) => {
    const items: PDFFileItem[] = newFiles.map((file) => ({
      id: generateId(),
      file,
      name: file.name,
      size: file.size,
      pageCount: 1,
      thumbnail: null,
      thumbnailLoading: true,
      error: null,
      createdAt: new Date(),
    }));

    set((state) => {
      const newHistory = state.history.slice(0, state.historyIndex + 1);
      newHistory.push([...state.files, ...items]);

      return {
        files: [...state.files, ...items],
        history: newHistory,
        historyIndex: newHistory.length - 1,
      };
    });
  },

  removeFile: (id: string) => {
    set((state) => {
      const newFiles = state.files.filter((f) => f.id !== id);
      const newSelectedIds = new Set(state.selectedIds);
      newSelectedIds.delete(id);

      const newHistory = state.history.slice(0, state.historyIndex + 1);
      newHistory.push(newFiles);

      return {
        files: newFiles,
        selectedIds: newSelectedIds,
        history: newHistory,
        historyIndex: newHistory.length - 1,
      };
    });
  },

  removeFiles: (ids: string[]) => {
    set((state) => {
      const idsSet = new Set(ids);
      const newFiles = state.files.filter((f) => !idsSet.has(f.id));
      const newSelectedIds = new Set([...state.selectedIds].filter((id) => !idsSet.has(id)));

      const newHistory = state.history.slice(0, state.historyIndex + 1);
      newHistory.push(newFiles);

      return {
        files: newFiles,
        selectedIds: newSelectedIds,
        history: newHistory,
        historyIndex: newHistory.length - 1,
      };
    });
  },

  clearAllFiles: () => {
    set((state) => {
      const newHistory = state.history.slice(0, state.historyIndex + 1);
      newHistory.push([]);

      return {
        files: [],
        selectedIds: new Set(),
        history: newHistory,
        historyIndex: newHistory.length - 1,
      };
    });
  },

  reorderFiles: (fromIndex: number, toIndex: number) => {
    set((state) => {
      const newFiles = [...state.files];
      const [removed] = newFiles.splice(fromIndex, 1);
      newFiles.splice(toIndex, 0, removed);

      const newHistory = state.history.slice(0, state.historyIndex + 1);
      newHistory.push(newFiles);

      return {
        files: newFiles,
        history: newHistory,
        historyIndex: newHistory.length - 1,
      };
    });
  },

  selectFile: (id: string) => {
    set((state) => {
      const newSelectedIds = new Set(state.selectedIds);
      newSelectedIds.add(id);
      return { selectedIds: newSelectedIds };
    });
  },

  toggleSelectFile: (id: string) => {
    set((state) => {
      const newSelectedIds = new Set(state.selectedIds);
      if (newSelectedIds.has(id)) {
        newSelectedIds.delete(id);
      } else {
        newSelectedIds.add(id);
      }
      return { selectedIds: newSelectedIds };
    });
  },

  selectAll: () => {
    set((state) => ({
      selectedIds: new Set(state.files.map((f) => f.id)),
    }));
  },

  deselectAll: () => {
    set({ selectedIds: new Set() });
  },

  setThumbnailSize: (size: "small" | "medium" | "large") => {
    set({ thumbnailSize: size });
  },

  setSortOrder: (order: SortOrder) => {
    set((state) => ({
      sortOrder: order,
      files: sortFiles(state.files, order),
    }));
  },

  setSearchQuery: (query: string) => {
    set({ searchQuery: query });
  },

  updateFileThumbnail: (id: string, thumbnail: string, pageCount: number) => {
    set((state) => ({
      files: state.files.map((f) =>
        f.id === id ? { ...f, thumbnail, pageCount, thumbnailLoading: false } : f
      ),
    }));
  },

  setFileThumbnailLoading: (id: string, loading: boolean) => {
    set((state) => ({
      files: state.files.map((f) =>
        f.id === id ? { ...f, thumbnailLoading: loading } : f
      ),
    }));
  },

  setFileError: (id: string, error: string | null) => {
    set((state) => ({
      files: state.files.map((f) =>
        f.id === id ? { ...f, error, thumbnailLoading: false } : f
      ),
    }));
  },

  undo: () => {
    const state = get();
    if (state.historyIndex > 0) {
      const newIndex = state.historyIndex - 1;
      set({
        files: state.history[newIndex],
        historyIndex: newIndex,
      });
    }
  },

  redo: () => {
    const state = get();
    if (state.historyIndex < state.history.length - 1) {
      const newIndex = state.historyIndex + 1;
      set({
        files: state.history[newIndex],
        historyIndex: newIndex,
      });
    }
  },
}));

// Selectors
export const selectTotalSize = (state: MergePDFState) =>
  state.files.reduce((sum, f) => sum + f.size, 0);

export const selectTotalPages = (state: MergePDFState) =>
  state.files.reduce((sum, f) => sum + f.pageCount, 0);

export const selectFilteredFiles = (state: MergePDFState) => {
  if (!state.searchQuery) return state.files;
  const query = state.searchQuery.toLowerCase();
  return state.files.filter((f) => f.name.toLowerCase().includes(query));
};

export const selectCanUndo = (state: MergePDFState) => state.historyIndex > 0;
export const selectCanRedo = (state: MergePDFState) => state.historyIndex < state.history.length - 1;
