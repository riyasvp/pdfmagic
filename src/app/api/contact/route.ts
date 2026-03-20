import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

// Validation schema for contact form
const contactSchema = z.object({
  name: z.string().min(1, "Name is required").max(100, "Name is too long"),
  email: z.string().email("Invalid email address"),
  subject: z.string().min(1, "Subject is required").max(200, "Subject is too long"),
  message: z.string().min(10, "Message must be at least 10 characters").max(5000, "Message is too long"),
});

// Rate limiting map (in production, use Redis or similar)
const rateLimitMap = new Map<string, { count: number; lastReset: number }>();
const RATE_LIMIT = 5; // Maximum requests
const RATE_LIMIT_WINDOW = 60 * 60 * 1000; // 1 hour in milliseconds

function isRateLimited(ip: string): boolean {
  const now = Date.now();
  const record = rateLimitMap.get(ip);

  if (!record) {
    rateLimitMap.set(ip, { count: 1, lastReset: now });
    return false;
  }

  // Reset if window has passed
  if (now - record.lastReset > RATE_LIMIT_WINDOW) {
    rateLimitMap.set(ip, { count: 1, lastReset: now });
    return false;
  }

  // Check if limit exceeded
  if (record.count >= RATE_LIMIT) {
    return true;
  }

  // Increment count
  record.count++;
  return false;
}

export async function POST(request: NextRequest) {
  try {
    // Get client IP for rate limiting
    const ip = request.headers.get("x-forwarded-for") || 
                request.headers.get("x-real-ip") || 
                "unknown";

    // Check rate limit
    if (isRateLimited(ip)) {
      return NextResponse.json(
        {
          success: false,
          error: "Too many requests. Please try again later.",
        },
        {
          status: 429,
          headers: {
            "Retry-After": String(Math.ceil(RATE_LIMIT_WINDOW / 1000)),
          },
        }
      );
    }

    // Parse and validate request body
    const body = await request.json();
    const validationResult = contactSchema.safeParse(body);

    if (!validationResult.success) {
      return NextResponse.json(
        {
          success: false,
          error: "Validation failed",
          details: validationResult.error.flatten().fieldErrors,
        },
        { status: 400 }
      );
    }

    const { name, email, subject, message } = validationResult.data;

    // Sanitize inputs (basic XSS prevention)
    const sanitizedData = {
      name: name.trim().replace(/<[^>]*>/g, ""),
      email: email.trim().toLowerCase(),
      subject: subject.trim().replace(/<[^>]*>/g, ""),
      message: message.trim(),
    };

    // Log the contact form submission
    // In production, you would:
    // 1. Send an email notification
    // 2. Store in database
    // 3. Send to CRM
    // 4. Trigger webhook
    console.log("📬 Contact Form Submission:", {
      timestamp: new Date().toISOString(),
      name: sanitizedData.name,
      email: sanitizedData.email,
      subject: sanitizedData.subject,
      messageLength: sanitizedData.message.length,
      ip: ip,
    });

    // Example: Send to email (using your preferred email service)
    // await sendEmail({
    //   to: "support@pdfmagic.store",
    //   subject: `Contact Form: ${sanitizedData.subject}`,
    //   html: `
    //     <h2>New Contact Form Submission</h2>
    //     <p><strong>Name:</strong> ${sanitizedData.name}</p>
    //     <p><strong>Email:</strong> ${sanitizedData.email}</p>
    //     <p><strong>Subject:</strong> ${sanitizedData.subject}</p>
    //     <p><strong>Message:</strong></p>
    //     <p>${sanitizedData.message}</p>
    //   `,
    // });

    // Example: Store in database (using Prisma or similar)
    // await prisma.contactSubmission.create({
    //   data: {
    //     name: sanitizedData.name,
    //     email: sanitizedData.email,
    //     subject: sanitizedData.subject,
    //     message: sanitizedData.message,
    //     ipAddress: ip,
    //   },
    // });

    // Return success response
    return NextResponse.json(
      {
        success: true,
        message: "Thank you for your message! We'll get back to you within 24-48 hours.",
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Contact form error:", error);

    return NextResponse.json(
      {
        success: false,
        error: "An unexpected error occurred. Please try again later.",
      },
      { status: 500 }
    );
  }
}

// Optional: GET endpoint for checking API status
export async function GET() {
  return NextResponse.json(
    {
      status: "ok",
      endpoint: "contact",
      method: "POST",
      fields: ["name", "email", "subject", "message"],
    },
    { status: 200 }
  );
}
