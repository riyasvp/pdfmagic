"use client";

import { useState, useCallback, useEffect } from "react";
import {
  MinusCircle,
  PlusCircle,
  ArrowRightLeft,
  Volume2,
  Square,
  Maximize,
  Play,
  Pause,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface TextToSpeechControlsProps {
  text: string;
  className?: string;
  onTextChange?: (text: string) => void;
}

export function TextToSpeechControls({
  text,
  className,
  onTextChange,
}: TextToSpeechControlsProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [rate, setRate] = useState(1);
  const [pitch, setPitch] = useState(1);
  const [volume, setVolume] = useState(1);
  const [voice, setVoice] = useState<string>("");
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([]);
  const [currentUtterance, setCurrentUtterance] = useState<SpeechSynthesisUtterance | null>(null);

  // Load voices
  useEffect(() => {
    const loadVoices = () => {
      const availableVoices = window.speechSynthesis.getVoices();
      setVoices(availableVoices);
      if (availableVoices.length > 0 && !voice) {
        const englishVoice = availableVoices.find((v) => v.lang.startsWith("en")) || availableVoices[0];
        setVoice(englishVoice?.name || "");
      }
    };

    loadVoices();
    window.speechSynthesis.onvoiceschanged = loadVoices;

    return () => {
      window.speechSynthesis.cancel();
    };
  }, [voice]);

  const startSpeech = useCallback(() => {
    if (!text || typeof window === "undefined") return;

    window.speechSynthesis.cancel();

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = rate;
    utterance.pitch = pitch;
    utterance.volume = volume;

    if (voice) {
      const selectedVoice = voices.find((v) => v.name === voice);
      if (selectedVoice) {
        utterance.voice = selectedVoice;
      }
    }

    utterance.onend = () => setIsPlaying(false);
    utterance.onerror = () => setIsPlaying(false);

    setCurrentUtterance(utterance);
    window.speechSynthesis.speak(utterance);
    setIsPlaying(true);
  }, [text, rate, pitch, volume, voice, voices]);

  const stopSpeech = useCallback(() => {
    if (typeof window === "undefined") return;
    window.speechSynthesis.cancel();
    setIsPlaying(false);
    setCurrentUtterance(null);
  }, []);

  const toggleSpeech = useCallback(() => {
    if (isPlaying) {
      stopSpeech();
    } else {
      startSpeech();
    }
  }, [isPlaying, startSpeech, stopSpeech]);

  return (
    <div className={cn("space-y-6", className)}>
      {/* Text input */}
      <div className="space-y-2">
        <label className="text-sm font-medium">Text to read</label>
        <textarea
          value={text}
          onChange={(e) => onTextChange?.(e.target.value)}
          className="w-full h-32 p-3 border rounded-lg bg-background resize-none"
          placeholder="Enter or paste text to read aloud..."
        />
      </div>

      {/* Controls */}
      <div className="flex flex-wrap gap-4">
        {/* Play/Pause button */}
        <Button
          onClick={toggleSpeech}
          disabled={!text}
          size="lg"
          className="gap-2"
        >
          {isPlaying ? (
            <>
              <Pause className="w-4 h-4" />
              Pause
            </>
          ) : (
            <>
              <Play className="w-4 h-4" />
              Play
            </>
          )}
        </Button>

        {/* Voice selector */}
        <Select value={voice} onValueChange={setVoice}>
          <SelectTrigger className="w-[200px]">
            <SelectValue placeholder="Select voice" />
          </SelectTrigger>
          <SelectContent>
            {voices.map((v) => (
              <SelectItem key={v.name} value={v.name}>
                {v.name} ({v.lang})
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Settings */}
      <div className="grid gap-4 sm:grid-cols-3">
        {/* Rate */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <label className="text-sm font-medium">Speed</label>
            <span className="text-sm text-muted-foreground">{rate}x</span>
          </div>
          <Slider
            value={[rate * 10]}
            onValueChange={([v]) => setRate(v / 10)}
            min={5}
            max={20}
            step={1}
          />
        </div>

        {/* Pitch */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <label className="text-sm font-medium">Pitch</label>
            <span className="text-sm text-muted-foreground">{pitch}</span>
          </div>
          <Slider
            value={[pitch * 10]}
            onValueChange={([v]) => setPitch(v / 10)}
            min={5}
            max={20}
            step={1}
          />
        </div>

        {/* Volume */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <label className="text-sm font-medium">Volume</label>
            <span className="text-sm text-muted-foreground">
              {Math.round(volume * 100)}%
            </span>
          </div>
          <Slider
            value={[volume * 100]}
            onValueChange={([v]) => setVolume(v / 100)}
            min={0}
            max={100}
            step={1}
          />
        </div>
      </div>

      {/* Info */}
      <div className="text-xs text-muted-foreground">
        Uses the browser&apos;s built-in Web Speech API. Voice availability varies by browser and OS.
      </div>
    </div>
  );
}
