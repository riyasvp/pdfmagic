import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

// POST /api/analytics/track - Track an analytics event
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { event, toolId, timestamp, metadata } = body;

    if (!event || !timestamp) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    // Store the analytics event
    const { error } = await supabase.from("analytics_events").insert({
      event,
      tool_id: toolId,
      timestamp: new Date(timestamp).toISOString(),
      metadata: metadata || {},
      // No user identification - privacy-first
    });

    if (error) {
      console.error("Analytics tracking error:", error);
      // Don't fail the request - analytics is non-critical
      return NextResponse.json(
        { success: false, error: "Failed to track event" },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Analytics error:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}

// GET /api/analytics/track - Get analytics summary (admin only)
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const toolId = searchParams.get("toolId");
    const days = parseInt(searchParams.get("days") || "7", 10);

    let query = supabase
      .from("analytics_events")
      .select("*")
      .gte("timestamp", new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString());

    if (toolId) {
      query = query.eq("tool_id", toolId);
    }

    const { data, error } = await query;

    if (error) {
      return NextResponse.json(
        { error: "Failed to fetch analytics" },
        { status: 500 }
      );
    }

    // Aggregate stats
    const stats = aggregateStats(data || []);

    return NextResponse.json({ stats, days });
  } catch (error) {
    console.error("Analytics fetch error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

interface AnalyticsEvent {
  event: string;
  tool_id: string | null;
  timestamp: string;
  metadata: Record<string, unknown>;
}

function aggregateStats(events: AnalyticsEvent[]) {
  const toolStats: Record<string, {
    views: number;
    uses: number;
    successes: number;
    failures: number;
    totalFileSize: number;
    totalProcessingTime: number;
  }> = {};

  events.forEach((event) => {
    const toolId = event.tool_id || "unknown";

    if (!toolStats[toolId]) {
      toolStats[toolId] = {
        views: 0,
        uses: 0,
        successes: 0,
        failures: 0,
        totalFileSize: 0,
        totalProcessingTime: 0,
      };
    }

    if (event.event === "page_view") {
      toolStats[toolId].views++;
    } else if (event.event === "tool_use") {
      toolStats[toolId].uses++;
      const success = event.metadata?.success as boolean;
      if (success) {
        toolStats[toolId].successes++;
      } else {
        toolStats[toolId].failures++;
      }

      const fileSize = event.metadata?.fileSize as number;
      if (fileSize) {
        toolStats[toolId].totalFileSize += fileSize;
      }

      const processingTime = event.metadata?.processingTime as number;
      if (processingTime) {
        toolStats[toolId].totalProcessingTime += processingTime;
      }
    }
  });

  // Calculate averages
  Object.keys(toolStats).forEach((toolId) => {
    const stats = toolStats[toolId];
    stats.totalFileSize = stats.uses > 0 ? stats.totalFileSize / stats.uses : 0;
    stats.totalProcessingTime = stats.uses > 0 ? stats.totalProcessingTime / stats.uses : 0;
  });

  return toolStats;
}
