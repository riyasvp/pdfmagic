import {
  FileText,
  Combine,
  Scissors,
  Minimize2,
  FileOutput,
  Shield,
  Lock,
  Unlock,
  ImageDown,
  Droplet,
  RotateCw,
  FileImage,
  FileSpreadsheet,
  Presentation,
  FileDigit,
  Crop,
  Trash2,
  PenTool,
  FileInput,
  FileCode,
  Eraser,
  Sparkles,
  Scan,
  GitCompare,
  Layers,
  FileSearch,
  MessageSquare,
  Brain,
  type LucideIcon,
} from "lucide-react";

export interface Tool {
  id: string;
  name: string;
  description: string;
  icon: LucideIcon;
  gradient: string;
  acceptTypes: string;
  maxFiles: number;
  popular?: boolean;
  endpoint: string;
  outputFormat: string;
}

export interface ToolCategory {
  name: string;
  description: string;
  icon: LucideIcon;
  gradient: string;
  tools: Tool[];
}

export const toolCategories: ToolCategory[] = [
  {
    name: "PDF Tools",
    description: "Essential PDF manipulation tools",
    icon: FileText,
    gradient: "from-violet-500 to-purple-600",
    tools: [
      {
        id: "merge",
        name: "Merge PDF",
        description: "Combine multiple PDF files into one document",
        icon: Combine,
        gradient: "from-orange-400 to-pink-500",
        acceptTypes: ".pdf",
        maxFiles: 999, // Unlimited - no file limit for merge
        popular: true,
        endpoint: "/api/pdf/merge",
        outputFormat: "PDF",
      },
      {
        id: "split",
        name: "Split PDF",
        description: "Extract pages or split PDF into multiple files",
        icon: Scissors,
        gradient: "from-red-400 to-rose-500",
        acceptTypes: ".pdf",
        maxFiles: 1,
        popular: true,
        endpoint: "/api/pdf/split",
        outputFormat: "PDF",
      },
      {
        id: "compress",
        name: "Compress PDF",
        description: "Reduce PDF file size while maintaining quality",
        icon: Minimize2,
        gradient: "from-green-400 to-emerald-500",
        acceptTypes: ".pdf",
        maxFiles: 1,
        popular: true,
        endpoint: "/api/pdf/compress",
        outputFormat: "PDF",
      },
      {
        id: "pdf-to-word",
        name: "PDF to Word",
        description: "Convert PDF documents to editable Word files",
        icon: FileOutput,
        gradient: "from-blue-400 to-indigo-500",
        acceptTypes: ".pdf",
        maxFiles: 1,
        popular: true,
        endpoint: "/api/pdf/to-word",
        outputFormat: "DOCX",
      },
      {
        id: "pdf-to-excel",
        name: "PDF to Excel",
        description: "Extract tables from PDF to Excel spreadsheets",
        icon: FileSpreadsheet,
        gradient: "from-green-500 to-teal-500",
        acceptTypes: ".pdf",
        maxFiles: 1,
        endpoint: "/api/pdf/to-excel",
        outputFormat: "XLSX",
      },
      {
        id: "pdf-to-ppt",
        name: "PDF to PowerPoint",
        description: "Convert PDF pages to PowerPoint presentation",
        icon: Presentation,
        gradient: "from-orange-500 to-red-500",
        acceptTypes: ".pdf",
        maxFiles: 1,
        endpoint: "/api/pdf/to-ppt",
        outputFormat: "PPTX",
      },
      {
        id: "pdf-to-image",
        name: "PDF to Image",
        description: "Convert PDF pages to high-quality images",
        icon: ImageDown,
        gradient: "from-purple-400 to-violet-500",
        acceptTypes: ".pdf",
        maxFiles: 1,
        popular: true,
        endpoint: "/api/pdf/to-image",
        outputFormat: "PNG/JPG",
      },
    ],
  },
  {
    name: "Convert to PDF",
    description: "Convert various file formats to PDF",
    icon: FileInput,
    gradient: "from-blue-500 to-cyan-600",
    tools: [
      {
        id: "word-to-pdf",
        name: "Word to PDF",
        description: "Convert Word documents to PDF format",
        icon: FileInput,
        gradient: "from-blue-500 to-indigo-600",
        acceptTypes: ".doc,.docx",
        maxFiles: 1,
        popular: true,
        endpoint: "/api/pdf/from-word",
        outputFormat: "PDF",
      },
      {
        id: "excel-to-pdf",
        name: "Excel to PDF",
        description: "Convert Excel spreadsheets to PDF documents",
        icon: FileSpreadsheet,
        gradient: "from-green-500 to-emerald-600",
        acceptTypes: ".xls,.xlsx",
        maxFiles: 1,
        endpoint: "/api/pdf/from-excel",
        outputFormat: "PDF",
      },
      {
        id: "ppt-to-pdf",
        name: "PPT to PDF",
        description: "Convert PowerPoint presentations to PDF",
        icon: Presentation,
        gradient: "from-orange-500 to-red-600",
        acceptTypes: ".ppt,.pptx",
        maxFiles: 1,
        endpoint: "/api/pdf/from-ppt",
        outputFormat: "PDF",
      },
      {
        id: "image-to-pdf",
        name: "Image to PDF",
        description: "Convert images to PDF document",
        icon: FileImage,
        gradient: "from-pink-500 to-rose-600",
        acceptTypes: ".jpg,.jpeg,.png,.gif,.bmp,.webp",
        maxFiles: 50,
        popular: true,
        endpoint: "/api/pdf/from-image",
        outputFormat: "PDF",
      },
      {
        id: "html-to-pdf",
        name: "HTML to PDF",
        description: "Convert HTML pages to PDF documents",
        icon: FileCode,
        gradient: "from-cyan-500 to-blue-600",
        acceptTypes: ".html,.htm",
        maxFiles: 1,
        endpoint: "/api/pdf/from-html",
        outputFormat: "PDF",
      },
    ],
  },
  {
    name: "PDF Editing",
    description: "Edit and modify PDF documents",
    icon: PenTool,
    gradient: "from-pink-500 to-rose-600",
    tools: [
      {
        id: "watermark",
        name: "Add Watermark",
        description: "Add text or image watermark to PDF",
        icon: Droplet,
        gradient: "from-cyan-400 to-blue-500",
        acceptTypes: ".pdf",
        maxFiles: 1,
        popular: true,
        endpoint: "/api/pdf/watermark",
        outputFormat: "PDF",
      },
      {
        id: "page-numbers",
        name: "Add Page Numbers",
        description: "Add page numbers to PDF document",
        icon: FileDigit,
        gradient: "from-violet-400 to-purple-500",
        acceptTypes: ".pdf",
        maxFiles: 1,
        endpoint: "/api/pdf/page-numbers",
        outputFormat: "PDF",
      },
      {
        id: "rotate",
        name: "Rotate PDF",
        description: "Rotate PDF pages to any angle",
        icon: RotateCw,
        gradient: "from-amber-400 to-orange-500",
        acceptTypes: ".pdf",
        maxFiles: 1,
        endpoint: "/api/pdf/rotate",
        outputFormat: "PDF",
      },
      {
        id: "crop",
        name: "Crop PDF",
        description: "Crop PDF pages to custom size",
        icon: Crop,
        gradient: "from-lime-400 to-green-500",
        acceptTypes: ".pdf",
        maxFiles: 1,
        endpoint: "/api/pdf/crop",
        outputFormat: "PDF",
      },
      {
        id: "delete-pages",
        name: "Delete Pages",
        description: "Remove unwanted pages from PDF",
        icon: Trash2,
        gradient: "from-red-400 to-rose-500",
        acceptTypes: ".pdf",
        maxFiles: 1,
        endpoint: "/api/pdf/delete-pages",
        outputFormat: "PDF",
      },
      {
        id: "organize",
        name: "Organize PDF",
        description: "Reorder, rotate, and delete pages with drag & drop",
        icon: Layers,
        gradient: "from-indigo-400 to-purple-500",
        acceptTypes: ".pdf",
        maxFiles: 1,
        endpoint: "/api/pdf/organize",
        outputFormat: "PDF",
      },
    ],
  },
  {
    name: "PDF Security",
    description: "Protect and secure your PDF documents",
    icon: Shield,
    gradient: "from-amber-500 to-orange-600",
    tools: [
      {
        id: "protect",
        name: "Protect PDF",
        description: "Add password protection to PDF",
        icon: Lock,
        gradient: "from-red-500 to-rose-600",
        acceptTypes: ".pdf",
        maxFiles: 1,
        popular: true,
        endpoint: "/api/pdf/protect",
        outputFormat: "PDF",
      },
      {
        id: "unlock",
        name: "Unlock PDF",
        description: "Remove password from protected PDF",
        icon: Unlock,
        gradient: "from-green-500 to-emerald-600",
        acceptTypes: ".pdf",
        maxFiles: 1,
        endpoint: "/api/pdf/unlock",
        outputFormat: "PDF",
      },
      {
        id: "sign",
        name: "Sign PDF",
        description: "Add digital signature to PDF",
        icon: PenTool,
        gradient: "from-blue-500 to-indigo-600",
        acceptTypes: ".pdf",
        maxFiles: 1,
        endpoint: "/api/pdf/sign",
        outputFormat: "PDF",
      },
      {
        id: "redact",
        name: "Redact PDF",
        description: "Permanently remove sensitive information",
        icon: Eraser,
        gradient: "from-gray-500 to-slate-600",
        acceptTypes: ".pdf",
        maxFiles: 1,
        endpoint: "/api/pdf/redact",
        outputFormat: "PDF",
      },
    ],
  },
  {
    name: "AI-Powered Tools",
    description: "Smart PDF tools powered by artificial intelligence",
    icon: Brain,
    gradient: "from-purple-500 to-indigo-600",
    tools: [
      {
        id: "ocr",
        name: "OCR PDF",
        description: "Extract text from scanned PDFs using AI",
        icon: Scan,
        gradient: "from-teal-400 to-cyan-500",
        acceptTypes: ".pdf",
        maxFiles: 1,
        popular: true,
        endpoint: "/api/pdf/ocr",
        outputFormat: "DOCX/TXT",
      },
      {
        id: "compare",
        name: "Compare PDFs",
        description: "Compare two PDFs and highlight differences",
        icon: GitCompare,
        gradient: "from-orange-400 to-amber-500",
        acceptTypes: ".pdf",
        maxFiles: 2,
        endpoint: "/api/pdf/compare",
        outputFormat: "PDF Report",
      },
      {
        id: "summarize",
        name: "Summarize PDF",
        description: "Generate AI summary of PDF content",
        icon: FileSearch,
        gradient: "from-violet-500 to-purple-600",
        acceptTypes: ".pdf",
        maxFiles: 1,
        endpoint: "/api/pdf/summarize",
        outputFormat: "TXT/PDF",
      },
      {
        id: "chat",
        name: "Chat with PDF",
        description: "Ask questions about your PDF documents",
        icon: MessageSquare,
        gradient: "from-pink-500 to-rose-600",
        acceptTypes: ".pdf",
        maxFiles: 1,
        popular: true,
        endpoint: "/api/pdf/chat",
        outputFormat: "Interactive",
      },
    ],
  },
];

// Get all tools flattened
export const getAllTools = (): Tool[] => {
  return toolCategories.flatMap((category) => category.tools);
};

// Get popular tools
export const getPopularTools = (): Tool[] => {
  return getAllTools().filter((tool) => tool.popular);
};

// Get tool by ID
export const getToolById = (id: string): Tool | undefined => {
  return getAllTools().find((tool) => tool.id === id);
};

// Get category for a tool
export const getCategoryForTool = (toolId: string): ToolCategory | undefined => {
  return toolCategories.find((category) =>
    category.tools.some((tool) => tool.id === toolId)
  );
};
