import { NextRequest, NextResponse } from "next/server";
import { checkRateLimit, addSecurityHeaders, getClientIP } from "./security";

/**
 * Rate-limited API handler wrapper
 */
export function withRateLimit(
  handler: (request: NextRequest) => Promise<NextResponse>,
  options: {
    maxRequests?: number;
    skipPaths?: string[];
  } = {}
) {
  return async (request: NextRequest) => {
    // Skip rate limiting for certain paths if specified
    if (options.skipPaths?.some(path => request.nextUrl.pathname.startsWith(path))) {
      return handler(request);
    }

    const { allowed, remaining, resetIn } = checkRateLimit(
      request,
      options.maxRequests
    );

    // Add rate limit headers
    const response = allowed
      ? await handler(request)
      : NextResponse.json(
          { error: "Too many requests. Please try again later." },
          { status: 429 }
        );

    // Add rate limit headers to response
    response.headers.set("X-RateLimit-Remaining", String(remaining));
    response.headers.set("X-RateLimit-Reset", String(Math.ceil(resetIn / 1000)));

    return addSecurityHeaders(response);
  };
}

/**
 * Validate content type header
 */
export function validateContentType(
  request: NextRequest,
  allowedTypes: string[]
): NextResponse | null {
  const contentType = request.headers.get("content-type");
  
  if (!contentType) {
    return NextResponse.json(
      { error: "Content-Type header is required" },
      { status: 400 }
    );
  }

  const isValid = allowedTypes.some(type => 
    contentType.includes(type)
  );

  if (!isValid) {
    return NextResponse.json(
      { error: `Invalid Content-Type. Allowed: ${allowedTypes.join(", ")}` },
      { status: 400 }
    );
  }

  return null;
}

/**
 * Require specific HTTP method
 */
export function requireMethod(
  request: NextRequest,
  allowedMethods: string[]
): NextResponse | null {
  if (!allowedMethods.includes(request.method)) {
    return NextResponse.json(
      { error: `Method ${request.method} is not allowed. Allowed: ${allowedMethods.join(", ")}` },
      { status: 405 }
    );
  }
  return null;
}

/**
 * Create a secure API route with common protections
 */
export function createSecureHandler(
  handler: (request: NextRequest) => Promise<NextResponse>,
  options: {
    allowedMethods?: string[];
    allowedContentTypes?: string[];
    maxRequests?: number;
    requireAuth?: boolean;
  } = {}
) {
  return async (request: NextRequest) => {
    // Method check
    if (options.allowedMethods) {
      const methodError = requireMethod(request, options.allowedMethods);
      if (methodError) return addSecurityHeaders(methodError);
    }

    // Content type check
    if (options.allowedContentTypes) {
      const contentError = validateContentType(request, options.allowedContentTypes);
      if (contentError) return addSecurityHeaders(contentError);
    }

    // Rate limiting
    if (options.maxRequests) {
      const { allowed, remaining, resetIn } = checkRateLimit(request, options.maxRequests);
      
      if (!allowed) {
        const response = NextResponse.json(
          { error: "Too many requests. Please try again later." },
          { status: 429 }
        );
        response.headers.set("X-RateLimit-Remaining", "0");
        response.headers.set("X-RateLimit-Reset", String(Math.ceil(resetIn / 1000)));
        return addSecurityHeaders(response);
      }

      // Add rate limit headers to successful responses
      const response = await handler(request);
      response.headers.set("X-RateLimit-Remaining", String(remaining));
      response.headers.set("X-RateLimit-Reset", String(Math.ceil(resetIn / 1000)));
      return addSecurityHeaders(response);
    }

    const response = await handler(request);
    return addSecurityHeaders(response);
  };
}
