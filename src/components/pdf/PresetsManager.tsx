"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Bookmark, BookmarkPlus, Trash2, Check, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import type { UserPreset } from "@/lib/presets/watermark-presets";
import {
  saveUserPreset,
  getUserPresets,
  deleteUserPreset,
  getPresetsForTool,
} from "@/lib/presets/watermark-presets";

interface PresetsManagerProps {
  toolId: string;
  currentSettings: Record<string, unknown>;
  onSelectPreset: (settings: Record<string, unknown>) => void;
  className?: string;
}

export function PresetsManager({
  toolId,
  currentSettings,
  onSelectPreset,
  className,
}: PresetsManagerProps) {
  const [presets, setPresets] = useState<UserPreset[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [newPresetName, setNewPresetName] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [selectedPresetId, setSelectedPresetId] = useState<string | null>(null);

  // Load presets on mount
  useEffect(() => {
    setPresets(getPresetsForTool(toolId));
  }, [toolId]);

  const handleSavePreset = () => {
    if (!newPresetName.trim()) return;

    setIsSaving(true);
    const preset: UserPreset = {
      id: `preset_${Date.now()}`,
      toolId,
      name: newPresetName.trim(),
      settings: currentSettings,
      createdAt: new Date().toISOString(),
    };

    saveUserPreset(preset);
    setPresets([...presets, preset]);
    setNewPresetName("");
    setIsSaving(false);
    setIsOpen(false);
  };

  const handleSelectPreset = (preset: UserPreset) => {
    setSelectedPresetId(preset.id);
    onSelectPreset(preset.settings);
  };

  const handleDeletePreset = (presetId: string) => {
    deleteUserPreset(presetId);
    setPresets(presets.filter((p) => p.id !== presetId));
    if (selectedPresetId === presetId) {
      setSelectedPresetId(null);
    }
  };

  const hasPresets = presets.length > 0;

  return (
    <div className={cn("flex items-center gap-2", className)}>
      {/* Presets Dropdown */}
      {hasPresets ? (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="sm" className="gap-2">
              <Bookmark className="w-4 h-4" />
              Presets ({presets.length})
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="w-56">
            {presets.map((preset) => (
              <DropdownMenuItem
                key={preset.id}
                className="flex items-center justify-between"
                onSelect={() => handleSelectPreset(preset)}
              >
                <div className="flex items-center gap-2">
                  <Bookmark
                    className={cn(
                      "w-4 h-4",
                      selectedPresetId === preset.id && "text-primary"
                    )}
                  />
                  <span>{preset.name}</span>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  className="w-6 h-6 hover:bg-destructive hover:text-destructive-foreground"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDeletePreset(preset.id);
                  }}
                >
                  <Trash2 className="w-3 h-3" />
                </Button>
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      ) : null}

      {/* Save Preset Dialog */}
      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogTrigger asChild>
          <Button variant="outline" size="sm" className="gap-2">
            <BookmarkPlus className="w-4 h-4" />
            Save as Preset
          </Button>
        </DialogTrigger>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Save Preset</DialogTitle>
            <DialogDescription>
              Save your current settings as a preset for quick access later.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="preset-name">Preset Name</Label>
              <Input
                id="preset-name"
                placeholder="e.g., My Custom Watermark"
                value={newPresetName}
                onChange={(e) => setNewPresetName(e.target.value)}
              />
            </div>

            {/* Preview of settings being saved */}
            <div className="p-3 rounded-lg bg-muted/50 border">
              <p className="text-xs text-muted-foreground mb-2">Settings to save:</p>
              <div className="space-y-1">
                {Object.entries(currentSettings).slice(0, 3).map(([key, value]) => (
                  <div key={key} className="flex justify-between text-sm">
                    <span className="text-muted-foreground">{key}:</span>
                    <span className="font-medium truncate max-w-[150px]">
                      {String(value)}
                    </span>
                  </div>
                ))}
                {Object.keys(currentSettings).length > 3 && (
                  <span className="text-xs text-muted-foreground">
                    +{Object.keys(currentSettings).length - 3} more settings
                  </span>
                )}
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleSavePreset}
              disabled={!newPresetName.trim() || isSaving}
              className="gap-2"
            >
              {isSaving ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Check className="w-4 h-4" />
                  Save Preset
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// Quick preset selector for watermark tool
interface QuickPresetsSelectorProps {
  presets: { id: string; name: string; settings: Record<string, unknown> }[];
  selectedId: string | null;
  onSelect: (settings: Record<string, unknown>) => void;
  className?: string;
}

export function QuickPresetsSelector({
  presets,
  selectedId,
  onSelect,
  className,
}: QuickPresetsSelectorProps) {
  if (presets.length === 0) return null;

  return (
    <div className={cn("space-y-2", className)}>
      <Label className="text-sm">Quick Presets</Label>
      <div className="flex flex-wrap gap-2">
        {presets.map((preset) => (
          <Button
            key={preset.id}
            variant={selectedId === preset.id ? "default" : "outline"}
            size="sm"
            onClick={() => onSelect(preset.settings)}
            className={cn(
              "gap-1 transition-all",
              selectedId === preset.id && "ring-2 ring-primary ring-offset-2"
            )}
          >
            <Check
              className={cn(
                "w-3 h-3",
                selectedId !== preset.id && "opacity-0"
              )}
            />
            {preset.name}
          </Button>
        ))}
      </div>
    </div>
  );
}
