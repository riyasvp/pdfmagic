import { supabaseServer } from "@/lib/supabase-server";

export interface HistoryItem {
  id: string;
  tool_id: string;
  tool_name: string;
  file_name: string;
  file_size: number;
  status: "success" | "error" | "pending";
  download_url?: string;
  created_at: string;
  metadata?: Record<string, unknown>;
}

export interface HistoryFilters {
  toolId?: string;
  status?: "success" | "error" | "pending";
  search?: string;
  dateFrom?: string;
  dateTo?: string;
  limit?: number;
  offset?: number;
}

export interface HistoryStats {
  totalItems: number;
  totalFileSize: number;
  successCount: number;
  errorCount: number;
}

// Get user history
export async function getHistory(
  userId: string,
  filters: HistoryFilters = {}
): Promise<{ items: HistoryItem[]; total: number }> {
  if (!supabaseServer) {
    console.error("Supabase server not initialized");
    return { items: [], total: 0 };
  }

  let query = supabaseServer
    .from("processing_history")
    .select("*", { count: "exact" })
    .eq("user_id", userId)
    .order("created_at", { ascending: false });

  // Apply filters
  if (filters.toolId) {
    query = query.eq("tool_id", filters.toolId);
  }

  if (filters.status) {
    query = query.eq("status", filters.status);
  }

  if (filters.search) {
    query = query.ilike("file_name", `%${filters.search}%`);
  }

  if (filters.dateFrom) {
    query = query.gte("created_at", filters.dateFrom);
  }

  if (filters.dateTo) {
    query = query.lte("created_at", filters.dateTo);
  }

  // Pagination
  if (filters.limit) {
    query = query.limit(filters.limit);
  }

  if (filters.offset) {
    query = query.range(filters.offset, (filters.offset || 0) + (filters.limit || 10) - 1);
  }

  const { data, count, error } = await query;

  if (error) {
    console.error("Error fetching history:", error);
    return { items: [], total: 0 };
  }

  return {
    items: data || [],
    total: count || 0,
  };
}

// Get history stats
export async function getHistoryStats(userId: string): Promise<HistoryStats> {
  if (!supabaseServer) {
    return { totalItems: 0, totalFileSize: 0, successCount: 0, errorCount: 0 };
  }

  const { data, error } = await supabaseServer
    .from("processing_history")
    .select("status, file_size")
    .eq("user_id", userId);

  if (error) {
    console.error("Error fetching history stats:", error);
    return { totalItems: 0, totalFileSize: 0, successCount: 0, errorCount: 0 };
  }

  const stats = {
    totalItems: data.length,
    totalFileSize: data.reduce((acc, item) => acc + (item.file_size || 0), 0),
    successCount: data.filter((item) => item.status === "success").length,
    errorCount: data.filter((item) => item.status === "error").length,
  };

  return stats;
}

// Add history item
export async function addHistoryItem(
  userId: string,
  item: Omit<HistoryItem, "id" | "created_at">
): Promise<HistoryItem | null> {
  if (!supabaseServer) {
    return null;
  }

  const { data, error } = await supabaseServer
    .from("processing_history")
    .insert({
      user_id: userId,
      tool_id: item.tool_id,
      tool_name: item.tool_name,
      file_name: item.file_name,
      file_size: item.file_size,
      status: item.status,
      download_url: item.download_url,
      metadata: item.metadata,
    })
    .select()
    .single();

  if (error) {
    console.error("Error adding history item:", error);
    return null;
  }

  return data;
}

// Delete history item
export async function deleteHistoryItem(
  userId: string,
  itemId: string
): Promise<boolean> {
  if (!supabaseServer) {
    return false;
  }

  const { error } = await supabaseServer
    .from("processing_history")
    .delete()
    .eq("id", itemId)
    .eq("user_id", userId);

  if (error) {
    console.error("Error deleting history item:", error);
    return false;
  }

  return true;
}

// Delete all history for user
export async function deleteAllHistory(userId: string): Promise<boolean> {
  if (!supabaseServer) {
    return false;
  }

  const { error } = await supabaseServer
    .from("processing_history")
    .delete()
    .eq("user_id", userId);

  if (error) {
    console.error("Error deleting all history:", error);
    return false;
  }

  return true;
}

// Export history as CSV
export async function exportHistoryAsCSV(userId: string): Promise<string> {
  const { items } = await getHistory(userId, { limit: 1000 });

  const headers = ["Date", "Tool", "File Name", "File Size", "Status"];
  const rows = items.map((item) => [
    new Date(item.created_at).toLocaleString(),
    item.tool_name,
    item.file_name,
    formatFileSize(item.file_size),
    item.status,
  ]);

  const csv = [headers, ...rows].map((row) => row.join(",")).join("\n");
  return csv;
}

// Helper function to format file size
function formatFileSize(bytes: number): string {
  if (bytes === 0) return "0 Bytes";
  const k = 1024;
  const sizes = ["Bytes", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
}
