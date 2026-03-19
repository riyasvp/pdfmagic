import { NextRequest, NextResponse } from "next/server";
import { join, resolve, isAbsolute, normalize } from "path";

// Rate limiting storage (in production, use Redis or similar)
const rateLimitMap = new Map<string, { count: number; resetTime: number }>();

// Configuration
const RATE_LIMIT_WINDOW_MS = 60 * 1000; // 1 minute
const RATE_LIMIT_MAX_REQUESTS = 100; // 100 requests per minute for general APIs
const RATE_LIMIT_MAX_FILE_UPLOADS = 20; // 20 file uploads per minute

/**
 * Get client IP from request
 */
export function getClientIP(request: NextRequest): string {
  const forwarded = request.headers.get("x-forwarded-for");
  const realIP = request.headers.get("x-real-ip");
  
  if (forwarded) {
    return forwarded.split(",")[0].trim();
  }
  
  if (realIP) {
    return realIP;
  }
  
  return "unknown";
}

/**
 * Check rate limit for API routes
 */
export function checkRateLimit(
  request: NextRequest,
  maxRequests: number = RATE_LIMIT_MAX_REQUESTS
): { allowed: boolean; remaining: number; resetIn: number } {
  const ip = getClientIP(request);
  const now = Date.now();
  
  // Clean expired entries periodically
  if (rateLimitMap.size > 10000) {
    for (const [key, value] of rateLimitMap.entries()) {
      if (value.resetTime < now) {
        rateLimitMap.delete(key);
      }
    }
  }
  
  const record = rateLimitMap.get(ip);
  
  if (!record || record.resetTime < now) {
    // New or expired record
    rateLimitMap.set(ip, {
      count: 1,
      resetTime: now + RATE_LIMIT_WINDOW_MS,
    });
    return { allowed: true, remaining: maxRequests - 1, resetIn: RATE_LIMIT_WINDOW_MS };
  }
  
  if (record.count >= maxRequests) {
    return {
      allowed: false,
      remaining: 0,
      resetIn: record.resetTime - now,
    };
  }
  
  record.count++;
  return {
    allowed: true,
    remaining: maxRequests - record.count,
    resetIn: record.resetTime - now,
  };
}

/**
 * Sanitize filename to prevent path traversal attacks
 */
