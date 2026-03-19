"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  History,
  FileText,
  Trash2,
  Download,
  Search,
  Filter,
  ChevronDown,
  Clock,
  CheckCircle2,
  XCircle,
  Loader2,
  ArrowLeft,
  ExternalLink,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { getToolById } from "@/lib/tools-config";

interface HistoryItem {
  id: string;
  tool_id: string;
  tool_name: string;
  file_name: string;
  file_size: number;
  status: "success" | "error" | "pending";
  download_url?: string;
  created_at: string;
}

interface DashboardStats {
  totalItems: number;
  totalFileSize: number;
  successCount: number;
  errorCount: number;
}

const ITEMS_PER_PAGE = 20;

export default function DashboardPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [search, setSearch] = useState("");
  const [filterTool, setFilterTool] = useState<string>("");
  const [filterStatus, setFilterStatus] = useState<string>("");
  const [showFilters, setShowFilters] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [selectedItems, setSelectedItems] = useState<Set<string>>(new Set());
  const [currentPage, setCurrentPage] = useState(1);

  // Check authentication
  useEffect(() => {
    const checkAuth = async () => {
      // For demo purposes, we'll check localStorage
      // In production, this would verify the session with Supabase
      const userEmail = localStorage.getItem("pdfmagic_user_email");
      if (!userEmail) {
        // Redirect to sign in
        router.push("/auth/signin?redirect=/dashboard");
        return;
      }
      setIsAuthenticated(true);
      await fetchHistory();
    };

    checkAuth();
  }, [router]);

  const fetchHistory = async () => {
    setIsLoading(true);
    try {
      // In production, this would fetch from the API
      // For demo, we'll use mock data
      const mockHistory: HistoryItem[] = [
        {
          id: "1",
          tool_id: "merge",
          tool_name: "Merge PDF",
          file_name: "report_final.pdf",
          file_size: 5242880,
          status: "success",
          download_url: "/downloads/merged.pdf",
          created_at: new Date(Date.now() - 3600000).toISOString(),
        },
        {
          id: "2",
          tool_id: "compress",
          tool_name: "Compress PDF",
          file_name: "presentation.pdf",
          file_size: 15728640,
          status: "success",
          download_url: "/downloads/compressed.pdf",
          created_at: new Date(Date.now() - 7200000).toISOString(),
        },
        {
          id: "3",
          tool_id: "split",
          tool_name: "Split PDF",
          file_name: "document.pdf",
          file_size: 8388608,
          status: "success",
          download_url: "/downloads/split.zip",
          created_at: new Date(Date.now() - 86400000).toISOString(),
        },
        {
          id: "4",
          tool_id: "ocr",
          tool_name: "OCR PDF",
          file_name: "scanned_doc.pdf",
          file_size: 2097152,
          status: "error",
          created_at: new Date(Date.now() - 172800000).toISOString(),
        },
      ];

      setHistory(mockHistory);
      setStats({
        totalItems: mockHistory.length,
        totalFileSize: mockHistory.reduce((acc, item) => acc + item.file_size, 0),
        successCount: mockHistory.filter((item) => item.status === "success").length,
        errorCount: mockHistory.filter((item) => item.status === "error").length,
      });
    } catch (error) {
      console.error("Error fetching history:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  };

  const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (hours < 1) return "Just now";
    if (hours < 24) return `${hours}h ago`;
    if (days < 7) return `${days}d ago`;
    return date.toLocaleDateString();
  };

  const handleDelete = async (id: string) => {
    setDeletingId(id);
    try {
      // In production, this would call the API
      setHistory(history.filter((item) => item.id !== id));
      if (stats) {
        setStats({
          ...stats,
          totalItems: stats.totalItems - 1,
        });
      }
    } catch (error) {
      console.error("Error deleting item:", error);
    } finally {
      setDeletingId(null);
    }
  };

  const handleDeleteSelected = async () => {
    if (selectedItems.size === 0) return;

    setIsLoading(true);
    try {
      // In production, this would call the API
      setHistory(history.filter((item) => !selectedItems.has(item.id)));
      setSelectedItems(new Set());
      if (stats) {
        setStats({
          ...stats,
          totalItems: stats.totalItems - selectedItems.size,
        });
      }
    } catch (error) {
      console.error("Error deleting items:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleExportCSV = async () => {
    // Create CSV content
    const headers = ["Date", "Tool", "File Name", "File Size", "Status"];
    const rows = history.map((item) => [
      new Date(item.created_at).toLocaleString(),
      item.tool_name,
      item.file_name,
      formatFileSize(item.file_size),
      item.status,
    ]);

    const csv = [headers, ...rows].map((row) => row.join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `pdfmagic-history-${new Date().toISOString().split("T")[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const toggleSelectItem = (id: string) => {
    const newSelected = new Set(selectedItems);
    if (newSelected.has(id)) {
      newSelected.delete(id);
    } else {
      newSelected.add(id);
    }
    setSelectedItems(newSelected);
  };

  const toggleSelectAll = () => {
    if (selectedItems.size === filteredHistory.length) {
      setSelectedItems(new Set());
    } else {
      setSelectedItems(new Set(filteredHistory.map((item) => item.id)));
    }
  };

  // Filter history
  const filteredHistory = history.filter((item) => {
    if (search && !item.file_name.toLowerCase().includes(search.toLowerCase())) {
      return false;
    }
    if (filterTool && item.tool_id !== filterTool) {
      return false;
    }
    if (filterStatus && item.status !== filterStatus) {
      return false;
    }
    return true;
  });

  // Paginate
  const totalPages = Math.ceil(filteredHistory.length / ITEMS_PER_PAGE);
  const paginatedHistory = filteredHistory.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen relative overflow-hidden">
      {/* Background */}
      <div className="fixed inset-0 -z-10">
        <div className="absolute inset-0 bg-gradient-to-br from-violet-50 via-purple-50 to-pink-50 dark:from-slate-950 dark:via-purple-950 dark:to-slate-950" />
      </div>

      <div className="container mx-auto max-w-6xl px-4 py-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-4"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Home
          </Link>
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center">
              <History className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold">Your Dashboard</h1>
              <p className="text-muted-foreground">
                View your processing history and manage your files
              </p>
            </div>
          </div>
        </motion.div>

        {/* Stats Cards */}
        {stats && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8"
          >
            <div className="glass-card rounded-xl p-4">
              <div className="text-sm text-muted-foreground mb-1">Total Files</div>
              <div className="text-2xl font-bold">{stats.totalItems}</div>
            </div>
            <div className="glass-card rounded-xl p-4">
              <div className="text-sm text-muted-foreground mb-1">Data Processed</div>
              <div className="text-2xl font-bold">{formatFileSize(stats.totalFileSize)}</div>
            </div>
            <div className="glass-card rounded-xl p-4">
              <div className="text-sm text-muted-foreground mb-1">Successful</div>
              <div className="text-2xl font-bold text-green-600 flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5" />
                {stats.successCount}
              </div>
            </div>
            <div className="glass-card rounded-xl p-4">
              <div className="text-sm text-muted-foreground mb-1">Errors</div>
              <div className="text-2xl font-bold text-red-600 flex items-center gap-2">
                <XCircle className="w-5 h-5" />
                {stats.errorCount}
              </div>
            </div>
          </motion.div>
        )}

        {/* Search and Filters */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="glass-card rounded-xl p-4 mb-6"
        >
          <div className="flex flex-col md:flex-row gap-4">
            {/* Search */}
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                type="text"
                placeholder="Search by file name..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-10"
              />
            </div>

            {/* Filter toggle */}
            <Button
              variant="outline"
              onClick={() => setShowFilters(!showFilters)}
              className="gap-2"
            >
              <Filter className="w-4 h-4" />
              Filters
              <ChevronDown className={cn("w-4 h-4 transition-transform", showFilters && "rotate-180")} />
            </Button>

            {/* Export button */}
            <Button
              variant="outline"
              onClick={handleExportCSV}
              className="gap-2"
              disabled={history.length === 0}
            >
              <Download className="w-4 h-4" />
              Export CSV
            </Button>
          </div>

          {/* Filter options */}
          {showFilters && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              className="flex flex-wrap gap-4 mt-4 pt-4 border-t"
            >
              <select
                className="px-3 py-2 rounded-lg border bg-background"
                value={filterTool}
                onChange={(e) => setFilterTool(e.target.value)}
              >
                <option value="">All Tools</option>
                <option value="merge">Merge PDF</option>
                <option value="split">Split PDF</option>
                <option value="compress">Compress PDF</option>
              </select>

              <select
                className="px-3 py-2 rounded-lg border bg-background"
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
              >
                <option value="">All Status</option>
                <option value="success">Success</option>
                <option value="error">Error</option>
                <option value="pending">Pending</option>
              </select>
            </motion.div>
          )}
        </motion.div>

        {/* Bulk Actions */}
        {selectedItems.size > 0 && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-center gap-4 mb-4 p-3 rounded-lg bg-muted"
          >
            <span className="text-sm font-medium">
              {selectedItems.size} item{selectedItems.size > 1 ? "s" : ""} selected
            </span>
            <Button
              variant="destructive"
              size="sm"
              onClick={handleDeleteSelected}
              disabled={isLoading}
              className="gap-2"
            >
              <Trash2 className="w-4 h-4" />
              Delete Selected
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setSelectedItems(new Set())}
            >
              Clear Selection
            </Button>
          </motion.div>
        )}

        {/* History List */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="glass-card rounded-xl overflow-hidden"
        >
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
          ) : paginatedHistory.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <FileText className="w-12 h-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">No History Found</h3>
              <p className="text-muted-foreground mb-4">
                {search || filterTool || filterStatus
                  ? "Try adjusting your filters"
                  : "Start using our PDF tools to see your history here"}
              </p>
              <Link href="/">
                <Button>Browse Tools</Button>
              </Link>
            </div>
          ) : (
            <>
              {/* Table Header */}
              <div className="hidden md:grid grid-cols-12 gap-4 px-6 py-3 border-b bg-muted/50 text-sm font-medium">
                <div className="col-span-1 flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={selectedItems.size === paginatedHistory.length && paginatedHistory.length > 0}
                    onChange={toggleSelectAll}
                    className="rounded"
                  />
                  <span>Select</span>
                </div>
                <div className="col-span-3">File</div>
                <div className="col-span-2">Tool</div>
                <div className="col-span-2">Size</div>
                <div className="col-span-2">Date</div>
                <div className="col-span-2">Actions</div>
              </div>

              {/* Table Rows */}
              <div className="divide-y">
                {paginatedHistory.map((item) => {
                  const tool = getToolById(item.tool_id);
                  const Icon = tool?.icon || FileText;

                  return (
                    <div
                      key={item.id}
                      className={cn(
                        "grid grid-cols-1 md:grid-cols-12 gap-4 px-6 py-4 items-center hover:bg-muted/30 transition-colors",
                        selectedItems.has(item.id) && "bg-primary/5"
                      )}
                    >
                      {/* Checkbox */}
                      <div className="col-span-1 flex items-center gap-2">
                        <input
                          type="checkbox"
                          checked={selectedItems.has(item.id)}
                          onChange={() => toggleSelectItem(item.id)}
                          className="rounded"
                        />
                        <span className="md:hidden text-sm font-medium">Select</span>
                      </div>

                      {/* File info */}
                      <div className="col-span-11 md:col-span-3 flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center flex-shrink-0">
                          <Icon className="w-5 h-5 text-white" />
                        </div>
                        <div className="min-w-0">
                          <p className="font-medium truncate">{item.file_name}</p>
                          <div className="flex items-center gap-1 text-sm">
                            {item.status === "success" ? (
                              <CheckCircle2 className="w-3 h-3 text-green-600" />
                            ) : item.status === "error" ? (
                              <XCircle className="w-3 h-3 text-red-600" />
                            ) : (
                              <Clock className="w-3 h-3 text-yellow-600" />
                            )}
                            <span className="capitalize text-muted-foreground">
                              {item.status}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Tool name */}
                      <div className="md:col-span-2 text-sm text-muted-foreground">
                        {item.tool_name}
                      </div>

                      {/* Size */}
                      <div className="md:col-span-2 text-sm">
                        {formatFileSize(item.file_size)}
                      </div>

                      {/* Date */}
                      <div className="md:col-span-2 text-sm text-muted-foreground">
                        {formatDate(item.created_at)}
                      </div>

                      {/* Actions */}
                      <div className="md:col-span-2 flex items-center gap-2">
                        {item.status === "success" && item.download_url && (
                          <Link href={item.download_url}>
                            <Button size="sm" variant="outline" className="gap-1">
                              <Download className="w-3 h-3" />
                              Download
                            </Button>
                          </Link>
                        )}
                        <Button
                          size="icon"
                          variant="ghost"
                          onClick={() => handleDelete(item.id)}
                          disabled={deletingId === item.id}
                          className="hover:bg-destructive hover:text-destructive-foreground"
                        >
                          {deletingId === item.id ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                          ) : (
                            <Trash2 className="w-4 h-4" />
                          )}
                        </Button>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex items-center justify-between px-6 py-4 border-t">
                  <span className="text-sm text-muted-foreground">
                    Page {currentPage} of {totalPages}
                  </span>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                      disabled={currentPage === 1}
                    >
                      Previous
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                      disabled={currentPage === totalPages}
                    >
                      Next
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}
        </motion.div>
      </div>
    </div>
  );
}
