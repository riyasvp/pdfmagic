// Analytics tracking for PDFMagic
// Privacy-first: No cookies, no personal data, only anonymized tool stats

interface AnalyticsEvent {
  event: string;
  toolId?: string;
  timestamp: number;
  metadata?: Record<string, unknown>;
}

interface ToolUsageStats {
  toolId: string;
  viewCount: number;
  useCount: number;
  successCount: number;
  failureCount: number;
  avgFileSize: number;
  avgProcessingTime: number;
}

// In-memory storage for client-side (resets on refresh)
const clientEvents: AnalyticsEvent[] = [];
const MAX_CLIENT_EVENTS = 100;

// Track page view
export async function trackPageView(pagePath: string, toolId?: string): Promise<void> {
  const event: AnalyticsEvent = {
    event: "page_view",
    toolId,
    timestamp: Date.now(),
    metadata: { pagePath },
  };

  clientEvents.push(event);
  if (clientEvents.length > MAX_CLIENT_EVENTS) {
    clientEvents.shift();
  }

  // Send to server
  try {
    await fetch("/api/analytics/track", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(event),
    });
  } catch {
    // Silently fail - analytics should never break the app
  }
}

// Track tool usage
export async function trackToolUse(
  toolId: string,
  success: boolean,
  fileSize?: number,
  processingTime?: number,
  metadata?: Record<string, unknown>
): Promise<void> {
  const event: AnalyticsEvent = {
    event: "tool_use",
    toolId,
    timestamp: Date.now(),
    metadata: {
      success,
      fileSize,
      processingTime,
      ...metadata,
    },
  };

  clientEvents.push(event);
  if (clientEvents.length > MAX_CLIENT_EVENTS) {
    clientEvents.shift();
  }

  // Send to server
  try {
    await fetch("/api/analytics/track", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(event),
    });
  } catch {
    // Silently fail
  }
}

// Track file upload
export async function trackFileUpload(
  toolId: string,
  fileSize: number,
  success: boolean
): Promise<void> {
  await trackToolUse(toolId, success, fileSize, undefined, {
    eventType: "file_upload",
  });
}

// Track error
export async function trackError(
  toolId: string,
  errorMessage: string,
  errorType: string
): Promise<void> {
  const event: AnalyticsEvent = {
    event: "error",
    toolId,
    timestamp: Date.now(),
    metadata: {
      errorMessage,
      errorType,
    },
  };

  clientEvents.push(event);

  try {
    await fetch("/api/analytics/track", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(event),
    });
  } catch {
    // Silently fail
  }
}

// Get tool stats (client-side)
export function getLocalToolStats(): Record<string, { views: number; uses: number }> {
  const stats: Record<string, { views: number; uses: number }> = {};

  clientEvents.forEach((event) => {
    if (event.toolId) {
      if (!stats[event.toolId]) {
        stats[event.toolId] = { views: 0, uses: 0 };
      }

      if (event.event === "page_view") {
        stats[event.toolId].views++;
      } else if (event.event === "tool_use") {
        stats[event.toolId].uses++;
      }
    }
  });

  return stats;
}

// Export events for debugging
export function getClientEvents(): AnalyticsEvent[] {
  return [...clientEvents];
}