export function sanitizeFilename(filename: string): string {
  if (!filename) return "file";
  
  // Remove path separators and null bytes
  let sanitized = filename
    .replace(/\0/g, "")
    .replace(/[/\\]/g, "_")
    .replace(/\.\./g, "_")
    .replace(/[<>:"|?*]/g, "_");
  
  // Limit length
  if (sanitized.length > 255) {
    const ext = sanitized.split(".").pop() || "";
    sanitized = sanitized.slice(0, 250) + (ext ? "." + ext : "");
  }
  
  return sanitized || "file";
}

/**
 * Validate file path to prevent path traversal
 */
export function validateFilePath(baseDir: string, userPath: string): string | null {
  // Resolve both paths to absolute
  const resolvedBase = resolve(baseDir);
  const resolvedUserPath = resolve(baseDir, userPath);
  
  // Ensure the resolved path is within the base directory
  if (!resolvedUserPath.startsWith(resolvedBase + process.sep) && 
      resolvedUserPath !== resolvedBase) {
    return null; // Path traversal detected
  }
  
  return resolvedUserPath;
}

/**
 * Validate filename for downloads (prevent path traversal)
 */
export function validateDownloadFilename(filename: string, downloadDir: string): string | null {
  // Sanitize first
  const sanitized = sanitizeFilename(filename);
  
  // Create full path
  const filePath = join(downloadDir, sanitized);
  
  // Validate it's within download directory
  const validatedPath = validateFilePath(downloadDir, sanitized);
  
  if (!validatedPath) {
    return null;
  }
  
  // Additional check: ensure file exists and is within expected directory
  const normalizedPath = normalize(filePath);
  if (!normalizedPath.startsWith(resolve(downloadDir))) {
    return null;
  }
  
  return normalizedPath;
}

/**
 * Validate file type by checking magic bytes (first few bytes)
 */
export async function validateFileMagicBytes(
  buffer: ArrayBuffer,
  expectedMimeTypes: string[]
): Promise<boolean> {
  const header = new Uint8Array(buffer.slice(0, 8));
  
  // Common magic bytes for different file types
  const magicBytes: Record<string, Array<[number[], string]>> = {
    "application/pdf": [[
      [0x25, 0x50, 0x44, 0x46], "PDF"
    ]],
    "image/png": [[
      [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a], "PNG"
    ]],
    "image/jpeg": [[
      [0xff, 0xd8, 0xff], "JPEG"
    ]],
    "application/zip": [[
      [0x50, 0x4b, 0x03, 0x04], "ZIP"
    ]],
    "application/msword": [[
      [0xd0, 0xcf, 0x11, 0xe0, 0xa1, 0xb1, 0x1a, 0xe1], "DOC"
    ]],
  };
  
  for (const mimeType of expectedMimeTypes) {
    const signatures = magicBytes[mimeType];
    if (signatures) {
      for (const [signature] of signatures) {
        let match = true;
        for (let i = 0; i < signature.length && i < header.length; i++) {
          if (header[i] !== signature[i]) {
            match = false;
            break;
          }
        }
        if (match) return true;
      }
    }
  }
  
  return false;
}

/**
 * Sanitize user input for SQL-like queries (if using DB)
 */
export function sanitizeSQLInput(input: string): string {
  // Remove potentially dangerous SQL characters
  return input
    .replace(/'/g, "''")
    .replace(/;/g, "")
    .replace(/--/g, "")
    .replace(/\/\*/g, "")
    .replace(/\*\//g, "")
    .replace(/xp_/gi, "")
    .replace(/exec/gi, "")
    .replace(/execute/gi, "")
    .trim();
}

/**
 * Validate URL to prevent open redirect attacks
 */
export function validateRedirectUrl(url: string, allowedDomains: string[]): boolean {
  try {
    const parsed = new URL(url);
    
    // Check protocol
    if (parsed.protocol !== "https:" && parsed.protocol !== "http:") {
      return false;
    }
    
    // Check domain
    if (allowedDomains.length > 0) {
      return allowedDomains.some(domain => 
        parsed.host === domain || parsed.host.endsWith("." + domain)
      );
    }
    
    // If no allowed domains specified, only allow relative URLs
    return !parsed.host;
  } catch {
    // If URL parsing fails, treat as relative path
    return !url.startsWith("//") && !url.startsWith("http");
  }
}

/**
 * Security headers to add to responses
 */
export const securityHeaders = {
  "X-Content-Type-Options": "nosniff",
  "X-Frame-Options": "DENY",
  "X-XSS-Protection": "1; mode=block",
  "Referrer-Policy": "strict-origin-when-cross-origin",
  "Permissions-Policy": "camera=(), microphone=(), geolocation=()",
  "Content-Security-Policy": [
    "default-src 'self'",
    "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://www.googletagmanager.com https://pagead2.googlesyndication.com",
    "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
    "font-src 'self' https://fonts.gstatic.com",
    "img-src 'self' data: blob: https:",
    "connect-src 'self' https://*.supabase.co https://www.google-analytics.com",
    "frame-src 'self' https://www.googletagmanager.com",
  ].join("; "),
};

/**
 * Add security headers to response
 */
export function addSecurityHeaders(response: NextResponse): NextResponse {
  for (const [key, value] of Object.entries(securityHeaders)) {
    response.headers.set(key, value);
  }
  return response;
}

/**
 * Validate file size
 */
export function validateFileSize(
  size: number,
  maxSizeBytes: number = 100 * 1024 * 1024 // 100MB default
): { valid: boolean; error?: string } {
  if (size === 0) {
    return { valid: false, error: "File is empty" };
  }
  
  if (size > maxSizeBytes) {
    const maxMB = Math.round(maxSizeBytes / (1024 * 1024));
    return { valid: false, error: `File size exceeds maximum of ${maxMB}MB` };
  }
  
  return { valid: true };
}

/**
 * Generate a secure random filename
 */
export function generateSecureFilename(extension: string): string {
  const chars = "abcdefghijklmnopqrstuvwxyz0123456789";
  let randomPart = "";
  
  const randomBytes = new Uint8Array(16);
  if (typeof crypto !== "undefined" && crypto.getRandomValues) {
    crypto.getRandomValues(randomBytes);
    for (const byte of randomBytes) {
      randomPart += chars[byte % chars.length];
    }
  } else {
    // Fallback for environments without crypto
    for (let i = 0; i < 16; i++) {
      randomPart += chars[Math.floor(Math.random() * chars.length)];
    }
  }
  
  return `${randomPart}.${extension}`;
}
