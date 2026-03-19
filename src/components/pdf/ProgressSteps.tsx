"use client";

import { useState } from "react";
import { CheckCircle, XCircle, Clock, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { Progress } from "@/components/ui/progress";

interface ProgressStepsProps {
  steps: {
    label: string;
    status: "pending" | "processing" | "completed" | "error";
  }[];
  currentStep?: number;
  className?: string;
}

export function ProgressSteps({
  steps,
  currentStep,
  className,
}: ProgressStepsProps) {
  return (
    <div className={cn("space-y-4", className)}>
      {steps.map((step, index) => (
        <div key={index} className="flex items-start gap-4">
          <div className="flex flex-col items-center">
            <div
              className={cn(
                "w-8 h-8 rounded-full flex items-center justify-center border-2 transition-all",
                step.status === "completed" &&
                  "bg-green-500 border-green-500 text-white",
                step.status === "processing" &&
                  "bg-primary border-primary text-primary-foreground",
                step.status === "error" &&
                  "bg-red-500 border-red-500 text-white",
                step.status === "pending" &&
                  "bg-muted border-muted-foreground/25 text-muted-foreground"
              )}
            >
              {step.status === "completed" && (
                <CheckCircle className="w-4 h-4" />
              )}
              {step.status === "processing" && (
                <Loader2 className="w-4 h-4 animate-spin" />
              )}
              {step.status === "error" && <XCircle className="w-4 h-4" />}
              {step.status === "pending" && (
                <Clock className="w-4 h-4" />
              )}
            </div>
            {index < steps.length - 1 && (
              <div
                className={cn(
                  "w-0.5 h-8 mt-2",
                  step.status === "completed" ? "bg-green-500" : "bg-muted"
                )}
              />
            )}
          </div>
          <div className="pt-1">
            <div
              className={cn(
                "font-medium",
                step.status === "pending" && "text-muted-foreground",
                step.status === "processing" && "text-primary",
                step.status === "completed" && "text-green-600",
                step.status === "error" && "text-red-600"
              )}
            >
              {step.label}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

interface DetailedProgressProps {
  status: "idle" | "uploading" | "processing" | "success" | "error";
  progress: number;
  errorMessage?: string;
  steps?: {
    label: string;
    status: "pending" | "processing" | "completed" | "error";
  }[];
  className?: string;
}

export function DetailedProgress({
  status,
  progress,
  errorMessage,
  steps,
  className,
}: DetailedProgressProps) {
  if (status === "idle") return null;

  return (
    <div className={cn("space-y-4", className)}>
      {/* Progress bar */}
      {status !== "success" && status !== "error" && (
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground capitalize">{status}...</span>
            <span>{progress}%</span>
          </div>
          <Progress value={progress} className="h-2" />
        </div>
      )}

      {/* Steps */}
      {steps && <ProgressSteps steps={steps} />}

      {/* Error message */}
      {status === "error" && errorMessage && (
        <div className="p-4 rounded-lg bg-red-500/10 border border-red-500/20">
          <div className="flex items-center gap-2 text-red-600 font-medium mb-1">
            <XCircle className="w-4 h-4" />
            Error
          </div>
          <p className="text-sm text-red-600/80">{errorMessage}</p>
        </div>
      )}

      {/* Success message */}
      {status === "success" && (
        <div className="p-4 rounded-lg bg-green-500/10 border border-green-500/20">
          <div className="flex items-center gap-2 text-green-600 font-medium">
            <CheckCircle className="w-4 h-4" />
            Complete!
          </div>
        </div>
      )}
    </div>
  );
}
