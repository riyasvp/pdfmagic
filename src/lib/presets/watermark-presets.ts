// Watermark presets
export interface WatermarkPreset {
  id: string;
  name: string;
  text: string;
  fontSize: number;
  fontFamily: string;
  color: string;
  opacity: number;
  position: "center" | "top-left" | "top-right" | "bottom-left" | "bottom-right" | "diagonal";
  rotation: number;
}

export const defaultWatermarkPresets: WatermarkPreset[] = [
  {
    id: "confidential",
    name: "Confidential",
    text: "CONFIDENTIAL",
    fontSize: 48,
    fontFamily: "Arial",
    color: "#FF0000",
    opacity: 0.3,
    position: "diagonal",
    rotation: -45,
  },
  {
    id: "draft",
    name: "Draft",
    text: "DRAFT",
    fontSize: 60,
    fontFamily: "Arial",
    color: "#000000",
    opacity: 0.2,
    position: "center",
    rotation: 0,
  },
  {
    id: "proof",
    name: "Proof",
    text: "PROOF",
    fontSize: 54,
    fontFamily: "Arial",
    color: "#0000FF",
    opacity: 0.25,
    position: "diagonal",
    rotation: -30,
  },
  {
    id: "sample",
    name: "Sample",
    text: "SAMPLE",
    fontSize: 48,
    fontFamily: "Helvetica",
    color: "#808080",
    opacity: 0.3,
    position: "center",
    rotation: 0,
  },
];

// Compression presets
export interface CompressionPreset {
  id: string;
  name: string;
  quality: "low" | "medium" | "high";
  description: string;
}

export const defaultCompressionPresets: CompressionPreset[] = [
  {
    id: "web-optimized",
    name: "Web Optimized",
    quality: "low",
    description: "Maximum compression for fast web loading",
  },
  {
    id: "balanced",
    name: "Balanced",
    quality: "medium",
    description: "Good balance between size and quality",
  },
  {
    id: "high-quality",
    name: "High Quality",
    quality: "high",
    description: "Minimal compression, best quality",
  },
];

// Page numbers presets
export interface PageNumbersPreset {
  id: string;
  name: string;
  position: "bottom-center" | "bottom-right" | "bottom-left" | "top-center" | "top-right" | "top-left";
  format: "1" | "1 of N" | "- 1 -" | "Page 1";
  fontSize: number;
  fontFamily: string;
  color: string;
}

export const defaultPageNumbersPresets: PageNumbersPreset[] = [
  {
    id: "simple",
    name: "Simple (1)",
    position: "bottom-center",
    format: "1",
    fontSize: 12,
    fontFamily: "Arial",
    color: "#000000",
  },
  {
    id: "full",
    name: "Full (1 of N)",
    position: "bottom-right",
    format: "1 of N",
    fontSize: 12,
    fontFamily: "Arial",
    color: "#000000",
  },
  {
    id: "fancy",
    name: "Fancy (- 1 -)",
    position: "bottom-center",
    format: "- 1 -",
    fontSize: 14,
    fontFamily: "Times New Roman",
    color: "#333333",
  },
  {
    id: "verbose",
    name: "Verbose (Page 1)",
    position: "top-right",
    format: "Page 1",
    fontSize: 11,
    fontFamily: "Arial",
    color: "#666666",
  },
];

// Imposition presets (N-up)
export interface ImpositionPreset {
  id: string;
  name: string;
  pagesPerSheet: 2 | 4 | 6 | 8 | 9 | 12 | 16;
  layout: "portrait" | "landscape" | "auto";
  margin: number;
  description: string;
}

export const defaultImpositionPresets: ImpositionPreset[] = [
  {
    id: "2up",
    name: "2-up",
    pagesPerSheet: 2,
    layout: "auto",
    margin: 10,
    description: "2 pages per sheet",
  },
  {
    id: "4up",
    name: "4-up",
    pagesPerSheet: 4,
    layout: "auto",
    margin: 10,
    description: "4 pages per sheet (2x2 grid)",
  },
  {
    id: "6up",
    name: "6-up",
    pagesPerSheet: 6,
    layout: "portrait",
    margin: 10,
    description: "6 pages per sheet (2x3 grid)",
  },
  {
    id: "9up",
    name: "9-up",
    pagesPerSheet: 9,
    layout: "auto",
    margin: 8,
    description: "9 pages per sheet (3x3 grid)",
  },
  {
    id: "16up",
    name: "16-up",
    pagesPerSheet: 16,
    layout: "portrait",
    margin: 5,
    description: "16 pages per sheet (4x4 grid)",
  },
];

// User preset storage interface
export interface UserPreset {
  id: string;
  toolId: string;
  name: string;
  settings: Record<string, unknown>;
  createdAt: string;
  isDefault?: boolean;
}

// Local storage helpers
const PRESETS_STORAGE_KEY = "pdfmagic_user_presets";

export function saveUserPreset(preset: UserPreset): void {
  try {
    const existing = getUserPresets();
    const updated = [...existing.filter((p) => p.id !== preset.id), preset];
    localStorage.setItem(PRESETS_STORAGE_KEY, JSON.stringify(updated));
  } catch (error) {
    console.error("Failed to save preset:", error);
  }
}

export function getUserPresets(): UserPreset[] {
  try {
    const stored = localStorage.getItem(PRESETS_STORAGE_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch {
    return [];
  }
}

export function deleteUserPreset(presetId: string): void {
  try {
    const existing = getUserPresets();
    const updated = existing.filter((p) => p.id !== presetId);
    localStorage.setItem(PRESETS_STORAGE_KEY, JSON.stringify(updated));
  } catch (error) {
    console.error("Failed to delete preset:", error);
  }
}

export function getPresetsForTool(toolId: string): UserPreset[] {
  return getUserPresets().filter((p) => p.toolId === toolId);
}
